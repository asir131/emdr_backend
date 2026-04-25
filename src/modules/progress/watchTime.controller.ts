import { Response, NextFunction } from 'express';
import { watchTimeService } from './watchTime.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const watchTimeController = {
  /**
   * Log Heartbeat/Time spent
   */
  logTime: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { journeyId, seconds = 30 } = req.body;
      if (!journeyId) throw new Error('journeyId is required');

      const result = await watchTimeService.logTime(req.user!.userId, journeyId, seconds);
      ok(res, result);
    } catch (e) { next(e); }
  },

  /**
   * Get overall stats for a journey
   */
  getJourneyStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { journeyId } = req.params;
      const result = await watchTimeService.getJourneyTotalTime(req.user!.userId, journeyId);
      ok(res, result);
    } catch (e) { next(e); }
  },

  /**
   * Get user's weekly usage report
   */
  getWeeklyReport: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await watchTimeService.getWeeklyStats(req.user!.userId);
      ok(res, result);
    } catch (e) { next(e); }
  },
};
