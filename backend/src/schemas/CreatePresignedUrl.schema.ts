import { FromSchema, JSONSchema } from 'json-schema-to-ts';

const CreatePutPresignedUrlBody = {
  type: 'object',
  properties: {
    mime: { type: 'string' },
  },
  required: ['mime'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const CreatePutPresignedUrlWithNameBody = {
  type: 'object',
  properties: {
    mime: { type: 'string' },
    fileName: { type: 'string' },
  },
  required: ['mime', 'fileName'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const CreateGetPresignedUrlBody = {
  type: 'object',
  properties: {
    folder: { type: 'string' },
    fileName: { type: 'string' },
  },
  required: ['fileName', 'folder'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const CreatePresignedUrlResponse = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    fileName: { type: 'string' },
  },
  required: ['url'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const GetChecksumHashBody = {
  type: 'object',
  properties: {
    content: { type: 'string' },
  },
  required: ['content'],
  additionalProperties: false,
} as const satisfies JSONSchema;

const GetChecksumHashResponse = {
  type: 'object',
  properties: {
    hash: { type: 'string' },
  },
  required: ['hash'],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreatePutPresignedUrlSchema = {
  body: CreatePutPresignedUrlBody,
  response: {
    200: CreatePresignedUrlResponse,
  },
};

export const CreatePutPresignedUrlWithNameSchema = {
  body: CreatePutPresignedUrlWithNameBody,
  response: {
    200: CreatePresignedUrlResponse,
  },
};

export const CreateGetPresignedUrlSchema = {
  body: CreateGetPresignedUrlBody,
  response: {
    200: CreatePresignedUrlResponse,
  },
};

export const GetChecksumHashSchema = {
  body: GetChecksumHashBody,
  response: {
    200: GetChecksumHashResponse,
  },
};

export type CreatePutPresignedUrlBodyType = FromSchema<typeof CreatePutPresignedUrlBody>;
export type CreatePutPresignedUrlWithNameBodyType = FromSchema<typeof CreatePutPresignedUrlWithNameBody>;
export type CreateGetPresignedUrlBodyType = FromSchema<typeof CreateGetPresignedUrlBody>;
export type CreatePresignedUrlResponseType = FromSchema<typeof CreatePresignedUrlResponse>;

export type GetChecksumHashResponseType = FromSchema<typeof GetChecksumHashResponse>;
export type GetChecksumHashBodyType = FromSchema<typeof GetChecksumHashBody>;
