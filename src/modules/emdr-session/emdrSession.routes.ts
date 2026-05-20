import { Router } from 'express';
import { emdrSessionController as ctrl } from './emdrSession.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { requireSubscription } from '../../middleware/requireSubscription';
import { requireSessionLimit } from '../../middleware/requireSessionLimit';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import {
  startSessionSchema,
  saveTargetSchema,
  saveBeliefPairsSchema,
  saveEmotionsSchema,
  saveSudSchema,
  saveAddictionSchema,
  completeSessionSchema,
  idParamSchema,
} from './emdrSession.validation';

const router = Router();

// All EMDR session routes require a valid JWT
router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION ROUTES (no :id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/emdr-session/start
 * Start a new session (or resume an existing draft of the same type).
 * Body: { sessionType: 'memory' | 'future' | 'words' | 'negative' | 'addiction' }
 */
router.post('/start', validate(startSessionSchema), ctrl.startSession);

/**
 * GET /api/emdr-session
 * List all sessions for the authenticated user (paginated).
 * Query: ?page=1&limit=20&status=completed
 */
router.get('/', ctrl.listSessions);

/**
 * GET /api/emdr-session/latest
 * Return the user's most recent session (for "My Space" resume card).
 * ⚠️  Must be declared BEFORE /:id so Express doesn't treat "latest" as an ID.
 */
router.get('/latest', ctrl.getLatest);

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE ROUTES (with :id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/emdr-session/:id
 * Fetch a single session (ownership-checked).
 */
router.get('/:id', validate(idParamSchema), ctrl.getSession);

/**
 * PATCH /api/emdr-session/:id/target
 * Save target description + freeze frame (Steps 1 & 2, non-addiction).
 * Supports both JSON and multipart/form-data with file uploads.
 * Body: { targetDescription, freezeFrame, targetFile?, freezeFrameFile? }
 */
router.patch(
  '/:id/target',
  upload.fields([
    { name: 'targetFile', maxCount: 1 },
    { name: 'freezeFrameFile', maxCount: 1 }
  ]),
  validate(saveTargetSchema),
  ctrl.saveTarget
);

/**
 * PATCH /api/emdr-session/:id/beliefs
 * Save belief pairs with VOC ratings (Steps 3–5, non-addiction).
 * Body: { beliefPairs: [{ negativeBelief, positiveBelief, vocRating }] }
 */
router.patch('/:id/beliefs', validate(saveBeliefPairsSchema), ctrl.saveBeliefPairs);

/**
 * PATCH /api/emdr-session/:id/emotions
 * Save emotions + body location (Steps 6–8, non-addiction).
 * Body: { primaryEmotion, additionalEmotions?, bodyLocation }
 */
router.patch('/:id/emotions', validate(saveEmotionsSchema), ctrl.saveEmotions);

/**
 * PATCH /api/emdr-session/:id/sud
 * Save SUD rating and mark session ready_for_bls (Step 9, non-addiction).
 * Body: { sudRating: 0-10 }
 */
router.patch('/:id/sud', validate(saveSudSchema), ctrl.saveSud);

/**
 * PATCH /api/emdr-session/:id/addiction
 * Save all addiction-path data and mark session ready_for_bls.
 * Body: { aspect, positiveFeeling, pfsRating, associatedThoughts, bodyLocation, visualization }
 */
router.patch('/:id/addiction', validate(saveAddictionSchema), ctrl.saveAddiction);

/**
 * PATCH /api/emdr-session/:id/complete
 * Mark a ready_for_bls session as fully completed (called after BLS finishes).
 */
router.patch('/:id/complete', validate(completeSessionSchema), ctrl.completeSession);

/**
 * PATCH /api/emdr-session/:id/abandon
 * Discard a draft / in_progress session.
 */
router.patch('/:id/abandon', validate(idParamSchema), ctrl.abandonSession);

/**
 * DELETE /api/emdr-session/:id
 * Permanently delete a session (hard delete).
 */
router.delete('/:id', validate(idParamSchema), ctrl.deleteSession);

export default router;
