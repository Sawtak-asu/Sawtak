import { describe, it, expect } from "bun:test";
import { resolveSession, buildSessionCookie } from "./session.middleware";

describe("Session Middleware", () => {
  describe("resolveSession", () => {
    it("generates new session when no cookie provided", () => {
      const result = resolveSession(null);
      expect(result.isNew).toBe(true);
      expect(result.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("extracts valid session from cookie", () => {
      const sessionId = "550e8400-e29b-41d4-a716-446655440000";
      const cookie = `sawtak_sid=${sessionId}`;
      const result = resolveSession(cookie);
      expect(result.isNew).toBe(false);
      expect(result.sessionId).toBe(sessionId);
    });

    it("generates new session for invalid cookie format", () => {
      const result = resolveSession("sawtak_sid=not-a-uuid");
      expect(result.isNew).toBe(true);
    });

    it("generates new session for empty cookie", () => {
      const result = resolveSession("");
      expect(result.isNew).toBe(true);
    });

    it("generates new session for different cookie name", () => {
      const result = resolveSession("other_sid=550e8400-e29b-41d4-a716-446655440000");
      expect(result.isNew).toBe(true);
    });

    it("generates unique sessions for consecutive null calls", () => {
      const r1 = resolveSession(null);
      const r2 = resolveSession(null);
      expect(r1.sessionId).not.toBe(r2.sessionId);
    });
  });

  describe("buildSessionCookie", () => {
    it("includes session ID and correct cookie attributes", () => {
      const sessionId = "550e8400-e29b-41d4-a716-446655440000";
      const cookie = buildSessionCookie(sessionId);
      expect(cookie).toContain(`sawtak_sid=${sessionId}`);
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("Max-Age=86400");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });
  });
});
