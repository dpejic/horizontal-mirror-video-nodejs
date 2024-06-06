import { FastifyReply } from 'fastify';
import { SSEEvents } from '../types/SSEEvents';

export class SseDispatcherService {
  #clients: Record<string, FastifyReply> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #isSseStreamReadable(reply: any) {
    const sseProp = Object.getOwnPropertySymbols(reply).find((sym) => sym.toString() === 'Symbol(sse)');

    return sseProp !== undefined && reply[sseProp]?.stream?.readable === true;
  }

  dispatch(event: string, clientId: string) {
    const reply = this.#clients[clientId];
    if (reply && this.#isSseStreamReadable(reply)) {
      reply.sse(event);
    }
  }

  removeConnection(clientId: string) {
    delete this.#clients[clientId];
  }

  connect(reply: FastifyReply, clientId: string) {
    this.#clients[clientId] = reply;

    reply.sse(JSON.stringify({ message: SSEEvents.STREAM_STARTED }));
  }

  get clients(): Record<string, FastifyReply> {
    return this.#clients;
  }
}
