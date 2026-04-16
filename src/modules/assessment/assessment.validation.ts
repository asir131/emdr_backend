import { z } from 'zod';

const score0to3 = z.number().int().min(0).max(3);
const score0to100 = z.number().min(0).max(100);

export const assessmentSchema = z.object({
  body: z.object({
    // PHQ-9: 9 questions, each 0-3
    phq9Answers: z.array(score0to3)
      .length(9, 'PHQ-9 requires exactly 9 answers'),

    // GAD-7: 7 questions, each 0-3
    gad7Answers: z.array(score0to3)
      .length(7, 'GAD-7 requires exactly 7 answers'),

    // DES-11: 8 questions, each 0-100
    des11Answers: z.array(score0to100)
      .length(8, 'DES-11 requires exactly 8 answers'),
  }),
});
