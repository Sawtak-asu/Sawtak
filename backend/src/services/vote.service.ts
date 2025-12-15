import { prisma } from "../db";

export interface VotePayload {
  complaintId: string;
  voterId: string; // User ID (required - must be logged in)
}

export interface VoteResult {
  success: boolean;
  voteCount: number;
  hasVoted: boolean;
}

export class VoteService {
  /**
   * Toggle a vote on a public identified complaint (upvote/remove upvote)
   */
  async toggleVote(payload: VotePayload): Promise<VoteResult> {
    const { complaintId, voterId } = payload;

    // Verify the complaint exists and is public
    const complaint = await prisma.identifiedComplaint.findFirst({
      where: {
        id: complaintId,
        visibility: "public",
        deleted_at: null,
      },
    });

    if (!complaint) {
      throw new Error("Complaint not found or is not public");
    }

    // Check if user has already voted
    const existingVote = await prisma.complaintVote.findUnique({
      where: {
        complaint_id_voter_id: {
          complaint_id: complaintId,
          voter_id: voterId,
        },
      },
    });

    if (existingVote) {
      // Remove the vote
      await prisma.complaintVote.delete({
        where: { id: existingVote.id },
      });
    } else {
      // Add the vote
      await prisma.complaintVote.create({
        data: {
          complaint_id: complaintId,
          voter_id: voterId,
        },
      });
    }

    // Get updated vote count
    const voteCount = await this.getVoteCount(complaintId);
    const hasVoted = !existingVote; // If they had a vote, they no longer do

    return {
      success: true,
      voteCount,
      hasVoted,
    };
  }

  /**
   * Get vote count for a specific complaint
   */
  async getVoteCount(complaintId: string): Promise<number> {
    return prisma.complaintVote.count({
      where: {
        complaint_id: complaintId,
      },
    });
  }

  /**
   * Get vote counts for multiple complaints in one query
   */
  async getVoteCountsBatch(complaintIds: string[]): Promise<Map<string, number>> {
    if (complaintIds.length === 0) {
      return new Map();
    }

    const votes = await prisma.complaintVote.groupBy({
      by: ["complaint_id"],
      where: {
        complaint_id: { in: complaintIds },
      },
      _count: {
        id: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const vote of votes) {
      countMap.set(vote.complaint_id, vote._count.id);
    }

    return countMap;
  }

  /**
   * Check if a specific user has voted on complaints
   */
  async checkUserVotes(complaintIds: string[], voterId: string): Promise<Set<string>> {
    if (complaintIds.length === 0) {
      return new Set();
    }

    const votes = await prisma.complaintVote.findMany({
      where: {
        complaint_id: { in: complaintIds },
        voter_id: voterId,
      },
      select: {
        complaint_id: true,
      },
    });

    return new Set(votes.map((v) => v.complaint_id));
  }
}
