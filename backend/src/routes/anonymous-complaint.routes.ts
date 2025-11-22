import { Elysia } from "elysia";
import { AnonymousSubmissionService } from "../services/anonymous-submission.service";
import { authMiddleware } from "../middleware/auth.middleware";

const anonymousService = new AnonymousSubmissionService();

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
    try {
      const {
        userId,
        anonymousIdentifier,
        title,
        text,
        category,
        area,
        incidentDate,
        evidenceCids
      } = body;

      // Validate required fields
      if (!userId || !anonymousIdentifier || !title || !text || !category) {
        set.status = 400;
        return {
          success: false,
          error: "Missing required fields"
        };
      }

      // Submit to blockchain
      const result = await anonymousService.submitAnonymousComplaint({
        userId,
        anonymousIdentifier,
        title,
        text,
        category,
        area,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        evidenceCids: evidenceCids || []
      });

      return {
        success: true,
        message: "Anon complaint submitted successfully",
        transactionId: result.transactionId,
        status: result.status
      };
    } catch (error: any) {
      console.error("Submission error:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to submit"
      };
    }
  });
