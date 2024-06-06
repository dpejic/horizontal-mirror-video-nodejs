export const splitFileIntoChunks = (
  file: File,
  chunkSize: number,
  mime: string
): Promise<Blob[]> => {
  const chunks: Blob[] = [];
  let startByte = 0;
  let remainingBytes = file.size;

  while (remainingBytes > 0) {
    const chunkLength = Math.min(remainingBytes, chunkSize);
    const chunk = file.slice(startByte, startByte + chunkLength);
    chunks.push(new Blob([chunk], { type: mime }));
    startByte += chunkLength;
    remainingBytes -= chunkLength;
  }

  return new Promise((resolve) => resolve(chunks));
};
