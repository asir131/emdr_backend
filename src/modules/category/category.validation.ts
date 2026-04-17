import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

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
  }),
});

export const updateMediaSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    categoryId: objectId.optional(),
    status:     z.enum(['active', 'inactive']).optional(),
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
