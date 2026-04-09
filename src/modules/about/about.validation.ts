import { z } from 'zod';

export const aboutUsSchema = z.object({
  body: z.object({
    overview: z
      .string({ required_error: 'Overview is required' })
      .min(10, 'Overview must be at least 10 characters')
      .trim(),
    sections: z
      .array(
        z.object({
          title: z.string().min(1).max(100).trim(),
          content: z.string().min(1).trim(),
          order: z.number().int().min(0),
        })
      )
      .min(1, 'At least one section is required (e.g., Mission, Vision)'),
  }),
});
