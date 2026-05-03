/**
 * Header Policies for Privacy Proxy
 *
 * Defines which HTTP headers are allowed through, which are blocked,
 * and what proxy-specific headers are injected.
 */

/**
 * Headers allowed to pass from client → backend.
 * Everything else is stripped.
 */
export const ALLOWED_HEADERS = new Set([
  "authorization",
  "content-type",
  "content-length",
  "accept",
  "accept-language",
  "accept-encoding",
]);

/**
 * Headers explicitly blocked (logged when seen).
 * These are privacy-sensitive and must never reach the backend.
 */
export const BLOCKED_HEADERS = new Set([
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "true-client-ip",
  "referer",
  "referrer",
  "user-agent",
  "via",
  "forwarded",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-originating-ip",
  "x-remote-ip",
  "x-remote-addr",
]);

/**
 * Proxy-injected headers sent to the backend.
 * These provide controlled context without leaking client identity.
 */
export const PROXY_HEADERS = {
  /** Unique ID for this request (for correlation/debugging) */
  REQUEST_ID: "x-proxy-request-id",

  /** Opaque session ID (UUID, no PII) */
  SESSION_ID: "x-proxy-session-id",

  /** Shared secret proving request came from proxy */
  SECRET: "x-proxy-secret",

  /** Coarse client class (optional enrichment) */
  CLIENT_CLASS: "x-proxy-client-class",
} as const;

/**
 * Filter incoming request headers through the allowlist.
 * Returns a new Headers object containing only allowed headers.
 *
 * @param incoming - The raw client request headers
 * @returns Object with sanitized headers and count of stripped headers
 */
export function filterHeaders(incoming: Headers): {
  sanitized: Record<string, string>;
  strippedCount: number;
  blockedNames: string[];
} {
  const sanitized: Record<string, string> = {};
  let strippedCount = 0;
  const blockedNames: string[] = [];

  incoming.forEach((value, name) => {
    const lowerName = name.toLowerCase();

    if (ALLOWED_HEADERS.has(lowerName)) {
      sanitized[lowerName] = value;
    } else {
      strippedCount++;
      if (BLOCKED_HEADERS.has(lowerName)) {
        blockedNames.push(lowerName);
      }
    }
  });

  return { sanitized, strippedCount, blockedNames };
}
