import { Elysia, t } from "elysia";
import { IdentifiedComplaintController } from "../controllers/identified-complaint.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { prisma } from "../db";

// Initialize controller
const controller = new IdentifiedComplaintController();

export const identifiedComplaintRoutes = new Elysia({
  prefix: "/api/complaints/identified",
  detail: {
    tags: ["Identified Complaints"],
    description: "Submit identified complaints linked to user account for direct follow-up"
  }
})
  .use(authMiddleware)
  /**
   * POST /api/complaints/identified/submit
   * Submit an identified complaint to the database
   */
  .post("/submit", async ({ body, set, user }: any) => {
    // 1. Authenticate and authorize
    if (!user || !user.userId) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    if (body.userId !== user.userId) {
      set.status = 403;
      return { success: false, error: "Cannot submit complaint for another user" };
    }

    // 2. Check strict blocking status from DB (fresh check)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { is_blocked: true }
    });

    if (dbUser?.is_blocked) {
      set.status = 403;
      return { success: false, error: "You are blocked from creating complaints" };
    }

    return controller.submitComplaint(body, set);
  }, {
    body: t.Object({
      userId: t.String({
        description: "User ID of the complaint submitter"
      }),
      title: t.String({
        description: "Brief title of the complaint",
        minLength: 5,
        maxLength: 200
      }),
      text: t.String({
        description: "Detailed description of the complaint",
        minLength: 20,
        maxLength: 10000
      }),
      category: t.String({
        description: "Complaint category (corruption, harassment, fraud, etc.)"
      }),
      area: t.Optional(t.String({
        description: "Geographic area where the incident occurred"
      })),
      directedTo: t.Optional(t.Object({
        type: t.String({ description: "Target type: ministry, governorate, or center" }),
        ministryId: t.Optional(t.String()),
        governorateId: t.Optional(t.String()),
        centerId: t.Optional(t.String())
      }, { description: "Optional: Direct complaint to specific authority" })),
      incidentDate: t.Optional(t.String({
        description: "Date of incident (ISO 8601 format)"
      })),
      evidenceUrls: t.Optional(t.Array(t.String(), {
        description: "Array of public URLs for uploaded evidence"
      })),
      visibility: t.Optional(t.Union([
        t.Literal("public"),
        t.Literal("private")
      ], {
        default: "public",
        description: "Visibility: 'public' (visible in feed) or 'private' (admin only)"
      }))
    }),
    detail: {
      summary: "Submit Identified Complaint",
      description: `Submit a complaint linked to your user account. This allows authorities to follow up directly with you.

**Features:**
- Linked to your account for direct communication
- Can be public (visible in feed) or private (admin only)
- Supports evidence attachments
- Admins can see your identity for follow-up

**Note:** Your personal information is encrypted at rest (AES-256).`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Complaint successfully submitted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "Complaint UUID" },
                      status: { type: "string", description: "Initial status (submitted)" },
                      visibility: { type: "string" },
                      createdAt: { type: "string" }
                    }
                  },
                  message: { type: "string" }
                }
              }
            }
          }
        },
        400: { description: "Invalid request body" },
        401: { description: "Authentication required" },
        429: { description: "Rate limit exceeded (20 identified complaints per hour)" },
        500: { description: "Database error" }
      }
    }
  })

  /**
   * GET /api/complaints/identified/user/:userId
   * Get all complaints for a specific user
   */
  .get("/user/:userId", async ({ params, set }: any) => {
    return controller.getUserComplaints(params.userId, set);
  }, {
    params: t.Object({
      userId: t.String({ description: "User ID to fetch complaints for" })
    }),
    detail: {
      summary: "Get User Complaints",
      description: "Retrieve all identified complaints submitted by a specific user. User must be authenticated and can only view their own complaints.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "List of user's complaints",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        category: { type: "string" },
                        status: { type: "string" },
                        visibility: { type: "string" },
                        createdAt: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Authentication required" },
        403: { description: "Cannot view other users' complaints" }
      }
    }
  });
