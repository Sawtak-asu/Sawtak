import { Elysia } from 'elysia';
import { rateLimiter } from '../services/rate-limiter.service';

// Define user type for better type safety
interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Rate limit middleware for complaint submissions
 * Applies different limits for anonymous vs identified complaints
 * NOTE: This middleware should be used AFTER authMiddleware
 */
export const complaintRateLimitMiddleware = new Elysia()
  .derive(async ({ request, set, ...ctx }) => {
    // Get user from context (set by authMiddleware)
    const user = (ctx as any).user as AuthUser | null;
    
    // Ensure user is authenticated
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }

    // Determine complaint type from route path
    const url = new URL(request.url);
    const isAnonymous = url.pathname.includes('/anonymous/');
    const type = isAnonymous ? 'anonymous' : 'identified';

    // Check rate limit
    const result = await rateLimiter.checkComplaintSubmission(user.userId, type);

    // Set rate limit headers (RFC 6585)
    const limit = type === 'anonymous' ? 5 : 20;
    set.headers['X-RateLimit-Limit'] = limit.toString();
    set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    set.headers['X-RateLimit-Reset'] = result.resetAt.toISOString();

    // If rate limit exceeded
    if (!result.allowed) {
      // Record violation for monitoring
      await rateLimiter.recordViolation(user.userId, `complaint_${type}`, {
        email: user.email,
        path: url.pathname,
      });

      set.status = 429;
      set.headers['Retry-After'] = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      ).toString();

      throw new Error(
        `Rate limit exceeded. You can submit ${limit} ${type} complaints per hour. ` +
        `Try again at ${result.resetAt.toLocaleTimeString()}.`
      );
    }

    return { rateLimitInfo: result };
  });

/**
 * IP-based rate limit middleware for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimitMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    // Get client IP (handle proxies)
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Determine endpoint type
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/').pop() || 'unknown';

    // Different limits for different auth endpoints
    const limits: Record<string, { max: number; window: number }> = {
      login: { max: 10, window: 60 }, // 10 per minute
      signup: { max: 5, window: 3600 }, // 5 per hour
      'forgot-password': { max: 3, window: 3600 }, // 3 per hour
      'reset-password': { max: 5, window: 3600 }, // 5 per hour
      'verify-email': { max: 10, window: 3600 }, // 10 per hour
    };

    const config = limits[endpoint] || { max: 20, window: 60 };

    // Check IP rate limit
    const result = await rateLimiter.checkIpRateLimit(
      ip,
      endpoint,
      config.max,
      config.window
    );

    // Set headers
    set.headers['X-RateLimit-Limit'] = config.max.toString();
    set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    set.headers['X-RateLimit-Reset'] = result.resetAt.toISOString();

    // If rate limit exceeded
    if (!result.allowed) {
      await rateLimiter.recordViolation(ip, `auth_${endpoint}`, {
        endpoint,
        userAgent: request.headers.get('user-agent'),
      });

      set.status = 429;
      set.headers['Retry-After'] = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      ).toString();

      throw new Error(
        `Too many ${endpoint} attempts. Please try again in ${Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)} seconds.`
      );
    }

    return { ipRateLimitInfo: result };
  });

/**
 * General API rate limit middleware
 * Applies to public endpoints
 */
export const apiRateLimitMiddleware = new Elysia()
  .derive(async ({ request, set, ...ctx }) => {
    // Get user from context if authenticated
    const user = (ctx as any).user as AuthUser | null;
    
    // Use user ID if authenticated, otherwise use IP
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const identifier = user?.userId || `ip:${ip}`;

    // Check API rate limit (token bucket)
    const maxTokens = user ? 1000 : 100; // Higher limit for authenticated users
    const refillRate = user ? 50 : 10; // Faster refill for authenticated users

    const result = await rateLimiter.checkApiRateLimit(
      identifier,
      maxTokens,
      refillRate
    );

    // Set headers
    set.headers['X-RateLimit-Limit'] = maxTokens.toString();
    set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    set.headers['X-RateLimit-Reset'] = result.resetAt.toISOString();

    // If rate limit exceeded
    if (!result.allowed) {
      await rateLimiter.recordViolation(identifier, 'api_general', {
        path: new URL(request.url).pathname,
        authenticated: !!user,
      });

      set.status = 429;
      set.headers['Retry-After'] = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      ).toString();

      throw new Error(
        `API rate limit exceeded. Please slow down your requests.`
      );
    }

    return { apiRateLimitInfo: result };
  });

/**
 * File upload rate limit middleware
 * Prevents storage abuse
 * NOTE: This middleware should be used AFTER authMiddleware
 */
export const uploadRateLimitMiddleware = new Elysia()
  .derive(async ({ request, set, ...ctx }) => {
    // Get user from context (set by authMiddleware)
    const user = (ctx as any).user as AuthUser | null;
    
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }

    const maxUploads = 10; // 10 uploads per hour
    const windowSeconds = 3600;

    const result = await rateLimiter.checkIpRateLimit(
      user.userId,
      'upload',
      maxUploads,
      windowSeconds
    );

    set.headers['X-RateLimit-Limit'] = maxUploads.toString();
    set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    set.headers['X-RateLimit-Reset'] = result.resetAt.toISOString();

    if (!result.allowed) {
      await rateLimiter.recordViolation(user.userId, 'upload', {
        email: user.email,
      });

      set.status = 429;
      throw new Error(
        `Upload limit exceeded. You can upload ${maxUploads} files per hour. ` +
        `Try again at ${result.resetAt.toLocaleTimeString()}.`
      );
    }

    return { uploadRateLimitInfo: result };
  });
