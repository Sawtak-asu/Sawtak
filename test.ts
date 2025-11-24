import { 
    Client, 
    TopicMessageSubmitTransaction, 
    AccountId, 
    PrivateKey 
  } from "@hiero-ledger/sdk"; // Using Hiero SDK as requested
  import dotenv from "dotenv";
  
  // Load environment variables from backend/.env
  dotenv.config({ path: "backend/.env" });
  
  /**
   * SERVICE DEFINITION
   * (Included here for easy testing. In your real app, import this from services/)
   */
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
  
      // Handle "testnet" vs "mainnet" string, or custom client
      this.client = Client.forName(network);
      
      // Handle potential DER prefix in keys
      let key;
      if (operatorKey.startsWith("302e")) {
          key = PrivateKey.fromStringDer(operatorKey);
      } else {
          key = PrivateKey.fromString(operatorKey);
      }
  
      this.client.setOperator(
        AccountId.fromString(operatorId),
        key
      );
    }
  
    async submitAnonymousComplaint(data: {
      userId: string;
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
  
        console.log(`\n🚀 Submitting payload to topic ${this.topicId}...`);
  
        const transaction = new TopicMessageSubmitTransaction()
          .setTopicId(this.topicId)
          .setMessage(JSON.stringify(publicPayload));
  
        const txResponse = await transaction.execute(this.client);
  
        const receipt = await txResponse.getReceipt(this.client);
  
        console.log("✅ Transaction Success!");
  
        return {
          transactionId: txResponse.transactionId.toString(),
          // FIX APPLIED HERE: Handle potential null
          topicSequenceNumber: receipt.topicSequenceNumber?.toString() || "0",
          status: receipt.status.toString(),
          success: true
        };
  
      } catch (error: any) {
        console.error("❌ Hedera Submission Failed:", error);
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