import { type EnvSchemaType } from './src/config/config';
import { type UploadService } from './src/services/upload.service';
import { type S3 } from './src/sdk/s3/s3';
import { SQS } from './src/sdk/sqs/sqs';
import { SseDispatcherService } from './src/services/sseDispatcher.service';
import { Dependencies } from './src/DI/ioc';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}

declare module 'fastify' {
  interface FastifyReply {
    sse: (event: string) => void;
  }
}

declare module '@fastify/awilix' {
  interface Cradle extends Dependencies {}
  interface RequestCradle extends Dependencies {}
}
