import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { ProxyRateLimiter } from "./rate-limiter";
import { config } from "../config";
import Redis from "ioredis";

describe("Proxy Rate Limiter", () => {
  let rateLimiter: ProxyRateLimiter;
  let redis: Redis;
  let redisAvailable = false;

  beforeAll(async () => {
    rateLimiter = new ProxyRateLimiter();
    const connected = await rateLimiter.connect();

    if (!connected) {
      return;
    }

    try {
      redis = new Redis({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        commandTimeout: 2000,
      });

      await redis.ping();
      redisAvailable = true;

      const keys = await redis.keys("ratelimit:proxy:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      redisAvailable = false;
    }
  });

  afterAll(async () => {
    await rateLimiter.disconnect();
    if (redisAvailable && redis) {
      await redis.quit();
    }
  });

  function skipIfRedisUnavailable() {
    if (!redisAvailable) {
      console.warn("[Redis] Skipping test - Redis not available");
    }
    return !redisAvailable;
  }

  it("should enforce anonymous complaint rate limit (5 per hour)", async () => {
    if (skipIfRedisUnavailable()) return;

    const sessionId = "test-session-anon";

    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkComplaint(sessionId, "anonymous");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }

    const blockedResult = await rateLimiter.checkComplaint(sessionId, "anonymous");
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.limit).toBe(5);
  }, { timeout: 10000 });

  it("should enforce auth endpoint rate limit based on IP (10 per min)", async () => {
    if (skipIfRedisUnavailable()) return;

    const ip = "192.168.1.100";
    const endpoint = "login";

    for (let i = 0; i < 10; i++) {
      const result = await rateLimiter.checkAuth(ip, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9 - i);
    }

    const blockedResult = await rateLimiter.checkAuth(ip, endpoint);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.limit).toBe(10);
  }, { timeout: 10000 });

  it("should enforce general API token bucket limit", async () => {
    if (skipIfRedisUnavailable()) return;

    const sessionId = "test-session-api";
    const ip = "192.168.1.100";

    for (let i = 0; i < 100; i++) {
      const result = await rateLimiter.checkGeneralApi(sessionId, ip);
      expect(result.allowed).toBe(true);
    }

    const blockedResult = await rateLimiter.checkGeneralApi(sessionId, ip);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  }, { timeout: 10000 });
});
