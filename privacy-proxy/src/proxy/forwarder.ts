/**
 * Request Forwarder for Privacy Proxy
 *
 * Handles the actual HTTP forwarding from proxy to the internal backend.
 * Uses Bun's native fetch for maximum performance.
 */

import { config } from "../config";

export interface ForwardResult {
  /** HTTP status from backend */
  status: number;
  /** Response headers from backend */
  headers: Record<string, string>;
  /** Response body */
  body: ReadableStream<Uint8Array> | ArrayBuffer | string | null;
  /** Time taken to receive response (ms) */
  latencyMs: number;
  /** Whether the forward succeeded (backend responded) */
  success: boolean;
  /** Error message if forward failed */
  error?: string;
}

/**
 * Forward a sanitized request to the internal backend.
 *
 * @param method - HTTP method
 * @param path - Request path (including query string)
 * @param headers - Sanitized headers to send
 * @param body - Request body (if any)
 * @returns ForwardResult with backend response
 */
export async function forwardRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  body: ReadableStream<Uint8Array> | ArrayBuffer | string | null,
): Promise<ForwardResult> {
  const upstreamUrl = `${config.backendUrl}${path}`;
  const startTime = performance.now();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Only include body for methods that support it
    if (body && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
      fetchOptions.body = body;
      // Tell Bun not to auto-add content-length when streaming
      (fetchOptions as any).duplex = "half";
    }

    const response = await fetch(upstreamUrl, fetchOptions);
    const latencyMs = performance.now() - startTime;

    // Collect response headers (filter out hop-by-hop headers)
    const responseHeaders: Record<string, string> = {};
    const hopByHop = new Set([
      "connection",
      "keep-alive",
      "transfer-encoding",
      "te",
      "trailer",
      "upgrade",
      "proxy-authorization",
      "proxy-authenticate",
    ]);

    response.headers.forEach((value, name) => {
      if (!hopByHop.has(name.toLowerCase())) {
        responseHeaders[name] = value;
      }
    });

    return {
      status: response.status,
      headers: responseHeaders,
      body: response.body,
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = performance.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    console.error(
      `[Proxy] ❌ Forward failed: ${method} ${upstreamUrl} — ${message} (${latencyMs.toFixed(1)}ms)`,
    );

    return {
      status: 502,
      headers: {},
      body: null,
      latencyMs,
      success: false,
      error: `Backend unavailable: ${message}`,
    };
  }
}
