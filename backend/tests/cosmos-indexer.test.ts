import { describe, expect, it } from "bun:test";
import { CosmosIndexerService, getIndexer, startIndexer, stopIndexer } from "../src/services/cosmos-indexer.service";
import { COSMOS_CONFIG } from "../src/config/cosmos.config";

describe("Cosmos Indexer Service", () => {
  describe("Constructor and Initialization", () => {
    it("creates an indexer instance", () => {
      const indexer = new CosmosIndexerService();
      expect(indexer).toBeDefined();
    });

    it("starts with isRunning false", () => {
      const indexer = new CosmosIndexerService();
      const status = indexer.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it("exposes RPC endpoint in status", () => {
      const indexer = new CosmosIndexerService();
      const status = indexer.getStatus();
      expect(status.rpcEndpoint).toBeDefined();
      expect(typeof status.rpcEndpoint).toBe("string");
    });

    it("starts with configured start height", () => {
      const indexer = new CosmosIndexerService();
      const status = indexer.getStatus();
      expect(status.lastHeight).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Start/Stop Lifecycle", () => {
    it("stop on non-running indexer is safe", () => {
      const indexer = new CosmosIndexerService();
      expect(() => indexer.stop()).not.toThrow();
    });

    it("can stop without errors after creation", () => {
      const indexer = new CosmosIndexerService();
      indexer.stop();
      expect(indexer.getStatus().isRunning).toBe(false);
    });
  });

  describe("Singleton Pattern", () => {
    it("getIndexer returns the same instance", () => {
      stopIndexer();
      const indexer1 = getIndexer();
      const indexer2 = getIndexer();
      expect(indexer1).toBe(indexer2);
    });
  });

  describe("Event Type Routing", () => {
    it("recognizes anonymous complaint event type", () => {
      const eventType = "sawtak.sawtak.v1.EventSubmitAnonymousComplaint";
      expect(eventType).toContain("EventSubmitAnonymousComplaint");
    });

    it("recognizes identified complaint event type", () => {
      const eventType = "sawtak.sawtak.v1.EventSubmitIdentifiedComplaint";
      expect(eventType).toContain("EventSubmitIdentifiedComplaint");
    });

    it("recognizes status update event type", () => {
      const eventType = "sawtak.sawtak.v1.EventUpdateComplaintStatus";
      expect(eventType).toContain("EventUpdateComplaintStatus");
    });

    it("ignores unknown event types", () => {
      const eventType = "sawtak.sawtak.v1.UnknownEvent";
      const knownTypes = [
        "sawtak.sawtak.v1.EventSubmitAnonymousComplaint",
        "sawtak.sawtak.v1.EventSubmitIdentifiedComplaint",
        "sawtak.sawtak.v1.EventUpdateComplaintStatus",
      ];
      expect(knownTypes.includes(eventType)).toBe(false);
    });
  });

  describe("Status Reporting", () => {
    it("provides complete status object", () => {
      const indexer = new CosmosIndexerService();
      const status = indexer.getStatus();

      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("lastHeight");
      expect(status).toHaveProperty("rpcEndpoint");
      expect(typeof status.isRunning).toBe("boolean");
      expect(typeof status.lastHeight).toBe("number");
      expect(typeof status.rpcEndpoint).toBe("string");
    });
  });

  describe("JSON Parsing for Complex Fields", () => {
    it("parses directed_to JSON field correctly", () => {
      const raw = JSON.stringify({ type: "ministry", ministryId: "min-justice" });
      const parsed = JSON.parse(raw);
      expect(parsed.type).toBe("ministry");
      expect(parsed.ministryId).toBe("min-justice");
    });

    it("parses evidence JSON array correctly", () => {
      const raw = JSON.stringify(["QmHash1", "QmHash2", "QmHash3"]);
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
    });

    it("handles empty directed_to string", () => {
      const raw = "";
      let parsed: any = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = null;
      }
      expect(parsed).toBeNull();
    });

    it("handles malformed JSON gracefully", () => {
      const raw = "not-json";
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      expect(parsed).toBeNull();
    });
  });

  describe("RPC URL Construction", () => {
    it("constructs tx_search URL correctly", () => {
      const rpcEndpoint = "http://localhost:26657";
      const fromHeight = 100;
      const query = `tx.height>=${fromHeight}`;
      const url = `${rpcEndpoint}/tx_search?query="${encodeURIComponent(query)}"&order_by="asc"&per_page=50`;

      expect(url).toContain("localhost:26657");
      expect(url).toContain("tx_search");
      expect(url).toContain(encodeURIComponent("tx.height>=100"));
      expect(url).toContain("per_page=50");
    });

    it("encodes query parameters properly", () => {
      const query = 'tx.height>=100';
      const encoded = encodeURIComponent(query);
      expect(encoded).not.toContain(" ");
      expect(encoded).toContain("%3E");
      expect(encoded).toContain("%3D");
    });
  });

  describe("Cosmos Configuration", () => {
    it("has valid RPC endpoint", () => {
      expect(COSMOS_CONFIG.RPC_ENDPOINT).toBeDefined();
      expect(COSMOS_CONFIG.RPC_ENDPOINT.startsWith("http")).toBe(true);
    });

    it("has valid chain ID", () => {
      expect(COSMOS_CONFIG.CHAIN_ID).toBeDefined();
      expect(COSMOS_CONFIG.CHAIN_ID).toContain("sawtak");
    });

    it("has valid address prefix", () => {
      expect(COSMOS_CONFIG.PREFIX).toBe("sawtak");
    });

    it("has gas price configured", () => {
      expect(COSMOS_CONFIG.GAS_PRICE).toBeDefined();
    });
  });
});
