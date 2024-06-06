import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { envServerSchema } from '../config/config';
import { BadRequestError } from 'http-errors-enhanced-cjs';

export const errorHandler = (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
  if (error.validation) {
    if (envServerSchema.STRIP_ERROR_VALIDATION) {
      throw new BadRequestError('Something went wrong.');
    }
  }
  console.log(error);

  reply.status(400).send(error);
};
