import {
  aws_lambda,
  Stack,
  StackProps,
  Duration,
  aws_logs,
  aws_iam,
  aws_events,
  aws_events_targets,
  aws_sqs,
  RemovalPolicy,
  aws_lambda_event_sources,
  aws_mediaconvert,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import { Code } from "aws-cdk-lib/aws-lambda";
import { config } from "dotenv";

config();

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaExecutionRole = new aws_iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    lambdaExecutionRole.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: ["s3:*"],
        resources: ["*"],
        effect: aws_iam.Effect.ALLOW,
      })
    );

    lambdaExecutionRole.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: ["sqs:*"],
        resources: ["*"],
        effect: aws_iam.Effect.ALLOW,
      })
    );

    const ffmpegLayer = new aws_lambda.LayerVersion(this, "FfmpegLayer", {
      code: Code.fromAsset(path.join(__dirname, "../ffmpeg-dist")),
      compatibleArchitectures: [aws_lambda.Architecture.ARM_64],
      compatibleRuntimes: [
        aws_lambda.Runtime.NODEJS_16_X,
        aws_lambda.Runtime.NODEJS_20_X,
        aws_lambda.Runtime.NODEJS_20_X,
        aws_lambda.Runtime.NODEJS_LATEST,
        aws_lambda.Runtime.PROVIDED_AL2,
      ],
    });

    const mediaConvertRole = new aws_iam.Role(this, "MediaConvertRole", {
      assumedBy: new aws_iam.ServicePrincipal("mediaconvert.amazonaws.com"),
    });

    mediaConvertRole.addToPolicy(
      new aws_iam.PolicyStatement({
        resources: ["*"],
        actions: ["s3:*", "logs:*", "mediaconvert:*", "sqs:*"],
        effect: aws_iam.Effect.ALLOW,
      })
    );

    const lambdaFunction = new aws_lambda.Function(this, "LambdaFunction", {
      functionName: "horizontal-flip",
      code: Code.fromAsset(path.join(__dirname, "../dist")),
      timeout: Duration.seconds(300),
      handler: "index.handler",
      architecture: aws_lambda.Architecture.ARM_64,
      logRetention: aws_logs.RetentionDays.ONE_WEEK,
      runtime: aws_lambda.Runtime.NODEJS_16_X,
      layers: [ffmpegLayer],
      role: lambdaExecutionRole,
      memorySize: 3008,
      environment: {
        FLUENTFFMPEG_COV: "",
        FFMPEG_PATH: "/opt/ffmpeg",
        FFPROBE_PATH: "/opt/ffprobe",
        BACKEND_API: process.env.BACKEND_API!,
        NOTIFICATION_QUEUE_URL: process.env.NOTIFICATION_QUEUE_URL!,
        TRIGGER_PARALLEL_LAMBDA_QUEUE_URL:
          process.env.TRIGGER_PARALLEL_LAMBDA_QUEUE_URL!,
        BUCKET_NAME: process.env.BUCKET_NAME!,
      },
    });

    new aws_mediaconvert.CfnQueue(this, "MediaConvertQueue", {
      pricingPlan: "ON_DEMAND",
      name: "MediaConvertQueue",
      status: "ACTIVE",
    });

    const mediaConvertOnUploadQueue = new aws_sqs.Queue(
      this,
      "MediaConvertOnUploadQueue",
      {
        visibilityTimeout: Duration.seconds(300),
      }
    );

    new aws_events.Rule(this, "MyS3BucketEventRule", {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: [process.env.BUCKET_NAME],
          },
          object: { key: [{ prefix: "video/" }] },
        },
      },
      targets: [new aws_events_targets.SqsQueue(mediaConvertOnUploadQueue)],
    });

    const triggerParallelLambdaQueue = new aws_sqs.Queue(
      this,
      "TriggerParallelLambdaQueue",
      {
        visibilityTimeout: Duration.seconds(300),
      }
    );

    triggerParallelLambdaQueue.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        principals: [
          new aws_iam.ServicePrincipal("mediaconvert.amazonaws.com"),
        ],
        resources: [triggerParallelLambdaQueue.queueArn],
      })
    );

    new aws_events.Rule(this, "MediaConvertFinishEvent", {
      eventPattern: {
        source: ["aws.mediaconvert"],
        detailType: ["MediaConvert Job State Change"],
        detail: {
          status: ["COMPLETE", "ERROR"],
        },
      },
      targets: [new aws_events_targets.SqsQueue(triggerParallelLambdaQueue)],
    });

    lambdaFunction.addEventSource(
      new aws_lambda_event_sources.SqsEventSource(triggerParallelLambdaQueue, {
        batchSize: 1,
      })
    );

    const queue = new aws_sqs.Queue(this, "UploadQueue", {
      fifo: true,
      contentBasedDeduplication: true,
      fifoThroughputLimit: aws_sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      deduplicationScope: aws_sqs.DeduplicationScope.MESSAGE_GROUP,
      removalPolicy: RemovalPolicy.RETAIN,
      visibilityTimeout: Duration.minutes(5),
    });

    lambdaFunction.addToRolePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        resources: [queue.queueArn],
        actions: ["sqs:SendMessage"],
      })
    );

    triggerParallelLambdaQueue.grantConsumeMessages(lambdaFunction);
  }
}
