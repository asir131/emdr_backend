import { Response, NextFunction } from 'express';
import { assessmentService } from './assessment.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const assessmentController = {

  submitPhq9: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { phq9Answers } = req.body;
      const result = await assessmentService.submitPhq9(req.user!.userId, phq9Answers);
      respond(res, result, 201);
    } catch (e) { next(e); }
  },

  submitGad7: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { gad7Answers } = req.body;
      const result = await assessmentService.submitGad7(req.user!.userId, gad7Answers);
      respond(res, result, 201);
    } catch (e) { next(e); }
  },

  submitDes11: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { des11Answers } = req.body;
      const result = await assessmentService.submitDes11(req.user!.userId, des11Answers);
      respond(res, result, 201);
    } catch (e) { next(e); }
  },

  submitFull: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { phq9Answers, gad7Answers, des11Answers } = req.body;
      const result = await assessmentService.submitFull(req.user!.userId, phq9Answers, gad7Answers, des11Answers);
      respond(res, result, 201);
    } catch (e) { next(e); }
  },

  getResult: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // User can see their own result, Admin can see any user's result
      const userId = req.user!.role === 'admin' && req.query.userId 
        ? req.query.userId as string 
        : req.user!.userId;
      
      respond(res, await assessmentService.getLatestResult(userId));
    } catch (e) { next(e); }
  },

  updateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { assessmentId, status } = req.body;
      const result = await assessmentService.updateStatus(assessmentId, status);
      respond(res, result);
    } catch (e) { next(e); }
  },
};
