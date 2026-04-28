import { z } from 'zod';
import { DAYS_OF_WEEK } from './myTests.model';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Validates a 24-char hex MongoDB ObjectId */
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');

/** Non-empty trimmed string */
const nonEmptyStr = (minLen: number, maxLen: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(minLen, `${label} must be at least ${minLen} characters`)
    .max(maxLen, `${label} must not exceed ${maxLen} characters`);

/** Reusable :id param */
const idParam = z.object({ id: objectId });

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY VALIDATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/my-tests/categories
 * Create a new test category
 */
export const createCategorySchema = z.object({
  body: z.object({
    categoryName: nonEmptyStr(1, 100, 'Category name'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .optional()
      .nullable(),
  }),
});

/**
 * PATCH /api/my-tests/categories/:id
 * Update a test category
 */
export const updateCategorySchema = z.object({
  params: idParam,
  body: z.object({
    categoryName: nonEmptyStr(1, 100, 'Category name').optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * GET /api/my-tests/categories/:id
 * DELETE /api/my-tests/categories/:id
 */
export const categoryIdParamSchema = z.object({
  params: idParam,
});

// ─────────────────────────────────────────────────────────────────────────────
// ITEM VALIDATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/my-tests/categories/:categoryId/items
 * Create a new item in a category
 */
export const createItemSchema = z.object({
  params: z.object({
    categoryId: objectId,
  }),
  body: z.object({
    itemName: nonEmptyStr(1, 200, 'Item name'),
    day: z
      .enum(DAYS_OF_WEEK as [string, ...string[]], {
        invalid_type_error: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`,
      })
      .optional(), // Optional - auto-calculated if not provided
    description: z
      .string()
      .trim()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .nullable(),
  }),
});

/**
 * PATCH /api/my-tests/items/:id
 * Update an item
 */
export const updateItemSchema = z.object({
  params: idParam,
  body: z.object({
    itemName: nonEmptyStr(1, 200, 'Item name').optional(),
    day: z
      .enum(DAYS_OF_WEEK as [string, ...string[]], {
        invalid_type_error: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`,
      })
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * GET /api/my-tests/items/:id
 * DELETE /api/my-tests/items/:id
 */
export const itemIdParamSchema = z.object({
  params: idParam,
});

/**
 * GET /api/my-tests/categories/:categoryId/items
 * List items in a category
 */
export const listItemsSchema = z.object({
  params: z.object({
    categoryId: objectId,
  }),
});

