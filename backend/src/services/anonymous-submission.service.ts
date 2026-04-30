import { encrypt } from "../utils/crypto.utils";
import { IBlockchainService } from "../interfaces/blockchain.interface";
import { HederaService } from "./hedera.service";
import { SawtakCosmosService } from "./sawtak-cosmos.service";
import { HEDERA_CONFIG } from "../config/hedera.config";
import { COSMOS_CONFIG } from "../config/cosmos.config";
import { ComplaintStatusService } from "./complaint-status.service";
import { DirectedTo } from "../data/egypt-locations";
import crypto from "crypto";

interface AnonymousSubmission {
  anonymousIdentifier: string;
  title: string;
  text: string;
  category: string;
  area?: string;
  directedTo?: DirectedTo;
  incidentDate?: Date;
  evidenceCids?: string[];
}

/**
 * Generates a user-friendly tracking code
 * Format: SAWTAK-XXXXXXXX (where X is alphanumeric)
 */
function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding similar chars (0, O, 1, I)
  let code = "SAWTAK-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Determines which blockchain backend to use based on env config.
 * When COSMOS_CHAIN_ID is set, prefer Cosmos; otherwise fall back to Hedera.
 */
function getDefaultBlockchainService(): IBlockchainService {
  if (COSMOS_CONFIG.CHAIN_ID && COSMOS_CONFIG.BACKEND_MNEMONIC) {
    console.log("[AnonymousSubmission] Using Cosmos blockchain backend");
    return new SawtakCosmosService();
  }
  console.log("[AnonymousSubmission] Using Hedera blockchain backend");
  return new HederaService();
}

/**
 * Handles anonymous complaint submissions to the blockchain.
 * Encrypts user identity before submitting to ensure privacy.
 *
 * Supports both Hedera and Cosmos blockchains side-by-side.
 * The active blockchain is determined by environment configuration.
 */
export class AnonymousSubmissionService {
  private blockchain: IBlockchainService;
  private statusService: ComplaintStatusService;

  constructor(blockchain?: IBlockchainService) {
    // Defaults to hedera (for now) — Cosmos is opt-in via env config
    this.blockchain = blockchain || getDefaultBlockchainService();
    this.statusService = new ComplaintStatusService(this.blockchain);
  }

  async submitAnonymousComplaint(payload: AnonymousSubmission) {
    // Generate a tracking code for the user
    const trackingCode = generateTrackingCode();

    // Encrypting anonID/wallet
    const encryptedAnonId = encrypt(payload.anonymousIdentifier);

    // Create a lookup hash from tracking code (so we can find this complaint later)
    const trackingHash = crypto
      .createHash("sha256")
      .update(trackingCode)
      .digest("hex")
      .substring(0, 16);

    // Public Payload (Blockchain) — identical format for both Hedera and Cosmos
    const publicPayload = {
      type: "COMPLAINT_SUBMISSION",
      anon_id: encryptedAnonId,
      tracking_hash: trackingHash, // Hashed tracking code for lookup
      title: payload.title,
      text: payload.text,
      category: payload.category,
      area: payload.area || null,
      directed_to: payload.directedTo || null,
      incident_date: payload.incidentDate ? payload.incidentDate.toISOString() : null,
      evidence: payload.evidenceCids || [],
      timestamp: new Date().toISOString(),
    };

    // Determine topicId based on active blockchain
    // Hedera uses HCS topic IDs; Cosmos uses semantic topic strings
    const topicId = this.blockchain instanceof SawtakCosmosService
      ? "complaints"
      : HEDERA_CONFIG.TOPIC_ID_COMPLAINTS;

    if (!topicId) {
      throw new Error("Blockchain topic ID is not configured");
    }

    // Submit complaint to blockchain
    const complaintResponse = await this.blockchain.submitMessage(
      topicId,
      publicPayload
    );

    // Create initial status using the status service
    // For Cosmos, we need to pass trackingHash as the complaint identifier (not tx hash)
    const complaintHash = complaintResponse.transactionId;
    const statusIdentifier = this.blockchain instanceof SawtakCosmosService
      ? trackingHash
      : complaintHash;
    await this.statusService.createInitialStatus(statusIdentifier);

    return {
      status: "submitted",
      transactionId: complaintHash,
      trackingCode: trackingCode, // Return tracking code to user (they must save this!)
    };
  }
}
