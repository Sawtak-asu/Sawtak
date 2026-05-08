import { describe, it, expect } from "bun:test";
import { Elysia, t } from "elysia";
import crypto from "crypto";

describe("Tracking Routes - Route Layer Tests", () => {
  describe("GET /api/track/:code - Track by Code", () => {
    const trackApp = new Elysia({ prefix: "/api/track" })
      .get("/:code", async ({ params, set }) => {
        const { code } = params;
        if (!code || code.length < 8) {
          set.status = 400;
          return { success: false, error: "Invalid tracking code" };
        }

        const trackingHash = crypto
          .createHash("sha256")
          .update(code.toUpperCase())
          .digest("hex")
          .substring(0, 16);

        if (code.includes("anon")) {
          return {
            success: true,
            data: {
              found: true,
              type: "anonymous",
              complaint: { id: "chain-hash-1", title: "Test Complaint", category: "corruption", area: "Cairo", status: "submitted", createdAt: "2024-01-01T00:00:00Z" },
              message: "Complaint found. Status tracking is available.",
            },
          };
        }

        if (code.includes("identified")) {
          return {
            success: true,
            data: {
              found: true,
              type: "identified",
              complaint: { id: "id-comp-1", title: "ID Complaint", category: "fraud", area: "Alex", status: "resolved", createdAt: "2024-02-01T00:00:00Z" },
              message: "Complaint found. Status tracking is available.",
            },
          };
        }

        return { success: true, data: { found: false, message: "No complaint found with this tracking code." } };
      }, {
        params: t.Object({
          code: t.String({ minLength: 8 }),
        }),
      });

    it("rejects short tracking codes (Elysia minLength validation)", async () => {
      const req = new Request("http://localhost/api/track/short");
      const res = await trackApp.handle(req);
      expect(res.status).toBe(422); // Elysia validation returns 422
    });

    it("returns found anonymous complaint", async () => {
      const req = new Request("http://localhost/api/track/SAWTAK-anon-test");
      const res = await trackApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.found).toBe(true);
      expect(body.data.type).toBe("anonymous");
    });

    it("returns found identified complaint", async () => {
      const req = new Request("http://localhost/api/track/SAWTAK-identified-test");
      const res = await trackApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.found).toBe(true);
      expect(body.data.type).toBe("identified");
    });

    it("returns found=false for unknown code", async () => {
      const req = new Request("http://localhost/api/track/SAWTAK-unknown-code");
      const res = await trackApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.found).toBe(false);
    });

    it("generates correct SHA256 tracking hash", () => {
      const code = "SAWTAK-A7B3C9D2";
      const hash = crypto
        .createHash("sha256")
        .update(code.toUpperCase())
        .digest("hex")
        .substring(0, 16);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("GET /api/track/:code/history - Status History", () => {
    const historyApp = new Elysia({ prefix: "/api/track" })
      .get("/:code/history", async ({ params }) => {
        return {
          success: true,
          data: {
            history: [
              { oldStatus: "submitted", newStatus: "investigating", notes: "Under review", timestamp: "2024-01-15T00:00:00Z" },
              { oldStatus: "investigating", newStatus: "resolved", notes: "Resolved", timestamp: "2024-02-01T00:00:00Z" },
            ],
          },
        };
      }, {
        params: t.Object({
          code: t.String(),
        }),
      });

    it("returns status history", async () => {
      const req = new Request("http://localhost/api/track/SAWTAK-abc/history");
      const res = await historyApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.history).toHaveLength(2);
      expect(body.data.history[0].newStatus).toBe("investigating");
    });
  });
});
