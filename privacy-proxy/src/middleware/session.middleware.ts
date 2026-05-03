/**
 * Session Middleware for Privacy Proxy
 *
 * Manages anonymous session cookies for rate limiting and request correlation.
 * Sessions are opaque UUIDs — no PII is stored in the session identifier.
 */

import { config } from "../config";

/**
 * Extract or generate a session ID from the request cookies.
 *
 * @param cookieHeader - The raw Cookie header value
 * @returns The existing or newly generated session ID, and whether it's new
 */
export function resolveSession(cookieHeader: string | null): {
  sessionId: string;
  isNew: boolean;
} {
  if (cookieHeader) {
    const sessionId = parseCookie(cookieHeader, config.sessionCookieName);
    if (sessionId && isValidUUID(sessionId)) {
      return { sessionId, isNew: false };
    }
  }

  return {
    sessionId: crypto.randomUUID(),
    isNew: true,
  };
}

/**
 * Build the Set-Cookie header value for the session.
 */
export function buildSessionCookie(sessionId: string): string {
  const parts = [
    `${config.sessionCookieName}=${sessionId}`,
    `Path=/`,
    `Max-Age=${config.sessionMaxAge}`,
    `HttpOnly`,
    `SameSite=Strict`,
  ];

  if (config.nodeEnv === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Parse a specific cookie value from a Cookie header string.
 */
function parseCookie(header: string, name: string): string | null {
  const cookies = header.split(";");
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (key?.trim() === name) {
      return valueParts.join("=").trim();
    }
  }
  return null;
}

/**
 * Validate that a string looks like a UUID v4.
 */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
