import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { IBlockchainService } from "../interfaces/blockchain.interface";
import { COSMOS_CONFIG } from "../config/cosmos.config";
import {
  MsgSubmitAnonymousComplaint,
  MsgSubmitIdentifiedComplaint,
  MsgUpdateComplaintStatus,
} from "../../network/Sawtak/ts-client/sawtak.sawtak.v1/types/sawtak/sawtak/v1/tx";
import { msgTypes } from "../../network/Sawtak/ts-client/sawtak.sawtak.v1/registry";

type TopicId = "complaints" | "status" | "identified";

export class SawtakCosmosService implements IBlockchainService {
  private client: SigningStargateClient | null = null;
  private backendAddress: string = COSMOS_CONFIG.BACKEND_ADDRESS;
  private wallet: DirectSecp256k1HdWallet | null = null;

  async connect(): Promise<void> {
    if (!COSMOS_CONFIG.BACKEND_MNEMONIC) {
      throw new Error("COSMOS_BACKEND_MNEMONIC must be set");
    }

    const registry = new Registry(msgTypes);

    this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      COSMOS_CONFIG.BACKEND_MNEMONIC,
      { prefix: COSMOS_CONFIG.PREFIX }
    );

    const [{ address }] = await this.wallet.getAccounts();
    this.backendAddress = address;
    console.log(`[SawtakCosmosService] Backend address: ${this.backendAddress}`);

    this.client = await SigningStargateClient.connectWithSigner(
      COSMOS_CONFIG.RPC_ENDPOINT,
      this.wallet,
      { registry }
    );

    console.log(`[SawtakCosmosService] Connected to ${COSMOS_CONFIG.RPC_ENDPOINT}`);
  }

  async submitMessage(topicId: string, message: any): Promise<{
    transactionId: string;
    consensusTimestamp: string;
  }> {
    if (!this.client) {
      await this.connect();
    }

    const msg = this.mapToCosmosMessage(topicId as TopicId, message);
    const result = await this.client!.signAndBroadcast(
      this.backendAddress,
      [msg],
      "auto"
    );

    if (result.code !== 0) {
      throw new Error(`Cosmos tx failed: code=${result.code}, log=${result.rawLog}`);
    }

    return {
      transactionId: result.transactionHash,
      consensusTimestamp: result.height.toString(),
    };
  }

  private mapToCosmosMessage(topicId: TopicId, message: any) {
    switch (topicId) {
      case "complaints":
        return {
          typeUrl: "/sawtak.sawtak.v1.MsgSubmitAnonymousComplaint",
          value: MsgSubmitAnonymousComplaint.fromPartial({
            creator: this.backendAddress,
            trackingId: message.tracking_hash || "",
            title: message.title || "",
            text: message.text || "",
            category: message.category || "",
            area: message.area || "",
            directedTo: message.directed_to
              ? JSON.stringify(message.directed_to)
              : "",
            incidentDate: message.incident_date || "",
            evidence: Array.isArray(message.evidence)
              ? JSON.stringify(message.evidence)
              : message.evidence || "",
            proof: message.anon_id || message.encrypted_anon_id || "",
          }),
        };

      case "identified":
        return {
          typeUrl: "/sawtak.sawtak.v1.MsgSubmitIdentifiedComplaint",
          value: MsgSubmitIdentifiedComplaint.fromPartial({
            creator: this.backendAddress,
            trackingId: message.tracking_hash || message.user_id || "",
            title: message.title || "",
            text: message.text || "",
            category: message.category || "",
            area: message.area || "",
            directedTo: message.directed_to
              ? JSON.stringify(message.directed_to)
              : "",
            incidentDate: message.incident_date || "",
            evidence: Array.isArray(message.evidence)
              ? JSON.stringify(message.evidence)
              : message.evidence || "",
          }),
        };

      case "status":
        return {
          typeUrl: "/sawtak.sawtak.v1.MsgUpdateComplaintStatus",
          value: MsgUpdateComplaintStatus.fromPartial({
            creator: this.backendAddress,
            complaintId: message.complaint_hash || "",
            oldStatus: message.old_status || "",
            newStatus: message.new_status || "",
            publicNotes: message.public_notes || "",
          }),
        };

      default:
        // Default to anonymous complaint for unknown topic
        return {
          typeUrl: "/sawtak.sawtak.v1.MsgSubmitAnonymousComplaint",
          value: MsgSubmitAnonymousComplaint.fromPartial({
            creator: this.backendAddress,
            trackingId: message.tracking_hash || "",
            title: message.title || "",
            text: message.text || "",
            category: message.category || "",
            area: message.area || "",
            directedTo: message.directed_to
              ? JSON.stringify(message.directed_to)
              : "",
            incidentDate: message.incident_date || "",
            evidence: Array.isArray(message.evidence)
              ? JSON.stringify(message.evidence)
              : message.evidence || "",
            proof: message.anon_id || message.encrypted_anon_id || "",
          }),
        };
    }
  }

  getAddress(): string {
    return this.backendAddress;
  }
}