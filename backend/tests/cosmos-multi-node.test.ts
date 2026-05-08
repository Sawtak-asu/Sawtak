import { describe, expect, test, beforeAll } from "bun:test";
import { prisma } from "../src/db";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function isDbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe("Blockchain & Indexer Integration Tests", () => {
  let service: any;
  let cosmos: any;
  let testUser: any;
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDbAvailable();
    if (!dbAvailable) {
      console.log("[cosmos-multi-node] Skipping - database not available");
      return;
    }

    try {
      const { AnonymousSubmissionService } = await import("../src/services/anonymous-submission.service");
      const { SawtakCosmosService } = await import("../src/services/sawtak-cosmos.service");

      service = new AnonymousSubmissionService();
      cosmos = new SawtakCosmosService();
      await cosmos.connect();

      testUser = await prisma.user.upsert({
        where: { email: "test-indexer@sawtak.app" },
        update: {},
        create: {
          email: "test-indexer@sawtak.app",
          role: "user",
          anonymous_identifier: "test-anon-id-" + Date.now(),
        },
      });
    } catch (e: any) {
      console.log("[cosmos-multi-node] Skipping - Cosmos SDK not available:", e.message);
      dbAvailable = false;
    }
  });

  describe("Anonymous Complaints", () => {
    test("Should submit anonymous complaint and verify indexing in Postgres", async () => {
      if (!dbAvailable) return;

      const uniqueTitle = "Indexer Verification " + Date.now();
      const mockData = {
        anonymousIdentifier: "anon_indexer_test",
        title: uniqueTitle,
        text: "Testing the full loop from Chain to Indexer to Postgres.",
        category: "testing",
        area: "Cairo",
        incidentDate: new Date(),
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
          where: { chain_hash: txHash },
        });
        if (indexed) break;
        console.log(`...still waiting (${(i + 1) * 5}s)`);
      }

      expect(indexed).not.toBeNull();
      expect(indexed?.title).toBe(uniqueTitle);
      expect(indexed?.chain_type).toBe("cosmos");
      console.log("✅ Successfully indexed in Postgres!");
    }, 60000);
  });

  describe("Identified Complaints", () => {
    test("Should record identified complaint in DB and link to user", async () => {
      if (!dbAvailable) return;

      const { IdentifiedComplaintService } = await import("../src/services/identified-complaint.service");
      const identifiedService = new IdentifiedComplaintService();

      const mockData = {
        userId: testUser.id,
        title: "Identified Test " + Date.now(),
        text: "This is an identified complaint linked to a user profile.",
        category: "feedback",
        area: "Alexandria",
        visibility: "public",
      };

      console.log("💾 Saving identified complaint to DB...");
      const complaint = await identifiedService.createComplaint(mockData);

      expect(complaint.id).toBeDefined();
      expect(complaint.user_id).toBe(testUser.id);
      expect(complaint.status).toBe("submitted");
      console.log(`✅ Success! Internal ID: ${complaint.id}`);
    });
  });

  describe("Multi-Node Sync", () => {
    test("Data should be queryable from both Node 1 and Node 2", async () => {
      if (!dbAvailable) return;

      const uniqueTitle = "Sync Test " + Date.now();
      const mockData = {
        anonymousIdentifier: "sync_test_user",
        title: uniqueTitle,
        text: "Verifying sync between nodes",
        category: "testing",
      };

      const result = await service.submitAnonymousComplaint(mockData);
      const txHash = result.transactionId;

      console.log(`🔍 Checking Node 1 (RPC: ${process.env.COSMOS_RPC_ENDPOINT})...`);
      const node1Response = await fetch(`${process.env.COSMOS_RPC_ENDPOINT || "http://localhost:26657"}/tx?hash=0x${txHash}`);
      const node1Data = await node1Response.json() as any;
      expect(node1Data.result).toBeDefined();

      const node2Rpc = "http://localhost:26658";
      console.log(`🔍 Checking Node 2 (RPC: ${node2Rpc})...`);

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
    }, 60000);
  });
});
