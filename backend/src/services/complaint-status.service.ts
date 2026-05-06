import { IBlockchainService } from "../interfaces/blockchain.interface";
import { HederaService } from "./hedera.service";
import { SawtakCosmosService } from "./sawtak-cosmos.service";
import { HEDERA_CONFIG } from "../config/hedera.config";
import { COSMOS_CONFIG } from "../config/cosmos.config";

interface StatusUpdate {
  complaintHash: string;
  oldStatus: string | null;
  newStatus: string;
  publicNotes?: string;
  adminId: string;
}

/**
 * Determines which blockchain backend to use based on env config.
 * When COSMOS_CHAIN_ID is set, prefer Cosmos; otherwise fall back to Hedera.
 */
function getDefaultBlockchainService(): IBlockchainService {
  if (COSMOS_CONFIG.CHAIN_ID && COSMOS_CONFIG.BACKEND_MNEMONIC) {
    return new SawtakCosmosService();
  }
  return new HederaService();
}

/*
 * Handles all complaint status operations.
 * Submits status updates to the blockchain for transparency.
 *
 * Supports both Hedera and Cosmos blockchains side-by-side.
 * The active blockchain is determined by environment configuration.
 */

export class ComplaintStatusService {
  private blockchain: IBlockchainService;

  constructor(blockchain?: IBlockchainService) {
    this.blockchain = blockchain || getDefaultBlockchainService();
  }

  async createInitialStatus(complaintHash: string): Promise<void> {
    const statusPayload = {
      type: "STATUS_UPDATE",
      complaint_hash: complaintHash,
      old_status: null,
      new_status: "submitted",
      public_notes: "Complaint received and under review",
      admin_id: "system",
      timestamp: new Date().toISOString()
    };

    // Determine topicId based on active blockchain
    const topicId = this.blockchain instanceof SawtakCosmosService
      ? "status"
      : HEDERA_CONFIG.TOPIC_ID_STATUS;

    await this.blockchain.submitMessage(
      topicId,
      statusPayload
    );
  }

  /*
   * Update complaint status (admin/editor action)
   */

  async updateStatus(update: StatusUpdate): Promise<{ transactionId: string }> {
    const statusPayload = {
      type: "STATUS_UPDATE",
      complaint_hash: update.complaintHash,
      old_status: update.oldStatus,
      new_status: update.newStatus,
      public_notes: update.publicNotes || "",
      admin_id: update.adminId,
      timestamp: new Date().toISOString()
    };

    // Determine topicId based on active blockchain
    const topicId = this.blockchain instanceof SawtakCosmosService
      ? "status"
      : HEDERA_CONFIG.TOPIC_ID_STATUS;

    if (!topicId) {
      throw new Error("Blockchain topic ID for status updates is not configured");
    }

    const response = await this.blockchain.submitMessage(
      topicId,
      statusPayload
    );

    return {
      transactionId: response.transactionId
    };
  }
}
