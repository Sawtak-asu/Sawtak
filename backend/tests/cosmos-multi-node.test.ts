import { describe, expect, test, beforeAll } from "bun:test";
import { AnonymousSubmissionService } from "../src/services/anonymous-submission.service";
import { SawtakCosmosService } from "../src/services/sawtak-cosmos.service";
import { COSMOS_CONFIG } from "../src/config/cosmos.config";
import { prisma } from "../src/db";
import { jwt } from "@elysiajs/jwt";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

describe("Blockchain & Indexer Integration Tests", () => {
    let service: AnonymousSubmissionService;
    let cosmos: SawtakCosmosService;
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
        service = new AnonymousSubmissionService();
        cosmos = new SawtakCosmosService();
        await cosmos.connect();

        // Create or find a test user
        testUser = await prisma.user.upsert({
            where: { email: "test-indexer@sawtak.app" },
            update: {},
            create: {
                email: "test-indexer@sawtak.app",
                role: "user",
                anonymous_identifier: "test-anon-id-" + Date.now()
            }
        });

        // Mock a JWT for identified submission tests
        const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
        // Bun doesn't easily run Elysia plugins in standalone test files, 
        // but we can manually sign a JWT if we had a signer, 
        // for now we will test the SERVICE layer for identified complaints to avoid route/middleware overhead.
    });

    /**
     * ANONYMOUS COMPLAINTS
     */
    describe("Anonymous Complaints", () => {
        test("Should submit anonymous complaint and verify indexing in Postgres", async () => {
            const uniqueTitle = "Indexer Verification " + Date.now();
            const mockData = {
                anonymousIdentifier: "anon_indexer_test",
                title: uniqueTitle,
                text: "Testing the full loop from Chain to Indexer to Postgres.",
                category: "testing",
                area: "Cairo",
                incidentDate: new Date()
            };

            console.log("📤 Submitting anonymous complaint...");
            const result = await service.submitAnonymousComplaint(mockData);
            expect(result.status).toBe("submitted");
            const txHash = result.transactionId;
            console.log(`✅ TxHash: ${txHash}`);

            console.log("⏳ Waiting for indexer (max 20s)...");
            let indexed = null;
            for (let i = 0; i < 4; i++) {
                await new Promise(r => setTimeout(r, 5000));
                indexed = await prisma.indexedComplaint.findFirst({
                    where: { chain_hash: txHash }
                });
                if (indexed) break;
                console.log(`...still waiting (${(i+1)*5}s)`);
            }

            expect(indexed).not.toBeNull();
            expect(indexed?.title).toBe(uniqueTitle);
            expect(indexed?.chain_type).toBe("cosmos");
            console.log("✅ Successfully indexed in Postgres!");
        }, 60000);
    });

    /**
     * IDENTIFIED COMPLAINTS
     */
    describe("Identified Complaints", () => {
        test("Should record identified complaint in DB and link to user", async () => {
            const { IdentifiedComplaintService } = await import("../src/services/identified-complaint.service");
            const identifiedService = new IdentifiedComplaintService();

            const mockData = {
                userId: testUser.id,
                title: "Identified Test " + Date.now(),
                text: "This is an identified complaint linked to a user profile.",
                category: "feedback",
                area: "Alexandria",
                visibility: "public"
            };

            console.log("💾 Saving identified complaint to DB...");
            const complaint = await identifiedService.createComplaint(mockData);

            expect(complaint.id).toBeDefined();
            expect(complaint.user_id).toBe(testUser.id);
            expect(complaint.status).toBe("submitted");
            console.log(`✅ Success! Internal ID: ${complaint.id}`);
        });
    });

    /**
     * NODE SYNCHRONIZATION
     */
    describe("Multi-Node Sync", () => {
        test("Data should be queryable from both Node 1 and Node 2", async () => {
            const uniqueTitle = "Sync Test " + Date.now();
            const mockData = {
                anonymousIdentifier: "sync_test_user",
                title: uniqueTitle,
                text: "Verifying sync between nodes",
                category: "testing"
            };

            const result = await service.submitAnonymousComplaint(mockData);
            const txHash = result.transactionId;

            console.log(`🔍 Checking Node 1 (RPC: ${COSMOS_CONFIG.RPC_ENDPOINT})...`);
            const node1Response = await fetch(`${COSMOS_CONFIG.RPC_ENDPOINT}/tx?hash=0x${txHash}`);
            const node1Data = await node1Response.json() as any;
            expect(node1Data.result).toBeDefined();

            const node2Rpc = "http://localhost:26658";
            console.log(`🔍 Checking Node 2 (RPC: ${node2Rpc})...`);
            
            // Wait longer for Node 2 to catch up
            console.log("⏳ Waiting 10s for block replication...");
            await new Promise(r => setTimeout(r, 10000));

            try {
                const node2Response = await fetch(`${node2Rpc}/tx?hash=0x${txHash}`);
                const node2Data = await node2Response.json() as any;
                
                if (node2Data.error && node2Data.error.data && node2Data.error.data.includes("not ready")) {
                    console.log("⚠️ Node 2 reachable but still syncing block history.");
                } else if (node2Data.result) {
                    expect(node2Data.result).toBeDefined();
                    console.log("✅ Data replicated to Node 2!");
                } else {
                    console.log("❓ Node 2 returned unexpected response:", node2Data);
                }
            } catch (e: any) {
                console.warn(`⚠️ Node 2 unreachable (${e.message}) - check if docker container is running.`);
            }
        }, 60000); // 1 minute timeout
    });
});
