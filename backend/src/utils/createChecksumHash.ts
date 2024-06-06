import { createHash } from 'crypto';

export const createChecksumHash = (content: string) => {
  const raw = Buffer.from(content, 'hex');
  const hasher = createHash('md5');
  hasher.update(raw);
  const digest = hasher.digest('hex');

  return digest;
};
