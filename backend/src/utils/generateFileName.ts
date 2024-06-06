import { mimeToExtensionMap } from '../constants/mimeToExtension.constant';

export const generateFileName = (mime: string): string => {
  const randomString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  const extension = mimeToExtensionMap[mime];

  if (!extension) {
    throw new Error();
  }

  return `${randomString}${extension}`;
};
