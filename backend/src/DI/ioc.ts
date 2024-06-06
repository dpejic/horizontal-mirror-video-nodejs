import { diContainer } from '@fastify/awilix';
import { UploadService } from '../services/upload.service';
import { S3 } from '../sdk/s3/s3';
import { Lifetime, Resolver, asClass } from 'awilix';
import { SseDispatcherService } from '../services/sseDispatcher.service';
import { SQSEventNotificationQueue, SQSUploadQueue } from '../sdk/sqs';

const SINGLETON_CONFIG = { lifetime: Lifetime.SINGLETON };

export interface Dependencies {
  uploadService: UploadService;
  s3: S3;
  sqsUploadQueue: SQSUploadQueue;
  sqsEventNotificationQueue: SQSEventNotificationQueue;
  sseDispatcherService: SseDispatcherService;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DiConfig = Record<keyof Dependencies, Resolver<any>>;
export type DependencyOverrides = Partial<DiConfig>;

export const registerDi = (dependencyOverrides: DependencyOverrides = {}) => {
  diContainer.register({
    uploadService: asClass(UploadService, SINGLETON_CONFIG),
    s3: asClass(S3, SINGLETON_CONFIG),
    sqsUploadQueue: SQSUploadQueue ? asClass(SQSUploadQueue, SINGLETON_CONFIG) : undefined,
    sqsEventNotificationQueue: SQSEventNotificationQueue
      ? asClass(SQSEventNotificationQueue, SINGLETON_CONFIG)
      : undefined,
    sseDispatcherService: asClass(SseDispatcherService, SINGLETON_CONFIG),
  });

  for (const [dependencyKey, dependencyValue] of Object.entries(dependencyOverrides)) {
    diContainer.register(dependencyKey, dependencyValue);
  }

  diContainer.resolve<SQSUploadQueue>('sqsUploadQueue');
  diContainer.resolve<SQSEventNotificationQueue>('sqsEventNotificationQueue');
};
