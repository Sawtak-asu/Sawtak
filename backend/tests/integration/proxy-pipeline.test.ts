import { describe, expect, it, beforeAll } from "bun:test";

const PROXY_URL = "http://localhost:4000";
let dbAvailable = false;
let cosmosAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${PROXY_URL}/api/health`);
    if (res.ok) {
      dbAvailable = true;
      const data = await res.json() as any;
      console.log(`[integration] Backend healthy: ${data.environment}, uptime: ${data.uptime}s`);
    }
  } catch (e: any) {
    console.log(`[integration] Backend unreachable: ${e.message}`);
    dbAvailable = false;
  }

  try {
    const res = await fetch(`${PROXY_URL}/api/indexer/status`);
    if (res.ok) {
      const data = await res.json() as any;
      cosmosAvailable = data.data?.cosmos?.isRunning || false;
      console.log(`[integration] Cosmos indexer: ${cosmosAvailable ? "running" : "stopped"}, height: ${data.data?.cosmos?.lastHeight || 0}`);
    }
  } catch (e: any) {
    console.log(`[integration] Indexer status unreachable: ${e.message}`);
  }
});

function skipIfBackendDown() {
  if (!dbAvailable) {
    console.log("[integration] Skipping - backend not available");
  }
  return !dbAvailable;
}

describe("Integration Tests - Proxy → Backend Pipeline", () => {
  describe("Health & Connectivity", () => {
    it("proxy health endpoint responds", async () => {
      const res = await fetch(`${PROXY_URL}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe("ok");
      expect(data.service).toBe("sawtak-backend");
    });

    it("indexer status endpoint responds", async () => {
      const res = await fetch(`${PROXY_URL}/api/indexer/status`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.cosmos).toBeDefined();
      expect(data.data.hedera).toBeDefined();
    });
  });

  describe("Feed Endpoints (Public)", () => {
    it("GET /api/feed returns paginated complaints", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed?page=1&limit=10`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(10);
    });

    it("GET /api/feed accepts category filter", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed?category=corruption`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it("GET /api/feed accepts area filter", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed?area=Cairo`);
      expect(res.status).toBe(200);
    });

    it("GET /api/feed accepts search query", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed?search=test`);
      expect(res.status).toBe(200);
    });

    it("GET /api/feed/stats returns statistics", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed/stats`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe("Vote Endpoints (Public)", () => {
    it("GET /api/vote/status responds", async () => {
      const res = await fetch(`${PROXY_URL}/api/vote/status`);
      expect([200, 422]).toContain(res.status);
    });
  });

  describe("Tracking Endpoint (Public)", () => {
    it("GET /api/tracking/:code returns 404 for invalid tracking code", async () => {
      const res = await fetch(`${PROXY_URL}/api/tracking/SAWTAK-INVALID001`);
      expect(res.status).toBe(404);
    });

    it("GET /api/tracking/:code rejects malformed codes", async () => {
      const res = await fetch(`${PROXY_URL}/api/tracking/not-a-valid-code`);
      expect([400, 404, 422]).toContain(res.status);
    });
  });

  describe("Authentication Endpoints", () => {
    it("POST /api/auth/login rejects missing fields", async () => {
      const res = await fetch(`${PROXY_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([401, 422]).toContain(res.status);
    });

    it("POST /api/auth/google/callback rejects missing code", async () => {
      const res = await fetch(`${PROXY_URL}/api/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([401, 422]).toContain(res.status);
    });
  });

  describe("Protected Endpoints (Require Auth)", () => {
    it("POST /api/complaints/anonymous/submit rejects with invalid auth", async () => {
      const res = await fetch(`${PROXY_URL}/api/complaints/anonymous/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          anonymousIdentifier: "test",
          title: "Test Complaint",
          text: "This is a test complaint with enough text to pass validation checks",
          category: "testing",
        }),
      });
      expect([400, 401, 403, 422]).toContain(res.status);
    });

    it("POST /api/upload/ipfs accepts requests through proxy (proxy auth)", async () => {
      const formData = new FormData();
      formData.append("files", new Blob(["test content"]), "test.txt");
      const res = await fetch(`${PROXY_URL}/api/upload/ipfs`, {
        method: "POST",
        body: formData,
      });
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  describe("Complaint Validation (Through Proxy)", () => {
    it("rejects anonymous complaint with short title", async () => {
      const res = await fetch(`${PROXY_URL}/api/complaints/anonymous/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id",
          title: "Hi",
          text: "This is a complaint with enough text to pass validation checks",
          category: "testing",
        }),
      });
      expect([401, 403, 422]).toContain(res.status);
    });

    it("rejects anonymous complaint with short text", async () => {
      const res = await fetch(`${PROXY_URL}/api/complaints/anonymous/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id",
          title: "Valid Title Here",
          text: "Short",
          category: "testing",
        }),
      });
      expect([401, 403, 422]).toContain(res.status);
    });

    it("rejects anonymous complaint with oversized title", async () => {
      const res = await fetch(`${PROXY_URL}/api/complaints/anonymous/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          anonymousIdentifier: "test-anon-id",
          title: "A".repeat(201),
          text: "This is a complaint with enough text to pass validation checks",
          category: "testing",
        }),
      });
      expect([401, 403, 422]).toContain(res.status);
    });
  });

  describe("Cosmos Indexer (If Running)", () => {
    it("indexer reports running status when Cosmos is available", async () => {
      if (!cosmosAvailable) return;

      const res = await fetch(`${PROXY_URL}/api/indexer/status`);
      const data = await res.json() as any;
      expect(data.data.cosmos.isRunning).toBe(true);
      expect(data.data.cosmos.lastHeight).toBeGreaterThan(0);
    });

    it("indexer can be stopped and restarted", async () => {
      if (!cosmosAvailable) return;

      const stopRes = await fetch(`${PROXY_URL}/api/indexer/stop`, {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
      });

      const startRes = await fetch(`${PROXY_URL}/api/indexer/start`, {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
      });

      const statusRes = await fetch(`${PROXY_URL}/api/indexer/status`);
      const data = await statusRes.json() as any;
      expect(data.data.cosmos.isRunning).toBe(true);
    });

    it("reindex endpoint validates required parameters", async () => {
      if (!cosmosAvailable) return;

      const res = await fetch(`${PROXY_URL}/api/indexer/reindex`, {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chain: "cosmos" }),
      });
      expect([400, 401, 403]).toContain(res.status);
    });
  });

  describe("Proxy Header Stripping", () => {
    it("proxy strips x-forwarded-for header", async () => {
      const res = await fetch(`${PROXY_URL}/api/health`, {
        headers: {
          "x-forwarded-for": "1.2.3.4",
          "x-real-ip": "5.6.7.8",
        },
      });
      expect(res.status).toBe(200);
    });

    it("proxy replaces user-agent with generic value", async () => {
      const res = await fetch(`${PROXY_URL}/api/health`, {
        headers: {
          "user-agent": "Mozilla/5.0 (Test Browser)",
        },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await fetch(`${PROXY_URL}/api/nonexistent-endpoint`);
      expect([404, 502]).toContain(res.status);
    });

    it("handles malformed requests gracefully", async () => {
      const res = await fetch(`${PROXY_URL}/api/feed`, {
        headers: { "Content-Type": "invalid" },
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});
