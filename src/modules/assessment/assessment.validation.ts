import { z } from 'zod';

const score0to3 = z.number().int().min(0).max(3);
const score0to100 = z.number().min(0).max(100);

// Single submission schema
export const assessmentSchema = z.object({
  body: z.object({
    phq9Answers: z.array(score0to3).length(9, 'PHQ-9 requires exactly 9 answers'),
    gad7Answers: z.array(score0to3).length(7, 'GAD-7 requires exactly 7 answers'),
    des11Answers: z.array(score0to100).length(8, 'DES-11 requires exactly 8 answers'),
  }),
});

// Stagged submission schemas
export const phq9Schema = z.object({
  body: z.object({
    phq9Answers: z.array(score0to3).length(9),
  }),
});

export const gad7Schema = z.object({
  body: z.object({
    gad7Answers: z.array(score0to3).length(7),
  }),
});

export const des11Schema = z.object({
  body: z.object({
    des11Answers: z.array(score0to100).length(8),
  }),
});

export const statusUpdateSchema = z.object({
  body: z.object({
    assessmentId: z.string().min(1, 'Assessment ID is required'),
    status: z.enum(['pending', 'approved', 'cancelled'], {
      errorMap: () => ({ message: 'Status must be pending, approved, or cancelled' })
    }),
  }),
});
