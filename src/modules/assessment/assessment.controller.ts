import { Response, NextFunction } from 'express';
import { assessmentService } from './assessment.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const assessmentController = {

  submit: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { phq9Answers, gad7Answers, des11Answers } = req.body;
      respond(res, await assessmentService.submit(req.user!.userId, phq9Answers, gad7Answers, des11Answers), 201);
    } catch (e) { next(e); }
  },

  getResult: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await assessmentService.getLatestResult(req.user!.userId));
    } catch (e) { next(e); }
  },
};
