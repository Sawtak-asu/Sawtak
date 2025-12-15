import { encrypt } from "../utils/crypto.utils";
import { IBlockchainService } from "../interfaces/blockchain.interface";
import { HederaService } from "./hedera.service";
import { HEDERA_CONFIG } from "../config/hedera.config";
import { ComplaintStatusService } from "./complaint-status.service";
import { DirectedTo } from "../data/egypt-locations";
import crypto from "crypto";

interface AnonymousSubmission {
  userId: string;
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
 * Handles anonymous complaint submissions to the blockchain.
 * Encrypts user identity before submitting to ensure privacy.
 */
export class AnonymousSubmissionService {
  private blockchain: IBlockchainService;
  private statusService: ComplaintStatusService;

  constructor(blockchain?: IBlockchainService) {
    // Defaults to hedera (for now)
    this.blockchain = blockchain || new HederaService();
    this.statusService = new ComplaintStatusService(this.blockchain);
  }

  async submitAnonymousComplaint(payload: AnonymousSubmission) {
    if (!HEDERA_CONFIG.TOPIC_ID_COMPLAINTS) {
      throw new Error("HEDERA_TOPIC_ID_COMPLAINTS is not configured");
    }

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

    // Public Payload (Blockchain)
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

    // Submit complaint to blockchain
    const complaintResponse = await this.blockchain.submitMessage(
      HEDERA_CONFIG.TOPIC_ID_COMPLAINTS,
      publicPayload
    );

    // Create initial status using the status service
    const complaintHash = complaintResponse.transactionId;
    await this.statusService.createInitialStatus(complaintHash);

    return {
      status: "submitted",
      transactionId: complaintHash,
      trackingCode: trackingCode, // Return tracking code to user (they must save this!)
    };
  }
}

