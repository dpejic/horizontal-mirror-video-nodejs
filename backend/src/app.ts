import fastify, { FastifyInstance } from 'fastify';
import { DependencyOverrides, registerDi } from './DI/ioc';
import RoutesPlugin from './plugins/routes.plugin';
import { errorHandler } from './middlewares/error-handler';
import sse from 'fastify-sse';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

export const buildApp = (dependencyOverrides: DependencyOverrides = {}): FastifyInstance => {
  const server = fastify();

  server.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
  });

  registerDi(dependencyOverrides);

  server.register(helmet);
  server.register(cors, {
    origin: true,
    credentials: true,
  });

  server.register(sse);

  server.register(RoutesPlugin, { prefix: '/api' });

  server.setErrorHandler(errorHandler);

  return server;
};
