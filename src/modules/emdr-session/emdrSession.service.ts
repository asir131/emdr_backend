import mongoose from 'mongoose';
import { EmdrSession, IEmdrSession, SessionType, IBeliefPair, IAddictionContext } from './emdrSession.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';
import { generateRoadmapSummaryAudio } from './roadmapSummaryAudio.service';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SaveTargetPayload {
  targetDescription: string;
  freezeFrame      : string;
  targetFile?      : Express.Multer.File;
  freezeFrameFile? : Express.Multer.File;
}

interface SaveEmotionsPayload {
  primaryEmotion    : string;
  additionalEmotions?: string | null;
  bodyLocation      : string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a session and enforce ownership in a single DB hit.
 * Throws typed ApiErrors so the controller never handles raw DB errors.
 */
async function findOwned(sessionId: string, userId: string): Promise<IEmdrSession> {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw ApiError.validationError('Invalid session ID', 'id');
  }

  const session = await EmdrSession.findById(sessionId);
  if (!session) throw ApiError.notFound('EMDR session not found');
  if (session.userId.toString() !== userId) throw ApiError.forbidden('Access denied to this session');

  return session;
}

/**
 * Marks a session as ready-for-BLS and stamps completedAt.
 */
async function markReadyForBls(session: IEmdrSession): Promise<IEmdrSession> {
  session.status      = 'ready_for_bls';
  session.completedAt = new Date();
  return session.save();
}

