import { Request, Response, NextFunction } from 'express';
import { termsService } from './terms.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const termsController = {

  // PUBLIC
  getActive: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.getActive();
      respond(res, data);
    } catch (e) { next(e); }
  },

  // USER — accept active T&C
  acceptTerms: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { termsId } = req.body;
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const data = await termsService.acceptTerms(
        req.user!.userId,
        termsId,
        ipAddress,
        userAgent
      );
      respond(res, data);
    } catch (e) { next(e); }
  },

  // USER — check if accepted current T&C
  checkAcceptance: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.checkAcceptance(req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  // ADMIN
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.getAll();
      respond(res, data);
    } catch (e) { next(e); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.getById(req.params.id);
      respond(res, data);
    } catch (e) { next(e); }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.create(req.body, req.user!.userId);
      respond(res, data, 201);
    } catch (e) { next(e); }
  },

  replace: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.replace(req.params.id, req.body, req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.update(req.params.id, req.body, req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  setActive: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.setActive(req.params.id, req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.delete(req.params.id);
      respond(res, data);
    } catch (e) { next(e); }
  },

  getAcceptanceStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await termsService.getAcceptanceStats(req.params.id);
      respond(res, data);
    } catch (e) { next(e); }
  },
};
