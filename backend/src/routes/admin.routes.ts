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
   * POST /api/admin/complaints/:id/reveal-identity
   * Reveal identity of an anonymous complainant (Team Admin+)
   * Only for flagged complaints
   */
  .post("/complaints/:id/reveal-identity", async ({ params, user, set }: any) => {
    const { id } = params;

    try {
      // Check roles
      const userMemberships = await prisma.teamMember.findMany({
        where: { user_id: user?.userId },
        select: { role: true }
      });
      const isTeamAdmin = userMemberships.some(m => m.role === "team_admin");
      const isPlatformAdmin = user?.role === "platform_admin";

      if (!isTeamAdmin && !isPlatformAdmin) {
        set.status = 403;
        return { success: false, error: "Only team admins can reveal anonymous identities" };
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
        return { success: false, error: "Identity can only be revealed for flagged complaints" };
      }

      // Decrypt the identifier
      let decryptedAnonId: string;
      try {
        decryptedAnonId = decrypt(indexed.anonymous_identifier);
      } catch (err) {
        set.status = 500;
        return { success: false, error: "Failed to decrypt anonymous identifier" };
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

      // Log the action
      await prisma.complaintHistory.create({
        data: {
          complaint_id: id,
          complaint_type: "anonymous",
          action: "identity_reveal",
          performed_by: user?.userId,
          note: "Identity revealed due to flagged status"
        }
      });

      return {
        success: true,
        data: {
          user: targetUser,
          decryptedId: decryptedAnonId
        }
      };

    } catch (error: any) {
      console.error("[AdminRoutes] Reveal identity error:", error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    params: t.Object({
      id: t.String({ description: "Complaint ID (HCS Hash)" })
    }),
    detail: {
      summary: "Reveal Anonymous Identity",
      description: "Decrypts and reveals the identity of an anonymous complainant. Only available to Team Admins for FLAGGED complaints. Action is strictly audited.",
      security: [{ bearerAuth: [] }]
    }
  });
