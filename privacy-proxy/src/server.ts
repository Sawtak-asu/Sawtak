/**
 * Sawtak Privacy Proxy Server
 *
 * The single public-facing API entrypoint. Receives client requests,
 * strips privacy-sensitive metadata, and forwards sanitized requests
 * to the internal backend service.
 *
 * Architecture:
 *   Client → Privacy Proxy (public) → Backend (internal only)
 */

import "dotenv/config";

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { config } from "./config";
import { resolveSession, buildSessionCookie } from "./middleware/session.middleware";
import { sanitizeRequest } from "./middleware/sanitizer.middleware";
import { forwardRequest } from "./proxy/forwarder";
import { proxyRateLimiter, RateLimitResult } from "./services/rate-limiter";

const startTime = Date.now();

// Metrics counters (simple in-memory, exportable to Prometheus later)
const metrics = {
  requestsTotal: 0,
  requestsForwarded: 0,
  requestsBlocked: 0,
  headersStripped: 0,
  upstreamErrors: 0,
  rateLimitExceeded: 0,
};

// Initialize rate limiter
proxyRateLimiter.connect();

const app = new Elysia()
  .use(
    cors({
      origin: config.nodeEnv === "production"
        ? [config.frontendUrl, "capacitor://localhost", "http://localhost", "https://localhost"]
        : true,
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Accept-Language",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )

  // ─── Health Check ───────────────────────────────────────────
  .get("/health", () => ({
    status: "healthy",
    service: "sawtak-privacy-proxy",
    version: "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    metrics: { ...metrics },
    backend: config.backendUrl,
  }))

  // ─── Metrics (Prometheus-compatible, simple text format) ────
  .get("/proxy-metrics", ({ set }) => {
    set.headers["content-type"] = "text/plain; charset=utf-8";
    return [
      `# HELP proxy_requests_total Total requests received`,
      `# TYPE proxy_requests_total counter`,
      `proxy_requests_total ${metrics.requestsTotal}`,
      `# HELP proxy_requests_forwarded Total requests forwarded to backend`,
      `# TYPE proxy_requests_forwarded counter`,
      `proxy_requests_forwarded ${metrics.requestsForwarded}`,
      `# HELP proxy_requests_blocked Total requests blocked by policy`,
      `# TYPE proxy_requests_blocked counter`,
      `proxy_requests_blocked ${metrics.requestsBlocked}`,
      `# HELP proxy_headers_stripped Total headers stripped from requests`,
      `# TYPE proxy_headers_stripped counter`,
      `proxy_headers_stripped ${metrics.headersStripped}`,
      `# HELP proxy_upstream_errors Total upstream errors`,
      `# TYPE proxy_upstream_errors counter`,
      `proxy_upstream_errors ${metrics.upstreamErrors}`,
      `# HELP proxy_rate_limit_exceeded Total requests blocked by rate limiter`,
      `# TYPE proxy_rate_limit_exceeded counter`,
      `proxy_rate_limit_exceeded ${metrics.rateLimitExceeded}`,
    ].join("\n");
  })

  // ─── Main Proxy Handler ─────────────────────────────────────
  // Catch all /api/* requests and forward them to the backend
  .all("/api/*", async ({ request, set }) => {
    metrics.requestsTotal++;
    const proxyStart = performance.now();

    // 1. Resolve session and extract IP
    const cookieHeader = request.headers.get("cookie");
    const { sessionId, isNew } = resolveSession(cookieHeader);
    const ip = request.headers.get("cf-connecting-ip") || 
               request.headers.get("x-forwarded-for")?.split(',')[0] || 
               "unknown";

    const url = new URL(request.url);
    const path = url.pathname;

    // 2. Check Rate Limits
    let rateLimitInfo: RateLimitResult;
    
    if (path.startsWith("/api/complaints/anonymous")) {
      rateLimitInfo = await proxyRateLimiter.checkComplaint(sessionId, "anonymous");
    } else if (path.startsWith("/api/complaints/identified")) {
      rateLimitInfo = await proxyRateLimiter.checkComplaint(sessionId, "identified");
    } else if (path.startsWith("/api/auth/")) {
      const endpoint = path.replace("/api/auth/", "");
      rateLimitInfo = await proxyRateLimiter.checkAuth(ip, endpoint);
    } else if (path.startsWith("/api/upload")) {
      rateLimitInfo = await proxyRateLimiter.checkUpload(sessionId);
    } else {
      rateLimitInfo = await proxyRateLimiter.checkGeneralApi(sessionId, ip);
    }

    if (!rateLimitInfo.allowed) {
      metrics.rateLimitExceeded++;
      set.status = 429;
      set.headers["X-RateLimit-Limit"] = rateLimitInfo.limit.toString();
      set.headers["X-RateLimit-Remaining"] = "0";
      set.headers["X-RateLimit-Reset"] = rateLimitInfo.resetAt.toISOString();
      set.headers["Retry-After"] = Math.ceil((rateLimitInfo.resetAt.getTime() - Date.now()) / 1000).toString();
      
      console.warn(`[Proxy] 🚦 Rate limit exceeded for ${path} (IP: ${ip}, Session: ${sessionId})`);
      return {
        error: "Rate limit exceeded. Please slow down.",
        proxy: true,
      };
    }

    // 3. Sanitize request
    const sanitization = sanitizeRequest(request, sessionId);

    if (!sanitization.allowed) {
      metrics.requestsBlocked++;
      set.status = sanitization.status || 400;
      console.warn(
        `[Proxy] ⛔ Blocked: ${request.method} ${new URL(request.url).pathname} — ${sanitization.reason}`,
      );
      return {
        error: sanitization.reason,
        proxy: true,
      };
    }

    // 3. Log sanitization stats
    if (sanitization.blockedHeaderNames.length > 0) {
      console.log(
        `[Proxy] 🛡️  Stripped ${sanitization.strippedHeaderCount} headers ` +
          `(blocked: ${sanitization.blockedHeaderNames.join(", ")}) ` +
          `for ${request.method} ${new URL(request.url).pathname}`,
      );
    }
    metrics.headersStripped += sanitization.strippedHeaderCount;

    // 4. Prepare body
    let body: ReadableStream<Uint8Array> | ArrayBuffer | string | null = null;

    if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
      body = request.body;
    }

    // 5. Forward to backend
    const result = await forwardRequest(
      request.method,
      path + url.search,
      sanitization.headers,
      body,
    );

    const totalMs = performance.now() - proxyStart;

    if (!result.success) {
      metrics.upstreamErrors++;
      set.status = result.status;
      console.error(
        `[Proxy] ❌ Upstream error: ${request.method} ${path} — ${result.error} (${totalMs.toFixed(1)}ms)`,
      );
      return {
        error: "Service temporarily unavailable",
        proxy: true,
      };
    }

    metrics.requestsForwarded++;

    // 6. Build response
    // Set status
    set.status = result.status;

    // Copy backend response headers
    for (const [name, value] of Object.entries(result.headers)) {
      set.headers[name] = value;
    }

    // Append Rate Limit Headers
    set.headers["X-RateLimit-Limit"] = rateLimitInfo.limit.toString();
    set.headers["X-RateLimit-Remaining"] = rateLimitInfo.remaining.toString();
    set.headers["X-RateLimit-Reset"] = rateLimitInfo.resetAt.toISOString();

    // Set session cookie if new
    if (isNew) {
      set.headers["set-cookie"] = buildSessionCookie(sessionId);
    }

    // Log the request
    const statusEmoji = result.status >= 400 ? "⚠️" : "✅";
    console.log(
      `[Proxy] ${statusEmoji} ${request.method.padEnd(7)} ${path} → ${result.status} ` +
        `(${result.latencyMs.toFixed(1)}ms backend, ${totalMs.toFixed(1)}ms total) ` +
        `[${sanitization.routeDescription}]`,
    );

    return result.body;
  })

  // ─── Swagger Docs ────────────────────────────────────────────
  // Forward swagger docs to the backend (no sanitization needed)
  .all("/swagger*", async ({ request, set }) => {
    metrics.requestsTotal++;
    const proxyStart = performance.now();

    const url = new URL(request.url);
    const path = url.pathname;
    const query = request.method === "GET" ? url.search : "";

    let body: ReadableStream<Uint8Array> | ArrayBuffer | string | null = null;
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
      body = request.body;
    }

    const headers: Record<string, string> = {};
    for (const [name, value] of request.headers) {
      headers[name] = value;
    }

    const result = await forwardRequest(request.method, path + query, headers, body);
    const totalMs = performance.now() - proxyStart;

    if (!result.success) {
      metrics.upstreamErrors++;
      set.status = result.status;
      return { error: "Service temporarily unavailable", proxy: true };
    }

    metrics.requestsForwarded++;
    set.status = result.status;
    for (const [name, value] of Object.entries(result.headers)) {
      set.headers[name] = value;
    }

    console.log(`[Proxy] 📖 ${request.method} ${path} → ${result.status} (${totalMs.toFixed(1)}ms)`);
    return result.body;
  })

  // ─── Catch-all for non-API routes ──────────────────────────
  .all("*", ({ set }) => {
    set.status = 404;
    return {
      error: "Not found. This proxy only handles /api/* routes.",
      proxy: true,
    };
  })

  .listen(config.port);

console.log(`🛡️  Sawtak Privacy Proxy is running on port ${config.port}`);
console.log(`   Backend target: ${config.backendUrl}`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Max body size: ${(config.maxBodySize / 1024 / 1024).toFixed(1)}MB`);
console.log(`   Health: http://localhost:${config.port}/health`);
