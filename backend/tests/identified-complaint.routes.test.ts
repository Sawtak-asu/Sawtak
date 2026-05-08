import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia, t } from "elysia";

function createMockIdentifiedApp() {
  return new Elysia({ prefix: "/api/complaints/identified" })
    .post("/submit", async ({ body, set }) => {
      const {
        userId,
        title,
        text,
        category,
        area,
        directedTo,
        incidentDate,
        evidenceUrls,
        visibility,
      } = body;

      const validVisibilities = ["public", "private"];
      if (visibility && !validVisibilities.includes(visibility)) {
        set.status = 400;
        return { success: false, error: "Invalid visibility. Must be 'public' or 'private'" };
      }

      return {
        success: true,
        message: "Identified complaint submitted successfully",
        data: {
          id: "complaint-uuid-" + Math.random().toString(36).substring(7),
          userId,
          title,
          category,
          status: "submitted",
          visibility: visibility || "public",
          createdAt: new Date().toISOString(),
        },
      };
    }, {
      body: t.Object({
        userId: t.String(),
        title: t.String({ minLength: 5, maxLength: 200 }),
        text: t.String({ minLength: 20, maxLength: 10000 }),
        category: t.String(),
        area: t.Optional(t.String()),
        directedTo: t.Optional(t.Object({
          type: t.String(),
          ministryId: t.Optional(t.String()),
          governorateId: t.Optional(t.String()),
          centerId: t.Optional(t.String()),
        })),
        incidentDate: t.Optional(t.String()),
        evidenceUrls: t.Optional(t.Array(t.String())),
        visibility: t.Optional(t.Union([t.Literal("public"), t.Literal("private")])),
      }),
    })
    .get("/user/:userId", async ({ params, set }) => {
      return {
        success: true,
        data: [
          {
            id: "complaint-1",
            title: "Test Complaint",
            category: "testing",
            status: "submitted",
            visibility: "public",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }, {
      params: t.Object({ userId: t.String() }),
    });
}

describe("Identified Complaint Routes - Route Layer Tests", () => {
  let app: ReturnType<typeof createMockIdentifiedApp>;

  beforeEach(() => {
    app = createMockIdentifiedApp();
  });

  describe("POST /submit - Validation", () => {
    it("rejects missing userId", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Valid Title",
          text: "This is a valid complaint text with enough content",
          category: "corruption",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects short title", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Hi",
          text: "This is a valid complaint text with enough content",
          category: "corruption",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects short complaint text", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Valid Title Here",
          text: "Too short",
          category: "corruption",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects missing category", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Valid Title",
          text: "This is a valid complaint text with enough content for testing",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects invalid visibility value", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Valid Title",
          text: "This is a valid complaint text with enough content for testing",
          category: "corruption",
          visibility: "secret",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("POST /submit - Successful Submission", () => {
    it("submits complaint with minimal fields", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Minimal Complaint",
          text: "This is a minimal valid complaint with enough text to pass validation",
          category: "harassment",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("submitted");
      expect(body.data.id).toBeDefined();
    });

    it("submits complaint with public visibility", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Public Complaint",
          text: "This complaint should be visible in the public feed for all users to see",
          category: "fraud",
          visibility: "public",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.visibility).toBe("public");
    });

    it("submits complaint with private visibility", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Private Complaint",
          text: "This complaint should only be visible to admins for review and processing",
          category: "corruption",
          visibility: "private",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.visibility).toBe("private");
    });

    it("submits complaint with all optional fields", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Full Complaint",
          text: "This complaint includes all optional fields for comprehensive testing",
          category: "misconduct",
          area: "Alexandria",
          directedTo: { type: "governorate", governorateId: "gov-alexandria" },
          incidentDate: "2025-06-15T14:00:00Z",
          evidenceUrls: ["https://example.com/evidence1.pdf", "https://example.com/evidence2.png"],
          visibility: "public",
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
    });

    it("submits complaint with ministry directedTo", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "Ministry Directed",
          text: "This complaint is directed to a specific ministry for proper routing and handling",
          category: "corruption",
          directedTo: { type: "ministry", ministryId: "min-interior" },
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });

    it("accepts empty evidenceUrls array", async () => {
      const req = new Request("http://localhost/api/complaints/identified/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          title: "No Evidence",
          text: "Testing submission with empty evidence URLs array for edge case coverage",
          category: "testing",
          evidenceUrls: [],
        }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /user/:userId", () => {
    it("returns user complaints", async () => {
      const req = new Request("http://localhost/api/complaints/identified/user/user-123");
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
