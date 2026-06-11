import { MediaProgress } from './progress.model';
import { Media } from '../category/media.model';
import { Category } from '../category/category.model';
import { Journey } from '../journey/journey.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

const COMPLETION_THRESHOLD = 80; // 80% watched = completed

export const progressService = {

  // ── Update progress for a single media ───────────────────────────────────
  async updateMediaProgress(userId: string, mediaId: string, watchedSeconds: number, totalSeconds: number) {
    const media = await Media.findById(mediaId).lean();
    if (!media) throw ApiError.notFound('Media not found');

    // Use media's stored duration if available, otherwise use client-provided
    const effectiveTotalSeconds = media.duration ?? totalSeconds;

    // Clamp watchedSeconds to totalSeconds
    const clampedWatched = Math.min(watchedSeconds, effectiveTotalSeconds);
    const percentage = Math.round((clampedWatched / effectiveTotalSeconds) * 100);
    const isCompleted = percentage >= COMPLETION_THRESHOLD;

    const progress = await MediaProgress.findOneAndUpdate(
      { userId, mediaId },
      {
        userId,
        mediaId,
        categoryId:     media.categoryId,
        watchedSeconds: clampedWatched,
        totalSeconds:   effectiveTotalSeconds,
        percentage,
        isCompleted,
        lastWatchedAt:  new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    logger.info('Media progress updated', { userId, mediaId, percentage, isCompleted });
    return progress;
  },

  // ── Category progress for a user ─────────────────────────────────────────
  async getCategoryProgress(userId: string, categoryId: string) {
    const category = await Category.findById(categoryId).lean();
    if (!category) throw ApiError.notFound('Category not found');

    // All active media in this category
    const allMedia = await Media.find({ categoryId, status: 'active' }).lean();
    const totalMedia = allMedia.length;

    if (totalMedia === 0) {
      return {
        category: { _id: category._id, categoryName: category.categoryName },
        totalMedia: 0,
        completedMedia: 0,
        categoryProgress: 0,
        mediaList: [],
      };
    }

    // User's progress for all media in this category
    const progressRecords = await MediaProgress.find({
      userId,
      categoryId,
    }).lean();

    const progressMap = new Map(progressRecords.map(p => [p.mediaId.toString(), p]));

    const mediaList = allMedia.map(m => {
      const prog = progressMap.get(m._id.toString());
      return {
        mediaId:        m._id,
        name:           m.name,
        mediaType:      m.mediaType,
        url:            m.url,
        duration:       m.duration ?? null,
        watchedSeconds: prog?.watchedSeconds ?? 0,
        totalSeconds:   prog?.totalSeconds ?? (m.duration ?? 0),
        percentage:     prog?.percentage ?? 0,
        isCompleted:    prog?.isCompleted ?? false,
        lastWatchedAt:  prog?.lastWatchedAt ?? null,
      };
    });

    const completedMedia = mediaList.filter(m => m.isCompleted).length;
    const categoryProgress = Math.round((completedMedia / totalMedia) * 100);

    return {
      category: { _id: category._id, categoryName: category.categoryName },
      totalMedia,
      completedMedia,
      categoryProgress,
      mediaList,
    };
  },

  // ── Journey progress for a user ───────────────────────────────────────────
  async getJourneyProgress(_userId: string, journeyId: string) {
    const journey = await Journey.findById(journeyId).lean();
    if (!journey) throw ApiError.notFound('Journey not found');

    return {
      journey: {
        _id:         journey._id,
        journeyName: journey.journeyName,
        imageUrl:    journey.imageUrl,
        description: journey.description,
      },
      message: 'Journey found. Use GET /progress/category/:categoryId for per-category progress.',
    };
  },
};
