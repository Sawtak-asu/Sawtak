import { Elysia } from "elysia";
import { IdentifiedComplaintController } from "../controllers/identified-complaint.controller";
import { authMiddleware } from "../middleware/auth.middleware";

// Initialize controller
const controller = new IdentifiedComplaintController();

export const identifiedComplaintRoutes = new Elysia({ prefix: "/api/complaints/identified" })
  .use(authMiddleware)
  /**
   * POST /api/complaints/identified/submit
   * Submit an identified (public) complaint to the database
   * 
   * Body:
   * {
   *   "userId": "user-id",
   *   "title": "Complaint title",
   *   "text": "Detailed description",
   *   "category": "corruption",
   *   "area": "ministry_of_health",
   *   "incidentDate": "2025-11-20",  // optional
   *   "evidenceUrls": ["https://..."] // optional, public URLs from Supabase
   * }
   */
  .post("/submit", async ({ body, set }: any) => {
    return controller.submitComplaint(body, set);
  })
  /**
   * GET /api/complaints/identified/user/:userId
   * Get all complaints for a specific user
   */
  .get("/user/:userId", async ({ params, set }: any) => {
    return controller.getUserComplaints(params.userId, set);
  });
