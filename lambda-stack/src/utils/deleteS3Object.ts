import {
  DeleteObjectCommand,
  ListObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const deleteS3Object = async (key: string, s3Client: S3Client) => {
  const listObjectsResponse = await s3Client.send(
    new ListObjectsCommand({ Bucket: process.env.BUCKET_NAME, Prefix: key })
  );

  if (!listObjectsResponse || !listObjectsResponse.Contents) {
    throw new Error(`Could not find any file with prefix ${key}`);
  }

  const objectsToDelete = listObjectsResponse.Contents.filter((obj) =>
    obj.Key!.startsWith(key)
  );

  if (objectsToDelete.length === 0) {
    throw new Error("Could not find a file to delete.");
  }

  const input = {
    Bucket: process.env.BUCKET_NAME,
    Key: objectsToDelete[0].Key,
  };
  const command = new DeleteObjectCommand(input);
  await s3Client.send(command);
};
