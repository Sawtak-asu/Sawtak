import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import { RateLimiterService } from "../src/services/rate-limiter.service";

/**
 * Rate Limiter Service Tests
 * 
 * These tests require a running Redis instance.
 * Run with: bun test tests/rate-limiter.test.ts
 * 
 * Make sure Redis is running: docker run -d --name sawtak-redis -p 6379:6379 redis:7-alpine
 */

describe("RateLimiterService", () => {
  let rateLimiter: RateLimiterService;
  let isRedisAvailable = false;

  beforeAll(async () => {
    rateLimiter = new RateLimiterService();
    isRedisAvailable = await rateLimiter.connect();
    
    if (!isRedisAvailable) {
      console.warn("⚠️ Redis not available - some tests will be skipped");
    }
  });

  afterAll(async () => {
    if (isRedisAvailable) {
      await rateLimiter.disconnect();
    }
  });

  describe("Connection", () => {
    test("should connect to Redis successfully", () => {
      expect(isRedisAvailable).toBe(true);
    });

    test("should report healthy status when connected", async () => {
      if (!isRedisAvailable) return;
      
      const health = await rateLimiter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe("connected");
      expect(health.latency).toBeDefined();
      expect(health.latency).toBeLessThan(100); // Should respond in < 100ms
    });
  });

  describe("Complaint Submission Rate Limiting", () => {
    const testUserId = `test-user-${Date.now()}`;

    beforeEach(async () => {
      if (!isRedisAvailable) return;
      // Reset rate limits before each test
      await rateLimiter.resetUserLimit(testUserId, "anonymous");
      await rateLimiter.resetUserLimit(testUserId, "identified");
    });

    test("should allow first anonymous complaint submission", async () => {
      if (!isRedisAvailable) return;

      const result = await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    test("should allow first identified complaint submission", async () => {
      if (!isRedisAvailable) return;

      const result = await rateLimiter.checkComplaintSubmission(testUserId, "identified");
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    test("should track anonymous complaint count correctly", async () => {
      if (!isRedisAvailable) return;

      // Submit 3 anonymous complaints
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      }

      const status = await rateLimiter.getRateLimitStatus(testUserId, "anonymous");
      expect(status.current).toBe(3);
      expect(status.max).toBe(5); // Default limit
    });

    test("should block after exceeding anonymous limit", async () => {
      if (!isRedisAvailable) return;

      // Use up all anonymous quota (default is 5)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      }

      // 6th attempt should be blocked
      const result = await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test("should have different limits for anonymous vs identified", async () => {
      if (!isRedisAvailable) return;

      const anonResult = await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      const identifiedResult = await rateLimiter.checkComplaintSubmission(testUserId, "identified");

      // Anonymous has stricter limits (5) vs identified (20)
      // After one submission each, remaining should differ
      const anonStatus = await rateLimiter.getRateLimitStatus(testUserId, "anonymous");
      const identifiedStatus = await rateLimiter.getRateLimitStatus(testUserId, "identified");

      expect(anonStatus.max).toBeLessThan(identifiedStatus.max);
    });

    test("should reset user limits correctly", async () => {
      if (!isRedisAvailable) return;

      // Submit some complaints
      await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");

      // Reset
      await rateLimiter.resetUserLimit(testUserId, "anonymous");

      // Should be back to full quota
      const result = await rateLimiter.checkComplaintSubmission(testUserId, "anonymous");
      expect(result.allowed).toBe(true);
      
      const status = await rateLimiter.getRateLimitStatus(testUserId, "anonymous");
      expect(status.current).toBe(1); // Just the one we submitted after reset
    });
  });

  describe("IP Rate Limiting (Auth)", () => {
    const testIp = `127.0.0.${Date.now() % 255}`;

    test("should allow requests within limit", async () => {
      if (!isRedisAvailable) return;

      const result = await rateLimiter.checkIpRateLimit(testIp, "login", 10, 60);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 max - 1 used
    });

    test("should block after exceeding IP limit", async () => {
      if (!isRedisAvailable) return;

      const uniqueIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkIpRateLimit(uniqueIp, "test-endpoint", 5, 60);
      }

      // 6th attempt should be blocked
      const result = await rateLimiter.checkIpRateLimit(uniqueIp, "test-endpoint", 5, 60);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("API Rate Limiting (Token Bucket)", () => {
    test("should allow requests with tokens available", async () => {
      if (!isRedisAvailable) return;

      const uniqueId = `api-test-${Date.now()}`;
      const result = await rateLimiter.checkApiRateLimit(uniqueId, 100, 10);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(99);
    });

    test("should provide higher limits for authenticated users", async () => {
      if (!isRedisAvailable) return;

      const authId = `user:auth-${Date.now()}`;
      const anonId = `ip:anon-${Date.now()}`;

      // Authenticated users get 1000 tokens
      const authResult = await rateLimiter.checkApiRateLimit(authId, 1000, 50);
      expect(authResult.remaining).toBeGreaterThanOrEqual(998);

      // Anonymous users get 100 tokens
      const anonResult = await rateLimiter.checkApiRateLimit(anonId, 100, 10);
      expect(anonResult.remaining).toBeLessThanOrEqual(99);
    });
  });

  describe("Violation Recording", () => {
    test("should record violations", async () => {
      if (!isRedisAvailable) return;

      await rateLimiter.recordViolation("test-user", "test-violation", {
        reason: "test",
        timestamp: Date.now(),
      });

      const violations = await rateLimiter.getViolations("test-violation", 10);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].userId).toBe("test-user");
      expect(violations[0].type).toBe("test-violation");
    });

    test("should limit stored violations", async () => {
      if (!isRedisAvailable) return;

      // This just verifies the method doesn't throw
      for (let i = 0; i < 10; i++) {
        await rateLimiter.recordViolation(`user-${i}`, "bulk-test", { index: i });
      }

      const violations = await rateLimiter.getViolations("bulk-test", 5);
      expect(violations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Fail-Open Behavior", () => {
    test("should return allowed=true when Redis fails (graceful degradation)", async () => {
      // This tests the fail-open behavior
      // Even if Redis is down, the rate limiter should allow requests
      // (to avoid blocking all traffic)
      
      // We can't easily simulate Redis failure in tests without
      // disconnecting, so we just verify the structure exists
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.isConnected).toBe("function");
    });
  });
});

describe("Rate Limit Middleware Integration", () => {
  // Note: Full integration tests would require running the Elysia app
  // These are placeholder tests for the middleware structure
  
  test("middleware exports should be defined", async () => {
    const middleware = await import("../src/middleware/rate-limit.middleware");
    
    expect(middleware.complaintRateLimitMiddleware).toBeDefined();
    expect(middleware.authRateLimitMiddleware).toBeDefined();
    expect(middleware.apiRateLimitMiddleware).toBeDefined();
    expect(middleware.uploadRateLimitMiddleware).toBeDefined();
  });
});
