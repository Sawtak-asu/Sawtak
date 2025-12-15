import { IdentifiedComplaintService } from "../services/identified-complaint.service";
import { validateIdentifiedComplaint, sanitizeString } from "../validators/complaint.validator";

/**
 * Controller for handling identified (public) complaint submissions.
 * Separates HTTP handling from business logic.
 */
export class IdentifiedComplaintController {
  private complaintService: IdentifiedComplaintService;

  constructor() {
    this.complaintService = new IdentifiedComplaintService();
  }

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
        directedTo,
        incidentDate,
        evidenceUrls,
        visibility
      } = body;

      // Save to database via service
      const complaint = await this.complaintService.createComplaint({
        userId,
        title,
        text,
        category,
        area,
        directedTo,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        evidenceUrls: evidenceUrls || [],
        visibility: visibility || "public" // Default to public for identified complaints
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

      const complaints = await this.complaintService.getUserComplaints(userId);

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
