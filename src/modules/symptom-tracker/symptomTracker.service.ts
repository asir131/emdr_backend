import mongoose from 'mongoose';
import { SymptomTrackerConfig, ISymptomTrackerConfig, SymptomTrackerSubmission } from './symptomTracker.model';
import { ApiError } from '../../utils/ApiError';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

// ─────────────────────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY_ALL = 'symptom-tracker:configs:all';
const CACHE_KEY_ONE = (type: string) => `symptom-tracker:configs:${type}`;
const CACHE_TTL     = 1800; // 30 minutes

async function invalidateCache(type?: string) {
  try {
    const keys = [CACHE_KEY_ALL];
    if (type) keys.push(CACHE_KEY_ONE(type));
    await redis.del(...keys);
  } catch {
    logger.warn('Redis cache invalidation failed for symptom-tracker configs');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const symptomTrackerService = {

  // ── PUBLIC CONFIG ────────────────────────────────────────────────────────────

  async listConfigs() {
    try {
      const cached = await redis.get(CACHE_KEY_ALL);
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for symptom-tracker configs list');
    }

    const configs = await SymptomTrackerConfig.find({ isActive: true })
      .select('-createdBy -updatedBy -__v')
      .sort({ createdAt: 1 })
      .lean();

    try {
      await redis.setex(CACHE_KEY_ALL, CACHE_TTL, JSON.stringify(configs));
    } catch {
      logger.warn('Redis write failed for symptom-tracker configs list');
    }

    return configs;
  },

  async getConfigByType(type: string) {
    const cacheKey = CACHE_KEY_ONE(type.toLowerCase());

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for symptom-tracker config', { type });
    }

    const config = await SymptomTrackerConfig.findOne({
      trackerType: type.toLowerCase(),
      isActive   : true,
    })
      .select('-createdBy -updatedBy -__v')
      .lean();

    if (!config) throw ApiError.notFound(`Tracker config '${type}' not found`);

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(config));
    } catch {
      logger.warn('Redis write failed for symptom-tracker config', { type });
    }

    return config;
  },

  // ── ADMIN CONFIG ─────────────────────────────────────────────────────────────

  async listConfigsAdmin() {
    return SymptomTrackerConfig.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();
  },

  async createConfig(payload: any, adminId: string): Promise<ISymptomTrackerConfig> {
    const existing = await SymptomTrackerConfig.findOne({
      trackerType: payload.trackerType.toLowerCase(),
    });

    if (existing) {
      throw ApiError.validationError(
        `A tracker config with type '${payload.trackerType}' already exists`,
        'trackerType'
      );
    }

    const config = await SymptomTrackerConfig.create({
      ...payload,
      trackerType: payload.trackerType.toLowerCase(),
      createdBy  : adminId,
    });

    await invalidateCache();
    logger.info('Symptom tracker config created', { trackerType: config.trackerType, adminId });

    return config;
  },

  async updateConfig(type: string, payload: any, adminId: string): Promise<ISymptomTrackerConfig> {
    const config = await SymptomTrackerConfig.findOneAndUpdate(
      { trackerType: type.toLowerCase() },
      { ...payload, updatedBy: adminId },
      { new: true, runValidators: true }
    ).lean();

    if (!config) throw ApiError.notFound(`Tracker config '${type}' not found`);

    await invalidateCache(type.toLowerCase());
    logger.info('Symptom tracker config updated', { trackerType: type, adminId });

    return config as ISymptomTrackerConfig;
  },

  async deleteConfig(type: string): Promise<{ message: string }> {
    const config = await SymptomTrackerConfig.findOneAndDelete({
      trackerType: type.toLowerCase(),
    });

    if (!config) throw ApiError.notFound(`Tracker config '${type}' not found`);

    await invalidateCache(type.toLowerCase());
    logger.info('Symptom tracker config deleted', { trackerType: type });

    return { message: `Tracker config '${type}' deleted successfully` };
  },

  // ── USER SUBMISSION ──────────────────────────────────────────────────────────

  /**
   * Submit a completed tracker.
   * Server calculates score from raw answers + config — never trusts client score.
   */
  async submitTracker(
    userId     : string,
    trackerType: string,
    answers    : number[],
    stemValue ?: string | null
  ) {
    const type = trackerType.toLowerCase();

    const config = await SymptomTrackerConfig.findOne({ trackerType: type, isActive: true }).lean();
    if (!config) throw ApiError.notFound(`Tracker config '${type}' not found`);

    if (answers.length !== config.items.length) {
      throw ApiError.validationError(
        `Expected ${config.items.length} answers, got ${answers.length}`,
        'answers'
      );
    }

    // Calculate scores server-side
    let totalScore = 0;
    const maxOptionValue = config.options[config.options.length - 1].value;

    const itemScores = config.items.map((item, i) => {
      const raw    = answers[i];
      const scored = item.reverse ? (maxOptionValue - raw) : raw;
      totalScore  += scored;
      return { itemIndex: i, rawAnswer: raw, scored };
    });

    // Determine severity band
    const band = config.bands.find(b => totalScore <= b.max) ?? config.bands[config.bands.length - 1];

    const submission = await SymptomTrackerSubmission.create({
      userId,
      trackerType : type,
      totalScore,
      severityBand: band.label,
      itemScores,
      stemValue   : stemValue ?? null,
      submittedAt : new Date(),
    });

    logger.info('Symptom tracker submitted', { userId, trackerType: type, totalScore, band: band.label });

    return {
      submissionId : submission._id,
      trackerType  : type,
      totalScore,
      maxScore     : config.items.length * maxOptionValue,
      severityBand : band.label,
      description  : band.description,
      itemScores,
      submittedAt  : submission.submittedAt,
    };
  },

  /**
   * Get submission history for a user (paginated, filterable by trackerType)
   */
  async getHistory(
    userId     : string,
    trackerType?: string,
    page        = 1,
    limit       = 20
  ) {
    const filter: Record<string, any> = { userId };
    if (trackerType) filter.trackerType = trackerType.toLowerCase();

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      SymptomTrackerSubmission.find(filter)
        .select('-itemScores -__v')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SymptomTrackerSubmission.countDocuments(filter),
    ]);

    return {
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages : Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  /**
   * Get a single submission by ID (ownership enforced)
   */
  async getSubmissionById(submissionId: string, userId: string) {
    const submission = await SymptomTrackerSubmission.findById(submissionId).lean();
    if (!submission) throw ApiError.notFound('Submission not found');
    if (submission.userId.toString() !== userId) throw ApiError.forbidden('Access denied');
    return submission;
  },

  /**
   * Get score trend — last N submissions for a tracker type (for chart)
   */
  async getTrend(userId: string, trackerType: string, limit = 10) {
    const submissions = await SymptomTrackerSubmission.find({
      userId,
      trackerType: trackerType.toLowerCase(),
    })
      .select('totalScore severityBand submittedAt')
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();

    // Chronological order for chart rendering
    return submissions.reverse().map(s => ({
      totalScore  : s.totalScore,
      severityBand: s.severityBand,
      submittedAt : s.submittedAt,
    }));
  },

  /**
   * Get latest submission — per trackerType or across all types
   */
  async getLatest(userId: string, trackerType?: string) {
    if (trackerType) {
      const submission = await SymptomTrackerSubmission.findOne({
        userId,
        trackerType: trackerType.toLowerCase(),
      })
        .sort({ submittedAt: -1 })
        .lean();

      if (!submission) throw ApiError.notFound('No submissions found');
      return submission;
    }

    // Latest per each tracker type via aggregation
    const latest = await SymptomTrackerSubmission.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { submittedAt: -1 } },
      { $group: { _id: '$trackerType', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $project: { itemScores: 0, __v: 0 } },
    ]);

    return latest;
  },

  async adminListSubmissions(filters: {
    trackerType?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filters.trackerType) query.trackerType = filters.trackerType.toLowerCase();
    if (filters.userId) query.userId = new mongoose.Types.ObjectId(filters.userId);

    const [submissions, total] = await Promise.all([
      SymptomTrackerSubmission.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SymptomTrackerSubmission.countDocuments(query),
    ]);

    return {
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  async adminStats() {
    const [totalSubmissions, byTrackerType, bySeverityBand] = await Promise.all([
      SymptomTrackerSubmission.countDocuments(),
      SymptomTrackerSubmission.aggregate([
        { $group: { _id: '$trackerType', count: { $sum: 1 }, avgScore: { $avg: '$totalScore' } } },
        { $sort: { count: -1 } },
      ]),
      SymptomTrackerSubmission.aggregate([
        { $group: { _id: '$severityBand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalSubmissions,
      byTrackerType: byTrackerType.map((item) => ({
        trackerType: item._id,
        count: item.count,
        avgScore: Math.round(item.avgScore * 10) / 10,
      })),
      bySeverityBand: bySeverityBand.map((item) => ({
        severityBand: item._id,
        count: item.count,
      })),
    };
  },
};
