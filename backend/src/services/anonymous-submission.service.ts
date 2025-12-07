import { encrypt } from "../utils/crypto.utils";
import { IBlockchainService } from "../interfaces/blockchain.interface";
import { HederaService } from "./hedera.service";
import { HEDERA_CONFIG } from "../config/hedera.config";
import { ComplaintStatusService } from "./complaint-status.service";

interface AnonymousSubmission {
  userId: string;
  anonymousIdentifier: string;
  title: string;
  text: string;
  category: string;
  area?: string;
  incidentDate?: Date;
  evidenceCids?: string[];
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

    // Encrypting anonID/wallet
    const encryptedAnonId = encrypt(payload.anonymousIdentifier);

    // Public Payload (Blockchain)
    const publicPayload = {
      type: "COMPLAINT_SUBMISSION",
      anon_id: encryptedAnonId,
      title: payload.title,
      text: payload.text,
      category: payload.category,
      area: payload.area || null,
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
      transactionId: complaintHash
    };
  }
}
