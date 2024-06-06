declare module 'fastify-sse' {
  import { FastifyPluginCallback } from 'fastify';
  import { PassThrough, Readable, Transform } from 'stream';

  interface Event {
    id?: string;
    event?: string;
    data: string | Buffer | object;
  }

  interface SSEConfig {
    idGenerator?: (chunk: unknown) => string | number;
    event?: string | ((chunk: unknown) => string);
  }

  interface SSEPlugin {
    (chunk: string | Readable | object, options?: SSEConfig): void;
  }

  const sse: SSEPlugin;

  export default sse;
}
