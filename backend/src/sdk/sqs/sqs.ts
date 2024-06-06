import { envServerSchema } from '../../config/config';
import { Message, SQSClient } from '@aws-sdk/client-sqs';
import { Consumer } from 'sqs-consumer';
import { SseDispatcherService } from '../../services/sseDispatcher.service';

export abstract class SQS {
  sqsConsumer: Consumer;
  sseDispatcherService: SseDispatcherService;

  constructor({ sseDispatcherService, queueUrl }: { sseDispatcherService: SseDispatcherService; queueUrl: string }) {
    this.sseDispatcherService = sseDispatcherService;

    this.sqsConsumer = Consumer.create({
      queueUrl: queueUrl,
      handleMessage: this.handleSQSMessage.bind(this),
      sqs: new SQSClient({
        region: envServerSchema.AWS_REGION,
        credentials: {
          accessKeyId: envServerSchema.AWS_ACCESS_KEY_ID,
          secretAccessKey: envServerSchema.AWS_SECRET_ACCESS_KEY,
        },
      }),
    });

    this.sqsConsumer.on('error', (err) => {
      console.log(err.message);
    });

    this.sqsConsumer.on('processing_error', (err) => {
      console.log(err.message);
    });

    this.sqsConsumer.on('timeout_error', (err) => {
      console.log(err.message);
    });

    this.sqsConsumer.start();
  }

  abstract handleSQSMessage(message: Message): Promise<void>;
}
