import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth.middleware";
import { HEDERA_CONFIG } from "../config/hedera.config";

export const adminRoutes = new Elysia({
  prefix: "/api/admin",
  detail: {
    tags: ["Admin"],
    description: "Admin endpoints for managing complaints and viewing statistics"
  }
})
  .use(authMiddleware)

  /**
   * GET /api/admin/complaints
   * Get all complaints (including private) for admin review
   */
  .get("/complaints", async ({ query, user, set }: any) => {
    // TODO: Add proper role check
    // if (!user || user.role !== "admin") {
    //   set.status = 403;
    //   return { success: false, error: "Admin access required" };
    // }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = query.search as string | undefined;
    const status = query.status as string | undefined;
    const visibility = query.visibility as string | undefined;

    // Build where clause for identified complaints
    const identifiedWhere: any = {
      deleted_at: null,
    };

    if (search) {
      identifiedWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { text: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      identifiedWhere.status = status;
    }
    if (visibility && visibility !== "all") {
      identifiedWhere.visibility = visibility;
    }

    // Build where clause for indexed (anonymous) complaints
    const anonymousWhere: any = {};
    if (search) {
      anonymousWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { complaint_text: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      anonymousWhere.status = status;
    }

    try {
      // Fetch both types
      const [identified, anonymous] = await Promise.all([
        prisma.identifiedComplaint.findMany({
          where: identifiedWhere,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                picture: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        }),
        // Only include anonymous if not filtering by visibility=private
        visibility === "private"
          ? Promise.resolve([])
          : prisma.indexedComplaint.findMany({
            where: anonymousWhere,
            orderBy: { consensus_timestamp: "desc" },
          }),
      ]);

      // Transform to unified format
      const identifiedFormatted = identified.map((c) => ({
        id: c.id,
        title: c.title,
        text: c.text,
        category: c.category,
        area: c.area,
        status: c.status,
        visibility: c.visibility,
        submissionMode: "public" as const,
        createdAt: c.created_at.toISOString(),
        incidentDate: c.incident_date?.toISOString(),
        user: c.user ? { name: c.user.name, email: c.user.email, picture: c.user.picture } : undefined,
        evidenceUrls: c.evidence_urls ? (c.evidence_urls as string[]) : [],
      }));

      const anonymousFormatted = anonymous.map((c) => {
        const formatted = {
          id: c.hcs_hash,
          title: c.title,
          text: c.complaint_text,
          category: c.category,
          area: c.area,
          status: c.status,
          visibility: "public" as const, // Anonymous are always public
          submissionMode: "anonymous" as const,
          createdAt: c.consensus_timestamp.toISOString(),
          incidentDate: c.incident_date?.toISOString(),
          transactionId: c.hcs_hash,
          encryptedAnonId: c.anonymous_identifier,
          trackingHash: c.tracking_hash || undefined,
          topicId: HEDERA_CONFIG.TOPIC_ID_COMPLAINTS,
          evidenceCids: c.evidence_cids ? (c.evidence_cids as string[]) : [],
        };
        // console.log('[AdminRoutes] Anonymous complaint formatted:', {
        //   id: formatted.id,
        //   encryptedAnonId: formatted.encryptedAnonId,
        //   hasAnonId: !!c.anonymous_identifier
        // });
        return formatted;
      });

      // Merge and sort
      let allComplaints = [...identifiedFormatted, ...anonymousFormatted];
      allComplaints.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Paginate
      const total = allComplaints.length;
      const paginatedComplaints = allComplaints.slice(skip, skip + limit);

      // Calculate stats
      const stats = {
        total,
        pending: allComplaints.filter(c => c.status === "submitted").length,
        investigating: allComplaints.filter(c => c.status === "investigating").length,
        resolved: allComplaints.filter(c => c.status === "resolved").length,
        dismissed: allComplaints.filter(c => c.status === "dismissed").length,
      };

      return {
        success: true,
        data: {
          complaints: paginatedComplaints,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          stats,
        },
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String({ description: "Page number (default: 1)" })),
      limit: t.Optional(t.String({ description: "Items per page (default: 20)" })),
      search: t.Optional(t.String({ description: "Search in title and description" })),
      status: t.Optional(t.String({ description: "Filter by status: submitted, investigating, resolved, dismissed, or all" })),
      visibility: t.Optional(t.String({ description: "Filter by visibility: public, private, or all" }))
    }),
    detail: {
      summary: "Get All Complaints",
      description: `Get all complaints for admin review, including private ones. Supports filtering, search, and pagination.

**Includes:**
- Identified complaints with user information
- Anonymous complaints with blockchain data
- Unified format for easy processing`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Paginated complaint list with stats",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      complaints: { type: "array", items: { type: "object" } },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" }
                        }
                      },
                      stats: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          pending: { type: "integer" },
                          investigating: { type: "integer" },
                          resolved: { type: "integer" },
                          dismissed: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" },
        500: { description: "Server error" }
      }
    }
  })

  /**
   * PATCH /api/admin/complaints/:id/status
   * Update the status of a complaint
   */
  .patch("/complaints/:id/status", async ({ params, body, user, set }: any) => {
    // TODO: Add proper role check
    const { id } = params;
    const { status, note } = body;

    if (!status) {
      set.status = 400;
      return { success: false, error: "Status is required" };
    }

    const validStatuses = ["submitted", "investigating", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      set.status = 400;
      return { success: false, error: "Invalid status" };
    }

    try {
      // Try to update identified complaint first
      const identified = await prisma.identifiedComplaint.findUnique({
        where: { id },
      });

      if (identified) {
        await prisma.identifiedComplaint.update({
          where: { id },
          data: {
            status,
            updated_at: new Date(),
          },
        });

        return {
          success: true,
          message: "Status updated",
          data: { id, status, type: "identified" },
        };
      }

      // Try indexed complaint (anonymous)
      const indexed = await prisma.indexedComplaint.findUnique({
        where: { hcs_hash: id },
      });

      if (indexed) {
        await prisma.indexedComplaint.update({
          where: { hcs_hash: id },
          data: { status },
        });

        // TODO: Also publish status update to HCS for blockchain record

        return {
          success: true,
          message: "Status updated",
          data: { id, status, type: "anonymous" },
        };
      }

      set.status = 404;
      return { success: false, error: "Complaint not found" };
    } catch (error: any) {
      console.error("[AdminRoutes] Status update error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID (UUID or HCS hash)" })
    }),
    body: t.Object({
      status: t.String({ description: "New status: submitted, investigating, resolved, or dismissed" }),
      note: t.Optional(t.String({ description: "Public note about the status change" }))
    }),
    detail: {
      summary: "Update Complaint Status",
      description: `Update the status of a complaint. Works for both identified and anonymous complaints.

**Valid statuses:**
- \`submitted\` - Initial status, awaiting review
- \`investigating\` - Under active investigation
- \`resolved\` - Issue has been addressed
- \`dismissed\` - Complaint rejected (spam, invalid, etc.)

**Note:** For anonymous complaints, status updates may also be published to the blockchain for transparency.`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Status updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      status: { type: "string" },
                      type: { type: "string", enum: ["identified", "anonymous"] }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: "Invalid status value" },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" },
        404: { description: "Complaint not found" },
        500: { description: "Update failed" }
      }
    }
  })

  /**
   * GET /api/admin/stats
   * Get dashboard statistics
   */
  .get("/stats", async ({ user, set }: any) => {
    try {
      const [identifiedCount, anonymousCount, identifiedByStatus, anonymousByStatus] = await Promise.all([
        prisma.identifiedComplaint.count({ where: { deleted_at: null } }),
        prisma.indexedComplaint.count(),
        prisma.identifiedComplaint.groupBy({
          by: ["status"],
          _count: true,
          where: { deleted_at: null },
        }),
        prisma.indexedComplaint.groupBy({
          by: ["status"],
          _count: true,
        }),
      ]);

      // Combine stats
      const statusCounts: Record<string, number> = {};
      for (const item of identifiedByStatus) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + item._count;
      }
      for (const item of anonymousByStatus) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + item._count;
      }

      return {
        success: true,
        data: {
          total: identifiedCount + anonymousCount,
          identified: identifiedCount,
          anonymous: anonymousCount,
          byStatus: statusCounts,
        },
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    detail: {
      summary: "Get Admin Statistics",
      description: "Get aggregate dashboard statistics including total complaints, breakdown by type, and status distribution.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Dashboard statistics",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      total: { type: "integer", description: "Total complaint count" },
                      identified: { type: "integer", description: "Identified complaints count" },
                      anonymous: { type: "integer", description: "Anonymous complaints count" },
                      byStatus: {
                        type: "object",
                        description: "Count per status",
                        additionalProperties: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Authentication required" },
        403: { description: "Admin access required" },
        500: { description: "Server error" }
      }
    }
  })

  /**
   * GET /api/admin/users
   * Get all users with pagination and search
   */
  .get("/users", async ({ query, user, set }: any) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = query.search as string | undefined;
    const blocked = query.blocked === "true";

    try {
      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ];
      }

      if (blocked) {
        where.is_blocked = true;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            role: true,
            is_blocked: true,
            auth_provider: true,
            created_at: true,
            _count: {
              select: {
                complaints_identified: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Users fetch error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      blocked: t.Optional(t.String()),
    }),
    detail: {
      summary: "Get All Users",
      description: "Get all users with pagination and optional search filter",
      security: [{ bearerAuth: [] }],
    }
  })

  /**
   * PATCH /api/admin/users/:id/block
   * Block a user
   */
  .patch("/users/:id/block", async ({ params, user, set }: any) => {
    const { id } = params;

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } });

      if (!targetUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      if (targetUser.role === "admin") {
        set.status = 403;
        return { success: false, error: "Cannot block admin users" };
      }

      await prisma.user.update({
        where: { id },
        data: {
          is_blocked: true,
          // blocked_at: new Date(),
          // blocked_by: user?.userId,
        },
      });

      // Log the action
      await prisma.adminAudit.create({
        data: {
          admin_id: user?.userId,
          action_type: "BLOCK_USER",
          target_id: id,
          reason: "Blocked by admin",
        },
      });

      return {
        success: true,
        message: "User blocked successfully",
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Block user error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Block User",
      description: "Block a user from submitting complaints",
      security: [{ bearerAuth: [] }],
    }
  })

  /**
   * PATCH /api/admin/users/:id/unblock
   * Unblock a user
   */
  .patch("/users/:id/unblock", async ({ params, user, set }: any) => {
    const { id } = params;

    try {
      const targetUser = await prisma.user.findUnique({ where: { id } });

      if (!targetUser) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      await prisma.user.update({
        where: { id },
        data: {
          is_blocked: false,
        },
      });

      // Log the action
      await prisma.adminAudit.create({
        data: {
          admin_id: user?.userId,
          action_type: "UNBLOCK_USER",
          target_id: id,
          reason: "Unblocked by admin",
        },
      });

      return {
        success: true,
        message: "User unblocked successfully",
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Unblock user error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Unblock User",
      description: "Unblock a previously blocked user",
      security: [{ bearerAuth: [] }],
    }
  });
