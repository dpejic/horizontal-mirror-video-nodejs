import { Message } from '@aws-sdk/client-sqs';

export abstract class SQSMock {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: any) {}

  async handleSQSMessage(message: Message) {}
}
