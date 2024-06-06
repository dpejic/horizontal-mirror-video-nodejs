export const convertKbToMb = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return parseFloat(mb.toFixed(2));
};
