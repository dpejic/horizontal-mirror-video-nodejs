import { PassThrough, Readable } from "stream";
import { spawnFFMPEGProcess } from ".";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export const processAndUploadStream = async (
  inputBody: Readable,
  uploadFileName: string,
  s3Client: S3Client
): Promise<void> => {
  const ffmpeg = spawnFFMPEGProcess();

  inputBody.pipe(ffmpeg.stdin);

  const passThroughStream = new PassThrough();

  ffmpeg.stdout.pipe(passThroughStream);

  ffmpeg.on("error", (error: any, stdout: any, stderr: any) => {
    console.log(`ERROR: ${error}`);
    console.log(`STDOUT: ${stdout}`);
    console.log(`STDERR: ${stderr}`);
  });

  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.BUCKET_NAME,
      Key: `video-finished/${uploadFileName}`,
      Body: passThroughStream,
    },
    tags: [],
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
  });

  parallelUploads3.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });
  await parallelUploads3.done();
};
