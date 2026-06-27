import { SessionProgress } from './sessionProgress.model';
import { logger } from '../../config/logger';

export const sessionProgressService = {
  /**
   * Update or create session progress and calculate percentage
   */
  async updateProgress(userId: string, data: { journeyId: string; totalSession: number; compledSession: number }) {
    const { journeyId, totalSession, compledSession } = data;

    // Calculate percentage
    const percentageValue = totalSession > 0 ? Math.round((compledSession / totalSession) * 100) : 0;
    const progressPercentage = `${percentageValue}%`;

    try {
      const progress = await SessionProgress.findOneAndUpdate(
        { userId, journeyId },
        {
          $set: {
            totalSessions:     totalSession,
            completedSessions: compledSession,
            progressPercentage,
          }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean();

      logger.info('Session progress updated', { userId, journeyId, progressPercentage });
      
      return {
        totalCompledSession: progressPercentage,
        details: {
          totalSessions:     progress?.totalSessions,
          completedSessions: progress?.completedSessions
        },
        roadmapIntroVideoCompleted: Boolean(progress?.roadmapIntroVideoCompleted),
      };
    } catch (error: any) {
      // Handle duplicate key error (old index issue)
      if (error.code === 11000) {
        logger.warn('Duplicate key error detected, retrying with update only', { userId, journeyId });
        
        // Try update without upsert
        const progress = await SessionProgress.findOneAndUpdate(
          { userId, journeyId },
          {
            $set: {
              totalSessions:     totalSession,
              completedSessions: compledSession,
              progressPercentage,
            }
          },
          { new: true, runValidators: true }
        ).lean();

        if (!progress) {
          // Record doesn't exist, try to create manually
          logger.warn('Record not found, attempting manual creation', { userId, journeyId });
          
          const newProgress = await SessionProgress.create({
            userId,
            journeyId,
            totalSessions: totalSession,
            completedSessions: compledSession,
            progressPercentage,
          });

          return {
            totalCompledSession: progressPercentage,
            details: {
              totalSessions: newProgress.totalSessions,
              completedSessions: newProgress.completedSessions
            },
            roadmapIntroVideoCompleted: newProgress.roadmapIntroVideoCompleted,
          };
        }

        logger.info('Session progress updated (retry successful)', { userId, journeyId, progressPercentage });
        
        return {
          totalCompledSession: progressPercentage,
          details: {
            totalSessions:     progress.totalSessions,
            completedSessions: progress.completedSessions
          },
          roadmapIntroVideoCompleted: Boolean(progress.roadmapIntroVideoCompleted),
        };
      }
      
      // Re-throw other errors
      logger.error('Failed to update session progress', { error: error.message, userId, journeyId });
      throw error;
    }
  },

  /**
   * Get progress for a specific journey
   */
  async getProgress(userId: string, journeyId: string) {
    const progress = await SessionProgress.findOne({ userId, journeyId }).lean();
    if (!progress) {
      return {
        totalCompledSession: "0%",
        details: { totalSessions: 0, completedSessions: 0 },
        roadmapIntroVideoCompleted: false,
      };
    }
    
    return {
      totalCompledSession: progress.progressPercentage,
      details: {
        totalSessions:     progress.totalSessions,
        completedSessions: progress.completedSessions
      },
      roadmapIntroVideoCompleted: Boolean(progress.roadmapIntroVideoCompleted),
    };
  },

  async markRoadmapIntroCompleted(userId: string, journeyId: string) {
    const progress = await SessionProgress.findOneAndUpdate(
      { userId, journeyId },
      {
        $set: { roadmapIntroVideoCompleted: true },
        $setOnInsert: {
          totalSessions: 10,
          completedSessions: 0,
          progressPercentage: '0%',
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    logger.info('Roadmap intro video marked completed', { userId, journeyId });

    return {
      totalCompledSession: progress?.progressPercentage || '0%',
      details: {
        totalSessions: progress?.totalSessions || 10,
        completedSessions: progress?.completedSessions || 0,
      },
      roadmapIntroVideoCompleted: true,
    };
  },
};
