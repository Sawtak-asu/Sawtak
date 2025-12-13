import { Elysia } from "elysia";
import { getIndexer, startIndexer, stopIndexer } from "../services/hedera-indexer.service";
import { authMiddleware } from "../middleware/auth.middleware";

export const indexerRoutes = new Elysia({ prefix: "/api/indexer" })
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
  });
