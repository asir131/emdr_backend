import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

export const createItemSchema = z.object({
  body: z.object({
    type:      z.enum(['environment', 'object', 'sound'], { required_error: 'type is required' }),
    name:      z.string({ required_error: 'name is required' }).min(2).max(100).trim(),
    fileUrl:   z.string().url('Invalid URL').optional(),   // optional if file uploaded
    isActive:  z.coerce.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name:      z.string().min(2).max(100).trim().optional(),
    fileUrl:   z.string().url('Invalid URL').optional(),
    isActive:  z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listQuerySchema = z.object({
  query: z.object({
    type:     z.enum(['environment', 'object', 'sound']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const saveSettingsSchema = z.object({
  body: z.object({
    environmentId: z.string({ required_error: 'environmentId (image URL) is required' }).url('Invalid URL'),
    iconUrl:       z.string({ required_error: 'iconUrl is required' }).url('Invalid URL'),
    soundId:       z.string({ required_error: 'soundId (audio URL) is required' }).url('Invalid URL'),
    direction:     z.enum(['left-right', 'diagonal-down', 'diagonal-up']).default('left-right'),
    speed:         z.enum(['slow', 'medium', 'fast']).default('medium'),
  }),
});
