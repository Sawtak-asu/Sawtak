import { Client, TopicMessageSubmitTransaction, PrivateKey } from "@hashgraph/sdk";
import { IBlockchainService } from "../interfaces/blockchain.interface";

export class HederaService implements IBlockchainService {
  private client: Client;

  constructor() {
    const accountId = process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID;
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY;

    if (!accountId || !privateKeyString) {
      throw new Error("HEDERA_ACCOUNT_ID (or HEDERA_OPERATOR_ID) and HEDERA_PRIVATE_KEY (or HEDERA_OPERATOR_KEY) must be set in environment variables");
    }

    const privateKey = PrivateKey.fromString(privateKeyString);

    // Default to Testnet with timeout configuration
    this.client = Client.forTestnet();
    this.client.setOperator(accountId, privateKey);

    // Set request timeout to 30 seconds to prevent hanging
    this.client.setRequestTimeout(30000);
  }

  async submitMessage(topicId: string, message: any): Promise<{ transactionId: string; consensusTimestamp: string }> {
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(messageString);

      const txResponse = await transaction.execute(this.client);

      // Get receipt to ensure the transaction reached consensus
      await txResponse.getReceipt(this.client);

      return {
        transactionId: txResponse.transactionId.toString(),
        // We return local time here. The authoritative consensus timestamp 
        // will be picked up by the Indexer from the Mirror Node.
        consensusTimestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error("Hedera Submit Error:", error);
      throw new Error(`Failed to submit to Hedera: ${error.message}`);
    }
  }
}
