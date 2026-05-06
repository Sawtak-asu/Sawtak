/**
 * Privacy Proxy Configuration
 *
 * All configuration is sourced from environment variables with safe defaults
 * for local development.
 */

export const config = {
  /** Port the proxy listens on */
  port: parseInt(process.env.PROXY_PORT || "4000", 10),

  /** Internal backend URL (never exposed to public) */
  backendUrl: process.env.BACKEND_INTERNAL_URL || "http://localhost:8000",

  /** Shared secret for proxy ↔ backend trust */
  proxySecret: process.env.PROXY_SECRET || "dev-proxy-secret-change-in-production",

  /** Maximum request body size in bytes (default 10MB) */
  maxBodySize: parseInt(process.env.MAX_BODY_SIZE || String(10 * 1024 * 1024), 10),

  /** Session cookie name */
  sessionCookieName: "sawtak_sid",

  /** Session cookie max age in seconds (default 24 hours) */
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || "86400", 10),

  /** Environment */
  nodeEnv: process.env.NODE_ENV || "development",

  /** Frontend URL for CORS */
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  /** Redis Configuration for Rate Limiting */
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
} as const;
