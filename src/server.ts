import app from './app';
import { env } from './config/env';
import database from './config/database';
import { redis } from './config/redis';
import { startNotificationWorker } from './config/queue';
import { logger } from './config/logger';

const startServer = async () => {
  try {
    // Connect DB
    await database.connect();
    logger.info('Database connected');

    // Try Redis — fail silently if unavailable
    try {
      await redis.connect();
    } catch {
      logger.warn('Redis unavailable — caching & queues disabled, app will still work');
    }

    // Start BullMQ notification worker only if Redis is up
    startNotificationWorker();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Increase timeouts for large file uploads (10 minutes)
    server.timeout = 600000;
    server.keepAliveTimeout = 620000;

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await database.disconnect();
        await redis.quit();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