async function ensureRoadmapSummaryAudio(session: IEmdrSession): Promise<IEmdrSession> {
  if (
    session.roadmapSummaryAudioProvider === 'elevenlabs' &&
    session.roadmapSummaryAudioUrl &&
    session.roadmapSummaryText
  ) return session;

  const generated = await generateRoadmapSummaryAudio(session);
  session.roadmapSummaryText = generated.text;

  if (generated.audioUrl) {
    session.roadmapSummaryAudioUrl = generated.audioUrl;
    session.roadmapSummaryAudioProvider = 'elevenlabs';
    session.roadmapSummaryAudioGeneratedAt = new Date();
  } else {
    session.roadmapSummaryAudioUrl = null;
    session.roadmapSummaryAudioProvider = null;
  }

  return session.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const emdrSessionService = {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. START SESSION
  //    Creates a fresh in_progress session for the user.
  //    If the user already has an in_progress draft of the same type, return
  //    it so the frontend can resume instead of creating duplicates.
  // ───────────────────────────────────────────────────────────────────────────
  async startSession(userId: string, sessionType: SessionType): Promise<IEmdrSession> {
    // Resume any existing unfinished draft of the same type
    const existing = await EmdrSession.findOne({
      userId,
      sessionType,
      status: 'in_progress',
    }).sort({ createdAt: -1 });

    if (existing) {
      logger.info('Resuming existing EMDR session draft', {
        sessionId: existing._id,
        userId,
        sessionType,
      });
      return existing;
    }

    const session = await EmdrSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      sessionType,
      status: 'in_progress',
    });

    logger.info('EMDR session started', {
      sessionId   : session._id,
      userId,
      sessionType,
    });

    return session;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SAVE TARGET  (Steps 1 + 2)
  //    targetDescription + freezeFrame
  // ───────────────────────────────────────────────────────────────────────────
  async saveTarget(
    sessionId: string,
    userId   : string,
    payload  : SaveTargetPayload,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw ApiError.validationError(
        'Cannot modify a session that is no longer in progress',
        'status',
      );
    }

    if (session.sessionType === 'addiction') {
      throw ApiError.validationError(
        'Addiction sessions use the /addiction endpoint instead of /target',
        'sessionType',
      );
    }

    session.targetDescription = payload.targetDescription;
    session.freezeFrame       = payload.freezeFrame;

    // Handle file uploads (Cloudinary URLs are automatically set by multer middleware)
    if (payload.targetFile) {
      session.targetMediaUrl = payload.targetFile.path; // Cloudinary URL
      logger.info('Target media file uploaded', { 
        sessionId, 
        userId, 
        url: payload.targetFile.path 
      });
    }

    if (payload.freezeFrameFile) {
      session.freezeFrameMediaUrl = payload.freezeFrameFile.path; // Cloudinary URL
      logger.info('Freeze frame media file uploaded', { 
        sessionId, 
        userId, 
        url: payload.freezeFrameFile.path 
      });
    }

    await session.save();

    logger.info('EMDR session target saved', { sessionId, userId });
    return session;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SAVE BELIEF PAIRS  (Steps 3–5: Negative + Positive + VOC)
  //    Replaces the entire beliefPairs array each time (idempotent update).
  // ───────────────────────────────────────────────────────────────────────────
  async saveBeliefPairs(
    sessionId  : string,
    userId     : string,
    beliefPairs: IBeliefPair[],
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw ApiError.validationError('Session is no longer in progress', 'status');
    }

    if (session.sessionType === 'addiction') {
      throw ApiError.validationError(
        'Addiction sessions do not use belief pairs',
        'sessionType',
      );
    }

    if (!session.targetDescription || !session.freezeFrame) {
      throw ApiError.validationError(
        'Target description and freeze frame must be saved before adding belief pairs',
        'targetDescription',
      );
    }

    session.beliefPairs = beliefPairs;
    await session.save();

    logger.info('EMDR belief pairs saved', {
      sessionId,
      userId,
      pairCount: beliefPairs.length,
    });

    return session;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SAVE EMOTIONS  (Steps 6–8)
  //    primaryEmotion, additionalEmotions, bodyLocation
  // ───────────────────────────────────────────────────────────────────────────
  async saveEmotions(
    sessionId: string,
    userId   : string,
    payload  : SaveEmotionsPayload,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw ApiError.validationError('Session is no longer in progress', 'status');
    }

    if (session.sessionType === 'addiction') {
      throw ApiError.validationError(
        'Addiction sessions use the /addiction endpoint',
        'sessionType',
      );
    }

    if (session.beliefPairs.length === 0) {
      throw ApiError.validationError(
        'Belief pairs must be saved before recording emotions',
        'beliefPairs',
      );
    }

    session.primaryEmotion     = payload.primaryEmotion;
    session.additionalEmotions = payload.additionalEmotions ?? null;
    session.bodyLocation       = payload.bodyLocation;

    await session.save();

    logger.info('EMDR emotions saved', { sessionId, userId });
    return session;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SAVE SUD RATING  (Step 9 — final step for non-addiction sessions)
  //    Marks the session as ready_for_bls upon successful save.
  // ───────────────────────────────────────────────────────────────────────────
  async saveSud(
    sessionId: string,
    userId   : string,
    sudRating: number,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw ApiError.validationError('Session is no longer in progress', 'status');
    }

    if (session.sessionType === 'addiction') {
      throw ApiError.validationError(
        'Addiction sessions use the /addiction endpoint',
        'sessionType',
      );
    }

    // Enforce sequential completion
    if (!session.primaryEmotion || !session.bodyLocation) {
      throw ApiError.validationError(
        'Emotions and body location must be saved before recording SUD rating',
        'primaryEmotion',
      );
    }

    session.sudRating = sudRating;
    const saved = await ensureRoadmapSummaryAudio(await markReadyForBls(session));

    logger.info('EMDR session SUD saved — status: ready_for_bls', {
      sessionId,
      userId,
      sudRating,
    });

    return saved;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 6. SAVE ADDICTION CONTEXT  (single endpoint covers all addiction steps)
  //    Accepts all 6 addiction fields and marks the session ready_for_bls.
  // ───────────────────────────────────────────────────────────────────────────
  async saveAddiction(
    sessionId       : string,
    userId          : string,
    addictionContext: IAddictionContext,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw ApiError.validationError('Session is no longer in progress', 'status');
    }

    if (session.sessionType !== 'addiction') {
      throw ApiError.validationError(
        'This endpoint is only for addiction-type sessions',
        'sessionType',
      );
    }

    session.addictionContext = addictionContext;
    const saved = await ensureRoadmapSummaryAudio(await markReadyForBls(session));

    logger.info('EMDR addiction context saved — status: ready_for_bls', {
      sessionId,
      userId,
      pfsRating: addictionContext.pfsRating,
    });

    return saved;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 7. MARK COMPLETED  (called when BLS is finished)
  // ───────────────────────────────────────────────────────────────────────────
  async completeSession(sessionId: string, userId: string): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    if (session.status !== 'ready_for_bls') {
      throw ApiError.validationError(
        'Only sessions in ready_for_bls status can be marked completed',
        'status',
      );
    }

    await ensureRoadmapSummaryAudio(session);
    session.status = 'completed';
    await session.save();

    logger.info('EMDR session completed', { sessionId, userId });
    return session;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 8. ABANDON SESSION  (user closes / discards a draft)
  // ───────────────────────────────────────────────────────────────────────────
  async saveProcessingState(
    sessionId: string,
    userId: string,
    processingState: Record<string, unknown> | null,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    session.processingState = processingState;
    await session.save();

    logger.info('EMDR processing state saved', { sessionId, userId });
    return session;
  },

  async getProcessingState(
    sessionId: string,
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    const session = await findOwned(sessionId, userId);
    return session.processingState || null;
  },

  async clearProcessingState(sessionId: string, userId: string): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    session.processingState = null;
    await session.save();

    logger.info('EMDR processing state cleared', { sessionId, userId });
    return session;
  },

  async saveProcessingResult(
    sessionId: string,
    userId: string,
    processingResult: Record<string, unknown>,
  ): Promise<IEmdrSession> {
    const session = await findOwned(sessionId, userId);

    session.processingResult = processingResult;
    session.processingCompletedAt = new Date();
    session.processingState = null;
    if (session.status !== 'abandoned') {
      session.status = 'completed';
    }
    await session.save();

    logger.info('EMDR processing result saved', { sessionId, userId });
    return session;
  },

  async abandonSession(sessionId: string, userId: string): Promise<{ message: string }> {
    const session = await findOwned(sessionId, userId);

    if (session.status === 'completed') {
      throw ApiError.validationError('Completed sessions cannot be abandoned', 'status');
    }

    session.status = 'abandoned';
    await session.save();

    logger.info('EMDR session abandoned', { sessionId, userId });
    return { message: 'Session marked as abandoned' };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 9. GET SESSION BY ID
  // ───────────────────────────────────────────────────────────────────────────
  async getSessionById(sessionId: string, userId: string): Promise<IEmdrSession> {
    return findOwned(sessionId, userId);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 10. GET LATEST SESSION  (for "My Space" resume card)
  // ───────────────────────────────────────────────────────────────────────────
  async getLatestSession(userId: string): Promise<IEmdrSession | null> {
    return EmdrSession
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 11. GET ALL USER SESSIONS  (history list, paginated)
  // ───────────────────────────────────────────────────────────────────────────
  async getUserSessions(
    userId : string,
    page   : number = 1,
    limit  : number = 20,
    status?: string,
  ) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      EmdrSession
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmdrSession.countDocuments(filter),
    ]);

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 12. DELETE SESSION  (hard delete — irreversible)
  // ───────────────────────────────────────────────────────────────────────────
  async deleteSession(sessionId: string, userId: string): Promise<{ message: string }> {
    const session = await findOwned(sessionId, userId);
    await session.deleteOne();

    logger.info('EMDR session deleted', { sessionId, userId });
    return { message: 'EMDR session deleted successfully' };
  },
};
