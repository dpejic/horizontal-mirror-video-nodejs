import { BadRequestError } from 'http-errors-enhanced-cjs';
import { VALID_MIME_TYPES } from '../constants';

export const isValidMediaFormat = (value: string) => {
  const mimeValidation = VALID_MIME_TYPES.has(value);

  if (!mimeValidation) {
    throw new BadRequestError('Not valid mime type');
  }

  return mimeValidation;
};
