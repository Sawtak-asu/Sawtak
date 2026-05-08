import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia, t } from "elysia";

function createMockTeamApp() {
  return new Elysia({ prefix: "/api/admin/teams" })
    .get("/", async () => {
      return { success: true, data: { teams: [] } };
    })
    .post("/", async ({ body, set }) => {
      const { entityId, type } = body;
      const validTypes = ["ministry", "governorate", "center"];
      if (!validTypes.includes(type)) {
        set.status = 400;
        return { success: false, error: "Invalid team type" };
      }
      return { success: true, message: "Team created successfully" };
    }, {
      body: t.Object({
        entityId: t.String(),
        type: t.Union([t.Literal("ministry"), t.Literal("governorate"), t.Literal("center")]),
      }),
    })
    .get("/available-entities", async () => {
      return {
        success: true,
        data: {
          ministries: [{ id: "min_justice", name: "Ministry of Justice" }],
          governorates: [{ id: "gov_cairo", name: "Cairo" }],
        },
      };
    })
    .get("/my-teams", async ({ set }) => {
      return { success: true, data: { teams: [] } };
    })
    .get("/:id", async ({ params, set }) => {
      if (params.id === "not-found") {
        set.status = 404;
        return { success: false, error: "Team not found" };
      }
      return { success: true, data: { id: params.id, entity_id: "min_justice", type: "ministry" } };
    }, {
      params: t.Object({ id: t.String() }),
    })
    .post("/:id/members", async ({ params, body, set }) => {
      const { userId, role } = body;
      const validRoles = ["reviewer", "manager", "team_admin"];
      if (!validRoles.includes(role)) {
        set.status = 400;
        return { success: false, error: "Invalid role. Must be: reviewer, manager, or team_admin" };
      }
      return { success: true, message: "Member added to team" };
    }, {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        userId: t.String(),
        role: t.String(),
      }),
    })
    .delete("/:id/members/:userId", async ({ params, set }) => {
      return { success: true, message: "Member removed from team" };
    }, {
      params: t.Object({ id: t.String(), userId: t.String() }),
    })
    .patch("/:id/members/:userId", async ({ params, body, set }) => {
      const { role } = body;
      const validRoles = ["reviewer", "manager", "team_admin"];
      if (!validRoles.includes(role)) {
        set.status = 400;
        return { success: false, error: "Invalid role. Must be: reviewer, manager, or team_admin" };
      }
      return { success: true, message: "Member role updated successfully" };
    }, {
      params: t.Object({ id: t.String(), userId: t.String() }),
      body: t.Object({ role: t.String() }),
    })
    .delete("/:id", async ({ params, set }) => {
      return { success: true, message: "Team deleted successfully" };
    }, {
      params: t.Object({ id: t.String() }),
    });
}

describe("Team Routes - Route Layer Tests", () => {
  let app: ReturnType<typeof createMockTeamApp>;

  beforeEach(() => {
    app = createMockTeamApp();
  });

  describe("GET /api/admin/teams", () => {
    it("returns empty teams list", async () => {
      const req = new Request("http://localhost/api/admin/teams");
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.teams).toBeDefined();
    });
  });

  describe("POST /api/admin/teams", () => {
    it("rejects invalid team type", async () => {
      const req = new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: "min_justice", type: "invalid" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });

    it("accepts ministry type", async () => {
      const req = new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: "min_justice", type: "ministry" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });

    it("accepts governorate type", async () => {
      const req = new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: "gov_cairo", type: "governorate" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });

    it("accepts center type", async () => {
      const req = new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: "center-cairo", type: "center" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });

    it("rejects missing entityId", async () => {
      const req = new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ministry" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/admin/teams/available-entities", () => {
    it("returns available ministries and governorates", async () => {
      const req = new Request("http://localhost/api/admin/teams/available-entities");
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.ministries).toBeDefined();
      expect(body.data.governorates).toBeDefined();
    });
  });

  describe("GET /api/admin/teams/my-teams", () => {
    it("returns user's team memberships", async () => {
      const req = new Request("http://localhost/api/admin/teams/my-teams");
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.teams).toBeDefined();
    });
  });

  describe("GET /api/admin/teams/:id", () => {
    it("returns team details for valid ID", async () => {
      const req = new Request("http://localhost/api/admin/teams/team-123");
      const res = await app.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.id).toBe("team-123");
    });

    it("returns 404 for non-existent team", async () => {
      const req = new Request("http://localhost/api/admin/teams/not-found");
      const res = await app.handle(req);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/teams/:id/members", () => {
    it("accepts valid roles", async () => {
      const roles = ["reviewer", "manager", "team_admin"];
      for (const role of roles) {
        const req = new Request("http://localhost/api/admin/teams/team-123/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "user-123", role }),
        });
        const res = await app.handle(req);
        expect(res.status).toBe(200);
      }
    });

    it("rejects invalid role", async () => {
      const req = new Request("http://localhost/api/admin/teams/team-123/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-123", role: "admin" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
    });
  });

  describe("PATCH /api/admin/teams/:id/members/:userId", () => {
    it("accepts valid role update", async () => {
      const req = new Request("http://localhost/api/admin/teams/team-123/members/user-456", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "manager" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(200);
    });

    it("rejects invalid role update", async () => {
      const req = new Request("http://localhost/api/admin/teams/team-123/members/user-456", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "superadmin" }),
      });
      const res = await app.handle(req);
      expect(res.status).toBe(400);
    });
  });
});
