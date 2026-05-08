import { describe, it, expect } from "bun:test";
import { forwardRequest } from "./forwarder";
import { config } from "../config";

describe("Request Forwarder", () => {
  it("forwards request with correct URL and headers", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, options: any) => {
      expect(url).toBe(`${config.backendUrl}/api/feed?page=1`);
      expect(options.method).toBe("GET");
      expect(options.headers.get("x-proxy-secret")).toBe("test-secret");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const headers = new Headers();
    headers.set("x-proxy-secret", "test-secret");

    const result = await forwardRequest("GET", "/api/feed?page=1", {
      "x-proxy-secret": "test-secret",
    }, null);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);

    globalThis.fetch = originalFetch;
  });

  it("handles backend error gracefully", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("Connection refused");
    };

    const result = await forwardRequest("GET", "/api/feed", {}, null);

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("Backend unavailable");

    globalThis.fetch = originalFetch;
  });

  it("forwards POST request with body", async () => {
    const originalFetch = globalThis.fetch;
    let capturedBody: any = null;
    globalThis.fetch = async (_url: any, options: any) => {
      capturedBody = options.body;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    const body = new Blob([JSON.stringify({ title: "Test" })]).stream();
    const result = await forwardRequest("POST", "/api/complaints/submit", { "content-type": "application/json" }, body);

    expect(result.success).toBe(true);

    globalThis.fetch = originalFetch;
  });

  it("filters out hop-by-hop headers from response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const resHeaders = new Headers();
      resHeaders.set("Content-Type", "application/json");
      resHeaders.set("Connection", "keep-alive");
      resHeaders.set("Transfer-Encoding", "chunked");
      return new Response(JSON.stringify({}), { status: 200, headers: resHeaders });
    };

    const result = await forwardRequest("GET", "/api/feed", {}, null);

    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.headers["connection"]).toBeUndefined();
    expect(result.headers["transfer-encoding"]).toBeUndefined();

    globalThis.fetch = originalFetch;
  });

  it("measures latency", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response("ok", { status: 200 });
    };

    const result = await forwardRequest("GET", "/api/health", {}, null);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    globalThis.fetch = originalFetch;
  });
});
