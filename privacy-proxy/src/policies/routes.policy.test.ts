import { describe, it, expect } from "bun:test";
import { findRoutePolicy, ROUTE_POLICIES, DEFAULT_POLICY } from "./routes";

describe("Route Policies", () => {
  describe("findRoutePolicy", () => {
    it("matches upload route", () => {
      const policy = findRoutePolicy("/api/upload");
      expect(policy.pattern).toBe("/api/upload");
      expect(policy.maxBodySize).toBe(50 * 1024 * 1024);
      expect(policy.methods).toContain("POST");
    });

    it("matches anonymous complaint submission", () => {
      const policy = findRoutePolicy("/api/complaints/anonymous/submit");
      expect(policy.pattern).toBe("/api/complaints/anonymous/submit");
      expect(policy.maxBodySize).toBe(1 * 1024 * 1024);
    });

    it("matches auth routes", () => {
      const policy = findRoutePolicy("/api/auth/verify");
      expect(policy.pattern).toBe("/api/auth");
      expect(policy.methods).toContain("GET");
      expect(policy.methods).toContain("POST");
    });

    it("matches feed routes", () => {
      const policy = findRoutePolicy("/api/feed?page=1");
      expect(policy.pattern).toBe("/api/feed");
      expect(policy.maxBodySize).toBe(0);
      expect(policy.methods).toContain("GET");
    });

    it("matches health check", () => {
      const policy = findRoutePolicy("/api/health");
      expect(policy.pattern).toBe("/api/health");
      expect(policy.methods).toContain("GET");
      expect(policy.methods).not.toContain("POST");
    });

    it("falls back to default policy for unknown routes", () => {
      const policy = findRoutePolicy("/api/vote/status");
      expect(policy).toBe(DEFAULT_POLICY);
      expect(policy.maxBodySize).toBe(10 * 1024 * 1024);
    });

    it("applies first-match priority", () => {
      // /api/complaints/anonymous/submit should match the specific policy, not the general /api/ (default)
      const policy = findRoutePolicy("/api/complaints/anonymous/submit");
      expect(policy.pattern).toBe("/api/complaints/anonymous/submit");
      expect(policy.pattern).not.toBe("/api/");
    });
  });

  describe("ROUTE_POLICIES", () => {
    it("has correct number of policies", () => {
      expect(ROUTE_POLICIES.length).toBe(6);
    });

    it("all policies have required fields", () => {
      for (const policy of ROUTE_POLICIES) {
        expect(policy.pattern).toBeDefined();
        expect(policy.maxBodySize).toBeDefined();
        expect(policy.methods).toBeDefined();
        expect(policy.description).toBeDefined();
      }
    });
  });
});
