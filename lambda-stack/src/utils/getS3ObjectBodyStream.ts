import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const getS3ObjectBodyStream = async (
  fileName: string,
  s3Client: S3Client
): Promise<Readable> => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: `video-finished/${fileName}`,
  });

  const inputItem = await s3Client.send(command);

  if (!inputItem.Body) {
    throw new Error("Body doesn't exist.");
  }

  return inputItem.Body as Readable;
};
