import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { ProxyRateLimiter } from "./rate-limiter";
import { config } from "../config";
import Redis from "ioredis";

describe("Proxy Rate Limiter", () => {
  let rateLimiter: ProxyRateLimiter;
  let redis: Redis;

  beforeAll(async () => {
    // Direct Redis connection to clear keys before test
    redis = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
    });
    
    rateLimiter = new ProxyRateLimiter();
    await rateLimiter.connect();
    
    // Clean up test keys
    const keys = await redis.keys("ratelimit:proxy:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await rateLimiter.disconnect();
    await redis.quit();
  });

  it("should enforce anonymous complaint rate limit (5 per hour)", async () => {
    const sessionId = "test-session-anon";
    
    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkComplaint(sessionId, "anonymous");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
    
    // 6th request should be blocked
    const blockedResult = await rateLimiter.checkComplaint(sessionId, "anonymous");
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.limit).toBe(5);
  });

  it("should enforce auth endpoint rate limit based on IP (10 per min)", async () => {
    const ip = "192.168.1.100";
    const endpoint = "login";
    
    // First 10 requests should be allowed
    for (let i = 0; i < 10; i++) {
      const result = await rateLimiter.checkAuth(ip, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9 - i);
    }
    
    // 11th request should be blocked
    const blockedResult = await rateLimiter.checkAuth(ip, endpoint);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.limit).toBe(10);
  });

  it("should enforce general API token bucket limit", async () => {
    const sessionId = "test-session-api";
    const ip = "192.168.1.100";
    
    // Send 100 rapid requests
    for (let i = 0; i < 100; i++) {
      const result = await rateLimiter.checkGeneralApi(sessionId, ip);
      expect(result.allowed).toBe(true);
    }
    
    // 101th request should be blocked (bucket empty)
    const blockedResult = await rateLimiter.checkGeneralApi(sessionId, ip);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });
});
