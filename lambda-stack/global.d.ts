export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_API: string;
      NOTIFICATION_QUEUE_URL: string;
      TRIGGER_PARALLEL_LAMBDA_QUEUE_URL: string;
      BUCKET_NAME: string;
    }
  }
}
