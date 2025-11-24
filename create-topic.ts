import { Client, TopicCreateTransaction, AccountId, PrivateKey } from "@hiero-ledger/sdk";
import dotenv from "dotenv";

dotenv.config();
async function main() {
    const op_id = process.env.HEDERA_OPERATOR_ID as string;
    const op_k = process.env.HEDERA_OPERATOR_KEY as string;

    const client = Client.forTestnet();
    client.setOperator(
        AccountId.fromString(op_id),
        PrivateKey.fromString(op_k)
    );

    const transaction = new TopicCreateTransaction()
        .setTopicMemo("HEDERA_TOPIC_STATUS");

    const txResponse = await transaction.execute(client);
    
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(topicId?.toString());

    process.exit(0);
}

main();