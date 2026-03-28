import { FAQ } from './faq.model';
import { ApiError } from '../../utils/ApiError';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const CACHE_KEY = 'faq:active';
const CACHE_TTL = 1800; // 30 minutes

export const faqService = {

  // PUBLIC — all active FAQs ordered by `order` field (cached)
  async getAll() {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for FAQ cache');
    }

    const faqs = await FAQ.find({ isActive: true })
      .select('-createdBy -updatedBy -__v')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const result = faqs.map((faq, index) => ({ ...faq, displayId: index + 1 }));

    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
    } catch {
      logger.warn('Redis write failed for FAQ cache');
    }

    return result;
  },

  async getById(id: string) {
    const faq = await FAQ.findOne({ _id: id, isActive: true })
      .select('-createdBy -updatedBy -__v')
      .lean();
    if (!faq) throw ApiError.notFound('FAQ not found');
    return faq;
  },

  // ADMIN — all FAQs including inactive
  async getAllAdmin() {
    const faqs = await FAQ.find()
      .select('-__v')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return faqs.map((faq, index) => ({ ...faq, displayId: index + 1 }));
  },

  // ADMIN — create
  async create(data: { question: string; answer: string; order?: number; isActive?: boolean }, userId: string) {
    // Auto-assign order if not provided
    if (data.order === undefined) {
      const last = await FAQ.findOne().sort({ order: -1 }).select('order').lean();
      data.order = last ? last.order + 1 : 0;
    }

    const faq = await FAQ.create({ ...data, createdBy: userId });

    await invalidateCache();
    logger.info('FAQ created', { id: faq._id, userId });

    return faq;
  },

  // ADMIN — update (PATCH)
  async update(id: string, data: any, userId: string) {
    const faq = await FAQ.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    ).lean();

    if (!faq) throw ApiError.notFound('FAQ not found');

    await invalidateCache();
    logger.info('FAQ updated', { id, userId });

    return faq;
  },

  // ADMIN — bulk reorder (drag & drop support)
  async reorder(items: { id: string; order: number }[], userId: string) {
    const bulkOps = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { order, updatedBy: userId },
      },
    }));

    await FAQ.bulkWrite(bulkOps);
    await invalidateCache();
    logger.info('FAQs reordered', { count: items.length, userId });

    return { message: 'FAQs reordered successfully', updated: items.length };
  },

  // ADMIN — delete
  async delete(id: string) {
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) throw ApiError.notFound('FAQ not found');

    await invalidateCache();
    logger.info('FAQ deleted', { id });

    return { message: 'FAQ deleted successfully' };
  },
};

async function invalidateCache() {
  try {
    await redis.del(CACHE_KEY);
  } catch {
    logger.warn('Redis cache invalidation failed for FAQ');
  }
}
