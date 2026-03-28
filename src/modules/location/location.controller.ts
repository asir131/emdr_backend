import { Response, NextFunction } from 'express';
import { locationService } from './location.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const locationController = {

  // POST /location
  share: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await locationService.shareLocation(req.user!.userId, req.body);
      respond(res, data, 201);
    } catch (e) { next(e); }
  },

  // GET /location
  getMyLocation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await locationService.getMyLocation(req.user!.userId));
    } catch (e) { next(e); }
  },
};
