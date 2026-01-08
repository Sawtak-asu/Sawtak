import { Elysia, t } from "elysia";
import { FeedService } from "../services/feed.service";

const feedService = new FeedService();

export const feedRoutes = new Elysia({ 
  prefix: "/api/feed",
  detail: {
    tags: ["Public Feed"],
    description: "Public complaint feed endpoints for browsing and viewing complaints"
  }
})
  /**
   * GET /api/feed
   * Get the public complaint feed with filtering and pagination
   */
  .get("/", async ({ query }) => {
    try {
      // Parse directedTo if provided as JSON string
      let directedTo: any = undefined;
      if (query.directedTo) {
        try {
          directedTo = JSON.parse(query.directedTo as string);
        } catch (e) {
          console.log("[FeedRoutes] Failed to parse directedTo:", e);
        }
      }

      const result = await feedService.getPublicFeed({
        search: query.search as string | undefined,
        category: query.category as string | undefined,
        area: query.area as string | undefined,
        dateFrom: query.dateFrom as string | undefined,
        dateTo: query.dateTo as string | undefined,
        sort: (query.sort as "newest" | "oldest") || "newest",
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 10,
        submissionMode: query.submissionMode as "anonymous" | "public" | "all" | undefined,
        directedTo,
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
  }, {
    query: t.Object({
      search: t.Optional(t.String({ description: "Text search in title and description" })),
      category: t.Optional(t.String({ description: "Filter by category (e.g., corruption, harassment)" })),
      area: t.Optional(t.String({ description: "Filter by geographic area" })),
      dateFrom: t.Optional(t.String({ description: "Filter from date (ISO 8601 format)" })),
      dateTo: t.Optional(t.String({ description: "Filter to date (ISO 8601 format)" })),
      sort: t.Optional(t.String({ description: "Sort order: 'newest' or 'oldest'" })),
      page: t.Optional(t.String({ description: "Page number (default: 1)" })),
      limit: t.Optional(t.String({ description: "Items per page (default: 10, max: 50)" })),
      submissionMode: t.Optional(t.String({ description: "Filter by type: 'anonymous', 'public', or 'all'" })),
      directedTo: t.Optional(t.String({ description: "JSON filter for directed complaints" }))
    }),
    detail: {
      summary: "Get Public Feed",
      description: "Retrieve the public complaint feed with optional filtering, search, and pagination. Returns both anonymous (blockchain) and public identified complaints.",
      responses: {
        200: {
          description: "Paginated list of public complaints",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      complaints: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            text: { type: "string" },
                            category: { type: "string" },
                            area: { type: "string" },
                            status: { type: "string" },
                            submissionMode: { type: "string", enum: ["anonymous", "public"] },
                            createdAt: { type: "string", format: "date-time" },
                            voteCount: { type: "integer" }
                          }
                        }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" }
                        }
                      }
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
  }, {
    detail: {
      summary: "Get Feed Statistics",
      description: "Get aggregate statistics about the public feed including total complaints, category breakdown, and status distribution.",
      responses: {
        200: {
          description: "Feed statistics",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      total: { type: "integer", description: "Total number of public complaints" },
                      byCategory: { type: "object", description: "Count per category" },
                      byStatus: { type: "object", description: "Count per status" },
                      thisWeek: { type: "integer", description: "Complaints this week" },
                      thisMonth: { type: "integer", description: "Complaints this month" }
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
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID (UUID for identified, HCS hash for anonymous)" })
    }),
    detail: {
      summary: "Get Complaint by ID",
      description: "Retrieve a single complaint by its ID. Works for both anonymous (blockchain hash) and identified (UUID) complaints.",
      responses: {
        200: {
          description: "Complaint details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      text: { type: "string" },
                      category: { type: "string" },
                      area: { type: "string" },
                      status: { type: "string" },
                      submissionMode: { type: "string" },
                      createdAt: { type: "string" },
                      incidentDate: { type: "string" },
                      voteCount: { type: "integer" },
                      transactionId: { type: "string", description: "HCS transaction hash (anonymous only)" },
                      topicId: { type: "string", description: "HCS topic ID (anonymous only)" }
                    }
                  }
                }
              }
            }
          }
        },
        404: { description: "Complaint not found" },
        500: { description: "Server error" }
      }
    }
  });
