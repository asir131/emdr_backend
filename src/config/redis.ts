import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export let redisAvailable = false;

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: () => null, // never retry — fail fast
});

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis connected');
});

// Suppress all Redis error logs silently
redis.on('error', () => {});

export const CACHE_TTL = {
  PROFILE: 300,
  AUTH_CHECK: 60,
} as const;
