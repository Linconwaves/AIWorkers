import 'dotenv/config';
import { buildApp } from './app';
import { getConfig } from './config';
import { logger } from './logging/logger';
import { initRepositoryProvider } from './repositories';

const start = async () => {
  const config = getConfig();

  try {
    await initRepositoryProvider();
    const app = buildApp();
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`StoreCanvas server running on port ${config.PORT}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

start();
