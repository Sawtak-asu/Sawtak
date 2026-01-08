import { Elysia, t } from "elysia";
import { getIndexer, startIndexer, stopIndexer } from "../services/hedera-indexer.service";
import { authMiddleware } from "../middleware/auth.middleware";

export const indexerRoutes = new Elysia({ 
  prefix: "/api/indexer",
  detail: {
    tags: ["Indexer"],
    description: "Hedera blockchain indexer management endpoints"
  }
})
  /**
   * GET /api/indexer/status
   * Get the current indexer status (public)
   */
  .get("/status", () => {
    const indexer = getIndexer();
    return {
      success: true,
      data: indexer.getStatus(),
    };
  }, {
    detail: {
      summary: "Get Indexer Status",
      description: "Get the current status of the Hedera HCS indexer. This is a public endpoint for monitoring.",
      responses: {
        200: {
          description: "Indexer status",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      isRunning: { type: "boolean", description: "Whether the indexer is actively polling" },
                      lastTimestamp: { type: "string", description: "Last processed consensus timestamp" },
                      messagesProcessed: { type: "integer", description: "Total messages processed" },
                      lastError: { type: "string", description: "Last error message if any" },
                      pollingIntervalMs: { type: "integer", description: "Polling interval in milliseconds" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  /**
   * Protected admin routes for controlling the indexer
   */
  .use(authMiddleware)
  
  /**
   * POST /api/indexer/start
   * Start the indexer (admin only)
   */
  .post("/start", ({ user, set }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    startIndexer();
    return {
      success: true,
      message: "Indexer started",
      data: getIndexer().getStatus(),
    };
  }, {
    detail: {
      summary: "Start Indexer",
      description: "Start the Hedera HCS indexer. Requires admin privileges.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Indexer started",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" }
      }
    }
  })

  /**
   * POST /api/indexer/stop
   * Stop the indexer (admin only)
   */
  .post("/stop", ({ user, set }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    stopIndexer();
    return {
      success: true,
      message: "Indexer stopped",
      data: getIndexer().getStatus(),
    };
  }, {
    detail: {
      summary: "Stop Indexer",
      description: "Stop the Hedera HCS indexer. Requires admin privileges.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Indexer stopped",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" }
      }
    }
  })

  /**
   * POST /api/indexer/reindex
   * Reindex from a specific timestamp (admin only)
   */
  .post("/reindex", async ({ user, set, body }: any) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    const { timestamp } = body || {};
    if (!timestamp) {
      set.status = 400;
      return { success: false, error: "timestamp is required" };
    }

    const indexer = getIndexer();
    await indexer.reindexFrom(timestamp);

    return {
      success: true,
      message: `Reindexing from ${timestamp}`,
      data: indexer.getStatus(),
    };
  }, {
    body: t.Object({
      timestamp: t.String({ description: "Consensus timestamp to reindex from (e.g., 1699999999.000000000)" })
    }),
    detail: {
      summary: "Reindex from Timestamp",
      description: `Force reindex of HCS messages from a specific timestamp. Useful for recovering from missed messages or re-processing.

**Warning:** This may cause duplicate processing. Use with caution.`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Reindex started",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        400: { description: "Timestamp is required" },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" }
      }
    }
  });
