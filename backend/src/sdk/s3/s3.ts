import {
  AbortMultipartUploadCommand,
  AbortMultipartUploadCommandOutput,
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
  CompleteMultipartUploadCommandOutput,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { envServerSchema } from '../../config/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as _ from 'lodash';
import { PartsObject } from '../../schemas/FinalizeMultipart.schema';

export class S3 {
  S3Client: S3Client;

  constructor() {
    this.S3Client = new S3Client({
      region: envServerSchema.AWS_REGION,
      credentials: {
        accessKeyId: envServerSchema.AWS_ACCESS_KEY_ID,
        secretAccessKey: envServerSchema.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async getPresignedUrl(bucket: string, folderName: string, fileName: string, expireTime: number): Promise<string> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new GetObjectCommand({ Bucket: bucket, Key: filePath });

    return await getSignedUrl(this.S3Client, command, { expiresIn: expireTime });
  }

  async putPresignedUrl(
    bucket: string,
    folderName: string,
    fileName: string,
    expireTime: number,
    mime: string,
  ): Promise<string> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: mime,
    });

    return await getSignedUrl(this.S3Client, command, {
      expiresIn: expireTime,
      signableHeaders: new Set(['content-type']),
    });
  }

  async initializeMultipartUpload(
    bucket: string,
    folderName: string,
    fileName: string,
    mime: string,
  ): Promise<CreateMultipartUploadCommandOutput> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: mime,
    });

    return await this.S3Client.send(command);
  }

  async uploadPart(
    bucket: string,
    folderName: string,
    fileName: string,
    partNumber: number,
    uploadId: string,
    expireTime: number,
  ): Promise<string> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: filePath,
      PartNumber: partNumber,
      UploadId: uploadId,
    });

    return getSignedUrl(this.S3Client, command, { expiresIn: expireTime, signableHeaders: new Set(['content-type']) });
  }

  async completeMultipart(
    bucket: string,
    folderName: string,
    fileName: string,
    uploadId: string,
    parts: PartsObject[],
  ): Promise<CompleteMultipartUploadCommandOutput> {
    const filePath = this.getFilePath(folderName, fileName);

    const multipartParams: CompleteMultipartUploadCommandInput = {
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: _.orderBy(parts, ['PartNumber'], ['asc']),
      },
    };

    return await this.S3Client.send(new CompleteMultipartUploadCommand(multipartParams));
  }

  async abortMultipartUpload(
    bucket: string,
    folderName: string,
    fileName: string,
    uploadId: string,
  ): Promise<AbortMultipartUploadCommandOutput> {
    const filePath = this.getFilePath(folderName, fileName);

    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
    });

    return await this.S3Client.send(abortCommand);
  }

  async getHeadObject(bucket: string, folderName: string, fileName: string): Promise<HeadObjectCommandOutput> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new HeadObjectCommand({ Bucket: bucket, Key: filePath });

    return await this.S3Client.send(command);
  }

  async deleteObject(bucket: string, folderName: string, fileName: string): Promise<DeleteObjectCommandOutput> {
    const filePath = this.getFilePath(folderName, fileName);

    const command = new DeleteObjectCommand({ Bucket: bucket, Key: filePath });

    return await this.S3Client.send(command);
  }

  getFilePath(folderName: string, fileName: string): string {
    return `${folderName}/${fileName}`;
  }
}
