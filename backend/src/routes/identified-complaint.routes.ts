import { Elysia } from "elysia";
import { prisma } from "../db";

export const identifiedComplaintRoutes = new Elysia({ prefix: "/api/complaints/identified" })
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
    try {
      const {
        userId,
        title,
        text,
        category,
        area,
        incidentDate,
        evidenceUrls
      } = body;

      // Validate required fields
      if (!userId || !title || !text || !category) {
        set.status = 400;
        return {
          success: false,
          error: "Missing required fields: userId, title, text, category"
        };
      }

      // Save to db
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
        complaint: {
          id: complaint.id,
          status: complaint.status,
          createdAt: complaint.created_at
        }
      };
    } catch (error: any) {
      console.error("Identified submission error:", error);
      set.status = 500;
      return {
        success: false,
        error: error.message || "Failed to submit identified complaint"
      };
    }
  });
