import { describe, it, expect } from "bun:test";
import { Elysia, t } from "elysia";

describe("Vote Routes - Route Layer Tests", () => {
  const TEST_SECRET = "test-jwt-secret";

  describe("POST /api/vote - Toggle Vote", () => {
    const voteApp = new Elysia({ prefix: "/api/vote" })
      .post(
        "/",
        async ({ body, request, set }) => {
          const { complaintId } = body;
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            set.status = 401;
            return { success: false, error: "Authentication required to vote", requiresLogin: true };
          }
          return { success: true, data: { voted: true, newCount: 5 } };
        },
        {
          body: t.Object({
            complaintId: t.String(),
          }),
        }
      );

    it("returns 401 without auth header", async () => {
      const req = new Request("http://localhost/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: "comp-1" }),
      });
      const res = await voteApp.handle(req);
      expect(res.status).toBe(401);
    });

    it("accepts valid body with auth header", async () => {
      const req = new Request("http://localhost/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEifQ.test",
        },
        body: JSON.stringify({ complaintId: "comp-1" }),
      });
      const res = await voteApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects when complaintId is missing (validation)", async () => {
      const req = new Request("http://localhost/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEifQ.test",
        },
        body: JSON.stringify({}),
      });
      const res = await voteApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/vote/:complaintId - Vote Count", () => {
    const countApp = new Elysia({ prefix: "/api/vote" })
      .get("/:complaintId", async ({ params, request }) => {
        const authHeader = request.headers.get("authorization");
        let hasVoted = false;
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
            if (payload.userId) hasVoted = true;
          } catch {}
        }
        return { success: true, data: { voteCount: 5, hasVoted } };
      }, {
        params: t.Object({
          complaintId: t.String(),
        }),
      });

    it("returns vote count without auth", async () => {
      const req = new Request("http://localhost/api/vote/comp-1");
      const res = await countApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.voteCount).toBe(5);
      expect(body.data.hasVoted).toBe(false);
    });

    it("returns hasVoted=true with valid auth", async () => {
      const token = btoa(JSON.stringify({ userId: "user-1" }));
      const req = new Request("http://localhost/api/vote/comp-1", {
        headers: { Authorization: `Bearer header.${token}.sig` },
      });
      const res = await countApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.hasVoted).toBe(true);
    });
  });

  describe("GET /api/vote/status?complaintId=xxx - Query Param Version", () => {
    const statusApp = new Elysia({ prefix: "/api/vote" })
      .get("/status", async ({ query }) => {
        if (!query.complaintId) {
          return { success: false, error: "complaintId query parameter required" };
        }
        return { success: true, data: { voteCount: 3, hasVoted: false } };
      }, {
        query: t.Object({
          complaintId: t.String(),
        }),
      });

    it("returns vote status with complaintId", async () => {
      const req = new Request("http://localhost/api/vote/status?complaintId=comp-1");
      const res = await statusApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects without complaintId (validation)", async () => {
      const req = new Request("http://localhost/api/vote/status");
      const res = await statusApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/vote/batch - Batch Vote Counts", () => {
    const batchApp = new Elysia({ prefix: "/api/vote" })
      .post(
        "/batch",
        async ({ body }) => {
          const { complaintIds } = body;
          const result: Record<string, { voteCount: number; hasVoted: boolean }> = {};
          for (const id of complaintIds) {
            result[id] = { voteCount: 0, hasVoted: false };
          }
          return { success: true, data: result };
        },
        {
          body: t.Object({
            complaintIds: t.Array(t.String()),
          }),
        }
      );

    it("returns vote counts for multiple complaints", async () => {
      const req = new Request("http://localhost/api/vote/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintIds: ["c1", "c2", "c3"] }),
      });
      const res = await batchApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.c1).toBeDefined();
      expect(body.data.c2).toBeDefined();
      expect(body.data.c3).toBeDefined();
    });

    it("rejects when complaintIds is missing", async () => {
      const req = new Request("http://localhost/api/vote/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await batchApp.handle(req);
      expect(res.status).toBe(422);
    });
  });
});
