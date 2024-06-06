import { Message } from '@aws-sdk/client-sqs';
import { SQS } from './sqs';
import { SseDispatcherService } from '../../services/sseDispatcher.service';
import { envServerSchema } from '../../config/config';
import { CreateJobCommand, MediaConvertClient } from '@aws-sdk/client-mediaconvert';

const mediaConvert = new MediaConvertClient({
  region: envServerSchema.AWS_REGION,
  credentials: {
    accessKeyId: envServerSchema.AWS_ACCESS_KEY_ID,
    secretAccessKey: envServerSchema.AWS_SECRET_ACCESS_KEY,
  },
});

export class SQSUploadQueue extends SQS {
  constructor({ sseDispatcherService }: { sseDispatcherService: SseDispatcherService }) {
    super({ sseDispatcherService, queueUrl: envServerSchema.SQS_UPLOAD_QUEUE_URL });
  }

  async handleSQSMessage(message: Message) {
    try {
      if (message.Body) {
        const eventBody = JSON.parse(message.Body);

        const filePath = eventBody.detail.object.key;
        const outputKey = filePath.replace('video/', 'video-finished/').replace(/\.[^/.]+$/, '');

        const command = new CreateJobCommand({
          Role: envServerSchema.MEDIA_CONVERT_ROLE_ARN,
          Settings: {
            OutputGroups: [
              {
                Name: 'File Group',
                OutputGroupSettings: {
                  Type: 'FILE_GROUP_SETTINGS',
                  FileGroupSettings: {
                    Destination: `s3://${envServerSchema.AWS_BUCKET}/${outputKey}`,
                  },
                },
                Outputs: [
                  {
                    ContainerSettings: {
                      Container: 'MP4',
                      Mp4Settings: {},
                    },
                    VideoDescription: {
                      CodecSettings: {
                        Codec: 'H_264',
                        H264Settings: {
                          ParNumerator: 1,
                          ParDenominator: 1,
                          ParControl: 'SPECIFIED',
                          FramerateControl: 'SPECIFIED',
                          FramerateNumerator: 24,
                          FramerateDenominator: 1,
                          MaxBitrate: 5000000,
                          RateControlMode: 'QVBR',
                          SceneChangeDetect: 'TRANSITION_DETECTION',
                        },
                      },
                    },
                    AudioDescriptions: [
                      {
                        CodecSettings: {
                          Codec: 'AAC',
                          AacSettings: {
                            Bitrate: 96000,
                            CodingMode: 'CODING_MODE_2_0',
                            SampleRate: 48000,
                          },
                        },
                      },
                    ],
                    Extension: 'mp4',
                  },
                ],
              },
            ],
            Inputs: [
              {
                AudioSelectors: { 'Audio Selector 1': { DefaultSelection: 'DEFAULT' } },
                TimecodeSource: 'ZEROBASED',
                FileInput: `s3://${envServerSchema.AWS_BUCKET}/${filePath}`,
              },
            ],
          },
          Queue: envServerSchema.SQS_MEDIA_CONVERT_FINISH_QUEUE,
          AccelerationSettings: { Mode: 'DISABLED' },
        });
        await mediaConvert.send(command);
      }
    } catch (err) {
      console.log(err);
    }
  }
}
