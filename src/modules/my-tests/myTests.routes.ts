import { Router } from 'express';
import { myTestsController as ctrl } from './myTests.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  itemIdParamSchema,
  listItemsSchema,
} from './myTests.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/my-tests/categories
 * Create a new test category
 * Body: { categoryName: string, description?: string }
 */
router.post('/categories', validate(createCategorySchema), ctrl.createCategory);

/**
 * GET /api/my-tests/categories
 * List all categories for the authenticated user
 * Query: ?page=1&limit=20&isActive=true
 */
router.get('/categories', ctrl.listCategories);

/**
 * GET /api/my-tests/categories/:id
 * Get a single category by ID
 */
router.get('/categories/:id', validate(categoryIdParamSchema), ctrl.getCategory);

/**
 * PATCH /api/my-tests/categories/:id
 * Update a category
 * Body: { categoryName?: string, description?: string, isActive?: boolean }
 */
router.patch('/categories/:id', validate(updateCategorySchema), ctrl.updateCategory);

/**
 * DELETE /api/my-tests/categories/:id
 * Delete a category and all its items
 */
router.delete('/categories/:id', validate(categoryIdParamSchema), ctrl.deleteCategory);

/**
 * GET /api/my-tests/categories/:id/stats
 * Get category statistics (item count by day, etc.)
 */
router.get('/categories/:id/stats', validate(categoryIdParamSchema), ctrl.getCategoryStats);

// ═════════════════════════════════════════════════════════════════════════════
// ITEM ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/my-tests/categories/:categoryId/items
 * Accepts multipart/form-data (image optional).
 * Multer runs inside the controller — so NO validate() middleware here.
 */
router.post('/categories/:categoryId/items', ctrl.createItem);

/**
 * GET /api/my-tests/categories/:categoryId/items
 * List all items in a category
 * Query: ?page=1&limit=50&day=Monday&isActive=true
 */
router.get('/categories/:categoryId/items', validate(listItemsSchema), ctrl.listCategoryItems);

/**
 * GET /api/my-tests/items
 * List all items for the user (across all categories)
 * Query: ?page=1&limit=50&day=Monday
 */
router.get('/items', ctrl.listAllItems);

/**
 * GET /api/my-tests/items/:id
 * Get a single item by ID
 */
router.get('/items/:id', validate(itemIdParamSchema), ctrl.getItem);

/**
 * PATCH /api/my-tests/items/:id
 * Accepts multipart/form-data (image optional).
 * Multer runs inside the controller — so NO validate() middleware here.
 */
router.patch('/items/:id', ctrl.updateItem);

/**
 * DELETE /api/my-tests/items/:id
 * Delete an item
 */
router.delete('/items/:id', validate(itemIdParamSchema), ctrl.deleteItem);

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/my-tests/admin/items/make-global
 * Admin — bulk mark existing items as global (one-time migration)
 * Body: { itemIds: ["id1","id2"] } — or empty body to mark ALL items as global
 */
router.patch('/admin/items/make-global', requireAdmin, ctrl.makeItemsGlobal);

/**
 * GET /api/my-tests/admin/items
 * Admin — list ALL items across all users (for dashboard/chart)
 */
router.get('/admin/items', requireAdmin, ctrl.listAllItemsAdmin);

/**
 * POST /api/my-tests/admin/categories/:categoryId/items
 * Admin — create a global item (visible to ALL users)
 * form-data: itemName, description?, day?, image?
 */
router.post('/admin/categories/:categoryId/items', requireAdmin, ctrl.createGlobalItem);

export default router;

