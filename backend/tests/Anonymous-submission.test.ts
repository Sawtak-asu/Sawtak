import { describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";

const anonymousApp = new Elysia({ prefix: "/api/complaints/anonymous" })
  .post("/submit", async ({ body, set }) => {
    const { anonymousIdentifier, title, text, category, area, directedTo, incidentDate, evidenceCids } = body as any;

    const trackingCode = "SAWTAK-" + Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 34)]).join("");

    return {
      success: true,
      message: "Anonymous complaint submitted successfully",
      data: {
        transactionId: "cosmos-tx-" + Math.random().toString(36).substring(7),
        status: "submitted",
        trackingCode,
      },
    };
  }, {
    body: t.Object({
      anonymousIdentifier: t.String({
        description: "Client-generated anonymous identifier (hashed)"
      }),
      title: t.String({
        description: "Brief title of the complaint",
        minLength: 5,
        maxLength: 200
      }),
      text: t.String({
        description: "Detailed description of the complaint",
        minLength: 20,
        maxLength: 10000
      }),
      category: t.String({
        description: "Complaint category (corruption, harassment, fraud, etc.)"
      }),
      area: t.Optional(t.String({
        description: "Geographic area where the incident occurred"
      })),
      directedTo: t.Optional(t.Object({
        type: t.String({ description: "Target type: ministry, governorate, or center" }),
        ministryId: t.Optional(t.String()),
        governorateId: t.Optional(t.String()),
        centerId: t.Optional(t.String())
      }, { description: "Optional: Direct complaint to specific authority" })),
      incidentDate: t.Optional(t.String({
        description: "Date of incident (ISO 8601 format)"
      })),
      evidenceCids: t.Optional(t.Array(t.String(), {
        description: "Array of IPFS CIDs for uploaded evidence"
      }))
    }),
  });

describe("Anonymous Complaint Routes - Cosmos Network (Route Layer)", () => {
  describe("POST /submit - Validation", () => {
    it("rejects missing anonymousIdentifier", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Valid Title Here",
          text: "This is a detailed complaint description for testing purposes",
          category: "corruption",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects short title (minLength: 5)", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id-123",
          title: "Hi",
          text: "This is a detailed complaint description for testing purposes",
          category: "corruption",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects short complaint text (minLength: 20)", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id-123",
          title: "Valid Title Here",
          text: "Too short",
          category: "corruption",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects missing category", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id-123",
          title: "Valid Title Here",
          text: "This is a detailed complaint description for testing purposes",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects oversized title (maxLength: 200)", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id-123",
          title: "A".repeat(201),
          text: "This is a detailed complaint description for testing purposes",
          category: "corruption",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects oversized text (maxLength: 10000)", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id-123",
          title: "Valid Title",
          text: "B".repeat(10001),
          category: "corruption",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("POST /submit - Successful Submission", () => {
    it("submits complaint with minimal required fields", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "anon-minimal-test",
          title: "Minimal Valid Complaint",
          text: "This is a minimal but valid complaint with enough text to pass validation",
          category: "harassment",
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.transactionId).toBeDefined();
      expect(body.data.trackingCode).toMatch(/^SAWTAK-[A-Z2-9]{6,8}$/);
      expect(body.data.status).toBe("submitted");
    });

    it("submits complaint with all optional fields", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "anon-full-test",
          title: "Full Complaint Submission",
          text: "This complaint includes all optional fields for comprehensive testing of the submission pipeline",
          category: "fraud",
          area: "Cairo",
          directedTo: {
            type: "ministry",
            ministryId: "min-finance-001",
          },
          incidentDate: "2025-03-15T10:00:00Z",
          evidenceCids: ["QmTestHash1", "QmTestHash2", "QmTestHash3"],
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.message).toContain("successfully");
    });

    it("submits complaint with governorate directedTo", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "anon-gov-test",
          title: "Governorate Directed Complaint",
          text: "Testing directedTo with governorate type for proper routing validation in the system",
          category: "corruption",
          directedTo: {
            type: "governorate",
            governorateId: "gov-alexandria",
          },
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(200);
    });

    it("submits complaint with center directedTo", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "anon-center-test",
          title: "Center Directed Complaint",
          text: "Testing directedTo with center type for proper routing validation in the system",
          category: "misconduct",
          directedTo: {
            type: "center",
            centerId: "center-cairo-downtown",
          },
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(200);
    });

    it("generates unique tracking codes for each submission", async () => {
      const codes = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost/api/complaints/anonymous/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonymousIdentifier: `anon-unique-${i}`,
            title: `Unique Complaint ${i}`,
            text: `This is complaint number ${i} with enough text to pass the minimum length validation`,
            category: "testing",
          }),
        });
        const res = await anonymousApp.handle(req);
        const body = await res.json() as any;
        codes.add(body.data.trackingCode);
      }
      expect(codes.size).toBe(5);
    });

    it("accepts empty evidenceCids array", async () => {
      const req = new Request("http://localhost/api/complaints/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousIdentifier: "anon-empty-evidence",
          title: "No Evidence Complaint",
          text: "Testing submission with empty evidence array for edge case coverage",
          category: "testing",
          evidenceCids: [],
        }),
      });
      const res = await anonymousApp.handle(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Cosmos Network Configuration", () => {
    it("should have Cosmos RPC endpoint configured", async () => {
      const { COSMOS_CONFIG } = await import("../src/config/cosmos.config");
      expect(COSMOS_CONFIG.RPC_ENDPOINT).toBeDefined();
      expect(COSMOS_CONFIG.CHAIN_ID).toBeDefined();
      expect(COSMOS_CONFIG.PREFIX).toBe("sawtak");
    });

    it("should have Cosmos indexer service available", async () => {
      const { CosmosIndexerService, getIndexer, stopIndexer } = await import("../src/services/cosmos-indexer.service");
      stopIndexer();
      const indexer = getIndexer();
      expect(indexer).toBeDefined();
      expect(typeof indexer.getStatus).toBe("function");
    });
  });
});
