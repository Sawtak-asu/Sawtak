import { Elysia } from "elysia";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth.middleware";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
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
        user: c.user ? { name: c.user.name, email: c.user.email } : undefined,
      }));

      const anonymousFormatted = anonymous.map((c) => ({
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
      }));

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
  });
