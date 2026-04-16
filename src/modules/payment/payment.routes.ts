import { Router } from 'express';
import { paymentController as ctrl } from './payment.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { createIntentSchema, confirmPaymentSchema } from './payment.validation';
import express from 'express';

const router = Router();

// Stripe webhook — raw body required BEFORE json middleware
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  ctrl.webhook
);

// Protected routes
router.use(authenticate);

router.post('/create-intent', validate(createIntentSchema), ctrl.createPaymentIntent);
router.post('/confirm',       validate(confirmPaymentSchema), ctrl.confirmPayment);
router.get('/history',        ctrl.getHistory);

export default router;
