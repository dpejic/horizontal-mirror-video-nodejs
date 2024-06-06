import { Message } from '@aws-sdk/client-sqs';
import { SQSMock } from './sqs';

export class SQSEventNotificationQueue extends SQSMock {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ sseDispatcherService }: { sseDispatcherService: any }) {
    super({ sseDispatcherService, queueUrl: 'mock' });
  }

  async handleSQSMessage(message: Message) {}
}
