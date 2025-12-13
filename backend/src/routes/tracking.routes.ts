import { Elysia } from "elysia";
import { prisma } from "../db";
import crypto from "crypto";

/**
 * Tracking Routes
 * 
 * Allows users to track anonymous complaints using their tracking code.
 * The tracking code is generated at submission time and not linked to any user.
 */
export const trackingRoutes = new Elysia({ prefix: "/api/track" })

  /**
   * GET /api/track/:code
   * Look up a complaint by its tracking code
   * 
   * For anonymous complaints, the tracking code is stored in the blockchain message.
   * For identified complaints, it's stored in the database.
   */
  .get("/:code", async ({ params, set }) => {
    const { code } = params;

    if (!code || code.length < 8) {
      set.status = 400;
      return { success: false, error: "Invalid tracking code" };
    }

    try {
      // Hash the tracking code to search for it
      const trackingHash = crypto
        .createHash("sha256")
        .update(code.toUpperCase())
        .digest("hex")
        .substring(0, 16);

      // Search in indexed complaints by tracking hash first
      let anonymous = await prisma.indexedComplaint.findFirst({
        where: { tracking_hash: trackingHash },
      });

      // Fallback: search by partial hash/ID match
      if (!anonymous) {
        anonymous = await prisma.indexedComplaint.findFirst({
          where: {
            OR: [
              { hcs_hash: { contains: code } },
              { anonymous_identifier: { contains: code } },
            ],
          },
        });
      }

      if (anonymous) {
        return {
          success: true,
          data: {
            found: true,
            type: "anonymous",
            complaint: {
              id: anonymous.hcs_hash,
              title: anonymous.title,
              category: anonymous.category,
              area: anonymous.area,
              status: anonymous.status,
              createdAt: anonymous.consensus_timestamp.toISOString(),
              incidentDate: anonymous.incident_date?.toISOString(),
            },
            // Don't expose sensitive data
            message: "Complaint found. Status tracking is available.",
          },
        };
      }

      // Search in identified complaints by ID prefix
      const identified = await prisma.identifiedComplaint.findFirst({
        where: {
          id: { startsWith: code },
          deleted_at: null,
        },
      });

      if (identified) {
        return {
          success: true,
          data: {
            found: true,
            type: "identified",
            complaint: {
              id: identified.id,
              title: identified.title,
              category: identified.category,
              area: identified.area,
              status: identified.status,
              createdAt: identified.created_at.toISOString(),
              incidentDate: identified.incident_date?.toISOString(),
            },
            message: "Complaint found. Status tracking is available.",
          },
        };
      }

      return {
        success: true,
        data: {
          found: false,
          message: "No complaint found with this tracking code. Please check and try again.",
        },
      };
    } catch (error: any) {
      console.error("[TrackingRoutes] Error:", error);
      set.status = 500;
      return { success: false, error: "Failed to look up tracking code" };
    }
  })

  /**
   * GET /api/track/:code/history
   * Get status update history for a complaint
   */
  .get("/:code/history", async ({ params, set }) => {
    const { code } = params;

    try {
      // For now, just return the current status
      // TODO: Implement status history from IndexedStatusUpdate table
      const statusUpdates = await prisma.indexedStatusUpdate.findMany({
        where: {
          complaint_hash: { contains: code },
        },
        orderBy: { consensus_timestamp: "desc" },
      });

      return {
        success: true,
        data: {
          history: statusUpdates.map((u: any) => ({
            oldStatus: u.old_status,
            newStatus: u.new_status,
            notes: u.public_notes,
            timestamp: u.consensus_timestamp.toISOString(),
          })),
        },
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  });
