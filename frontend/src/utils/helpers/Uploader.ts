import { splitFileIntoChunks } from ".";
import {
  finalizeMultipart,
  getChecksumHash,
  getMultipartPresignedUrls,
} from "../../services/api/api";

export class Uploader {
  private threadsQuantity: number;
  private file: File;
  private fileName: string;
  private aborted: boolean;
  private uploadedSize: number;
  private progressCache: { [key: number]: number };
  private activeConnections: { [key: number]: XMLHttpRequest };
  private parts: { PartNumber: number; signedUrl: string }[];
  private chunks: Blob[];
  private uploadedParts: { PartNumber: number; ETag: string }[];
  private uploadId: string | null;
  private onProgressFn: (progress: {
    sent: number;
    total: number;
    percentage: number;
  }) => void;
  private onErrorFn: (error: Error) => void;
  private onFinish: (fileName: string) => void;

  constructor(options: {
    threadsQuantity?: number;
    file: File;
    onFinish: (fileName: string) => void;
  }) {
    this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15);
    this.file = options.file;
    this.fileName = "";
    this.aborted = false;
    this.uploadedSize = 0;
    this.progressCache = {};
    this.activeConnections = {};
    this.parts = [];
    this.uploadedParts = [];
    this.uploadId = null;
    this.onProgressFn = () => {};
    this.onErrorFn = () => {};
    this.onFinish = options.onFinish;
    this.chunks = [];
  }

  start(): void {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      const mime = this.file.type.slice(0, this.file.type.indexOf(";"));
      const presignedUrls = await getMultipartPresignedUrls(
        mime,
        this.file.size
      );

      this.parts = presignedUrls.partSignedUrlList;
      this.fileName = presignedUrls.fileName;
      this.uploadId = presignedUrls.uploadId;

      this.chunks = await splitFileIntoChunks(
        this.file,
        presignedUrls.chunkSize,
        mime
      );

      this.sendNext();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      await this.complete(error);
    }
  }

  sendNext(): void {
    const activeConnections = Object.keys(this.activeConnections).length;
    if (activeConnections >= this.threadsQuantity) {
      return;
    }

    if (!this.parts.length) {
      if (!activeConnections) {
        this.complete();
      }
      return;
    }

    const part = this.parts.pop();

    if (this.file && part) {
      const chunk = this.chunks[part.PartNumber - 1];

      const sendChunkStarted = () => {
        this.sendNext();
      };

      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNext();
        })
        .catch((error) => {
          this.parts.push(part);
          this.complete(error);
        });
    }
  }

  async complete(error?: Error): Promise<void> {
    if (error && !this.aborted) {
      this.onErrorFn(error);
      return;
    }

    if (error) {
      this.onErrorFn(error);
      return;
    }

    try {
      await this.sendCompleteRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.onErrorFn(error);
    }
  }

  async sendCompleteRequest(): Promise<void> {
    if (this.uploadId) {
      const sortedETags = this.uploadedParts
        .slice()
        .sort((a, b) => a.PartNumber - b.PartNumber);

      const ETags = sortedETags.map((part) => part.ETag.replace(/"/g, ""));
      const { hash } = await getChecksumHash(ETags.join(""));

      const videoFinalizationMultiPartInput = {
        fileName: this.fileName,
        uploadId: this.uploadId,
        parts: this.uploadedParts,
        checksum: hash + "-" + this.uploadedParts.length,
      };

      const response = await finalizeMultipart(videoFinalizationMultiPartInput);

      this.onFinish(response.fileName);
    }
  }

  sendChunk(
    chunk: Blob,
    part: { PartNumber: number; signedUrl: string },
    sendChunkStarted: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.upload(chunk, part, sendChunkStarted)
        .then((status) => {
          if (status !== 200) {
            reject(new Error("Failed chunk upload"));
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  handleProgress(part: number, event: ProgressEvent): void {
    if (this.file) {
      if (
        event.type === "progress" ||
        event.type === "error" ||
        event.type === "abort"
      ) {
        this.progressCache[part] = event.loaded;
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0;
        delete this.progressCache[part];
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0);

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size);

      const total = this.file.size;

      const percentage = Math.round((sent / total) * 100);

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      });
    }
  }

  upload(
    file: Blob,
    part: { PartNumber: number; signedUrl: string },
    sendChunkStarted: () => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const xhr = (this.activeConnections[part.PartNumber - 1] =
        new XMLHttpRequest());

      sendChunkStarted();

      const progressListener = this.handleProgress.bind(
        this,
        part.PartNumber - 1
      );

      xhr.upload.addEventListener("progress", progressListener);

      xhr.addEventListener("error", progressListener);
      xhr.addEventListener("abort", progressListener);
      xhr.addEventListener("loadend", progressListener);

      xhr.open("PUT", part.signedUrl);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const ETag = xhr.getResponseHeader("ETag");

          if (ETag) {
            const uploadedPart = {
              PartNumber: part.PartNumber,
              ETag: ETag,
            };

            this.uploadedParts.push(uploadedPart);

            resolve(xhr.status);
            delete this.activeConnections[part.PartNumber - 1];
          }
        }
      };

      xhr.onerror = (error) => {
        reject(error);
        delete this.activeConnections[part.PartNumber - 1];
      };

      xhr.onabort = () => {
        reject(new Error("Upload canceled by user"));
        delete this.activeConnections[part.PartNumber - 1];
      };

      xhr.send(file);
    });
  }

  onProgress(
    onProgress: (progress: {
      sent: number;
      total: number;
      percentage: number;
    }) => void
  ): this {
    this.onProgressFn = onProgress;
    return this;
  }

  onError(onError: (error: Error) => void): this {
    this.onErrorFn = onError;
    return this;
  }

  abort(): void {
    Object.keys(this.activeConnections)
      .map(Number)
      .forEach((id) => {
        this.activeConnections[id].abort();
      });

    this.aborted = true;
  }
}
