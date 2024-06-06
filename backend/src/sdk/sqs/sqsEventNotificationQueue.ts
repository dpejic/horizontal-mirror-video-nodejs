import { Message } from '@aws-sdk/client-sqs';
import { SQS } from './sqs';
import { SseDispatcherService } from '../../services/sseDispatcher.service';
import { envServerSchema } from '../../config/config';

export class SQSEventNotificationQueue extends SQS {
  constructor({ sseDispatcherService }: { sseDispatcherService: SseDispatcherService }) {
    super({ sseDispatcherService, queueUrl: envServerSchema.SQS_EVENT_NOTIFICATION_QUEUE });
  }

  async handleSQSMessage(message: Message) {
    try {
      if (message.Body) {
        const sqsObject = JSON.parse(message.Body);

        if (sqsObject.message && sqsObject.id) {
          this.sseDispatcherService.dispatch(
            JSON.stringify({
              message: sqsObject.message,
              id: sqsObject.id,
            }),
            sqsObject.id,
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}
