import { prisma } from "../db";

export interface FeedComplaint {
  id: string;
  title: string;
  text: string;
  category: string;
  area: string;
  incidentDate: string;
  createdAt: string;
  status: string;
  submissionMode: "anonymous" | "public";
  user?: {
    name: string | null;
    picture?: string | null;
  };
  transactionId?: string; // For anonymous complaints from blockchain
  evidenceUrls?: string[]; // Evidence URLs for identified complaints
  evidenceCids?: string[]; // Evidence CIDs for anonymous complaints (IPFS)
  upvoteCount?: number; // Number of upvotes
  encryptedAnonId?: string; // Encrypted anonymous identifier (for admin view)
  trackingHash?: string; // Tracking hash for anonymous complaints
}

export interface FeedFilters {
  search?: string;
  category?: string;
  area?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface FeedResult {
  complaints: FeedComplaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    categories: string[];
    areas: string[];
  };
}

export class FeedService {
  /**
   * Get aggregated public feed combining identified (public) and indexed anonymous complaints
   */
  async getPublicFeed(filters: FeedFilters): Promise<FeedResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clauses for both tables
    const identifiedWhere: any = {
      visibility: "public",
      deleted_at: null,
    };

    const anonymousWhere: any = {};

    // Apply filters
    if (filters.category && filters.category !== "all") {
      identifiedWhere.category = filters.category;
      anonymousWhere.category = filters.category;
    }

    if (filters.area) {
      identifiedWhere.area = { contains: filters.area, mode: "insensitive" };
      anonymousWhere.area = { contains: filters.area, mode: "insensitive" };
    }

