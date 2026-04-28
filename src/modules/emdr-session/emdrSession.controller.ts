import { Response, NextFunction } from 'express';
import { emdrSessionService } from './emdrSession.service';
import { AuthRequest } from '../../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE HELPER
// ─────────────────────────────────────────────────────────────────────────────

const ok = (res: Response, data: unknown, status = 200): void => {
  res.status(status).json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

export const emdrSessionController = {

  // ── 1. POST /api/emdr-session/start ──────────────────────────────────────
  startSession: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.startSession(
        req.user!.userId,
        req.body.sessionType,
      );
      ok(res, session, 201);
    } catch (e) { next(e); }
  },

  // ── 2. PATCH /api/emdr-session/:id/target ────────────────────────────────
  saveTarget: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const session = await emdrSessionService.saveTarget(
        req.params.id,
        req.user!.userId,
        {
          ...req.body,
          targetFile: files?.targetFile?.[0],
          freezeFrameFile: files?.freezeFrameFile?.[0],
        },
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 3. PATCH /api/emdr-session/:id/beliefs ───────────────────────────────
  saveBeliefPairs: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.saveBeliefPairs(
        req.params.id,
        req.user!.userId,
        req.body.beliefPairs,
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 4. PATCH /api/emdr-session/:id/emotions ──────────────────────────────
  saveEmotions: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.saveEmotions(
        req.params.id,
        req.user!.userId,
        req.body,
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 5. PATCH /api/emdr-session/:id/sud ───────────────────────────────────
  saveSud: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.saveSud(
        req.params.id,
        req.user!.userId,
        req.body.sudRating,
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 6. PATCH /api/emdr-session/:id/addiction ─────────────────────────────
  saveAddiction: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.saveAddiction(
        req.params.id,
        req.user!.userId,
        req.body, // addictionContext payload
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 7. PATCH /api/emdr-session/:id/complete ──────────────────────────────
  completeSession: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.completeSession(
        req.params.id,
        req.user!.userId,
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 8. PATCH /api/emdr-session/:id/abandon ───────────────────────────────
  abandonSession: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await emdrSessionService.abandonSession(
        req.params.id,
        req.user!.userId,
      );
      ok(res, result);
    } catch (e) { next(e); }
  },

  // ── 9. GET /api/emdr-session/:id ─────────────────────────────────────────
  getSession: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.getSessionById(
        req.params.id,
        req.user!.userId,
      );
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 10. GET /api/emdr-session/latest ─────────────────────────────────────
  getLatest: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await emdrSessionService.getLatestSession(req.user!.userId);
      ok(res, session);
    } catch (e) { next(e); }
  },

  // ── 11. GET /api/emdr-session ─────────────────────────────────────────────
  //    Supports: ?page=1&limit=20&status=completed
  listSessions: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;

      const result = await emdrSessionService.getUserSessions(
        req.user!.userId,
        page,
        limit,
        status,
      );
      ok(res, result);
    } catch (e) { next(e); }
  },

  // ── 12. DELETE /api/emdr-session/:id ─────────────────────────────────────
  deleteSession: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await emdrSessionService.deleteSession(
        req.params.id,
        req.user!.userId,
      );
      ok(res, result);
    } catch (e) { next(e); }
  },
};
