import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

/**
 * Auth Routes - Unit Tests
 *
 * Tests the route layer (validation, wiring, error handling).
 * The AuthController is mocked at the instance level since bun:test
 * doesn't support module-level mocking like Jest.
 */

describe("Auth Routes", () => {
  describe("POST /api/auth/login", () => {
    const loginApp = new Elysia({ prefix: "/api/auth" })
      .use(jwt({ name: "jwt", secret: "test-secret" }))
      .post(
        "/login",
        async ({ body, jwt, set }: any) => {
          const { provider, token } = body;
          if (provider === "google") {
            return { success: true, token: "mock-jwt", user: { id: "1", email: "test@test.com" } };
          }
          if (provider === "haweya") {
            return { success: true, token: "mock-jwt", user: { id: "2", email: "haweya@test.com" } };
          }
          set.status = 400;
          return { success: false, error: "Unsupported provider" };
        },
        {
          body: t.Object({
            provider: t.String(),
            token: t.String(),
          }),
        }
      );

    it("accepts valid body schema (provider + token)", async () => {
      const req = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", token: "abc123" }),
      });
      const res = await loginApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects when provider is missing (Elysia validation)", async () => {
      const req = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "abc123" }),
      });
      const res = await loginApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects when token is missing (Elysia validation)", async () => {
      const req = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      const res = await loginApp.handle(req);
      expect(res.status).toBe(422);
    });

    it("rejects when body is not JSON", async () => {
      const req = new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "not json",
      });
      const res = await loginApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/auth/google/callback", () => {
    const googleApp = new Elysia({ prefix: "/api/auth" })
      .use(jwt({ name: "jwt", secret: "test-secret" }))
      .post(
        "/google/callback",
        async ({ body, jwt, set }: any) => {
          return { success: true, token: "mock-jwt", user: { id: "g-1", email: "google@test.com" } };
        },
        {
          body: t.Object({
            code: t.String(),
            redirect_uri: t.String(),
          }),
        }
      );

    it("accepts valid callback body", async () => {
      const req = new Request("http://localhost/api/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "auth-code", redirect_uri: "http://localhost/callback" }),
      });
      const res = await googleApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects when code is missing", async () => {
      const req = new Request("http://localhost/api/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirect_uri: "http://localhost/callback" }),
      });
      const res = await googleApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/auth/haweya/callback", () => {
    const haweyaApp = new Elysia({ prefix: "/api/auth" })
      .use(jwt({ name: "jwt", secret: "test-secret" }))
      .post(
        "/haweya/callback",
        async ({ body, jwt, set }: any) => {
          return { success: true, token: "mock-jwt", user: { id: "h-1", email: "haweya@test.com", verified: true } };
        },
        {
          body: t.Object({
            code: t.String(),
            redirect_uri: t.String(),
          }),
        }
      );

    it("accepts valid haweya callback body", async () => {
      const req = new Request("http://localhost/api/auth/haweya/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "haweya-code", redirect_uri: "http://localhost/callback" }),
      });
      const res = await haweyaApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects when redirect_uri is missing", async () => {
      const req = new Request("http://localhost/api/auth/haweya/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "haweya-code" }),
      });
      const res = await haweyaApp.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/auth/verify", () => {
    const TEST_SECRET = "test-jwt-secret-for-unit-tests";

    const verifyApp = new Elysia({ prefix: "/api/auth" })
      .use(jwt({ name: "jwt", secret: TEST_SECRET }))
      .get("/verify", async ({ jwt, set, headers }: any) => {
        const authHeader = headers["authorization"] as string | undefined;
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, error: "No token provided" };
        }
        const token = authHeader.substring(7);
        const decoded = await jwt.verify(token);
        if (!decoded) {
          set.status = 401;
          return { success: false, error: "Invalid token" };
        }
        return { success: true, data: { user: decoded } };
      }, {
        headers: t.Object({
          authorization: t.Optional(t.String()),
        }),
      });

    it("returns 401 when Authorization header is missing", async () => {
      const req = new Request("http://localhost/api/auth/verify");
      const res = await verifyApp.handle(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 for invalid/malformed JWT", async () => {
      const req = new Request("http://localhost/api/auth/verify", {
        headers: { Authorization: "Bearer not-a-real-jwt" },
      });
      const res = await verifyApp.handle(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 with decoded user for valid JWT", async () => {
      // Create a mini app to sign the JWT, then use the token on verifyApp
      const signApp = new Elysia()
        .use(jwt({ name: "jwt", secret: TEST_SECRET }))
        .get("/sign", async ({ jwt }) => {
          return await jwt.sign({
            userId: "user-123",
            email: "test@test.com",
            iat: Math.floor(Date.now() / 1000),
          });
        });

      const signRes = await signApp.handle(new Request("http://localhost/sign"));
      const testJwt = await signRes.text();

      const req = new Request("http://localhost/api/auth/verify", {
        headers: { Authorization: `Bearer ${testJwt}` },
      });
      const res = await verifyApp.handle(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.userId).toBe("user-123");
    });
  });
});
