/**
 * Proxy Authentication Middleware
 *
 * Validates that incoming requests were forwarded by the privacy proxy
 * using a shared secret header. When REQUIRE_PROXY_AUTH is enabled,
 * direct backend access without the proxy secret is rejected.
 *
 * This provides a trust boundary: the backend only accepts traffic
 * that has been sanitized by the privacy proxy.
 */

import { Elysia } from "elysia";



export const proxyAuthMiddleware = (app: Elysia) => app
  .onBeforeHandle(({ request, set }) => {
    const PROXY_SECRET = process.env.PROXY_SECRET || "";
    const REQUIRE_PROXY_AUTH = process.env.REQUIRE_PROXY_AUTH === "true";

    // Use request.headers (raw Fetch API) to bypass Elysia header schema filtering
    const proxySecret = request.headers.get("x-proxy-secret") ?? undefined;
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip proxy auth for metrics endpoints (scrapeable by Prometheus)
    if (path === "/metrics" || path === "/api/metrics") {
      return;
    }

    if (REQUIRE_PROXY_AUTH) {
      if (!PROXY_SECRET) {
        set.status = 500;
        return { error: "Server misconfiguration: proxy secret not set" };
      }

      if (!proxySecret || proxySecret !== PROXY_SECRET) {
        console.warn(
          `[ProxyAuth] ⛔ Rejected direct access attempt: ${request.method} ${path}`
        );
        set.status = 403;
        return { error: "Direct backend access is not allowed" };
      }
    }
  })
  .derive(({ request }) => {
    const PROXY_SECRET = process.env.PROXY_SECRET || "";
    const proxySecret = request.headers.get("x-proxy-secret") ?? undefined;
    const proxyRequestId = request.headers.get("x-proxy-request-id") ?? undefined;
    const proxySessionId = request.headers.get("x-proxy-session-id") ?? undefined;

    return {
      proxyRequestId: proxyRequestId || null,
      proxySessionId: proxySessionId || null,
      isProxied: !!proxySecret && proxySecret === PROXY_SECRET,
    };
  });
