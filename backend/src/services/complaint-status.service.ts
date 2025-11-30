import { IBlockchainService } from "../interfaces/blockchain.interface";
import { HederaService } from "./hedera.service";
import { HEDERA_CONFIG } from "../config/hedera.config";

interface StatusUpdate {
  complaintHash: string;
  oldStatus: string | null;
  newStatus: string;
  publicNotes?: string;
  adminId: string;
}

/*
 * Handles all complaint status operations.
 * Submits status updates to the blockchain for transparency.
*/

export class ComplaintStatusService {
  private blockchain: IBlockchainService;

  constructor(blockchain?: IBlockchainService) {
    this.blockchain = blockchain || new HederaService();
  }

  async createInitialStatus(complaintHash: string): Promise<void> {
    const statusPayload = {
      complaint_hash: complaintHash,
      old_status: null,
      new_status: "submitted",
      public_notes: "Complaint received and under review",
      admin_id: "system",
      timestamp: new Date().toISOString()
    };

    await this.blockchain.submitMessage(
      HEDERA_CONFIG.TOPIC_ID_STATUS,
      statusPayload
    );
  }

/*
  * Update complaint status (admin/editor action)
*/

  async updateStatus(update: StatusUpdate): Promise<{ transactionId: string }> {
    if (!HEDERA_CONFIG.TOPIC_ID_STATUS) {
      throw new Error("HEDERA_TOPIC_ID_STATUS is not configured");
    }

    const statusPayload = {
      complaint_hash: update.complaintHash,
      old_status: update.oldStatus,
      new_status: update.newStatus,
      public_notes: update.publicNotes || "",
      admin_id: update.adminId,
      timestamp: new Date().toISOString()
    };

    const response = await this.blockchain.submitMessage(
      HEDERA_CONFIG.TOPIC_ID_STATUS,
      statusPayload
    );

    return {
      transactionId: response.transactionId
    };
  }
}
