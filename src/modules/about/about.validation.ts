import { z } from 'zod';

export const aboutUsSchema = z.object({
  body: z.object({
    aboutUs: z
      .string({ required_error: 'aboutUs content is required' })
      .min(10, 'aboutUs must be at least 10 characters')
      .max(10000, 'aboutUs cannot exceed 10000 characters')
      .trim(),
  }),
});
