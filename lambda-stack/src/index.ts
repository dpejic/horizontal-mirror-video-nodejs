import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { S3Client } from "@aws-sdk/client-s3";
import {
  deleteS3Object,
  extractFileName,
  getS3ObjectBodyStream,
  processAndUploadStream,
  removeExtensionFromFileName,
  sqsSendEvent,
} from "./utils";

const sqsClient = new SQSClient({ region: process.env.CDK_DEFAULT_REGION });
const s3Client = new S3Client({ region: process.env.CDK_DEFAULT_REGION });

export const handler = async (event: any) => {
  const eventData = JSON.parse(JSON.stringify(event, null, 2));
  const records = eventData["Records"][0];
  const eventBody = JSON.parse(records.body);

  await sqsClient.send(
    new DeleteMessageCommand({
      QueueUrl: process.env.TRIGGER_PARALLEL_LAMBDA_QUEUE_URL,
      ReceiptHandle: records.receiptHandle,
    })
  );

  if (!eventBody.detail?.status) {
    return;
  }

  const status = eventBody.detail.status;
  if (status === "COMPLETE") {
    try {
      const fileName = extractFileName(eventBody);
      const convertedVideoFileName = removeExtensionFromFileName(
        fileName.replace(/\.[^/.]+$/, "")
      );
      await deleteS3Object(`video/${convertedVideoFileName}`, s3Client);

      const inputBody = await getS3ObjectBodyStream(fileName, s3Client);
      const mirroredFileName = `${convertedVideoFileName}-flipped.mp4`;

      await processAndUploadStream(inputBody, mirroredFileName, s3Client);
      await sqsSendEvent(sqsClient, mirroredFileName, status);

      await deleteS3Object(
        `video-finished/${convertedVideoFileName}.`,
        s3Client
      );
    } catch (err) {
      console.log(err);
    }
  }

  return true;
};
