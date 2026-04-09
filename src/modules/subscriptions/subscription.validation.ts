import { z } from 'zod';
import { SubscriptionPlanType } from './subscription.model';

export const planIdSchema = z.object({
  body: z.object({
    planId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid plan ID'),
  }),
});

export const createPlanSchema = z.object({
  body: z.object({
    name:         z.string({ required_error: 'Plan name is required' }).min(2).max(100).trim(),
    type:         z.nativeEnum(SubscriptionPlanType),
    price:        z.number({ required_error: 'Price is required' }).min(0),
    currency:     z.string().min(1).default('£'),
    interval:     z.enum(['monthly', 'yearly']).default('monthly'),
    description:  z.string().optional(),
    tagline:      z.string().optional(),
    features:     z.array(z.string()).min(1, 'At least one feature is required'),
    spotsAvailable: z.number().int().optional(),
    isActive:     z.boolean().optional(),
    isCommunityAccess: z.boolean().optional(),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid plan ID'),
  }),
  body: z.object({
    name:         z.string().min(2).max(100).trim().optional(),
    type:         z.nativeEnum(SubscriptionPlanType).optional(),
    price:        z.number().min(0).optional(),
    currency:     z.string().optional(),
    interval:     z.enum(['monthly', 'yearly']).optional(),
    description:  z.string().optional(),
    tagline:      z.string().optional(),
    features:     z.array(z.string()).optional(),
    spotsAvailable: z.number().int().optional(),
    isActive:     z.boolean().optional(),
    isCommunityAccess: z.boolean().optional(),
  }),
});

export const reviewRequestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid request ID'),
  }),
  body: z.object({
    status:  z.enum(['approved', 'rejected']),
    comment: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  }),
});
