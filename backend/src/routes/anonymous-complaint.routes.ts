import { Elysia } from "elysia";
import { AnonymousComplaintController } from "../controllers/anonymous-complaint.controller";
import { authMiddleware } from "../middleware/auth.middleware";

// Initialize controller
const controller = new AnonymousComplaintController();

export const anonymousComplaintRoutes = new Elysia({ prefix: "/api/complaints/anonymous" })
  .use(authMiddleware)
  /**
   * POST /api/complaints/anonymous/submit
   * Submit an anonymous complaint to the blockchain
   * 
   * Body:
   * {
   *   "userId": "user-id",
   *   "anonymousIdentifier": "anon_abc123",
   *   "title": "Complaint title",
   *   "text": "Detailed description",
   *   "category": "corruption",
   *   "area": "shobra",  // optional
   *   "incidentDate": "2025-11-20",  // optional
   *   "evidenceCids": ["Qm...", "xdxd..."]       // optional, IPFS CIDs
   * }
   */
  .post("/submit", async ({ body, set }: any) => {
    return controller.submitComplaint(body, set);
  });
