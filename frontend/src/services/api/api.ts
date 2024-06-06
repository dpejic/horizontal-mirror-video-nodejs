import axios from "axios";
import { GetMultipartPresignedUrlsResponseType } from "../../types/GetMultipartPresignedUrls";

const apiUrl = import.meta.env.REACT_APP_API_URL || "http://localhost:8010/api";

const api = axios.create({
  baseURL: apiUrl,
});

export const getPresignedUrl = async (mime: string) => {
  const response = await api.post("/upload/presigned-url", {
    mime: mime,
  });
  return response.data;
};

export const uploadToS3 = async (
  file: File,
  url: string,
  setUploadProgress?: (val: number) => void
) => {
  try {
    const response = await axios.put(url, file, {
      headers: {
        "Content-Type": file.type.split(";")[0],
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!
        );
        setUploadProgress && setUploadProgress(percentCompleted);
      },
    });
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

export const getFileUrl = async (fileName: string) => {
  const response = await api.post("/upload/get-presigned-url", {
    folder: "video-finished",
    fileName: fileName,
  });
  return response.data;
};

export const getSseEndpoint = (clientId: string) =>
  `${apiUrl}/upload/sse?id=${clientId}`;

// multipart

export const getMultipartPresignedUrls = async (
  mime: string,
  bufferSize: number
): Promise<GetMultipartPresignedUrlsResponseType> => {
  const response = await api.post("/upload/get-multipart-presigned-urls", {
    mime: mime,
    bufferSize: bufferSize,
  });
  return response.data;
};

export const finalizeMultipart = async (props: {
  uploadId: string;
  fileName: string;
  checksum: string;
  parts: {
    PartNumber: number;
    ETag: string;
  }[];
}) => {
  const response = await api.post("/upload/finalize-multipart", {
    ...props,
  });
  return response.data;
};

export const getChecksumHash = async (content: string) => {
  const response = await api.post("/upload/checksum-hash", {
    content,
  });
  return response.data;
};
