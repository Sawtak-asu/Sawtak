export interface IBlockchainService {
  submitMessage(topicId: string, message: any): Promise<{ transactionId: string; consensusTimestamp: string }>;
}
