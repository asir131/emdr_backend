import { z } from 'zod';

export const createFaqSchema = z.object({
  body: z.object({
    question: z.string({ required_error: 'Question is required' }).min(5).max(300).trim(),
    answer:   z.string({ required_error: 'Answer is required' }).min(5).max(2000).trim(),
    order:    z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateFaqSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid FAQ ID'),
  }),
  body: z.object({
    question: z.string().min(5).max(300).trim().optional(),
    answer:   z.string().min(5).max(2000).trim().optional(),
    order:    z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid FAQ ID'),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    // Array of { id, order } to bulk reorder
    items: z.array(z.object({
      id:    z.string().regex(/^[a-f\d]{24}$/i, 'Invalid FAQ ID'),
      order: z.number().int().min(0),
    })).min(1),
  }),
});
