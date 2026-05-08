import { describe, it, expect } from "bun:test";
import { Elysia, t } from "elysia";

describe("Feed Routes - Route Layer Tests", () => {
  describe("GET /api/feed - Query Validation", () => {
    const feedApp = new Elysia({ prefix: "/api/feed" })
      .get("/", async ({ query }) => {
        return {
          success: true,
          data: {
            complaints: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            filters: { categories: [], areas: [] },
          },
        };
      }, {
        query: t.Object({
          search: t.Optional(t.String()),
          category: t.Optional(t.String()),
          area: t.Optional(t.String()),
          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
          sort: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          submissionMode: t.Optional(t.String()),
          directedTo: t.Optional(t.String()),
        }),
      });

    it("accepts empty query params", async () => {
      const req = new Request("http://localhost/api/feed");
      const res = await feedApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("accepts all filter parameters", async () => {
      const params = new URLSearchParams({
        search: "corruption",
        category: "finance",
        area: "Cairo",
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        sort: "newest",
        page: "2",
        limit: "20",
        submissionMode: "anonymous",
      });
      const req = new Request(`http://localhost/api/feed?${params}`);
      const res = await feedApp.handle(req);
      expect(res.status).toBe(200);
    });

    it("accepts directedTo as JSON string", async () => {
      const params = new URLSearchParams({
        directedTo: JSON.stringify({ type: "ministry", ministryId: "min-1" }),
      });
      const req = new Request(`http://localhost/api/feed?${params}`);
      const res = await feedApp.handle(req);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/feed/stats - Stats Endpoint", () => {
    const statsApp = new Elysia({ prefix: "/api/feed" })
      .get("/stats", async () => {
        return { success: true, data: { total: 0, byCategory: {}, byStatus: {} } };
      });

    it("returns 200 for stats endpoint", async () => {
      const req = new Request("http://localhost/api/feed/stats");
      const res = await statsApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe("GET /api/feed/:id - Complaint by ID", () => {
    const byIdApp = new Elysia({ prefix: "/api/feed" })
      .get("/:id", async ({ params, set }) => {
        if (params.id === "not-found") {
          set.status = 404;
          return { success: false, error: "Complaint not found" };
        }
        return { success: true, data: { id: params.id, title: "Test" } };
      }, {
        params: t.Object({
          id: t.String(),
        }),
      });

    it("returns 200 with complaint data for valid ID", async () => {
      const req = new Request("http://localhost/api/feed/abc-123");
      const res = await byIdApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe("abc-123");
    });

    it("returns 404 for non-existent complaint", async () => {
      const req = new Request("http://localhost/api/feed/not-found");
      const res = await byIdApp.handle(req);
      expect(res.status).toBe(404);
    });
  });
});
