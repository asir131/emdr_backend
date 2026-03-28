import { PrivacyPolicy } from './privacy.model';
import { ApiError } from '../../utils/ApiError';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const CACHE_KEY = 'privacy:active';
const CACHE_TTL = 3600; 

export const privacyService = {

  // PUBLIC — get active policy (Redis cached)
  async getActive() {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for privacy cache');
    }

    const policy = await PrivacyPolicy.findOne({ isActive: true })
      .select('-createdBy -updatedBy -__v')
      .lean();

    if (!policy) throw ApiError.notFound('Privacy Policy not found');

    policy.sections.sort((a, b) => a.order - b.order);

    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(policy));
    } catch {
      logger.warn('Redis write failed for privacy cache');
    }

    return policy;
  },

  // ADMIN — all versions
  async getAll() {
    return PrivacyPolicy.find()
      .select('version overview effectiveDate changelog isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
  },

  // ADMIN — single by id
  async getById(id: string) {
    const policy = await PrivacyPolicy.findById(id).lean();
    if (!policy) throw ApiError.notFound('Privacy Policy not found');
    return policy;
  },

  // ADMIN — create new version (auto-activates)
  async create(data: any, userId: string) {
    await PrivacyPolicy.updateMany({ isActive: true }, { isActive: false });

    const policy = await PrivacyPolicy.create({
      ...data,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
      lastUpdated:   data.lastUpdated   ? new Date(data.lastUpdated)   : new Date(),
      isActive:  true,
      createdBy: userId,
    });

    await invalidateCache();
    logger.info('Privacy Policy created', { version: policy.version, userId });

    return policy;
  },

  // ADMIN — full replace (PUT)
  async replace(id: string, data: any, userId: string) {
    const policy = await PrivacyPolicy.findByIdAndUpdate(
      id,
      {
        version:       data.version,
        overview:      data.overview,
        sections:      data.sections,
        contactEmail:  data.contactEmail,
        contactName:   data.contactName,
        changelog:     data.changelog ?? '',
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
        lastUpdated:   data.lastUpdated   ? new Date(data.lastUpdated)   : new Date(),
        updatedBy:     userId,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!policy) throw ApiError.notFound('Privacy Policy not found');

    await invalidateCache();
    logger.info('Privacy Policy fully replaced', { id, userId });

    return policy;
  },

  // ADMIN — partial update (PATCH)
  async update(id: string, data: any, userId: string) {
    const updateData: Record<string, unknown> = { ...data, updatedBy: userId };
    if (data.effectiveDate) updateData.effectiveDate = new Date(data.effectiveDate);
    if (data.lastUpdated)   updateData.lastUpdated   = new Date(data.lastUpdated);

    const policy = await PrivacyPolicy.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!policy) throw ApiError.notFound('Privacy Policy not found');

    await invalidateCache();
    logger.info('Privacy Policy updated', { id, userId });

    return policy;
  },

  // ADMIN — activate a version
  async setActive(id: string, userId: string) {
    const policy = await PrivacyPolicy.findById(id);
    if (!policy) throw ApiError.notFound('Privacy Policy not found');

    await PrivacyPolicy.updateMany({ isActive: true }, { isActive: false });
    policy.isActive  = true;
    policy.updatedBy = userId as any;
    await policy.save();

    await invalidateCache();
    logger.info('Privacy Policy version activated', { id, userId });

    return policy;
  },

  // ADMIN — delete (cannot delete active)
  async delete(id: string) {
    const policy = await PrivacyPolicy.findById(id);
    if (!policy) throw ApiError.notFound('Privacy Policy not found');

    if (policy.isActive) {
      throw ApiError.validationError(
        'Cannot delete the active Privacy Policy. Activate another version first.'
      );
    }

    await PrivacyPolicy.findByIdAndDelete(id);
    logger.info('Privacy Policy version deleted', { id });

    return { message: 'Privacy Policy deleted successfully' };
  },
};

async function invalidateCache() {
  try {
    await redis.del(CACHE_KEY);
  } catch {
    logger.warn('Redis cache invalidation failed for privacy');
  }
}
