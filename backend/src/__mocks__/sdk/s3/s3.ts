import {
  CompleteMultipartUploadCommandOutput,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandOutput,
} from '@aws-sdk/client-s3';
import { S3 } from '../../../sdk/s3/s3';
import { PartsObject } from '../../../schemas/FinalizeMultipart.schema';

export class S3Mock extends S3 {
  async getPresignedUrl(bucket: string, folderName: string, fileName: string, expireTime: number) {
    return Promise.resolve('test');
  }

  async putPresignedUrl(
    bucket: string,
    folderName: string,
    fileName: string,
    expireTime: number,
    mime: string,
  ): Promise<string> {
    return Promise.resolve('puturl');
  }

  async initializeMultipartUpload(
    bucket: string,
    folderName: string,
    fileName: string,
    mime: string,
  ): Promise<CreateMultipartUploadCommandOutput> {
    return Promise.resolve({
      UploadId: 'testId',
      Key: 'filename',
      $metadata: {},
    });
  }

  async uploadPart(
    bucket: string,
    folderName: string,
    fileName: string,
    partNumber: number,
    uploadId: string,
    expireTime: number,
  ): Promise<string> {
    return Promise.resolve('fsafas');
  }

  async completeMultipart(
    bucket: string,
    folderName: string,
    fileName: string,
    uploadId: string,
    parts: PartsObject[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return Promise.resolve({});
  }

  async abortMultipartUpload(
    bucket: string,
    folderName: string,
    fileName: string,
    uploadId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return Promise.resolve({});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getHeadObject(bucket: string, folderName: string, fileName: string): Promise<any> {
    return Promise.resolve('"481024ncjn1401842njdsljn1490u"');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteObject(bucket: string, folderName: string, fileName: string): Promise<any> {
    return Promise.resolve({});
  }

  getFilePath(folderName: string, fileName: string): string {
    return `${folderName}/${fileName}`;
  }
}
