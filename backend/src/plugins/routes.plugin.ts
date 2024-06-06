import { FastifyInstance } from 'fastify';
import UploadController from '../controllers/upload.controller';

const RoutesPlugin = async (server: FastifyInstance) => {
  server.register(UploadController, { prefix: '/upload' });
};

export default RoutesPlugin;
