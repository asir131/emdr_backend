import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const planIdParam = z.object({ id: objectId });

const stepReviewSchema = z.object({
  stepIndex:   z.number().int().min(0),
  status:      z.enum(['completed', 'in-progress', 'not-started']),
  sudsRating:  z.number().int().min(0).max(10).optional(),
  problemType: z.enum(['anticipation', 'during', 'physical', 'thoughts', 'other']).optional(),
  plannedDay:  z.string().trim().max(20).optional(),
  notes:       z.string().trim().max(1000).optional(),
});

// ========== WITH planId (original) ==========

export const saveReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    weekNumber:     z.number({ required_error: 'weekNumber is required' }).int().min(1),
    overallFeeling: z.enum(['good', 'challenging', 'mixed', 'unable'], {
      required_error: 'overallFeeling is required',
    }),
    stepReviews: z
      .array(stepReviewSchema)
      .min(1, 'At least one step review is required'),
  }),
});

export const updateStepReviewSchema = z.object({
  params: z.object({ id: objectId }),
  body: stepReviewSchema.extend({
    weekNumber: z.number({ required_error: 'weekNumber is required' }).int().min(1),
  }),
});

export const idParamSchema = z.object({
  params: planIdParam,
});

// ========== WITHOUT planId (auto-detect) ==========

export const saveReviewSchemaAuto = z.object({
  body: z.object({
    weekNumber:     z.number({ required_error: 'weekNumber is required' }).int().min(1),
    overallFeeling: z.enum(['good', 'challenging', 'mixed', 'unable'], {
      required_error: 'overallFeeling is required',
    }),
    stepReviews: z
      .array(stepReviewSchema)
      .min(1, 'At least one step review is required'),
  }),
});

export const updateStepReviewSchemaAuto = z.object({
  body: stepReviewSchema.extend({
    weekNumber: z.number({ required_error: 'weekNumber is required' }).int().min(1),
  }),
});
