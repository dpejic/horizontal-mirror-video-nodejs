import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';

import {
  GetMultipartPresignedUrlsBodyType,
  GetMultipartPresignedUrlsSchema,
} from '../schemas/GetMultipartPresignedUrls.schema';
import { FinalizeMultipartBodyType, FinalizeMultipartSchema } from '../schemas/FinalizeMultipart.schema';
import {
  CreateGetPresignedUrlBodyType,
  CreateGetPresignedUrlSchema,
  CreatePutPresignedUrlBodyType,
  CreatePutPresignedUrlSchema,
  CreatePutPresignedUrlWithNameBodyType,
  CreatePutPresignedUrlWithNameSchema,
  GetChecksumHashBodyType,
  GetChecksumHashSchema,
} from '../schemas/CreatePresignedUrl.schema';
import { SseConnectionSchema } from '../schemas/SseConnection.schema';

const UploadController = async (server: FastifyInstance, options: FastifyPluginOptions) => {
  const uploadService = server.diContainer.resolve('uploadService');

  server.post(
    '/get-multipart-presigned-urls',
    { ...options, schema: GetMultipartPresignedUrlsSchema },
    async (request: FastifyRequest<{ Body: GetMultipartPresignedUrlsBodyType }>) => {
      return await uploadService.getMultipartPreSignedUrls(request.body);
    },
  );

  server.post(
    '/finalize-multipart',
    { ...options, schema: FinalizeMultipartSchema },
    async (request: FastifyRequest<{ Body: FinalizeMultipartBodyType }>) => {
      return await uploadService.finalizeMultipartUpload(request.body);
    },
  );

  server.post(
    '/presigned-url',
    { ...options, schema: CreatePutPresignedUrlSchema },
    async (request: FastifyRequest<{ Body: CreatePutPresignedUrlBodyType }>) => {
      return await uploadService.createPutPresignedUrl(request.body);
    },
  );

  server.post(
    '/presigned-url-by-name',
    { ...options, schema: CreatePutPresignedUrlWithNameSchema },
    async (request: FastifyRequest<{ Body: CreatePutPresignedUrlWithNameBodyType }>) => {
      return await uploadService.createPutPresignedUrlWithName(request.body);
    },
  );

  server.post(
    '/get-presigned-url',
    { ...options, schema: CreateGetPresignedUrlSchema },
    async (request: FastifyRequest<{ Body: CreateGetPresignedUrlBodyType }>) => {
      return await uploadService.createGetPresignedUrl(request.body);
    },
  );

  server.post(
    '/checksum-hash',
    { ...options, schema: GetChecksumHashSchema },
    async (request: FastifyRequest<{ Body: GetChecksumHashBodyType }>) => {
      return await uploadService.getChecksumHash(request.body);
    },
  );

  server.get(
    '/sse',
    {
      ...options,
      schema: SseConnectionSchema,
    },
    async (
      request: FastifyRequest<{
        Querystring: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const id = request.query.id;

      return await uploadService.sseSubscribe(request, reply, id);
    },
  );
};

export default UploadController;
