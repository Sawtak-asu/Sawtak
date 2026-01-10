import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth.middleware";
import { HEDERA_CONFIG } from "../config/hedera.config";
import { decrypt } from "../utils/crypto.utils";

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
    const category = query.category as string | undefined;

    const entity = query.entity as string | undefined;

    // Build where clause for identified complaints
    const identifiedWhere: any = {
      deleted_at: null,
    };

    // Filter by entity (Team ID)
    if (entity) {
      if (entity.startsWith("min_")) {
        identifiedWhere.AND = [
          ...(identifiedWhere.AND || []),
          { directed_to: { path: ["type"], equals: "ministry" } },
          { directed_to: { path: ["ministryId"], equals: entity } }
        ];
      } else if (entity.startsWith("gov_")) {
        identifiedWhere.AND = [
          ...(identifiedWhere.AND || []),
          { directed_to: { path: ["type"], equals: "governorate" } },
          { directed_to: { path: ["governorateId"], equals: entity } }
        ];
      }
    }

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
    if (category && category !== "all") {
      identifiedWhere.category = category;
    }

    // Build where clause for indexed (anonymous) complaints
    const anonymousWhere: any = {};

    // Filter by entity (Team ID) for anonymous
    if (entity) {
      if (entity.startsWith("min_")) {
        anonymousWhere.AND = [
          ...(anonymousWhere.AND || []),
          { directed_to: { path: ["type"], equals: "ministry" } },
          { directed_to: { path: ["ministryId"], equals: entity } }
        ];
      } else if (entity.startsWith("gov_")) {
        anonymousWhere.AND = [
          ...(anonymousWhere.AND || []),
          { directed_to: { path: ["type"], equals: "governorate" } },
          { directed_to: { path: ["governorateId"], equals: entity } }
        ];
      }
    }

    if (search) {
      anonymousWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { complaint_text: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      anonymousWhere.status = status;
    }
    if (category && category !== "all") {
      anonymousWhere.category = category;
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
        submitted: allComplaints.filter(c => c.status === "submitted").length,
        investigating: allComplaints.filter(c => c.status === "investigating").length,
        closed: allComplaints.filter(c => c.status === "closed").length,
        resolved: allComplaints.filter(c => c.status === "resolved").length,
        flagged: allComplaints.filter(c => c.status === "flagged").length,
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
      visibility: t.Optional(t.String({ description: "Filter by visibility: public, private, or all" })),
      category: t.Optional(t.String({ description: "Filter by category (e.g. Corruption)" })),
      entity: t.Optional(t.String({ description: "Filter by Entity ID (e.g. min_justice)" }))
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
   * Update the status of a complaint with role-based permissions
   * 
   * Status flow:
   * - pending → in_progress (manager), closed (reviewer with comment)
   * - in_progress → under_investigation, resolved (manager/team_admin)
   * - under_investigation → resolved, flagged_inaccurate (manager/team_admin)
   * - flagged_inaccurate → flagged_legal (team_admin)
   * - flagged_legal → identity revealed (platform_admin)
   */
  .patch("/complaints/:id/status", async ({ params, body, user, set }: any) => {
    const { id } = params;
    const { status, note } = body;

    if (!status) {
      set.status = 400;
      return { success: false, error: "Status is required" };
    }

    // Ensure user is authenticated
    if (!user?.userId) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    // Valid status values
    const validStatuses = [
      "submitted", "investigating", "closed", "resolved", "flagged"
    ];
    if (!validStatuses.includes(status)) {
      set.status = 400;
      return { success: false, error: `Invalid status. Valid: ${validStatuses.join(", ")}` };
    }

    try {
      // Find the complaint and its current status
      let complaint: any = null;
      let complaintType = "identified";
      let oldStatus = "";

      const identified = await prisma.identifiedComplaint.findUnique({
        where: { id },
      });

      if (identified) {
        complaint = identified;
        oldStatus = identified.status;
      } else {
        const indexed = await prisma.indexedComplaint.findUnique({
          where: { hcs_hash: id },
        });
        if (indexed) {
          complaint = indexed;
          complaintType = "anonymous";
          oldStatus = indexed.status;
        }
      }

      if (!complaint) {
        set.status = 404;
        return { success: false, error: "Complaint not found" };
      }

      // Check user's team role for this complaint's entity
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId },
        select: { role: true, team_id: true }
      });
      const userRoles = userMemberships.map(m => m.role);
      const isReviewer = userRoles.includes("reviewer");
      const isManager = userRoles.includes("manager");
      const isTeamAdmin = userRoles.includes("team_admin");
      const isPlatformAdmin = user?.role === "platform_admin";

      // Role-based permission checks for status transitions
      let action = "status_change";

      // Reviewer: submitted → closed (with required comment)
      if (status === "closed" && oldStatus === "submitted") {
        if (!isReviewer && !isManager && !isTeamAdmin && !isPlatformAdmin) {
          set.status = 403;
          return { success: false, error: "Only reviewers can close complaints" };
        }
        if (!note) {
          set.status = 400;
          return { success: false, error: "Comment is required when closing a complaint" };
        }
      }
      // Reviewer: submitted → investigating
      else if (status === "investigating" && oldStatus === "submitted") {
        if (!isReviewer && !isManager && !isTeamAdmin && !isPlatformAdmin) {
          set.status = 403;
          return { success: false, error: "Only reviewers or higher can start investigation" };
        }
      }
      // Manager: investigating → resolved/closed/flagged
      else if ((status === "resolved" || status === "closed" || status === "flagged") && oldStatus === "investigating") {
        if (!isManager && !isTeamAdmin && !isPlatformAdmin) {
          set.status = 403;
          return { success: false, error: "Only managers or higher can resolve, close, or flag complaints" };
        }
        if (status === "flagged") {
          action = "flag";
        }
      }
      // Platform Admin can do anything
      else if (!isPlatformAdmin) {
        // If none of the specific transitions match, only platform admin can proceed
        set.status = 403;
        return { success: false, error: "Invalid status transition or insufficient permissions" };
      }

      // Update the complaint status
      if (complaintType === "identified") {
        await prisma.identifiedComplaint.update({
          where: { id },
          data: { status, updated_at: new Date() },
        });
      } else {
        await prisma.indexedComplaint.update({
          where: { hcs_hash: id },
          data: { status },
        });
      }

      // Record in complaint history
      await prisma.complaintHistory.create({
        data: {
          complaint_id: id,
          complaint_type: complaintType,
          action,
          old_status: oldStatus,
          new_status: status,
          note: note || null,
          performed_by: user?.userId,
        },
      });

      return {
        success: true,
        message: "Status updated",
        data: { id, oldStatus, status, type: complaintType, action },
      };
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
      status: t.String({ description: "New status: pending, in_progress, under_investigation, closed, resolved, flagged_inaccurate, flagged_legal" }),
      note: t.Optional(t.String({ description: "Note - required for closing complaints" }))
    }),
    detail: {
      summary: "Update Complaint Status",
      description: `Update the status of a complaint with role-based permissions.

**Status Flow:**
- \`pending\` → \`closed\` (reviewer, requires comment)
- \`pending\` → \`in_progress\` (manager+)
- \`in_progress\` → \`under_investigation\`, \`resolved\` (manager+)
- \`under_investigation\` → \`resolved\`, \`flagged_inaccurate\` (manager+)
- \`flagged_inaccurate\` → \`flagged_legal\` (team_admin+)
- \`flagged_legal\` → identity reveal (platform_admin)`,
      security: [{ bearerAuth: [] }],
    }
  })

  /**
   * POST /api/admin/complaints/:id/escalate
   * Escalate a complaint to a manager with priority
   * Only reviewers can escalate
   */
  .post("/complaints/:id/escalate", async ({ params, body, user, set }: any) => {
    const { id } = params;
    const { priority, note, toUserId } = body;

    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      set.status = 400;
      return { success: false, error: "Invalid priority. Valid: low, medium, high, urgent" };
    }

    try {
      // Check if user is a reviewer
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId },
        select: { role: true }
      });
      const isReviewer = userMemberships.some(m => m.role === "reviewer");

      if (!isReviewer && user?.role !== "platform_admin") {
        set.status = 403;
        return { success: false, error: "Only reviewers can escalate complaints" };
      }

      // Find the complaint
      let complaint: any = null;
      let complaintType = "identified";

      const identified = await prisma.identifiedComplaint.findUnique({ where: { id } });
      if (identified) {
        complaint = identified;
      } else {
        const indexed = await prisma.indexedComplaint.findUnique({ where: { hcs_hash: id } });
        if (indexed) {
          complaint = indexed;
          complaintType = "anonymous";
        }
      }

      if (!complaint) {
        set.status = 404;
        return { success: false, error: "Complaint not found" };
      }

      // Create escalation record
      const escalation = await prisma.escalation.create({
        data: {
          complaint_id: id,
          complaint_type: complaintType,
          from_user_id: user?.userId,
          to_user_id: toUserId || null,
          priority,
          note: note || null,
        }
      });

      // Update complaint status to in_progress
      if (complaintType === "identified") {
        await prisma.identifiedComplaint.update({
          where: { id },
          data: { status: "in_progress", updated_at: new Date() },
        });
      } else {
        await prisma.indexedComplaint.update({
          where: { hcs_hash: id },
          data: { status: "in_progress" },
        });
      }

      // Log to history
      await prisma.complaintHistory.create({
        data: {
          complaint_id: id,
          complaint_type: complaintType,
          action: "escalate",
          old_status: complaint.status,
          new_status: "in_progress",
          note: `Priority: ${priority}. ${note || ""}`,
          performed_by: user?.userId,
        },
      });

      return {
        success: true,
        message: "Complaint escalated successfully",
        data: { escalation }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Escalation error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID" })
    }),
    body: t.Object({
      priority: t.String({ description: "Priority: low, medium, high, urgent" }),
      note: t.Optional(t.String({ description: "Reason for escalation" })),
      toUserId: t.Optional(t.String({ description: "Assign to specific manager (optional)" }))
    }),
    detail: {
      summary: "Escalate Complaint",
      description: "Escalate a complaint to managers with priority. Only reviewers can escalate.",
      security: [{ bearerAuth: [] }]
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

    const excludeRole = query.excludeRole as string | undefined;

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

      if (excludeRole) {
        where.role = { not: excludeRole };
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
      excludeRole: t.Optional(t.String()),
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

      if (targetUser.role === "platform_admin") {
        set.status = 403;
        return { success: false, error: "Cannot block platform admin users" };
      }

      // 1. Remove from all teams
      await prisma.teamMember.deleteMany({
        where: { user_id: id },
      });

      // 2. Downgrade to user and block
      await prisma.user.update({
        where: { id },
        data: {
          role: "user",
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
  })

  /**
   * GET /api/admin/complaints/:id/history
   * Get complaint action history
   */
  .get("/complaints/:id/history", async ({ params, set }: any) => {
    const { id } = params;

    try {
      const history = await prisma.complaintHistory.findMany({
        where: { complaint_id: id },
        include: {
          performer: {
            select: { id: true, name: true, email: true, picture: true }
          }
        },
        orderBy: { created_at: "desc" }
      });

      return {
        success: true,
        data: { history }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Get history error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID" })
    }),
    detail: {
      summary: "Get Complaint History",
      description: "Get the full action history of a complaint including status changes, escalations, and notes.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * GET /api/admin/complaints/:id/user-info
   * Get user info for a FLAGGED complaint (admin only)
   */
  .get("/complaints/:id/user-info", async ({ params, user, set }: any) => {
    const { id } = params;

    try {
      // Check if user is admin (either system admin or team admin)
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId, role: "admin" }
      });
      const isTeamAdmin = userMemberships.length > 0;
      const isSystemAdmin = user?.role === "admin";

      if (!isTeamAdmin && !isSystemAdmin) {
        set.status = 403;
        return { success: false, error: "Only admins can track user information" };
      }

      // Find the complaint
      const identified = await prisma.identifiedComplaint.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              picture: true,
              auth_provider: true,
              created_at: true,
              is_blocked: true,
              _count: { select: { complaints_identified: true } }
            }
          }
        }
      });

      if (identified) {
        // Check if complaint is flagged
        if (identified.status !== "flagged") {
          set.status = 403;
          return { success: false, error: "User info can only be accessed for flagged complaints" };
        }

        // Log this access
        await prisma.complaintHistory.create({
          data: {
            complaint_id: id,
            complaint_type: "identified",
            action: "track_user",
            performed_by: user?.userId,
          }
        });

        return {
          success: true,
          data: {
            user: identified.user,
            complaint: {
              id: identified.id,
              title: identified.title,
              status: identified.status,
              created_at: identified.created_at
            }
          }
        };
      }

      // Check anonymous complaint
      const indexed = await prisma.indexedComplaint.findUnique({
        where: { hcs_hash: id }
      });

      if (indexed) {
        if (indexed.status !== "flagged") {
          set.status = 403;
          return { success: false, error: "User info can only be accessed for flagged complaints" };
        }

        // Log this access
        await prisma.complaintHistory.create({
          data: {
            complaint_id: id,
            complaint_type: "anonymous",
            action: "track_user",
            performed_by: user?.userId,
          }
        });

        // For anonymous complaints, return the encrypted identifier
        return {
          success: true,
          data: {
            user: {
              anonymous_identifier: indexed.anonymous_identifier,
              tracking_hash: indexed.tracking_hash,
              note: "This is an anonymous complaint. Only encrypted identifiers are available."
            },
            complaint: {
              id: indexed.hcs_hash,
              title: indexed.title,
              status: indexed.status,
              created_at: indexed.consensus_timestamp
            }
          }
        };
      }

      set.status = 404;
      return { success: false, error: "Complaint not found" };
    } catch (error: any) {
      console.error("[AdminRoutes] Get user info error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID" })
    }),
    detail: {
      summary: "Track User Info (Admin Only)",
      description: "Get user information for a FLAGGED complaint. Only admins can access this, and only for complaints in the 'flagged' status. Access is logged.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * POST /api/admin/complaints/:id/request-identity-reveal
   * Request identity reveal for an anonymous complainant (Team Admin only)
   * Creates a pending request for Platform Admin approval
   * Only for flagged complaints
   */
  .post("/complaints/:id/request-identity-reveal", async ({ params, body, user, set }: any) => {
    const { id } = params;
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      set.status = 400;
      return { success: false, error: "A detailed reason (at least 10 characters) is required" };
    }

    try {
      // Check roles - only team admins can request
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId },
        select: { role: true }
      });
      const isTeamAdmin = userMemberships.some(m => m.role === "team_admin");

      if (!isTeamAdmin) {
        set.status = 403;
        return { success: false, error: "Only team admins can request identity reveals" };
      }

      // Find the complaint (must be anonymous/indexed)
      const indexed = await prisma.indexedComplaint.findUnique({ where: { hcs_hash: id } });

      if (!indexed) {
        set.status = 404;
        return { success: false, error: "Anonymous complaint not found" };
      }

      // Check status - must be flagged
      if (indexed.status !== "flagged" && indexed.status !== "flagged_legal" && indexed.status !== "flagged_inaccurate") {
        set.status = 400;
        return { success: false, error: "Identity reveal can only be requested for flagged complaints" };
      }

      // Check if there's already a pending request
      const existingRequest = await prisma.identityRevealRequest.findFirst({
        where: {
          complaint_id: id,
          status: "pending"
        }
      });

      if (existingRequest) {
        set.status = 400;
        return { success: false, error: "A pending reveal request already exists for this complaint" };
      }

      // Create the request
      const request = await prisma.identityRevealRequest.create({
        data: {
          complaint_id: id,
          complaint_type: "anonymous",
          requested_by: user?.userId,
          reason: reason.trim()
        }
      });

      // Log the action
      await prisma.complaintHistory.create({
        data: {
          complaint_id: id,
          complaint_type: "anonymous",
          action: "identity_reveal_request",
          performed_by: user?.userId,
          note: `Identity reveal requested. Reason: ${reason.trim()}`
        }
      });

      return {
        success: true,
        message: "Identity reveal request submitted. A platform admin will review it.",
        data: { requestId: request.id }
      };

    } catch (error: any) {
      console.error("[AdminRoutes] Request reveal error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID (HCS Hash)" })
    }),
    body: t.Object({
      reason: t.String({ description: "Justification for requesting identity reveal (min 10 chars)" })
    }),
    detail: {
      summary: "Request Identity Reveal (Team Admin)",
      description: "Creates a request to reveal the identity of an anonymous complainant. Only team admins can submit requests, and only for FLAGGED complaints. A platform admin must approve and manually enter the decryption key.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * GET /api/admin/identity-reveal-requests
   * Get all identity reveal requests (Platform Admin only)
   */
  .get("/identity-reveal-requests", async ({ query, user, set }: any) => {
    // Check if platform admin
    if (user?.role !== "platform_admin") {
      set.status = 403;
      return { success: false, error: "Only platform admins can view reveal requests" };
    }

    const status = query.status as string | undefined;
    const search = query.search as string | undefined;
    const entity = query.entity as string | undefined;
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (status && status !== "all") {
        where.status = status;
      }

      // If searching by complaint ID, filter by complaint_id
      if (search) {
        where.complaint_id = { contains: search, mode: "insensitive" };
      }

      const [requests, total] = await Promise.all([
        prisma.identityRevealRequest.findMany({
          where,
          include: {
            requester: {
              select: { id: true, name: true, email: true, picture: true }
            },
            reviewer: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit
        }),
        prisma.identityRevealRequest.count({ where })
      ]);

      // Fetch complaint details for context
      const complaintIds = requests.map(r => r.complaint_id);
      
      // Build complaint filter
      const complaintWhere: any = { hcs_hash: { in: complaintIds } };
      
      // If filtering by entity, we need to filter complaints by directed_to
      if (entity) {
        if (entity.startsWith("min_")) {
          complaintWhere.AND = [
            { directed_to: { path: ["type"], equals: "ministry" } },
            { directed_to: { path: ["ministryId"], equals: entity } }
          ];
        } else if (entity.startsWith("gov_")) {
          complaintWhere.AND = [
            { directed_to: { path: ["type"], equals: "governorate" } },
            { directed_to: { path: ["governorateId"], equals: entity } }
          ];
        }
      }

      const complaints = await prisma.indexedComplaint.findMany({
        where: complaintWhere,
        select: { hcs_hash: true, title: true, status: true, directed_to: true }
      });
      const complaintMap = new Map(complaints.map(c => [c.hcs_hash, c]));

      // Filter requests to only those whose complaints match the entity filter
      let filteredRequests = requests;
      if (entity) {
        filteredRequests = requests.filter(r => complaintMap.has(r.complaint_id));
      }

      const enrichedRequests = filteredRequests.map(r => ({
        ...r,
        complaint: complaintMap.get(r.complaint_id) || null
      }));

      return {
        success: true,
        data: {
          requests: enrichedRequests,
          pagination: {
            page,
            limit,
            total: entity ? enrichedRequests.length : total,
            totalPages: Math.ceil((entity ? enrichedRequests.length : total) / limit)
          }
        }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Get reveal requests error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      status: t.Optional(t.String({ description: "Filter by status: pending, approved, rejected, or all" })),
      search: t.Optional(t.String({ description: "Search by complaint ID" })),
      entity: t.Optional(t.String({ description: "Filter by entity ID (e.g. min_justice, gov_cairo)" })),
      page: t.Optional(t.String({ description: "Page number (default: 1)" })),
      limit: t.Optional(t.String({ description: "Items per page (default: 20)" }))
    }),
    detail: {
      summary: "Get Identity Reveal Requests (Platform Admin)",
      description: "List all identity reveal requests submitted by team admins. Only platform admins can access this endpoint. Supports search by complaint ID and filter by entity.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * POST /api/admin/identity-reveal-requests/:id/approve
   * Approve an identity reveal request with manual decryption key (Platform Admin only)
   */
  .post("/identity-reveal-requests/:id/approve", async ({ params, body, user, set }: any) => {
    const { id } = params;
    const { decryptionKey, note } = body;

    // Check if platform admin
    if (user?.role !== "platform_admin") {
      set.status = 403;
      return { success: false, error: "Only platform admins can approve reveal requests" };
    }

    if (!decryptionKey) {
      set.status = 400;
      return { success: false, error: "Decryption key is required" };
    }

    try {
      // Find the request
      const request = await prisma.identityRevealRequest.findUnique({
        where: { id }
      });

      if (!request) {
        set.status = 404;
        return { success: false, error: "Reveal request not found" };
      }

      if (request.status !== "pending") {
        set.status = 400;
        return { success: false, error: `Request has already been ${request.status}` };
      }

      // Find the complaint
      const indexed = await prisma.indexedComplaint.findUnique({
        where: { hcs_hash: request.complaint_id }
      });

      if (!indexed) {
        set.status = 404;
        return { success: false, error: "Associated complaint not found" };
      }

      // Decrypt the identifier with the manually provided key
      const { decryptWithKey } = require("../utils/crypto.utils");
      let decryptedAnonId: string;
      try {
        decryptedAnonId = decryptWithKey(indexed.anonymous_identifier, decryptionKey);
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: `Decryption failed: ${err.message}` };
      }

      // Find the user
      const targetUser = await prisma.user.findUnique({
        where: { anonymous_identifier: decryptedAnonId },
        select: { id: true, name: true, email: true, picture: true }
      });

      if (!targetUser) {
        set.status = 404;
        return { success: false, error: "User associated with this anonymous ID not found" };
      }

      // Update the request with revealed info
      await prisma.identityRevealRequest.update({
        where: { id },
        data: {
          status: "approved",
          reviewed_by: user?.userId,
          review_note: note || null,
          revealed_user_id: targetUser.id,
          revealed_user_name: targetUser.name,
          revealed_user_email: targetUser.email,
          reviewed_at: new Date()
        }
      });

      // Log the action
      await prisma.complaintHistory.create({
        data: {
          complaint_id: request.complaint_id,
          complaint_type: "anonymous",
          action: "identity_reveal_approved",
          performed_by: user?.userId,
          note: `Platform admin approved identity reveal. User: ${targetUser.email}`
        }
      });

      // Admin audit log
      await prisma.adminAudit.create({
        data: {
          admin_id: user?.userId,
          action_type: "IDENTITY_REVEAL",
          target_id: request.complaint_id,
          reason: `Approved reveal request. Revealed user: ${targetUser.email}. ${note || ""}`
        }
      });

      return {
        success: true,
        message: "Identity reveal approved",
        data: {
          user: targetUser,
          decryptedId: decryptedAnonId
        }
      };

    } catch (error: any) {
      console.error("[AdminRoutes] Approve reveal error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Reveal Request ID" })
    }),
    body: t.Object({
      decryptionKey: t.String({ description: "The 64-character hex decryption key (32 bytes)" }),
      note: t.Optional(t.String({ description: "Optional note from platform admin" }))
    }),
    detail: {
      summary: "Approve Identity Reveal (Platform Admin)",
      description: "Approve an identity reveal request by manually entering the decryption key. Only platform admins can approve requests. The key must be 64 hex characters (32 bytes). This action is strictly audited.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * POST /api/admin/identity-reveal-requests/:id/reject
   * Reject an identity reveal request (Platform Admin only)
   */
  .post("/identity-reveal-requests/:id/reject", async ({ params, body, user, set }: any) => {
    const { id } = params;
    const { note } = body;

    // Check if platform admin
    if (user?.role !== "platform_admin") {
      set.status = 403;
      return { success: false, error: "Only platform admins can reject reveal requests" };
    }

    if (!note || note.trim().length < 10) {
      set.status = 400;
      return { success: false, error: "A reason for rejection (at least 10 characters) is required" };
    }

    try {
      const request = await prisma.identityRevealRequest.findUnique({
        where: { id }
      });

      if (!request) {
        set.status = 404;
        return { success: false, error: "Reveal request not found" };
      }

      if (request.status !== "pending") {
        set.status = 400;
        return { success: false, error: `Request has already been ${request.status}` };
      }

      await prisma.identityRevealRequest.update({
        where: { id },
        data: {
          status: "rejected",
          reviewed_by: user?.userId,
          review_note: note.trim(),
          reviewed_at: new Date()
        }
      });

      // Log the action
      await prisma.complaintHistory.create({
        data: {
          complaint_id: request.complaint_id,
          complaint_type: "anonymous",
          action: "identity_reveal_rejected",
          performed_by: user?.userId,
          note: `Platform admin rejected identity reveal. Reason: ${note.trim()}`
        }
      });

      return {
        success: true,
        message: "Identity reveal request rejected"
      };

    } catch (error: any) {
      console.error("[AdminRoutes] Reject reveal error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Reveal Request ID" })
    }),
    body: t.Object({
      note: t.String({ description: "Reason for rejection (min 10 characters)" })
    }),
    detail: {
      summary: "Reject Identity Reveal (Platform Admin)",
      description: "Reject an identity reveal request with a reason. Only platform admins can reject requests.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * GET /api/admin/identity-reveal-requests/:id
   * Get details of a specific reveal request
   */
  .get("/identity-reveal-requests/:id", async ({ params, user, set }: any) => {
    const { id } = params;

    // Platform admin or the requester can view
    const isPlatformAdmin = user?.role === "platform_admin";

    try {
      const request = await prisma.identityRevealRequest.findUnique({
        where: { id },
        include: {
          requester: {
            select: { id: true, name: true, email: true, picture: true }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!request) {
        set.status = 404;
        return { success: false, error: "Reveal request not found" };
      }

      // Check access
      if (!isPlatformAdmin && request.requested_by !== user?.userId) {
        set.status = 403;
        return { success: false, error: "Access denied" };
      }

      // Get complaint details
      const complaint = await prisma.indexedComplaint.findUnique({
        where: { hcs_hash: request.complaint_id },
        select: { hcs_hash: true, title: true, status: true, complaint_text: true, category: true }
      });

      return {
        success: true,
        data: {
          request,
          complaint
        }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Get reveal request error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Reveal Request ID" })
    }),
    detail: {
      summary: "Get Reveal Request Details",
      description: "Get details of a specific identity reveal request. Platform admins can view all requests, team admins can only view their own requests.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * GET /api/admin/my-reveal-requests
   * Get reveal requests made by the current user (Team Admin)
   */
  .get("/my-reveal-requests", async ({ query, user, set }: any) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;

    try {
      const [requests, total] = await Promise.all([
        prisma.identityRevealRequest.findMany({
          where: { requested_by: user?.userId },
          include: {
            reviewer: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit
        }),
        prisma.identityRevealRequest.count({
          where: { requested_by: user?.userId }
        })
      ]);

      // Fetch complaint titles
      const complaintIds = requests.map(r => r.complaint_id);
      const complaints = await prisma.indexedComplaint.findMany({
        where: { hcs_hash: { in: complaintIds } },
        select: { hcs_hash: true, title: true, status: true }
      });
      const complaintMap = new Map(complaints.map(c => [c.hcs_hash, c]));

      const enrichedRequests = requests.map(r => ({
        ...r,
        complaint: complaintMap.get(r.complaint_id) || null
      }));

      return {
        success: true,
        data: {
          requests: enrichedRequests,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Get my reveal requests error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    }),
    detail: {
      summary: "Get My Reveal Requests",
      description: "Get identity reveal requests submitted by the current user.",
      security: [{ bearerAuth: [] }]
    }
  })

  /**
   * GET /api/admin/audits
   * Get audit logs with role-based access control
   * 
   * Access levels:
   * - Platform Admin: sees ALL audits, can filter by entity
   * - Team Admin: sees audits from managers and reviewers in their teams
   * - Manager: sees audits from reviewers in their teams
   * - Reviewer: no access (can't see anyone's audits)
   */
  .get("/audits", async ({ query, user, set }: any) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const search = query.search as string | undefined;
    const entity = query.entity as string | undefined;
    const action = query.action as string | undefined;
    const performedBy = query.performedBy as string | undefined;

    try {
      const isPlatformAdmin = user?.role === "platform_admin";

      // Get user's team memberships
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId },
        include: { team: true }
      });

      const userRoles = userMemberships.map(m => m.role);
      const isTeamAdmin = userRoles.includes("team_admin");
      const isManager = userRoles.includes("manager");
      const isReviewer = userRoles.includes("reviewer") && !isManager && !isTeamAdmin;

      // Reviewers have no access
      if (isReviewer && !isPlatformAdmin) {
        set.status = 403;
        return { success: false, error: "Reviewers cannot access audit logs" };
      }

      // If not platform admin and has no team membership, deny access
      if (!isPlatformAdmin && userMemberships.length === 0) {
        set.status = 403;
        return { success: false, error: "You do not have access to audit logs" };
      }

      // Build the where clause based on role
      let where: any = {};
      
      // Search by complaint ID
      if (search) {
        where.complaint_id = { contains: search, mode: "insensitive" };
      }

      // Filter by action type
      if (action && action !== "all") {
        where.action = action;
      }

      // Filter by specific performer
      if (performedBy) {
        where.performed_by = performedBy;
      }

      // For non-platform-admin, filter to only show audits from lower roles
      if (!isPlatformAdmin) {
        const teamIds = userMemberships.map(m => m.team_id);
        
        // Get all team members from user's teams
        const teamMembers = await prisma.teamMember.findMany({
          where: { team_id: { in: teamIds } },
          select: { user_id: true, role: true }
        });

        // Determine which users' audits this user can see
        let visibleUserIds: string[] = [];
        
        if (isTeamAdmin) {
          // Team admins can see managers and reviewers
          visibleUserIds = teamMembers
            .filter(m => m.role === "manager" || m.role === "reviewer")
            .map(m => m.user_id);
        } else if (isManager) {
          // Managers can only see reviewers
          visibleUserIds = teamMembers
            .filter(m => m.role === "reviewer")
            .map(m => m.user_id);
        }

        if (visibleUserIds.length === 0) {
          return {
            success: true,
            data: {
              audits: [],
              pagination: { page, limit, total: 0, totalPages: 0 }
            }
          };
        }

        where.performed_by = { in: visibleUserIds };
      }

      // For platform admin with entity filter, we need to filter by complaints directed to that entity
      if (isPlatformAdmin && entity) {
        // Get all complaints directed to this entity
        const entityWhere: any = {};
        if (entity.startsWith("min_")) {
          entityWhere.AND = [
            { directed_to: { path: ["type"], equals: "ministry" } },
            { directed_to: { path: ["ministryId"], equals: entity } }
          ];
        } else if (entity.startsWith("gov_")) {
          entityWhere.AND = [
            { directed_to: { path: ["type"], equals: "governorate" } },
            { directed_to: { path: ["governorateId"], equals: entity } }
          ];
        }

        // Get complaints matching entity
        const entityComplaints = await prisma.indexedComplaint.findMany({
          where: entityWhere,
          select: { hcs_hash: true }
        });
        const identifiedEntityComplaints = await prisma.identifiedComplaint.findMany({
          where: entityWhere.AND ? { AND: entityWhere.AND } : {},
          select: { id: true }
        });

        const complaintIds = [
          ...entityComplaints.map(c => c.hcs_hash),
          ...identifiedEntityComplaints.map(c => c.id)
        ];

        if (complaintIds.length > 0) {
          where.complaint_id = { in: complaintIds };
        } else {
          // No complaints for this entity
          return {
            success: true,
            data: {
              audits: [],
              pagination: { page, limit, total: 0, totalPages: 0 }
            }
          };
        }
      }

      // Fetch audits
      const [audits, total] = await Promise.all([
        prisma.complaintHistory.findMany({
          where,
          include: {
            performer: {
              select: { id: true, name: true, email: true, picture: true }
            }
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit
        }),
        prisma.complaintHistory.count({ where })
      ]);

      // Enrich with performer's team role (if applicable)
      const performerIds = [...new Set(audits.map(a => a.performed_by))];
      const performerMemberships = await prisma.teamMember.findMany({
        where: { user_id: { in: performerIds } },
        include: { team: true }
      });

      const performerRoleMap = new Map<string, { role: string; teamName: string }[]>();
      for (const m of performerMemberships) {
        const existing = performerRoleMap.get(m.user_id) || [];
        existing.push({ role: m.role, teamName: m.team.entity_id });
        performerRoleMap.set(m.user_id, existing);
      }

      const enrichedAudits = audits.map(a => ({
        ...a,
        performerRoles: performerRoleMap.get(a.performed_by) || []
      }));

      return {
        success: true,
        data: {
          audits: enrichedAudits,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      console.error("[AdminRoutes] Get audits error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String({ description: "Page number (default: 1)" })),
      limit: t.Optional(t.String({ description: "Items per page (default: 50)" })),
      search: t.Optional(t.String({ description: "Search by complaint ID" })),
      entity: t.Optional(t.String({ description: "Filter by entity ID (Platform Admin only)" })),
      action: t.Optional(t.String({ description: "Filter by action type (e.g. status_change, escalate, identity_reveal_request)" })),
      performedBy: t.Optional(t.String({ description: "Filter by performer user ID" }))
    }),
    detail: {
      summary: "Get Audit Logs",
      description: `Get audit logs with role-based access control.

**Access Levels:**
- Platform Admin: sees ALL audits, can filter by entity
- Team Admin: sees audits from managers and reviewers in their teams
- Manager: sees audits from reviewers in their teams
- Reviewer: no access

Audits are read-only and cannot be deleted.`,
      security: [{ bearerAuth: [] }]
    }
  });
