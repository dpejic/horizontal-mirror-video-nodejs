export const removeExtensionFromFileName = (fileName: string) => {
  return fileName.replace(/\.[^/.]+$/, "");
};
