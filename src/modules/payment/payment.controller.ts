import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const paymentController = {

  createPaymentIntent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.body;
      respond(res, await paymentService.createPaymentIntent(req.user!.userId, planId), 201);
    } catch (e) { next(e); }
  },

  confirmPayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentIntentId } = req.body;
      respond(res, await paymentService.confirmPayment(req.user!.userId, paymentIntentId));
    } catch (e) { next(e); }
  },

  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await paymentService.getHistory(req.user!.userId));
    } catch (e) { next(e); }
  },

  // Raw body needed for Stripe webhook signature verification
  webhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const result = await paymentService.handleWebhook(req.body as Buffer, sig);
      res.json(result);
    } catch (e) { next(e); }
  },
};