    if (filters.search) {
      const searchFilter = {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { text: { contains: filters.search, mode: "insensitive" } },
        ],
      };
      const anonymousSearchFilter = {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { complaint_text: { contains: filters.search, mode: "insensitive" } },
        ],
      };
      identifiedWhere.AND = [searchFilter];
      anonymousWhere.AND = [anonymousSearchFilter];
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      identifiedWhere.created_at = { ...identifiedWhere.created_at, gte: dateFrom };
      anonymousWhere.consensus_timestamp = { ...anonymousWhere.consensus_timestamp, gte: dateFrom };
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      identifiedWhere.created_at = { ...identifiedWhere.created_at, lte: dateTo };
      anonymousWhere.consensus_timestamp = { ...anonymousWhere.consensus_timestamp, lte: dateTo };
    }

    // Fetch both types of complaints
    const [identifiedComplaints, anonymousComplaints, identifiedCount, anonymousCount] =
      await Promise.all([
        prisma.identifiedComplaint.findMany({
          where: identifiedWhere,
          include: {
            user: {
              select: {
                name: true,
                picture: true,
              },
            },
          },
          orderBy: {
            created_at: filters.sort === "oldest" ? "asc" : "desc",
          },
        }),
        prisma.indexedComplaint.findMany({
          where: anonymousWhere,
          orderBy: {
            consensus_timestamp: filters.sort === "oldest" ? "asc" : "desc",
          },
        }),
        prisma.identifiedComplaint.count({ where: identifiedWhere }),
        prisma.indexedComplaint.count({ where: anonymousWhere }),
      ]);

    // Transform to unified format
    const identifiedFormatted: FeedComplaint[] = identifiedComplaints.map((c) => ({
      id: c.id,
      title: c.title,
      text: c.text,
      category: c.category,
      area: c.area,
      incidentDate: c.incident_date.toISOString(),
      createdAt: c.created_at.toISOString(),
      status: c.status,
      submissionMode: "public" as const,
      user: c.user ? { name: c.user.name, picture: c.user.picture } : undefined,
      evidenceUrls: c.evidence_urls ? (c.evidence_urls as string[]) : [],
    }));

    const anonymousFormatted: FeedComplaint[] = anonymousComplaints.map((c) => ({
      id: c.hcs_hash,
      title: c.title,
      text: c.complaint_text,
      category: c.category,
      area: c.area,
      incidentDate: c.incident_date.toISOString(),
      createdAt: c.consensus_timestamp.toISOString(),
      status: c.status,
      submissionMode: "anonymous" as const,
      transactionId: c.hcs_hash,
      evidenceCids: c.evidence_cids ? (c.evidence_cids as string[]) : [],
      encryptedAnonId: c.anonymous_identifier, // Include anonymous identifier for admin
      trackingHash: c.tracking_hash || undefined, // Include tracking hash
    }));

    // Merge and sort
    let allComplaints = [...identifiedFormatted, ...anonymousFormatted];
    allComplaints.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return filters.sort === "oldest" ? dateA - dateB : dateB - dateA;
    });

    // Paginate
    const paginatedComplaints = allComplaints.slice(skip, skip + limit);
    const total = identifiedCount + anonymousCount;

    // Fetch upvote counts for public identified complaints only
    // Anonymous complaints don't have upvotes
    let voteCountMap = new Map<string, number>();
    try {
      const identifiedIds = paginatedComplaints
        .filter((c) => c.submissionMode === "public")
        .map((c) => c.id);

      if (identifiedIds.length > 0) {
        const voteCounts = await prisma.complaintVote.groupBy({
          by: ["complaint_id"],
          where: {
            complaint_id: { in: identifiedIds },
          },
          _count: {
            id: true,
          },
        });

        for (const vote of voteCounts) {
          voteCountMap.set(vote.complaint_id, vote._count.id);
        }
      }
    } catch (error) {
      // Table might not exist yet, continue without vote counts
      console.log("[FeedService] Vote table not ready, skipping vote counts");
    }

    // Add upvote counts to complaints (only for identified/public ones)
    const complaintsWithVotes = paginatedComplaints.map((c) => ({
      ...c,
      upvoteCount: c.submissionMode === "public" ? (voteCountMap.get(c.id) || 0) : undefined,
    }));

    // Get distinct categories and areas for filter dropdowns
    const [categories, areas] = await Promise.all([
      this.getDistinctCategories(),
      this.getDistinctAreas(),
    ]);

    return {
      complaints: complaintsWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories,
        areas,
      },
    };
  }

  /**
   * Get distinct categories from both tables
   */
  private async getDistinctCategories(): Promise<string[]> {
    const [identified, anonymous] = await Promise.all([
      prisma.identifiedComplaint.findMany({
        where: { visibility: "public", deleted_at: null },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.indexedComplaint.findMany({
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    const allCategories = new Set([
      ...identified.map((c) => c.category),
      ...anonymous.map((c) => c.category),
    ]);

    return Array.from(allCategories).sort();
  }

  /**
   * Get distinct areas from both tables
   */
  private async getDistinctAreas(): Promise<string[]> {
    const [identified, anonymous] = await Promise.all([
      prisma.identifiedComplaint.findMany({
        where: { visibility: "public", deleted_at: null },
        select: { area: true },
        distinct: ["area"],
      }),
      prisma.indexedComplaint.findMany({
        select: { area: true },
        distinct: ["area"],
      }),
    ]);

    const allAreas = new Set([
      ...identified.map((c) => c.area),
      ...anonymous.map((c) => c.area),
    ]);

    return Array.from(allAreas).sort();
  }

  /**
   * Get a single complaint by ID (works for both types)
   */
  async getComplaintById(id: string): Promise<FeedComplaint | null> {
    // Try identified first
    const identified = await prisma.identifiedComplaint.findFirst({
      where: { id, visibility: "public", deleted_at: null },
      include: {
        user: {
          select: { name: true, picture: true },
        },
      },
    });

    if (identified) {
      return {
        id: identified.id,
        title: identified.title,
        text: identified.text,
        category: identified.category,
        area: identified.area,
        incidentDate: identified.incident_date.toISOString(),
        createdAt: identified.created_at.toISOString(),
        status: identified.status,
        submissionMode: "public",
        user: identified.user ? { name: identified.user.name, picture: identified.user.picture } : undefined,
        evidenceUrls: identified.evidence_urls ? (identified.evidence_urls as string[]) : [],
      };
    }

    // Try anonymous/indexed
    const anonymous = await prisma.indexedComplaint.findUnique({
      where: { hcs_hash: id },
    });

    if (anonymous) {
      return {
        id: anonymous.hcs_hash,
        title: anonymous.title,
        text: anonymous.complaint_text,
        category: anonymous.category,
        area: anonymous.area,
        incidentDate: anonymous.incident_date.toISOString(),
        createdAt: anonymous.consensus_timestamp.toISOString(),
        status: anonymous.status,
        submissionMode: "anonymous",
        transactionId: anonymous.hcs_hash,
        evidenceCids: anonymous.evidence_cids ? (anonymous.evidence_cids as string[]) : [],
        encryptedAnonId: anonymous.anonymous_identifier,
        trackingHash: anonymous.tracking_hash || undefined,
      };
    }

    return null;
  }

  /**
   * Get feed statistics
   */
  async getStats(): Promise<{
    totalComplaints: number;
    anonymousCount: number;
    publicCount: number;
    pendingCount: number;
    resolvedCount: number;
  }> {
    const [identifiedTotal, anonymousTotal, identifiedPending, anonymousPending, identifiedResolved, anonymousResolved] =
      await Promise.all([
        prisma.identifiedComplaint.count({ where: { visibility: "public", deleted_at: null } }),
        prisma.indexedComplaint.count(),
        prisma.identifiedComplaint.count({ where: { visibility: "public", deleted_at: null, status: "submitted" } }),
        prisma.indexedComplaint.count({ where: { status: "submitted" } }),
        prisma.identifiedComplaint.count({ where: { visibility: "public", deleted_at: null, status: "resolved" } }),
        prisma.indexedComplaint.count({ where: { status: "resolved" } }),
      ]);

    return {
      totalComplaints: identifiedTotal + anonymousTotal,
      anonymousCount: anonymousTotal,
      publicCount: identifiedTotal,
      pendingCount: identifiedPending + anonymousPending,
      resolvedCount: identifiedResolved + anonymousResolved,
    };
  }
}
