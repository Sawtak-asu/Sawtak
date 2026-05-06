import { Redis } from "ioredis";
import { config } from "../config";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export class ProxyRateLimiter {
  private redis: Redis;
  private isReady: boolean = false;

  constructor() {
    this.redis = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error("[ProxyRedis] Max retries reached, giving up");
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    this.redis.on("connect", () => {
      this.isReady = true;
    });

    this.redis.on("error", (err) => {
      console.error("[ProxyRedis] ❌ Connection error:", err.message);
      this.isReady = false;
    });
  }

  async connect(): Promise<boolean> {
    try {
      await this.redis.connect();
      await this.redis.ping();
      console.log("[ProxyRedis] ✅ Rate Limiter connected to Redis");
      return true;
    } catch (error: any) {
      console.error("[ProxyRedis] ❌ Failed to connect:", error.message);
      console.warn("[ProxyRedis] ⚠️ Rate limiting will use fail-open strategy");
      return false;
    }
  }

  /**
   * Sliding window rate limit using sorted sets
   */
  private async checkSlidingWindow(
    key: string,
    max: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      if (!this.isReady) throw new Error("Redis not ready");

      const multi = this.redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zcard(key);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      if (!results) throw new Error("Pipeline execution failed");

      const count = results[1][1] as number;
      const allowed = count < max;
      const remaining = Math.max(0, max - count - 1);
      const resetAt = new Date(now + windowSeconds * 1000);

      return { allowed, remaining, resetAt, limit: max };
    } catch (error) {
      // Fail open
      return {
        allowed: true,
        remaining: max,
        resetAt: new Date(now + windowSeconds * 1000),
        limit: max,
      };
    }
  }

  /**
   * Fixed window rate limit using incr
   */
  private async checkFixedWindow(
    key: string,
    max: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();

    try {
      if (!this.isReady) throw new Error("Redis not ready");

      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }

      const allowed = count <= max;
      const remaining = Math.max(0, max - count);
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(now + (ttl > 0 ? ttl : windowSeconds) * 1000);

      return { allowed, remaining, resetAt, limit: max };
    } catch (error) {
      // Fail open
      return {
        allowed: true,
        remaining: max,
        resetAt: new Date(now + windowSeconds * 1000),
        limit: max,
      };
    }
  }

  /**
   * Token bucket for general API
   */
  private async checkTokenBucket(
    key: string,
    maxTokens: number,
    refillRate: number // tokens per second
  ): Promise<RateLimitResult> {
    const now = Date.now() / 1000; // seconds

    try {
      if (!this.isReady) throw new Error("Redis not ready");

      const bucket = await this.redis.get(key);
      let tokens = maxTokens;
      let lastRefill = now;

      if (bucket) {
        const [storedTokens, storedTime] = bucket.split(":").map(Number);
        const elapsed = now - storedTime;
        tokens = Math.min(maxTokens, storedTokens + elapsed * refillRate);
        lastRefill = storedTime;
      }

      const allowed = tokens >= 1;
      if (allowed) {
        tokens -= 1;
      }

      await this.redis.setex(key, 3600, `${tokens}:${now}`);
      const resetAt = new Date((now + (maxTokens - tokens) / refillRate) * 1000);

      return {
        allowed,
        remaining: Math.floor(tokens),
        resetAt,
        limit: maxTokens,
      };
    } catch (error) {
      return {
        allowed: true,
        remaining: maxTokens,
        resetAt: new Date(Date.now() + 3600 * 1000),
        limit: maxTokens,
      };
    }
  }

  /**
   * Complaint submissions: Sliding window based on session ID
   */
  async checkComplaint(
    sessionId: string,
    type: "anonymous" | "identified"
  ): Promise<RateLimitResult> {
    const limits = {
      anonymous: { max: 5, window: 3600 },
      identified: { max: 20, window: 3600 },
    };
    const { max, window } = limits[type];
    const key = `ratelimit:proxy:complaint:${type}:${sessionId}`;
    return this.checkSlidingWindow(key, max, window);
  }

  /**
   * Auth endpoints: Fixed window based on client IP
   */
  async checkAuth(ip: string, endpoint: string): Promise<RateLimitResult> {
    const limits: Record<string, { max: number; window: number }> = {
      login: { max: 10, window: 60 },
      "google/callback": { max: 10, window: 60 },
      "haweya/callback": { max: 10, window: 60 },
    };
    const config = limits[endpoint] || { max: 20, window: 60 };
    const key = `ratelimit:proxy:auth:${endpoint}:${ip}`;
    return this.checkFixedWindow(key, config.max, config.window);
  }

  /**
   * Upload endpoints: Fixed window based on session ID
   */
  async checkUpload(sessionId: string): Promise<RateLimitResult> {
    const key = `ratelimit:proxy:upload:${sessionId}`;
    return this.checkFixedWindow(key, 10, 3600); // 10 per hour
  }

  /**
   * General API endpoints: Token bucket based on session ID + IP
   */
  async checkGeneralApi(sessionId: string, ip: string): Promise<RateLimitResult> {
    const key = `ratelimit:proxy:api:${sessionId}:${ip}`;
    return this.checkTokenBucket(key, 100, 10); // 100 max, 10 per sec
  }
  
  async disconnect() {
    if (this.isReady) {
      await this.redis.quit();
    }
  }
}

export const proxyRateLimiter = new ProxyRateLimiter();
