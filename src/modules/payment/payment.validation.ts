import { z } from 'zod';

export const createIntentSchema = z.object({
  body: z.object({
    planId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid plan ID'),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string({ required_error: 'Payment intent ID is required' }).min(1),
  }),
});
