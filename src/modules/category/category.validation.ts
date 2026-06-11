import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const bilateralAudioProfileSchema = z.object({
  mode: z.enum(['one-shot', 'two-hit-stereo', 'stereo-track', 'unknown']),
  durationSec: z.coerce.number().min(0).optional(),
  hits: z.array(z.object({
    timeSec: z.coerce.number().min(0),
    side: z.enum(['left', 'right', 'center']),
  })).max(32).optional(),
  beatIntervalMs: z.coerce.number().min(0).optional(),
  firstBeatSide: z.enum(['left', 'right', 'center']).optional(),
  preserveOriginalPan: z.coerce.boolean().optional(),
  analysisStatus: z.enum(['pending', 'success', 'failed']).optional(),
  analysisError: z.string().max(1000).optional(),
});

const optionalJsonProfile = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, bilateralAudioProfileSchema.optional());

// ── Category ──────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  body: z.object({
    categoryName: z.string({ required_error: 'categoryName is required' }).min(2).max(100).trim(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    categoryName: z.string().min(2).max(100).trim().optional(),
    isActive:     z.coerce.boolean().optional(),
  }),
});

 export const createMediaSchema = z.object({
  body: z.object({
    name:       z.string({ required_error: 'Name is required' }).min(1).max(200).trim(),
    categoryId: objectId,
    status:     z.enum(['active', 'inactive']).default('active'),
    defaultFacing: z.enum(['left', 'right']).optional(),
    bilateralAudioProfile: optionalJsonProfile,
  }),
});

export const updateMediaSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    categoryId: objectId.optional(),
    status:     z.enum(['active', 'inactive']).optional(),
    defaultFacing: z.enum(['left', 'right']).optional(),
    bilateralAudioProfile: bilateralAudioProfileSchema.optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listQuerySchema = z.object({
  query: z.object({
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(100).default(20),
    categoryId: objectId.optional(),
    status:     z.enum(['active', 'inactive']).optional(),
  }),
});
