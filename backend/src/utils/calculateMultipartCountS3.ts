export const calculateMultipartCountS3 = (contentSize: number): { numMultiparts: number; chunkSize: number } => {
  const minChunkSize = 10 * 1024 * 1024;

  const maxChunkSize = 100 * 1024 * 1024;

  const adjustedChunkSize = contentSize < maxChunkSize ? minChunkSize : Math.min(contentSize, maxChunkSize);

  const numMultiparts = Math.ceil(contentSize / adjustedChunkSize);

  return { numMultiparts, chunkSize: adjustedChunkSize };
};
