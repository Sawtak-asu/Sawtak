import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { prisma } from "../db";
import { MINISTRIES, GOVERNORATES, getMinistryById, getGovernorateById } from "../lib/egypt-locations";

// Type definitions
type TeamType = "ministry" | "governorate" | "center";
type TeamRole = "reviewer" | "manager" | "team_admin";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const teamRoutes = new Elysia({
    prefix: "/api/admin/teams",
    detail: {
        tags: ["Admin - Teams"],
        description: "Team management endpoints for admin routing system"
    }
})
    .use(jwt({ name: "jwt", secret: JWT_SECRET }))
    .derive(async ({ headers, jwt, set }: any) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return { user: null };
        }
        const token = authHeader.substring(7);
        try {
            const payload = await jwt.verify(token);
            if (!payload) return { user: null };
            return {
                user: {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role
                }
            };
        } catch (err) {
            return { user: null };
        }
    })

    /**
     * GET /api/admin/teams
     * Get all teams with member counts
     */
    .get("/", async ({ user, set }: any) => {
        try {
            const teams = await prisma.team.findMany({
                include: {
                    _count: {
                        select: { members: true }
                    },
                    members: {
                        take: 5,
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, picture: true }
                            }
                        }
                    }
                },
                orderBy: { created_at: "desc" }
            });

            // Enrich with display names from egypt-locations
            const enrichedTeams = teams.map(team => {
                let displayName = team.entity_id;
                let displayNameAr = team.entity_id;

                if (team.type === "ministry") {
                    const ministry = getMinistryById(team.entity_id);
                    if (ministry) {
                        displayName = ministry.name;
                        displayNameAr = ministry.nameAr;
                    }
                } else if (team.type === "governorate") {
                    const gov = getGovernorateById(team.entity_id);
                    if (gov) {
                        displayName = gov.name;
                        displayNameAr = gov.nameAr;
                    }
                }

                return {
                    ...team,
                    displayName,
                    displayNameAr,
                    memberCount: team._count.members
                };
            });

            return {
                success: true,
                data: { teams: enrichedTeams }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Get teams error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            summary: "Get All Teams",
            description: "Get all teams with member counts and display names",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * POST /api/admin/teams
     * Create a new team (entity) - PLATFORM ADMIN ONLY
     */
    .post("/", async (context: any) => {
        const { body, user, set } = context;

        // Debug: see context keys
        console.log("[TeamRoutes] Context keys:", Object.keys(context));
        console.log("[TeamRoutes] Create team - User from JWT:", user);

        if (!user || !user.userId) {
            set.status = 401;
            return { success: false, error: "Unauthorized: Invalid user context" };
        }

        // Fetch fresh user data from database (JWT might have stale role)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { id: true, role: true, email: true }
        });

        console.log("[TeamRoutes] User from DB:", dbUser);

        if (!dbUser) {
            set.status = 401;
            return { success: false, error: "User not found in database. Please log out and log in again." };
        }

        // Only platform admins can create teams
        if (dbUser.role !== "platform_admin") {
            set.status = 403;
            return {
                success: false,
                error: `Only platform admins can create teams. Your role: '${dbUser.role}'. User ID: ${dbUser.id}`
            };
        }

        const { entityId, type } = body;


        // Validate entity exists
        if (type === "ministry" && !getMinistryById(entityId)) {
            set.status = 400;
            return { success: false, error: "Invalid ministry ID" };
        }
        if (type === "governorate" && !getGovernorateById(entityId)) {
            set.status = 400;
            return { success: false, error: "Invalid governorate ID" };
        }

        try {
            // Check if team already exists
            const existing = await prisma.team.findUnique({
                where: { entity_id: entityId }
            });

            if (existing) {
                set.status = 400;
                return { success: false, error: "Team already exists for this entity" };
            }

            const team = await prisma.team.create({
                data: {
                    entity_id: entityId,
                    type
                }
            });

            return {
                success: true,
                message: "Team created successfully",
                data: { team }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Create team error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            entityId: t.String({ description: "Entity ID from egypt-locations (e.g. min_interior)" }),
            type: t.Union([
                t.Literal("ministry"),
                t.Literal("governorate"),
                t.Literal("center")
            ])
        }),
        detail: {
            summary: "Create Team",
            description: "Create a new team for an entity (ministry, governorate, or center)",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * GET /api/admin/teams/:id
     * Get team details with all members
     */
    .get("/:id", async ({ params, set }: any) => {
        const { id } = params;

        try {
            const team = await prisma.team.findUnique({
                where: { id },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, picture: true, role: true }
                            }
                        },
                        orderBy: { created_at: "desc" }
                    }
                }
            });

            if (!team) {
                set.status = 404;
                return { success: false, error: "Team not found" };
            }

            // Enrich with display name
            let displayName = team.entity_id;
            let displayNameAr = team.entity_id;

            if (team.type === "ministry") {
                const ministry = getMinistryById(team.entity_id);
                if (ministry) {
                    displayName = ministry.name;
                    displayNameAr = ministry.nameAr;
                }
            } else if (team.type === "governorate") {
                const gov = getGovernorateById(team.entity_id);
                if (gov) {
                    displayName = gov.name;
                    displayNameAr = gov.nameAr;
                }
            }

            return {
                success: true,
                data: {
                    ...team,
                    displayName,
                    displayNameAr
                }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Get team error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            summary: "Get Team Details",
            description: "Get team details with all members",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * DELETE /api/admin/teams/:id
     * Delete a team - PLATFORM ADMIN ONLY
     */
    .delete("/:id", async ({ params, user, set }: any) => {
        // Only platform admins can delete teams
        if (user?.role !== "platform_admin") {
            set.status = 403;
            return { success: false, error: "Only platform admins can delete teams" };
        }

        const { id } = params;

        try {
            const team = await prisma.team.findUnique({ where: { id } });

            if (!team) {
                set.status = 404;
                return { success: false, error: "Team not found" };
            }

            await prisma.team.delete({ where: { id } });

            return {
                success: true,
                message: "Team deleted successfully"
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Delete team error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            summary: "Delete Team",
            description: "Delete a team and all its member assignments",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * POST /api/admin/teams/:id/members
     * Add a member to a team with a role - PLATFORM ADMIN ONLY
     */
    .post("/:id/members", async ({ params, body, user, set }: any) => {
        // Only platform admins can manage team members
        if (user?.role !== "platform_admin") {
            set.status = 403;
            return { success: false, error: "Only platform admins can manage team members" };
        }

        const { id } = params;
        const { userId, role } = body;

        // Validate role
        const validRoles: TeamRole[] = ["reviewer", "manager", "team_admin"];
        if (!validRoles.includes(role)) {
            set.status = 400;
            return { success: false, error: "Invalid role. Must be: reviewer, manager, or team_admin" };
        }

        try {
            // Check team exists
            const team = await prisma.team.findUnique({ where: { id } });
            if (!team) {
                set.status = 404;
                return { success: false, error: "Team not found" };
            }

            // Check user exists
            const targetUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!targetUser) {
                set.status = 404;
                return { success: false, error: "User not found" };
            }

            // Auto-promote to 'admin' (global) if currently just 'user'
            // This grants them access to the admin panel
            if (targetUser.role === "user") {
                await prisma.user.update({
                    where: { id: userId },
                    data: { role: "admin" } // Grants admin panel access
                });
            }

            // Check if already a member (upsert to update role if exists)
            const existing = await prisma.teamMember.findUnique({
                where: {
                    user_id_team_id: { user_id: userId, team_id: id }
                }
            });

            if (existing) {
                // Update role
                const member = await prisma.teamMember.update({
                    where: { id: existing.id },
                    data: { role },
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, picture: true }
                        }
                    }
                });

                return {
                    success: true,
                    message: "Member role updated",
                    data: { member }
                };
            }

            // Create new membership
            const member = await prisma.teamMember.create({
                data: {
                    user_id: userId,
                    team_id: id,
                    role
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, picture: true }
                    }
                }
            });

            return {
                success: true,
                message: "Member added to team",
                data: { member }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Add member error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            userId: t.String({ description: "User ID to add as member" }),
            role: t.String({ description: "Role: reviewer, manager, or team_admin" })
        }),
        detail: {
            summary: "Add Team Member",
            description: "Add a user to a team with a specific role",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * DELETE /api/admin/teams/:id/members/:userId
     * Remove a member from a team - PLATFORM ADMIN ONLY
     */
    .delete("/:id/members/:userId", async ({ params, user, set }: any) => {
        // Only platform admins can manage team members
        if (user?.role !== "platform_admin") {
            set.status = 403;
            return { success: false, error: "Only platform admins can manage team members" };
        }

        const { id, userId } = params;

        try {
            const member = await prisma.teamMember.findUnique({
                where: {
                    user_id_team_id: { user_id: userId, team_id: id }
                }
            });

            if (!member) {
                set.status = 404;
                return { success: false, error: "Member not found in team" };
            }

            await prisma.teamMember.delete({ where: { id: member.id } });

            // Check if user has any remaining team memberships
            const remainingCount = await prisma.teamMember.count({
                where: { user_id: userId }
            });

            if (remainingCount === 0) {
                // Fetch the user to check if they are currently 'admin' (don't demote platform_admin)
                const targetUser = await prisma.user.findUnique({ where: { id: userId } });

                if (targetUser && targetUser.role === "admin") {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { role: "user" }
                    });
                }
            }

            return {
                success: true,
                message: "Member removed from team"
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Remove member error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String(),
            userId: t.String()
        }),
        detail: {
            summary: "Remove Team Member",
            description: "Remove a user from a team",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * PATCH /api/admin/teams/:id/members/:userId
     * Update a member's role in a team - PLATFORM ADMIN ONLY
     */
    .patch("/:id/members/:userId", async ({ params, body, user, set }: any) => {
        // Only platform admins can manage team members
        if (user?.role !== "platform_admin") {
            set.status = 403;
            return { success: false, error: "Only platform admins can manage team members" };
        }

        const { id, userId } = params;
        const { role } = body;

        // Validate role
        const validRoles: TeamRole[] = ["reviewer", "manager", "team_admin"];
        if (!validRoles.includes(role)) {
            set.status = 400;
            return { success: false, error: "Invalid role. Must be: reviewer, manager, or team_admin" };
        }

        try {
            const member = await prisma.teamMember.findUnique({
                where: {
                    user_id_team_id: { user_id: userId, team_id: id }
                }
            });

            if (!member) {
                set.status = 404;
                return { success: false, error: "Member not found in team" };
            }

            const updatedMember = await prisma.teamMember.update({
                where: { id: member.id },
                data: { role },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, picture: true }
                    }
                }
            });

            return {
                success: true,
                message: "Member role updated successfully",
                data: { member: updatedMember }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Update member role error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String(),
            userId: t.String()
        }),
        body: t.Object({
            role: t.String({ description: "Role: reviewer, manager, or team_admin" })
        }),
        detail: {
            summary: "Update Team Member Role",
            description: "Update a user's role in a team",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * GET /api/admin/teams/available-entities
     * Get list of entities that can be turned into teams
     */
    .get("/available-entities", async ({ set }: any) => {
        try {
            // Get existing team entity IDs
            const existingTeams = await prisma.team.findMany({
                select: { entity_id: true }
            });
            const existingIds = new Set(existingTeams.map(t => t.entity_id));

            // Filter out already-created teams
            const availableMinistries = MINISTRIES.filter(m => !existingIds.has(m.id));
            const availableGovernorates = GOVERNORATES.filter(g => !existingIds.has(g.id));

            return {
                success: true,
                data: {
                    ministries: availableMinistries,
                    governorates: availableGovernorates
                }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Get available entities error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            summary: "Get Available Entities",
            description: "Get list of ministries and governorates not yet assigned to teams",
            security: [{ bearerAuth: [] }]
        }
    })

    /**
     * GET /api/admin/teams/my-teams
     * Get teams where current user is a member
     */
    .get("/my-teams", async ({ user, set }: any) => {
        if (!user?.userId) {
            set.status = 401;
            return { success: false, error: "Not authenticated" };
        }

        try {
            const memberships = await prisma.teamMember.findMany({
                where: { user_id: user.userId },
                include: {
                    team: true
                }
            });

            // Enrich with display names
            const teams = memberships.map(m => {
                let displayName = m.team.entity_id;
                let displayNameAr = m.team.entity_id;

                if (m.team.type === "ministry") {
                    const ministry = getMinistryById(m.team.entity_id);
                    if (ministry) {
                        displayName = ministry.name;
                        displayNameAr = ministry.nameAr;
                    }
                } else if (m.team.type === "governorate") {
                    const gov = getGovernorateById(m.team.entity_id);
                    if (gov) {
                        displayName = gov.name;
                        displayNameAr = gov.nameAr;
                    }
                }

                return {
                    team: {
                        ...m.team,
                        displayName,
                        displayNameAr
                    },
                    role: m.role
                };
            });

            return {
                success: true,
                data: { teams }
            };
        } catch (error: any) {
            console.error("[TeamRoutes] Get my teams error:", error);
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            summary: "Get My Teams",
            description: "Get teams where the current user is a member with their role",
            security: [{ bearerAuth: [] }]
        }
    });
