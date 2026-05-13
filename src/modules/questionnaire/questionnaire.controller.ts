import { Response, NextFunction } from 'express';
import { questionnaireService as svc } from './questionnaire.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const questionnaireController = {

  // ── POST /questionnaire/phq9 ────────────────────────────────────────────────
  submitPHQ9: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.submitPHQ9(req.user!.userId, req.body.answers), 201);
    } catch (e) { next(e); }
  },

  // ── POST /questionnaire/gad7 ────────────────────────────────────────────────
  submitGAD7: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.submitGAD7(req.user!.userId, req.body.answers), 201);
    } catch (e) { next(e); }
  },

  // ── POST /questionnaire/des11 ───────────────────────────────────────────────
  submitDES11: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.submitDES11(req.user!.userId, req.body.answers), 201);
    } catch (e) { next(e); }
  },

  // ── GET /questionnaire/phq9 — all PHQ-9 submissions ────────────────────────
  getAllPHQ9: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.getAll(req.user!.userId, 'phq9'));
    } catch (e) { next(e); }
  },

  // ── GET /questionnaire/gad7 — all GAD-7 submissions ────────────────────────
  getAllGAD7: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.getAll(req.user!.userId, 'gad7'));
    } catch (e) { next(e); }
  },

  // ── GET /questionnaire/des11 — all DES-11 submissions ──────────────────────
  getAllDES11: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.getAll(req.user!.userId, 'des11'));
    } catch (e) { next(e); }
  },

  // ── GET /questionnaire/:id — single submission by ID ───────────────────────
  getOne: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await svc.getOne(req.user!.userId, req.params.id));
    } catch (e) { next(e); }
  },
};
