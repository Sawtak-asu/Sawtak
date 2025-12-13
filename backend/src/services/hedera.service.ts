import { Client, TopicMessageSubmitTransaction, PrivateKey } from "@hashgraph/sdk";
import { IBlockchainService } from "../interfaces/blockchain.interface";

export class HederaService implements IBlockchainService {
  private client: Client;

  constructor() {
    const accountId = process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID;
    let privateKeyString = process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY;

    if (!accountId || !privateKeyString) {
      throw new Error("HEDERA_ACCOUNT_ID (or HEDERA_OPERATOR_ID) and HEDERA_PRIVATE_KEY (or HEDERA_OPERATOR_KEY) must be set in environment variables");
    }

    // Handle different key formats
    let privateKey: PrivateKey;
    try {
      // Remove 0x prefix if present for ECDSA keys
      if (privateKeyString.startsWith("0x")) {
        privateKeyString = privateKeyString.slice(2);
        privateKey = PrivateKey.fromStringECDSA(privateKeyString);
        console.log("[HederaService] Using ECDSA key format");
      } else if (privateKeyString.length === 64) {
        // Raw 32-byte hex without prefix - try ECDSA first
        try {
          privateKey = PrivateKey.fromStringECDSA(privateKeyString);
          console.log("[HederaService] Using raw ECDSA key");
        } catch {
          privateKey = PrivateKey.fromStringED25519(privateKeyString);
          console.log("[HederaService] Using raw ED25519 key");
        }
      } else {
        // Standard format (DER encoded)
        privateKey = PrivateKey.fromString(privateKeyString);
        console.log("[HederaService] Using standard key format");
      }
    } catch (error: any) {
      console.error("[HederaService] Failed to parse private key:", error.message);
      throw new Error(`Invalid Hedera private key format: ${error.message}`);
    }

    // Default to Testnet with timeout configuration
    this.client = Client.forTestnet();
    this.client.setOperator(accountId, privateKey);

    // Set request timeout to 30 seconds to prevent hanging
    this.client.setRequestTimeout(30000);
    
    // Set max attempts for transaction retries
    this.client.setMaxAttempts(5);
    
    // Set max node attempts to try different nodes on failure
    this.client.setMaxNodeAttempts(3);
    
    console.log(`[HederaService] Initialized for account ${accountId} on testnet`);
  }

  async submitMessage(topicId: string, message: any): Promise<{ transactionId: string; consensusTimestamp: string }> {
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);

      // Create and execute the transaction
      // The SDK will automatically handle transaction timing
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(messageString);

      // Execute with automatic retry on different nodes
      const txResponse = await transaction.execute(this.client);

      // Get receipt to ensure the transaction reached consensus
      const receipt = await txResponse.getReceipt(this.client);

      return {
        transactionId: txResponse.transactionId.toString(),
        consensusTimestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error("Hedera Submit Error:", error);
      throw new Error(`Failed to submit to Hedera: ${error.message}`);
    }
  }
}
