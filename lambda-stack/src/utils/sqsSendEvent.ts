import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sqsSendEvent = async (
  client: SQSClient,
  fileName: string,
  status: "COMPLETE" | "ERROR"
) => {
  try {
    const statusErrorMap = {
      COMPLETE: "SUCCESS_UPLOAD",
      ERROR: "FAILED_UPLOAD",
    };

    const command = new SendMessageCommand({
      QueueUrl: process.env.NOTIFICATION_QUEUE_URL,
      MessageGroupId: "uploadGroup",
      MessageBody: JSON.stringify({
        message: statusErrorMap[status],
        id: fileName,
      }),
    });

    const result = await client.send(command);
    console.log("Successfully sent message", result.MessageId);
  } catch (err) {
    console.log("Error:", err);
    throw new Error("Failed to send SQS message");
  }
};
