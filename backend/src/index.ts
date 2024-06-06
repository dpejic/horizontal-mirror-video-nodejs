import closeWithGrace from 'close-with-grace';
import { envServerSchema } from './config/config';
import { buildApp } from './app';

const startServer = async () => {
  const app = await buildApp();

  app.listen({ port: envServerSchema.PORT }, (err) => {
    console.log(`Server listening at ${envServerSchema.PORT}`);

    if (err) {
      console.log(err);
      app.log.error(err);
      process.exit(1);
    }
  });

  closeWithGrace(async ({ signal, err }) => {
    if (err) {
      app.log.error({ err }, 'server closing with error');
    } else {
      app.log.info(`${signal} received, server closing`);
    }
    await app.close();
  });
};

startServer();
