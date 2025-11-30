import { prisma } from "../db";
import { validateIdentifiedComplaint, sanitizeString } from "../validators/complaint.validator";

/**
 * Controller for handling identified (public) complaint submissions.
 * Separates HTTP handling from business logic.
 */
export class IdentifiedComplaintController {
  /**
   * Handle identified complaint submission
   */
  async submitComplaint(body: any, set: any) {
    try {
      // Validate input
      const validation = validateIdentifiedComplaint(body);
      if (!validation.isValid) {
        set.status = 400;
        return {
          success: false,
          error: validation.error
        };
      }

      const {
        userId,
        title,
        text,
        category,
        area,
        incidentDate,
        evidenceUrls
      } = body;

      // Save to database
      const complaint = await prisma.identifiedComplaint.create({
        data: {
          user_id: userId,
          title,
          text,
          category,
          area,
          incident_date: incidentDate ? new Date(incidentDate) : new Date(),
          evidence_urls: evidenceUrls || [],
          status: "submitted",
          visibility: "private" // Default to private
        }
      });

      return {
        success: true,
        message: "Identified complaint submitted successfully",
        data: {
          id: complaint.id,
          status: complaint.status,
          createdAt: complaint.created_at
        }
      };
    } catch (error: any) {
      console.error("[IdentifiedComplaintController] Submission error:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to submit identified complaint"
      };
    }
  }

  /**
   * Get user's identified complaints
   */
  async getUserComplaints(userId: string, set: any) {
    try {
      if (!userId) {
        set.status = 400;
        return {
          success: false,
          error: "Missing userId parameter"
        };
      }

      const complaints = await prisma.identifiedComplaint.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" }
      });

      return {
        success: true,
        data: complaints
      };
    } catch (error: any) {
      console.error("[IdentifiedComplaintController] Fetch error:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to fetch complaints"
      };
    }
  }
}
