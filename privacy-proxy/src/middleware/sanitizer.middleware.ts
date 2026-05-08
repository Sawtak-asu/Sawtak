/**
 * Request Sanitizer Middleware for Privacy Proxy
 *
 * Applies header filtering and body size validation before
 * requests are forwarded to the backend.
 */

import { filterHeaders, PROXY_HEADERS } from "../policies/headers";
import { findRoutePolicy } from "../policies/routes";
import { config } from "../config";

export interface SanitizationResult {
  /** Whether the request passed sanitization */
  allowed: boolean;
  /** If not allowed, the reason */
  reason?: string;
  /** HTTP status to return if not allowed */
  status?: number;
  /** Sanitized headers ready for forwarding */
  headers: Record<string, string>;
  /** Count of stripped headers (for metrics) */
  strippedHeaderCount: number;
  /** Names of privacy-sensitive headers that were blocked */
  blockedHeaderNames: string[];
  /** The matched route policy description */
  routeDescription: string;
}

/**
 * Sanitize an incoming request for forwarding to the backend.
 *
 * @param request - The incoming HTTP request
 * @param sessionId - The resolved session ID
 * @returns SanitizationResult with sanitized headers or rejection reason
 */
export function sanitizeRequest(
  request: Request,
  sessionId: string,
): SanitizationResult {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // 1. Find route policy
  const policy = findRoutePolicy(path);

  // 2. Check method allowed
  if (!policy.methods.includes(method)) {
    return {
      allowed: false,
      reason: `Method ${method} not allowed for ${path}`,
      status: 405,
      headers: {},
      strippedHeaderCount: 0,
      blockedHeaderNames: [],
      routeDescription: policy.description,
    };
  }

  // 3. Check body size (from Content-Length header)
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (policy.maxBodySize > 0 && contentLength > policy.maxBodySize) {
    return {
      allowed: false,
      reason: `Request body too large: ${contentLength} bytes exceeds limit of ${policy.maxBodySize} bytes`,
      status: 413,
      headers: {},
      strippedHeaderCount: 0,
      blockedHeaderNames: [],
      routeDescription: policy.description,
    };
  }

  // Even for routes with maxBodySize=0, don't block if there's a small content-length
  // (OPTIONS/CORS preflight can have content-length: 0)

  // 4. Filter headers through allowlist
  const { sanitized, strippedCount, blockedNames } = filterHeaders(request.headers);

  // 5. Inject proxy headers
  const requestId = crypto.randomUUID();
  sanitized[PROXY_HEADERS.REQUEST_ID] = requestId;
  sanitized[PROXY_HEADERS.SESSION_ID] = sessionId;
  sanitized[PROXY_HEADERS.SECRET] = config.proxySecret;

  // 6. Set a sanitized user-agent so backend knows traffic source
  sanitized["user-agent"] = "Sawtak-Proxy/1.0";

  return {
    allowed: true,
    headers: sanitized,
    strippedHeaderCount: strippedCount,
    blockedHeaderNames: blockedNames,
    routeDescription: policy.description,
  };
}
