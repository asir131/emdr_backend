import { Response, NextFunction } from 'express';
import { onboardingService } from './onboarding.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const onboardingController = {

  getStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await onboardingService.getStatus(req.user!.userId));
    } catch (e) { next(e); }
  },

  saveProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { dateOfBirth, sex } = req.body;
      respond(res, await onboardingService.saveProfile(req.user!.userId, dateOfBirth, sex));
    } catch (e) { next(e); }
  },

  saveSafetyCheck: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await onboardingService.saveSafetyCheck(req.user!.userId, req.body));
    } catch (e) { next(e); }
  },

  saveConsent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await onboardingService.saveConsent(req.user!.userId, req.body));
    } catch (e) { next(e); }
  },
};
