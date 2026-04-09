import { AboutUs } from './about.model';
import { ApiError } from '../../utils/ApiError';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const CACHE_KEY = 'about:us';
const CACHE_TTL = 3600; // 1 hour

export const aboutService = {

  // PUBLIC — get (cached)
  async get() {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for about cache');
    }

    const about = await AboutUs.findOne().select('overview sections updatedAt').lean();
    if (!about) throw ApiError.notFound('About Us content not found');

    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(about));
    } catch {
      logger.warn('Redis write failed for about cache');
    }

    return about;
  },

  // ADMIN — create (only one record allowed)
  async create(data: { overview: string; sections: any[] }, userId: string) {
    const existing = await AboutUs.findOne();
    if (existing) {
      throw ApiError.validationError(
        'About Us already exists. Use PUT to update it.'
      );
    }

    const about = await AboutUs.create({ ...data, updatedBy: userId });

    await invalidateCache();
    logger.info('About Us created', { userId });

    return about;
  },

  // ADMIN — full update (PUT)
  async update(data: { overview: string; sections: any[] }, userId: string) {
    const about = await AboutUs.findOneAndUpdate(
      {},
      { 
        $set: { ...data, updatedBy: userId },
        $unset: { aboutUs: "" } // Explicitly remove the legacy massive string field
      },
      { new: true, upsert: true, runValidators: true, returnDocument: 'after' }
    ).select('overview sections updatedAt').lean();

    await invalidateCache();
    logger.info('About Us updated', { userId });

    return about;
  },
};

async function invalidateCache() {
  try {
    await redis.del(CACHE_KEY);
  } catch {
    logger.warn('Redis cache invalidation failed for about');
  }
}
