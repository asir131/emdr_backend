import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

export const CACHE_TTL = {
  PROFILE: 300,        // 5 minutes
  AUTH_CHECK: 60,      // 1 minute
} as const;

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});
