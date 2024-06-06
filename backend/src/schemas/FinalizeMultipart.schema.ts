import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { GetArrayReturnType } from '../types/GetArrayReturnType';

const FinalizeMultipartBody = {
  type: 'object',
  properties: {
    fileName: { type: 'string' },
    uploadId: { type: 'string' },
    checksum: { type: 'string' },
    parts: { type: 'array', items: { $ref: '#/definitions/PartsObject' } },
  },
  required: ['fileName', 'uploadId', 'checksum', 'parts'],
  definitions: {
    PartsObject: {
      type: 'object',
      properties: {
        PartNumber: { type: 'number' },
        ETag: { type: 'string' },
      },
      required: ['PartNumber', 'ETag'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

const FinalizeMultipartResponse = {
  type: 'object',
  properties: {
    fileName: {
      type: 'string',
    },
  },
  required: ['fileName'],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const FinalizeMultipartSchema = {
  body: FinalizeMultipartBody,
  response: {
    200: FinalizeMultipartResponse,
  },
};

export type FinalizeMultipartBodyType = FromSchema<typeof FinalizeMultipartBody>;
export type FinalizeMultipartResponseType = FromSchema<typeof FinalizeMultipartResponse>;
export type PartsObject = GetArrayReturnType<() => FinalizeMultipartBodyType['parts']>;
