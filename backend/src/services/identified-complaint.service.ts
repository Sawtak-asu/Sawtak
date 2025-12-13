import { prisma } from "../db";

interface CreateIdentifiedComplaintDTO {
    userId: string;
    title: string;
    text: string;
    category: string;
    area: string;
    incidentDate?: Date;
    evidenceUrls?: string[];
    visibility?: string;
}

export class IdentifiedComplaintService {

    /**
     * Create a new identified complaint
     */
    async createComplaint(data: CreateIdentifiedComplaintDTO) {
        return await prisma.identifiedComplaint.create({
            data: {
                user_id: data.userId,
                title: data.title,
                text: data.text,
                category: data.category,
                area: data.area,
                incident_date: data.incidentDate || new Date(),
                evidence_urls: data.evidenceUrls || [],
                visibility: data.visibility || "private",
                status: "submitted"
            }
        });
    }

    /**
     * Get all complaints for a specific user
     */
    async getUserComplaints(userId: string) {
        const complaints = await prisma.identifiedComplaint.findMany({
            where: {
                user_id: userId,
                deleted_at: null
            },
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                title: true,
                category: true,
                status: true,
                visibility: true,
                created_at: true,
            }
        });

        return {
            complaints: complaints.map((c: typeof complaints[0]) => ({
                id: c.id,
                title: c.title,
                category: c.category,
                status: c.status,
                visibility: c.visibility,
                createdAt: c.created_at.toISOString(),
            }))
        };
    }

    /**
     * Get a single complaint by ID, ensuring ownership
     */
    async getComplaintById(id: string, userId: string) {
        const complaint = await prisma.identifiedComplaint.findUnique({
            where: { id }
        });

        if (!complaint || complaint.deleted_at) return null;

        if (complaint.user_id !== userId) {
            throw new Error("Unauthorized access to complaint");
        }

        return complaint;
    }

    /**
     * Get all public identified complaints for the public feed
     */
    async getPublicComplaints(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [complaints, total] = await Promise.all([
            prisma.identifiedComplaint.findMany({
                where: {
                    visibility: "public",
                    deleted_at: null
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    text: true,
                    category: true,
                    area: true,
                    incident_date: true,
                    evidence_urls: true,
                    status: true,
                    created_at: true
                    // Explicitly excluding user_id to protect identity to public, but identified to admin
                }
            }),
            prisma.identifiedComplaint.count({
                where: {
                    visibility: "public",
                    deleted_at: null
                }
            })
        ]);

        return {
            complaints,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get all identified complaints for admin dashboard (includes private ones)
     */
    async getAllComplaintsForAdmin(
        page: number = 1,
        limit: number = 20,
        filters: { status?: string; category?: string; area?: string } = {}
    ) {
        const skip = (page - 1) * limit;
        const where: any = { deleted_at: null };

        if (filters.status) where.status = filters.status;
        if (filters.category) where.category = filters.category;
        if (filters.area) where.area = { contains: filters.area, mode: 'insensitive' };

        const [complaints, total] = await Promise.all([
            prisma.identifiedComplaint.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            anonymous_identifier: true
                        }
                    }
                }
            }),
            prisma.identifiedComplaint.count({ where })
        ]);

        return {
            complaints,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
