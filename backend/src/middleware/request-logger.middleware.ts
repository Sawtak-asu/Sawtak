/**
 * Request Logging Middleware for Elysia
 * 
 * Logs all incoming HTTP requests with:
 * - Method, path, status code
 * - Response time
 * - Client IP
 * - User agent
 * 
 * Also records metrics for Prometheus/Grafana
 */

import { Elysia } from "elysia";
import { recordRequest } from "../telemetry";

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Get color based on status code
 */
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.reset;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request, headers: Record<string, string | undefined>): string {
  // Check common proxy headers
  return (
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    headers["x-real-ip"] ||
    headers["cf-connecting-ip"] || // Cloudflare
    "unknown"
  );
}

/**
 * Request logging middleware
 * 
 * Usage:
 * ```ts
 * const app = new Elysia()
 *   .use(requestLogger)
 *   .get("/", () => "Hello")
 * ```
 */
export const requestLogger = new Elysia({ name: "request-logger" })
  .derive(({ request }) => {
    return {
      requestStartTime: performance.now(),
      requestId: crypto.randomUUID().slice(0, 8),
    };
  })
  .onAfterHandle(({ request, set, requestStartTime, requestId, headers }) => {
    const duration = performance.now() - requestStartTime;
    const status = typeof set.status === "number" ? set.status : 200;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Skip logging for health checks and metrics (too noisy)
    if (path === "/api/health" || path === "/metrics") {
      return;
    }

    const clientIP = getClientIP(request, headers as Record<string, string | undefined>);
    const statusColor = getStatusColor(status);
    const timestamp = new Date().toISOString();

    // Log to console
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.magenta}${formatDuration(duration)}${colors.reset} ` +
      `${colors.dim}[${requestId}] ${clientIP}${colors.reset}`
    );

    // Record metrics for Prometheus
    recordRequest(method, path, status, duration);
  })
  .onError(({ request, error, set, requestStartTime, requestId, headers }) => {
    const duration = performance.now() - (requestStartTime || 0);
    const status = typeof set.status === "number" ? set.status : 500;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = getClientIP(request, headers as Record<string, string | undefined>);
    const timestamp = new Date().toISOString();

    // Log error
    console.error(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${path} ` +
      `${colors.red}${status} ERROR${colors.reset} ` +
      `${colors.magenta}${formatDuration(duration)}${colors.reset} ` +
      `${colors.dim}[${requestId || "?"}] ${clientIP}${colors.reset}\n` +
      `${colors.red}  └─ ${error instanceof Error ? error.message : String(error)}${colors.reset}`
    );

    // Record error metrics
    recordRequest(method, path, status, duration);
  });

/**
 * Structured JSON logger for production
 * Outputs logs in JSON format for log aggregation systems
 */
export function logJSON(level: "info" | "warn" | "error", message: string, data?: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "sawtak-backend",
    ...data,
  };
  
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
