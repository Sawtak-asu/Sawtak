import { describe, it, expect } from "bun:test";
import { ALLOWED_HEADERS, BLOCKED_HEADERS, PROXY_HEADERS, filterHeaders } from "./headers";

describe("Header Policies", () => {
  describe("ALLOWED_HEADERS", () => {
    it("includes authorization header", () => {
      expect(ALLOWED_HEADERS.has("authorization")).toBe(true);
    });

    it("includes content-type header", () => {
      expect(ALLOWED_HEADERS.has("content-type")).toBe(true);
    });

    it("excludes x-forwarded-for", () => {
      expect(ALLOWED_HEADERS.has("x-forwarded-for")).toBe(false);
    });
  });

  describe("BLOCKED_HEADERS", () => {
    it("blocks x-forwarded-for", () => {
      expect(BLOCKED_HEADERS.has("x-forwarded-for")).toBe(true);
    });

    it("blocks user-agent", () => {
      expect(BLOCKED_HEADERS.has("user-agent")).toBe(true);
    });

    it("blocks referer", () => {
      expect(BLOCKED_HEADERS.has("referer")).toBe(true);
    });

    it("blocks cf-connecting-ip", () => {
      expect(BLOCKED_HEADERS.has("cf-connecting-ip")).toBe(true);
    });
  });

  describe("PROXY_HEADERS", () => {
    it("defines x-proxy-secret", () => {
      expect(PROXY_HEADERS.SECRET).toBe("x-proxy-secret");
    });

    it("defines x-proxy-request-id", () => {
      expect(PROXY_HEADERS.REQUEST_ID).toBe("x-proxy-request-id");
    });

    it("defines x-proxy-session-id", () => {
      expect(PROXY_HEADERS.SESSION_ID).toBe("x-proxy-session-id");
    });
  });

  describe("filterHeaders", () => {
    it("allows only whitelisted headers", () => {
      const incoming = new Headers({
        "authorization": "Bearer token123",
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "Mozilla/5.0",
        "accept": "application/json",
      });

      const result = filterHeaders(incoming);
      expect(result.sanitized["authorization"]).toBe("Bearer token123");
      expect(result.sanitized["content-type"]).toBe("application/json");
      expect(result.sanitized["accept"]).toBe("application/json");
      expect(result.sanitized["x-forwarded-for"]).toBeUndefined();
      expect(result.sanitized["user-agent"]).toBeUndefined();
    });

    it("reports stripped count correctly", () => {
      const incoming = new Headers({
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "Mozilla",
        "referer": "https://example.com",
      });

      const result = filterHeaders(incoming);
      expect(result.strippedCount).toBe(3);
    });

    it("identifies blocked header names", () => {
      const incoming = new Headers({
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "Mozilla",
        "custom-header": "value",
      });

      const result = filterHeaders(incoming);
      expect(result.blockedNames).toContain("x-forwarded-for");
      expect(result.blockedNames).toContain("user-agent");
      // custom-header is stripped but NOT in blockedNames (it's not in BLOCKED_HEADERS)
    });

    it("handles empty headers", () => {
      const incoming = new Headers({});
      const result = filterHeaders(incoming);
      expect(Object.keys(result.sanitized).length).toBe(0);
      expect(result.strippedCount).toBe(0);
    });
  });
});
