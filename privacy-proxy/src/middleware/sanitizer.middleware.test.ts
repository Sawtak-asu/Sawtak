import { describe, it, expect } from "bun:test";
import { sanitizeRequest } from "./sanitizer.middleware";
import { PROXY_HEADERS } from "../policies/headers";

describe("Sanitizer Middleware", () => {
  it("allows GET requests to feed endpoint", () => {
    const req = new Request("http://localhost/api/feed?page=1");
    const result = sanitizeRequest(req, "test-session-uuid");
    expect(result.allowed).toBe(true);
    expect(result.headers[PROXY_HEADERS.SECRET]).toBe("dev-proxy-secret-change-in-production");
    expect(result.headers[PROXY_HEADERS.SESSION_ID]).toBe("test-session-uuid");
    expect(result.headers[PROXY_HEADERS.REQUEST_ID]).toBeDefined();
    expect(result.headers["user-agent"]).toBe("Sawtak-Proxy/1.0");
  });

  it("blocks PUT requests to feed endpoint (method not allowed)", () => {
    const req = new Request("http://localhost/api/feed?page=1", { method: "PUT" });
    const result = sanitizeRequest(req, "test-session");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(405);
    expect(result.reason).toContain("not allowed");
  });

  it("blocks oversized requests to upload endpoint", () => {
    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "content-length": "60000000" },
    });
    const result = sanitizeRequest(req, "test-session");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(413);
    expect(result.reason).toContain("too large");
  });

  it("allows POST to upload with valid size", () => {
    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "content-length": "1000" },
    });
    const result = sanitizeRequest(req, "test-session");
    expect(result.allowed).toBe(true);
  });

  it("strips privacy-sensitive headers and injects proxy headers", () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "authorization": "Bearer token",
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0",
        "referer": "https://example.com",
      },
    });
    const result = sanitizeRequest(req, "session-123");
    expect(result.allowed).toBe(true);
    expect(result.headers["authorization"]).toBe("Bearer token");
    expect(result.headers["x-forwarded-for"]).toBeUndefined();
    expect(result.headers["user-agent"]).toBe("Sawtak-Proxy/1.0");
    expect(result.headers[PROXY_HEADERS.SECRET]).toBe("dev-proxy-secret-change-in-production");
  });

  it("tracks stripped header count", () => {
    const req = new Request("http://localhost/api/feed", {
      method: "GET",
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "Mozilla",
        "referer": "https://example.com",
        "accept": "application/json",
      },
    });
    const result = sanitizeRequest(req, "session");
    expect(result.strippedHeaderCount).toBe(3); // x-forwarded-for, user-agent, referer stripped; accept kept
  });

  it("blocks POST to health check (method not allowed)", () => {
    const req = new Request("http://localhost/api/health", { method: "POST" });
    const result = sanitizeRequest(req, "test-session");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(405);
  });

  it("allows OPTIONS preflight for upload", () => {
    const req = new Request("http://localhost/api/upload", { method: "OPTIONS" });
    const result = sanitizeRequest(req, "test-session");
    expect(result.allowed).toBe(true);
  });
});
