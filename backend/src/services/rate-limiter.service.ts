import { Redis } from 'ioredis';

/**
 * Rate Limiter Service using Redis
 * Implements sliding window counter for accurate rate limiting
 */
export class RateLimiterService {
  private redis: Redis;
  private isReady: boolean = false;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error('[Redis] Max retries reached, giving up');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      lazyConnect: true, // Don't connect immediately
    });

    this.redis.on('connect', () => {
      console.log('[Redis] ✅ Connected successfully');
      this.isReady = true;
    });

    this.redis.on('ready', () => {
      console.log('[Redis] ✅ Ready to accept commands');
      this.isReady = true;
    });

    this.redis.on('error', (err) => {
      console.error('[Redis] ❌ Connection error:', err.message);
      this.isReady = false;
    });

    this.redis.on('close', () => {
      console.log('[Redis] Connection closed');
      this.isReady = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });
  }

  /**
   * Initialize Redis connection
   * Call this before using the rate limiter
   */
  async connect(): Promise<boolean> {
    try {
      await this.redis.connect();
      // Test the connection
      await this.redis.ping();
      console.log('[Redis] ✅ Ping successful - Redis is ready for rate limiting');
      return true;
    } catch (error: any) {
      console.error('[Redis] ❌ Failed to connect:', error.message);
      console.warn('[Redis] ⚠️ Rate limiting will use fail-open strategy (requests allowed)');
      return false;
    }
  }

  /**
   * Check if Redis is connected and ready
   */
  isConnected(): boolean {
    return this.isReady && this.redis.status === 'ready';
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ healthy: boolean; status: string; latency?: number }> {
    if (!this.isReady) {
      return { healthy: false, status: 'disconnected' };
    }
    
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      return { healthy: true, status: 'connected', latency };
    } catch (error) {
      return { healthy: false, status: 'error' };
    }
  }

  /**
   * Check if user can submit a complaint
   * Uses sorted set with timestamps for sliding window
   * 
   * @param userId - User ID
   * @param type - 'anonymous' or 'identified'
   * @returns { allowed: boolean, remaining: number, resetAt: Date }
   */
  async checkComplaintSubmission(
    userId: string,
    type: 'anonymous' | 'identified'
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const limits = {
      anonymous: { 
        max: parseInt(process.env.RATE_LIMIT_ANONYMOUS_HOURLY || '5'), 
        window: 3600 // 1 hour in seconds
      },
      identified: { 
        max: parseInt(process.env.RATE_LIMIT_IDENTIFIED_HOURLY || '20'), 
        window: 3600 
      },
    };

    const { max, window } = limits[type];
    const key = `ratelimit:complaint:${type}:${userId}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      // Use Redis pipeline for atomic operations
      const multi = this.redis.multi();
      
      // Remove old entries outside the sliding window
      multi.zremrangebyscore(key, 0, windowStart);
      
      // Count current entries in the window
      multi.zcard(key);
      
      // Add current timestamp
      multi.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry to window duration
      multi.expire(key, window);

      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      // Get count from the second operation (zcard)
      const count = results[1][1] as number;

      const allowed = count < max;
      const remaining = Math.max(0, max - count - 1);
      const resetAt = new Date(now + window * 1000);

      return { allowed, remaining, resetAt };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if Redis is down
      // In production, you might want to fail closed or use DB fallback
      return { 
        allowed: true, 
        remaining: 0, 
        resetAt: new Date(now + 3600 * 1000) 
      };
    }
  }

  /**
   * Token bucket algorithm for API rate limiting
   * Good for handling burst traffic
   * 
   * @param identifier - IP address or user ID
   * @param maxTokens - Maximum tokens in bucket
   * @param refillRate - Tokens added per second
   */
  async checkApiRateLimit(
    identifier: string,
    maxTokens: number = 100,
    refillRate: number = 10, // tokens per second
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `ratelimit:api:${identifier}`;
    const now = Date.now() / 1000; // seconds

    try {
      const bucket = await this.redis.get(key);
      let tokens = maxTokens;
      let lastRefill = now;

      if (bucket) {
        const [storedTokens, storedTime] = bucket.split(':').map(Number);
        const elapsed = now - storedTime;
        // Refill tokens based on elapsed time
        tokens = Math.min(maxTokens, storedTokens + elapsed * refillRate);
        lastRefill = storedTime;
      }

      const allowed = tokens >= 1;
      if (allowed) {
        tokens -= 1;
      }

      // Store updated bucket state
      await this.redis.setex(
        key,
        3600, // 1 hour TTL
        `${tokens}:${now}`
      );

      const resetAt = new Date((now + (maxTokens - tokens) / refillRate) * 1000);

      return { 
        allowed, 
        remaining: Math.floor(tokens),
        resetAt 
      };
    } catch (error) {
      console.error('API rate limit check failed:', error);
      return { 
        allowed: true, 
        remaining: 0,
        resetAt: new Date(Date.now() + 3600 * 1000)
      };
    }
  }

  /**
   * IP-based rate limiting for authentication endpoints
   * Prevents brute force attacks
   * 
   * @param ip - Client IP address
   * @param endpoint - Endpoint being accessed (e.g., 'login', 'signup')
   * @param maxAttempts - Maximum attempts allowed
   * @param windowSeconds - Time window in seconds
   */
  async checkIpRateLimit(
    ip: string,
    endpoint: string,
    maxAttempts: number = 10,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `ratelimit:ip:${endpoint}:${ip}`;
    const now = Date.now();

    try {
      const count = await this.redis.incr(key);
      
      // Set expiry on first request
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }

      const allowed = count <= maxAttempts;
      const remaining = Math.max(0, maxAttempts - count);
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(now + ttl * 1000);

      return { allowed, remaining, resetAt };
    } catch (error) {
      console.error('IP rate limit check failed:', error);
      return { 
        allowed: true, 
        remaining: 0,
        resetAt: new Date(now + windowSeconds * 1000)
      };
    }
  }

  /**
   * Record a rate limit violation for monitoring
   * 
   * @param userId - User ID or IP
   * @param type - Type of rate limit violated
   * @param metadata - Additional context
   */
  async recordViolation(
    userId: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const key = `ratelimit:violations:${type}`;
    const violation = {
      userId,
      type,
      timestamp: Date.now(),
      ...metadata,
    };

    try {
      // Store in sorted set for time-based queries
      await this.redis.zadd(
        key,
        Date.now(),
        JSON.stringify(violation)
      );

      // Keep only last 1000 violations per type
      await this.redis.zremrangebyrank(key, 0, -1001);
    } catch (error) {
      console.error('Failed to record violation:', error);
    }
  }

  /**
   * Get rate limit violations for a user
   * Useful for admin dashboard
   * 
   * @param type - Type of violations to retrieve
   * @param limit - Maximum number of violations to return
   */
  async getViolations(
    type: string,
    limit: number = 100
  ): Promise<any[]> {
    const key = `ratelimit:violations:${type}`;

    try {
      const violations = await this.redis.zrevrange(key, 0, limit - 1);
      return violations.map(v => JSON.parse(v));
    } catch (error) {
      console.error('Failed to get violations:', error);
      return [];
    }
  }

  /**
   * Reset rate limit for a user (admin function)
   * 
   * @param userId - User ID
   * @param type - Type of rate limit to reset
   */
  async resetUserLimit(userId: string, type: string): Promise<void> {
    const key = `ratelimit:complaint:${type}:${userId}`;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get current rate limit status for a user
   * Useful for displaying remaining attempts in UI
   * 
   * @param userId - User ID
   * @param type - 'anonymous' or 'identified'
   */
  async getRateLimitStatus(
    userId: string,
    type: 'anonymous' | 'identified'
  ): Promise<{ current: number; max: number; resetAt: Date }> {
    const limits = {
      anonymous: { max: 5, window: 3600 },
      identified: { max: 20, window: 3600 },
    };

    const { max, window } = limits[type];
    const key = `ratelimit:complaint:${type}:${userId}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, windowStart);
      
      // Get current count
      const current = await this.redis.zcard(key);
      
      // Get TTL
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(now + ttl * 1000);

      return { current, max, resetAt };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { 
        current: 0, 
        max, 
        resetAt: new Date(now + window * 1000) 
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();
