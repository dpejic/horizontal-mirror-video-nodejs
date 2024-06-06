import z from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8001),
  AWS_ACCESS_KEY_ID: z.coerce.string(),
  AWS_SECRET_ACCESS_KEY: z.coerce.string(),
  AWS_REGION: z.coerce.string(),
  AWS_BUCKET: z.coerce.string(),
  SQS_EVENT_NOTIFICATION_QUEUE: z.coerce.string(),
  SQS_UPLOAD_QUEUE_URL: z.coerce.string(),
  MEDIA_CONVERT_ROLE_ARN: z.coerce.string(),
  SQS_MEDIA_CONVERT_FINISH_QUEUE: z.coerce.string(),
  STRIP_ERROR_VALIDATION: z.coerce.boolean(),
});

const envServer = envSchema.safeParse({
  PORT: process.env.PORT,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET: process.env.AWS_BUCKET,
  SQS_EVENT_NOTIFICATION_QUEUE: process.env.SQS_EVENT_NOTIFICATION_QUEUE,
  SQS_UPLOAD_QUEUE_URL: process.env.SQS_UPLOAD_QUEUE_URL,
  MEDIA_CONVERT_ROLE_ARN: process.env.MEDIA_CONVERT_ROLE_ARN,
  SQS_MEDIA_CONVERT_FINISH_QUEUE: process.env.SQS_MEDIA_CONVERT_FINISH_QUEUE,
  STRIP_ERROR_VALIDATION: process.env.STRIP_ERROR_VALIDATION,
});

if (!envServer.success) {
  console.log(envServer.error.issues);
  throw new Error('There is an error with the server environment variables');
}

export const envServerSchema = envServer.data;
export type EnvSchemaType = z.infer<typeof envSchema>;
