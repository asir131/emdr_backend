import { z } from 'zod';

export const createVoiceAudioSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(2000),
    cacheNamespace: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9:_-]+$/i)
      .optional(),
  }),
});
