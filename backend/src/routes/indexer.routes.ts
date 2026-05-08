import { Elysia, t } from "elysia";
import { getIndexer as getHederaIndexer, startIndexer as startHederaIndexer, stopIndexer as stopHederaIndexer } from "../services/hedera-indexer.service";
import { getIndexer as getCosmosIndexer, startIndexer as startCosmosIndexer, stopIndexer as stopCosmosIndexer } from "../services/cosmos-indexer.service";
import { authMiddleware } from "../middleware/auth.middleware";

export const indexerRoutes = new Elysia({ 
  prefix: "/api/indexer",
  detail: {
    tags: ["Indexer"],
    description: "Blockchain indexer management endpoints for Hedera and Cosmos"
  }
})
  /**
   * GET /api/indexer/status
   * Get the current indexer status (public)
   */
  .get("/status", () => {
    const hedera = getHederaIndexer();
    const cosmos = getCosmosIndexer();
    return {
      success: true,
      data: {
        hedera: hedera.getStatus(),
        cosmos: cosmos.getStatus(),
      },
    };
  }, {
    detail: {
      summary: "Get Indexer Status",
      description: "Get the current status of both Hedera and Cosmos indexers. This is a public endpoint for monitoring.",
    }
  })
  /**
   * Protected admin routes for controlling the indexers
   */
  .use(authMiddleware)
  
  /**
   * POST /api/indexer/start
   * Start the indexers (admin only)
   */
  .post("/start", ({ user, set }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    const chain = (user as any).chain || "all";
    if (chain === "hedera" || chain === "all") {
      startHederaIndexer();
    }
    if (chain === "cosmos" || chain === "all") {
      startCosmosIndexer();
    }

    return {
      success: true,
      message: `Indexer(s) started: ${chain}`,
      data: {
        hedera: getHederaIndexer().getStatus(),
        cosmos: getCosmosIndexer().getStatus(),
      },
    };
  }, {
    detail: {
      summary: "Start Indexer(s)",
      description: "Start the Hedera and/or Cosmos indexers. Requires admin privileges.",
      security: [{ bearerAuth: [] }],
    }
  })

  /**
   * POST /api/indexer/stop
   * Stop the indexers (admin only)
   */
  .post("/stop", ({ user, set }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    const chain = (user as any).chain || "all";
    if (chain === "hedera" || chain === "all") {
      stopHederaIndexer();
    }
    if (chain === "cosmos" || chain === "all") {
      stopCosmosIndexer();
    }

    return {
      success: true,
      message: `Indexer(s) stopped: ${chain}`,
      data: {
        hedera: getHederaIndexer().getStatus(),
        cosmos: getCosmosIndexer().getStatus(),
      },
    };
  }, {
    detail: {
      summary: "Stop Indexer(s)",
      description: "Stop the Hedera and/or Cosmos indexers. Requires admin privileges.",
      security: [{ bearerAuth: [] }],
    }
  })

  /**
   * POST /api/indexer/reindex
   * Reindex from a specific point (admin only)
   */
  .post("/reindex", async ({ user, set, body }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    const { chain, height, timestamp } = body || {};
    if (chain === "cosmos" && !height) {
      set.status = 400;
      return { success: false, error: "height is required for Cosmos reindex" };
    }
    if (chain === "hedera" && !timestamp) {
      set.status = 400;
      return { success: false, error: "timestamp is required for Hedera reindex" };
    }

    if (chain === "cosmos") {
      await getCosmosIndexer().reindexFrom(height);
    } else if (chain === "hedera") {
      await getHederaIndexer().reindexFrom(timestamp);
    } else {
      if (height) await getCosmosIndexer().reindexFrom(height);
      if (timestamp) await getHederaIndexer().reindexFrom(timestamp);
    }

    return {
      success: true,
      message: `Reindexing: ${chain || "all"}`,
      data: {
        hedera: getHederaIndexer().getStatus(),
        cosmos: getCosmosIndexer().getStatus(),
      },
    };
  }, {
    body: t.Object({
      chain: t.Optional(t.String({ description: "Chain: hedera, cosmos, or all (default)" })),
      height: t.Optional(t.Number({ description: "Cosmos block height to reindex from" })),
      timestamp: t.Optional(t.String({ description: "Hedera consensus timestamp to reindex from" }))
    }),
    detail: {
      summary: "Reindex from Point",
      description: `Force reindex of blockchain messages from a specific point. Requires admin privileges.

**For Cosmos:** provide block height
**For Hedera:** provide consensus timestamp`,
      security: [{ bearerAuth: [] }],
    }
  });
