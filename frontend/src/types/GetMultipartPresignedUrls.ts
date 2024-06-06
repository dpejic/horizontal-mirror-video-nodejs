export type GetMultipartPresignedUrlsResponseType = {
  partSignedUrlList: {
    signedUrl: string;
    PartNumber: number;
  }[];
  chunkSize: number;
  uploadId: string;
  fileName: string;
};
