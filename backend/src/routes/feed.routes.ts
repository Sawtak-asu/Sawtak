import { Elysia, t } from "elysia";
import { FeedService } from "../services/feed.service";

const feedService = new FeedService();

export const feedRoutes = new Elysia({ prefix: "/api/feed" })
  /**
   * GET /api/feed
   * Get the public complaint feed with filtering and pagination
   * 
   * Query params:
   * - search: text search in title/text
   * - category: filter by category
   * - area: filter by area
   * - dateFrom: filter from date (ISO string)
   * - dateTo: filter to date (ISO string)
   * - sort: "newest" | "oldest"
   * - page: page number (default 1)
   * - limit: items per page (default 10)
   */
  .get("/", async ({ query }) => {
    try {
      const result = await feedService.getPublicFeed({
        search: query.search as string | undefined,
        category: query.category as string | undefined,
        area: query.area as string | undefined,
        dateFrom: query.dateFrom as string | undefined,
        dateTo: query.dateTo as string | undefined,
        sort: (query.sort as "newest" | "oldest") || "newest",
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 10,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error("[FeedRoutes] Error fetching feed:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch feed",
      };
    }
  })

  /**
   * GET /api/feed/stats
   * Get feed statistics
   */
  .get("/stats", async () => {
    try {
      const stats = await feedService.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      console.error("[FeedRoutes] Error fetching stats:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch stats",
      };
    }
  })

  /**
   * GET /api/feed/:id
   * Get a single complaint by ID
   */
  .get("/:id", async ({ params, set }) => {
    try {
      const complaint = await feedService.getComplaintById(params.id);
      
      if (!complaint) {
        set.status = 404;
        return {
          success: false,
          error: "Complaint not found",
        };
      }

      return {
        success: true,
        data: complaint,
      };
    } catch (error: any) {
      console.error("[FeedRoutes] Error fetching complaint:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to fetch complaint",
      };
    }
  });
