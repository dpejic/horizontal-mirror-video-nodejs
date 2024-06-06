import { FromSchema, JSONSchema } from 'json-schema-to-ts';

const GetMultipartPresignedUrlsBody = {
  type: 'object',
  properties: {
    bufferSize: { type: 'number' },
    mime: { type: 'string' },
  },
  required: ['bufferSize', 'mime'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const GetMultipartPresignedUrlsResponse = {
  type: 'object',
  properties: {
    partSignedUrlList: {
      type: 'array',
      items: { $ref: '#/definitions/PartSignedUrlObject' },
    },
    chunkSize: { type: 'number' },
    uploadId: { type: 'string' },
    fileName: { type: 'string' },
  },
  required: ['partSignedUrlList', 'chunkSize', 'uploadId', 'fileName'],
  definitions: {
    PartSignedUrlObject: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string' },
        PartNumber: { type: 'number' },
      },
      required: ['signedUrl', 'PartNumber'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export const GetMultipartPresignedUrlsSchema = {
  body: GetMultipartPresignedUrlsBody,
  response: {
    200: GetMultipartPresignedUrlsResponse,
  },
};

export type GetMultipartPresignedUrlsBodyType = FromSchema<typeof GetMultipartPresignedUrlsBody>;
export type GetMultipartPresignedUrlsResponseType = FromSchema<typeof GetMultipartPresignedUrlsResponse>;
