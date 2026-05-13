import { z } from 'zod';

const score0to3   = z.number().int().min(0).max(3);
const score0to100 = z.number().min(0).max(100);

export const phq9Schema = z.object({
  body: z.object({
    answers: z.array(score0to3).length(9, 'PHQ-9 requires exactly 9 answers (0–3 each)'),
  }),
});

export const gad7Schema = z.object({
  body: z.object({
    answers: z.array(score0to3).length(7, 'GAD-7 requires exactly 7 answers (0–3 each)'),
  }),
});

export const des11Schema = z.object({
  body: z.object({
    answers: z.array(score0to100).length(8, 'DES-11 requires exactly 8 answers (0–100 each)'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),
  }),
});
