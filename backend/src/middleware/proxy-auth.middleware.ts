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
  .onBeforeHandle(({ request, set, headers }) => {
    const PROXY_SECRET = process.env.PROXY_SECRET || "";
    const REQUIRE_PROXY_AUTH = process.env.REQUIRE_PROXY_AUTH === "true";

    const proxySecret = headers["x-proxy-secret"] as string | undefined;
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
          `[ProxyAuth] ⛔ Rejected direct access attempt: ${request.method} ${new URL(request.url).pathname}`
        );
        set.status = 403;
        return { error: "Direct backend access is not allowed" };
      }
    }
  })
  .derive(({ headers }) => {
    const proxySecret = headers["x-proxy-secret"] as string | undefined;
    const proxyRequestId = headers["x-proxy-request-id"] as string | undefined;
    const proxySessionId = headers["x-proxy-session-id"] as string | undefined;
    const PROXY_SECRET = process.env.PROXY_SECRET || "";

    return {
      proxyRequestId: proxyRequestId || null,
      proxySessionId: proxySessionId || null,
      isProxied: !!proxySecret && proxySecret === PROXY_SECRET,
    };
  });
