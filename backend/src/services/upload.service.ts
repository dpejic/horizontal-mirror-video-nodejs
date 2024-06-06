import * as _ from 'lodash';
import { BadRequestError } from 'http-errors-enhanced-cjs';

import { MultipartUploadResponseType } from '../types/MultipartUploadResponseType';
import { type S3 } from '../sdk/s3/s3';
import {
  CreateGetPresignedUrlBodyType,
  CreatePresignedUrlResponseType,
  CreatePutPresignedUrlBodyType,
  CreatePutPresignedUrlWithNameBodyType,
  GetChecksumHashBodyType,
  GetChecksumHashResponseType,
} from '../schemas/CreatePresignedUrl.schema';
import {
  GetMultipartPresignedUrlsBodyType,
  GetMultipartPresignedUrlsResponseType,
} from '../schemas/GetMultipartPresignedUrls.schema';
import { FinalizeMultipartBodyType, FinalizeMultipartResponseType } from '../schemas/FinalizeMultipart.schema';
import {
  calculateMultipartCountS3,
  isValidMediaFormat,
  convertToSeconds,
  generateFileName,
  createChecksumHash,
} from '../utils';
import { envServerSchema } from '../config/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { type SseDispatcherService } from './sseDispatcher.service';

export class UploadService {
  s3: S3;
  sseDispatcherService: SseDispatcherService;
  chunkSize: number;

  constructor({ s3, sseDispatcherService }: { s3: S3; sseDispatcherService: SseDispatcherService }) {
    this.s3 = s3;
    this.sseDispatcherService = sseDispatcherService;
    this.chunkSize = 10 * 1024 * 1024;

    this.initializeMultipartUpload = this.initializeMultipartUpload.bind(this);
    this.getMultipartPreSignedUrls = this.getMultipartPreSignedUrls.bind(this);
    this.finalizeMultipartUpload = this.finalizeMultipartUpload.bind(this);
    this.createPutPresignedUrl = this.createPutPresignedUrl.bind(this);
    this.createGetPresignedUrl = this.createGetPresignedUrl.bind(this);
    this.createPutPresignedUrlWithName = this.createPutPresignedUrlWithName.bind(this);
    this.sseSubscribe = this.sseSubscribe.bind(this);
  }

  async initializeMultipartUpload(mime: string): Promise<MultipartUploadResponseType> {
    try {
      isValidMediaFormat(mime);

      const fileName = generateFileName(mime);

      const multipartUpload = await this.s3.initializeMultipartUpload(
        envServerSchema.AWS_BUCKET,
        'video',
        fileName,
        mime,
      );

      if (!multipartUpload?.UploadId || !multipartUpload?.Key) {
        throw new Error('No upload id');
      }

      return { uploadId: multipartUpload.UploadId, fileName: fileName };
    } catch (err) {
      console.log(err);

      throw new BadRequestError('Bad request.');
    }
  }

  async getMultipartPreSignedUrls(
    body: GetMultipartPresignedUrlsBodyType,
  ): Promise<GetMultipartPresignedUrlsResponseType> {
    const { bufferSize, mime } = body;
    const { uploadId, fileName } = await this.initializeMultipartUpload(mime);

    const expireTime = convertToSeconds(2, 'd');
    const { numMultiparts, chunkSize } = calculateMultipartCountS3(bufferSize);

    const signedUrlsPromises: Promise<string>[] = [];
    try {
      for (let index = 0; index < numMultiparts; index++) {
        signedUrlsPromises.push(
          this.s3.uploadPart(envServerSchema.AWS_BUCKET, 'video', fileName, index + 1, uploadId, expireTime),
        );
      }

      const signedUrls = await Promise.all(signedUrlsPromises);

      const partSignedUrlList = signedUrls.map((signedUrl, index) => {
        return {
          signedUrl: signedUrl,
          PartNumber: index + 1,
        };
      });

      return { partSignedUrlList, chunkSize, uploadId, fileName };
    } catch (err) {
      console.log(err);

      if (uploadId) {
        await this.s3.abortMultipartUpload(envServerSchema.AWS_BUCKET, 'video', fileName, uploadId);
      }

      throw new BadRequestError('Failed finishing multipart upload.');
    }
  }

  async finalizeMultipartUpload(body: FinalizeMultipartBodyType): Promise<FinalizeMultipartResponseType> {
    const { uploadId, fileName, parts, checksum } = body;

    try {
      await this.s3.completeMultipart(envServerSchema.AWS_BUCKET, 'video', fileName, uploadId, parts);

      const response = await this.s3.getHeadObject(envServerSchema.AWS_BUCKET, 'video', fileName);
      const { ETag } = response;

      if (ETag !== `"${checksum}"`) {
        await this.s3.deleteObject(envServerSchema.AWS_BUCKET, 'video', fileName);

        throw new BadRequestError();
      }

      return { fileName };
    } catch (err) {
      console.log(err);

      if (uploadId) {
        await this.s3.abortMultipartUpload(envServerSchema.AWS_BUCKET, 'video', fileName, uploadId);
      }

      throw new BadRequestError('Failed finishing multipart upload.');
    }
  }

  async createPutPresignedUrl(body: CreatePutPresignedUrlBodyType): Promise<CreatePresignedUrlResponseType> {
    try {
      const { mime } = body;
      isValidMediaFormat(mime);

      const expireTime = convertToSeconds(2, 'd');

      const fileName = generateFileName(mime);

      const url = await this.s3.putPresignedUrl(envServerSchema.AWS_BUCKET, 'video', fileName, expireTime, mime);

      return { url, fileName };
    } catch (err) {
      console.log(err);
      throw new BadRequestError('Failed creating presigned url.');
    }
  }

  async createPutPresignedUrlWithName(
    body: CreatePutPresignedUrlWithNameBodyType,
  ): Promise<CreatePresignedUrlResponseType> {
    try {
      const { mime } = body;
      isValidMediaFormat(mime);

      const expireTime = convertToSeconds(2, 'd');

      const fileName = body.fileName;

      const url = await this.s3.putPresignedUrl(
        envServerSchema.AWS_BUCKET,
        'video-finished',
        fileName,
        expireTime,
        mime,
      );

      return { url, fileName };
    } catch (err) {
      console.log(err);
      throw new BadRequestError('Failed creating presigned url.');
    }
  }

  async createGetPresignedUrl(body: CreateGetPresignedUrlBodyType): Promise<CreatePresignedUrlResponseType> {
    try {
      const { fileName, folder } = body;

      const expireTime = convertToSeconds(30, 'm');

      const url = await this.s3.getPresignedUrl(envServerSchema.AWS_BUCKET, folder, fileName, expireTime);

      return { url };
    } catch (err) {
      console.log(err);
      throw new BadRequestError('Failed getting presigned url.');
    }
  }

  async getChecksumHash(body: GetChecksumHashBodyType): Promise<GetChecksumHashResponseType> {
    const hash = createChecksumHash(body.content);
    return { hash };
  }

  async sseSubscribe(request: FastifyRequest, reply: FastifyReply, id: string) {
    this.sseDispatcherService.connect(reply, id);

    request.raw.on('close', () => {
      this.sseDispatcherService.removeConnection(id);
    });
  }
}
