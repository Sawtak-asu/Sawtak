import { describe, expect, it, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { proxyAuthMiddleware } from "./proxy-auth.middleware";

describe("Proxy Auth Middleware (Trust Boundary)", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createApp = () => {
    return new Elysia()
      .use(proxyAuthMiddleware)
      .get("/", ({ proxyRequestId, proxySessionId, isProxied }: any) => ({
        success: true,
        proxyRequestId,
        proxySessionId,
        isProxied,
        message: "Sensitive Backend Data"
      }));
  };

  it("should block requests entirely missing the X-Proxy-Secret header (403)", async () => {
    process.env.REQUIRE_PROXY_AUTH = "true";
    process.env.PROXY_SECRET = "super-secret-test-key";
    
    const app = createApp();
    const req = new Request("http://localhost/");
    const res = await app.handle(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Direct backend access is not allowed");
  });

  it("should block requests with an invalid X-Proxy-Secret (403)", async () => {
    process.env.REQUIRE_PROXY_AUTH = "true";
    process.env.PROXY_SECRET = "super-secret-test-key";
    
    const app = createApp();
    const req = new Request("http://localhost/", {
      headers: {
        "x-proxy-secret": "hacker-guess-123"
      }
    });
    
    const res = await app.handle(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Direct backend access is not allowed");
  });

  it("should allow requests with the correct X-Proxy-Secret and derive session IDs", async () => {
    process.env.REQUIRE_PROXY_AUTH = "true";
    process.env.PROXY_SECRET = "super-secret-test-key";
    
    const app = createApp();
    const req = new Request("http://localhost/", {
      headers: {
        "x-proxy-secret": "super-secret-test-key",
        "x-proxy-request-id": "req-123",
        "x-proxy-session-id": "sess-456"
      }
    });
    
    const res = await app.handle(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.proxyRequestId).toBe("req-123");
    expect(body.proxySessionId).toBe("sess-456");
    expect(body.isProxied).toBe(true);
  });

  it("should fail-safe (crash/500) if REQUIRE_PROXY_AUTH=true but PROXY_SECRET is missing", async () => {
    process.env.REQUIRE_PROXY_AUTH = "true";
    process.env.PROXY_SECRET = ""; // Empty secret
    
    const app = createApp();
    const req = new Request("http://localhost/", {
      headers: {
        "x-proxy-secret": "anything"
      }
    });
    
    const res = await app.handle(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server misconfiguration: proxy secret not set");
  });

  it("should fail-open and allow direct access if REQUIRE_PROXY_AUTH=false", async () => {
    process.env.REQUIRE_PROXY_AUTH = "false";
    
    const app = createApp();
    const req = new Request("http://localhost/");
    
    const res = await app.handle(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Sensitive Backend Data");
  });
});
