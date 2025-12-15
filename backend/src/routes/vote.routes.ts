import { Elysia, t } from "elysia";
import { VoteService } from "../services/vote.service";
import { authMiddleware } from "../middleware/auth.middleware";

const voteService = new VoteService();

export const voteRoutes = new Elysia({ prefix: "/api/vote" })
  /**
   * POST /api/vote
   * Toggle upvote on a public identified complaint
   * Requires authentication
   */
  .post(
    "/",
    async ({ body, request, set }) => {
      try {
        const { complaintId } = body;

        // Get user from auth header (required)
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return {
            success: false,
            error: "Authentication required to vote",
            requiresLogin: true,
          };
        }

        // Decode JWT to get user ID
        let userId: string;
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString()
          );
          userId = payload.userId;
          if (!userId) {
            throw new Error("Invalid token");
          }
        } catch {
          set.status = 401;
          return {
            success: false,
            error: "Invalid authentication token",
            requiresLogin: true,
          };
        }

        const result = await voteService.toggleVote({
          complaintId,
          voterId: userId,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        console.error("[VoteRoutes] Error toggling vote:", error);

        // Handle specific errors
        if (error.message === "Complaint not found or is not public") {
          set.status = 404;
          return {
            success: false,
            error: error.message,
          };
        }

        // Handle unique constraint violation (shouldn't happen with toggle logic)
        if (error.code === "P2002") {
          set.status = 400;
          return {
            success: false,
            error: "You have already voted on this complaint",
          };
        }

        set.status = 500;
        return {
          success: false,
          error: error.message || "Failed to toggle vote",
        };
      }
    },
    {
      body: t.Object({
        complaintId: t.String(),
      }),
    }
  )

  /**
   * GET /api/vote/:complaintId
   * Get vote count for a specific complaint and check if current user has voted
   */
  .get(
    "/:complaintId",
    async ({ params, request }) => {
      try {
        const { complaintId } = params;

        const voteCount = await voteService.getVoteCount(complaintId);

        // Check if current user has voted (if authenticated)
        let hasVoted = false;
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(
              Buffer.from(token.split(".")[1], "base64").toString()
            );
            const userId = payload.userId;
            if (userId) {
              const votedSet = await voteService.checkUserVotes([complaintId], userId);
              hasVoted = votedSet.has(complaintId);
            }
          } catch {
            // Not authenticated or invalid token, that's fine
          }
        }

        return {
          success: true,
          data: {
            voteCount,
            hasVoted,
          },
        };
      } catch (error: any) {
        console.error("[VoteRoutes] Error getting vote count:", error);
        return {
          success: false,
          error: error.message || "Failed to get vote count",
        };
      }
    }
  )

  /**
   * GET /api/vote/status?complaintId=xxx
   * Get vote status for a specific complaint (query param version for easier frontend use)
   */
  .get(
    "/status",
    async ({ query, request }) => {
      try {
        const complaintId = query.complaintId;
        if (!complaintId) {
          return {
            success: false,
            error: "complaintId query parameter required",
          };
        }

        const voteCount = await voteService.getVoteCount(complaintId);

        // Check if current user has voted (if authenticated)
        let hasVoted = false;
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(
              Buffer.from(token.split(".")[1], "base64").toString()
            );
            const userId = payload.userId;
            if (userId) {
              const votedSet = await voteService.checkUserVotes([complaintId], userId);
              hasVoted = votedSet.has(complaintId);
            }
          } catch {
            // Not authenticated or invalid token, that's fine
          }
        }

        return {
          success: true,
          data: {
            voteCount,
            hasVoted,
          },
        };
      } catch (error: any) {
        console.error("[VoteRoutes] Error getting vote status:", error);
        return {
          success: false,
          error: error.message || "Failed to get vote status",
        };
      }
    }
  )

  /**
   * POST /api/vote/batch
   * Get vote counts for multiple complaints
   */
  .post(
    "/batch",
    async ({ body, request }) => {
      try {
        const { complaintIds } = body;

        // Get vote counts
        const countMap = await voteService.getVoteCountsBatch(complaintIds);

        // Check which ones the user has voted on (if authenticated)
        let votedSet = new Set<string>();
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(
              Buffer.from(token.split(".")[1], "base64").toString()
            );
            const userId = payload.userId;
            if (userId) {
              votedSet = await voteService.checkUserVotes(complaintIds, userId);
            }
          } catch {
            // Not authenticated or invalid token
          }
        }

        // Build response
        const result: Record<string, { voteCount: number; hasVoted: boolean }> = {};
        for (const complaintId of complaintIds) {
          result[complaintId] = {
            voteCount: countMap.get(complaintId) || 0,
            hasVoted: votedSet.has(complaintId),
          };
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        console.error("[VoteRoutes] Error getting batch votes:", error);
        return {
          success: false,
          error: error.message || "Failed to get vote counts",
        };
      }
    },
    {
      body: t.Object({
        complaintIds: t.Array(t.String()),
      }),
    }
  );
