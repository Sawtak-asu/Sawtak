import { AnonymousSubmissionService } from "../services/anonymous-submission.service";
import { validateAnonymousComplaint, sanitizeString } from "../validators/complaint.validator";

export class AnonymousComplaintController {
  private submissionService: AnonymousSubmissionService;

  constructor(submissionService?: AnonymousSubmissionService) {
    this.submissionService = submissionService || new AnonymousSubmissionService();
  }

  /**
   * Handle anonymous complaint submission
   */
  async submitComplaint(body: any, set: any) {
    try {
      // Validate input
      const validation = validateAnonymousComplaint(body);
      if (!validation.isValid) {
        set.status = 400;
        return {
          success: false,
          error: validation.error
        };
      }

      const {
        userId,
        anonymousIdentifier,
        title,
        text,
        category,
        area,
        directedTo,
        incidentDate,
        evidenceCids
      } = body;

      // Submit to blockchain via service
      const result = await this.submissionService.submitAnonymousComplaint({
        userId,
        anonymousIdentifier,
        title,
        text,
        category,
        area,
        directedTo,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        evidenceCids: evidenceCids || []
      });

      return {
        success: true,
        message: "Anonymous complaint submitted successfully",
        data: {
          transactionId: result.transactionId,
          status: result.status,
          trackingCode: result.trackingCode // Include tracking code for user to save
        }
      };
    } catch (error: any) {
      console.error("[AnonymousComplaintController] Submission error:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to submit anonymous complaint"
      };
    }
  }
}
