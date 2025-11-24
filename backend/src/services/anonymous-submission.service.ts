import { 
    Client, 
    TopicMessageSubmitTransaction, 
    AccountId, 
    PrivateKey 
  } from "@hiero-ledger/sdk"; 

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
export class AnonymousSubmissionService {
  private client: Client;
  private topicId: string;

  constructor() {
    const network = process.env.HEDERA_NETWORK || "mainnet";
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    this.topicId = process.env.HEDERA_TOPIC_COMPLAINTS!;

    if (!operatorId || !operatorKey || !this.topicId) {
      throw new Error("Missing required Hedera environment variables (ID, KEY, or TOPIC).");
    }

    this.client = Client.forName(network);
    this.client.setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromString(operatorKey)
    );
  }

  /**
   * Submit an anonymous complaint to the Hedera network.
   * * @param data - The complaint data
   * @returns The transaction receipt and status
   */
  async submitAnonymousComplaint(data: {
    userId: string; // internal tracking only NOT sent to HCS
    anonymousIdentifier: string;
    title: string;
    text: string;
    category: string;
    area?: string;
    incidentDate?: Date;
    evidenceCids: string[];
  }) {
    try {
      const publicPayload = {
        type: "COMPLAINT_SUBMISSION",
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          id: data.anonymousIdentifier, 
          title: data.title,
          description: data.text,
          category: data.category,
          location: data.area || null,
          incidentDate: data.incidentDate ? data.incidentDate.toISOString() : null,
          evidence: data.evidenceCids, 
        }
      };

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(JSON.stringify(publicPayload));

      const txResponse = await transaction.execute(this.client);

      const receipt = await txResponse.getReceipt(this.client);

      return {
        transactionId: txResponse.transactionId.toString(),
        topicSequenceNumber: receipt.topicSequenceNumber!.toString(),
        status: receipt.status.toString(),
        success: true
      };

    } catch (error: any) {
      console.error("Hedera Submission Failed:", error);
      throw new Error(`Failed to write complaint to Hedera: ${error.message}`);
    }
  }
}



/**
 * TEST RUNNER
 */
async function main() {
  console.log("Starting Sawtak Submission Test...");

  try {
      const service = new AnonymousSubmissionService();

      // Mock Data
      const mockComplaint = {
          userId: "internal-user-123", // This won't be sent to Hedera
          anonymousIdentifier: "anon_test_user_001",
          title: "Test Complaint from Script",
          text: "This is a test complaint submitted via the manual test script to verify HCS integration.",
          category: "corruption",
          area: "Maadi, Cairo",
          incidentDate: new Date(),
          evidenceCids: ["QmHash123", "QmHash456"]
      };

      const result = await service.submitAnonymousComplaint(mockComplaint);

      console.log("\n--- RESULT ---");
      console.log(JSON.stringify(result, null, 2));
      
      // Link to explorer (hashscan)
      console.log(`\n🔎 Verify on HashScan: https://hashscan.io/testnet/transaction/${result.transactionId}`);

  } catch (e) {
      console.error("Test failed to run:", e);
  }
  
  process.exit(0);
}

main();