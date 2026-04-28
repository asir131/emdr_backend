import mongoose from 'mongoose';
import { TestCategory, TestItem, ITestCategory, ITestItem, DayOfWeek, DAYS_OF_WEEK } from './myTests.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CreateCategoryPayload {
  categoryName: string;
  description?: string | null;
}

interface UpdateCategoryPayload {
  categoryName?: string;
  description?: string | null;
  isActive?: boolean;
}

interface CreateItemPayload {
  itemName: string;
  day?: DayOfWeek;
  description?: string | null;
}

interface UpdateItemPayload {
  itemName?: string;
  day?: DayOfWeek;
  description?: string | null;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate ObjectId format
 */
function validateObjectId(id: string, label: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.validationError(`Invalid ${label}`, 'id');
  }
}

/**
 * Find category and enforce ownership
 */
async function findOwnedCategory(categoryId: string, userId: string): Promise<ITestCategory> {
  validateObjectId(categoryId, 'category ID');

  const category = await TestCategory.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  if (category.userId.toString() !== userId) {
    throw ApiError.forbidden('Access denied to this category');
  }

  return category;
}

/**
 * Find item and enforce ownership
 */
async function findOwnedItem(itemId: string, userId: string): Promise<ITestItem> {
  validateObjectId(itemId, 'item ID');

  const item = await TestItem.findById(itemId).populate('categoryId');
  if (!item) throw ApiError.notFound('Item not found');
  if (item.userId.toString() !== userId) {
    throw ApiError.forbidden('Access denied to this item');
  }

  return item;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const myTestsService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new test category
   */
  async createCategory(userId: string, payload: CreateCategoryPayload): Promise<ITestCategory> {
    // Check for duplicate category name
    const existing = await TestCategory.findOne({
      userId,
      categoryName: payload.categoryName,
    });

    if (existing) {
      throw ApiError.validationError(
        'A category with this name already exists',
        'categoryName'
      );
    }

    const category = await TestCategory.create({
      userId: new mongoose.Types.ObjectId(userId),
      categoryName: payload.categoryName,
      description: payload.description || null,
    });

    logger.info('Test category created', {
      categoryId: category._id,
      userId,
      categoryName: category.categoryName,
    });

    return category;
  },

  /**
   * Get all categories for a user
   */
  async getUserCategories(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isActive?: boolean
  ) {
    const filter: Record<string, unknown> = { userId };
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      TestCategory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TestCategory.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  /**
   * Get a single category by ID
   */
  async getCategoryById(categoryId: string, userId: string): Promise<ITestCategory> {
    return findOwnedCategory(categoryId, userId);
  },

  /**
   * Update a category
   */
  async updateCategory(
    categoryId: string,
    userId: string,
    payload: UpdateCategoryPayload
  ): Promise<ITestCategory> {
    const category = await findOwnedCategory(categoryId, userId);

    // Check for duplicate name if updating categoryName
    if (payload.categoryName && payload.categoryName !== category.categoryName) {
      const duplicate = await TestCategory.findOne({
        userId,
        categoryName: payload.categoryName,
        _id: { $ne: categoryId },
      });

      if (duplicate) {
        throw ApiError.validationError(
          'A category with this name already exists',
          'categoryName'
        );
      }
    }

    // Update fields
    if (payload.categoryName !== undefined) category.categoryName = payload.categoryName;
    if (payload.description !== undefined) category.description = payload.description;
    if (payload.isActive !== undefined) category.isActive = payload.isActive;

    await category.save();

    logger.info('Test category updated', { categoryId, userId });
    return category;
  },

  /**
   * Delete a category (and all its items)
   */
  async deleteCategory(categoryId: string, userId: string): Promise<{ message: string }> {
    const category = await findOwnedCategory(categoryId, userId);

    // Delete all items in this category
    const deletedItems = await TestItem.deleteMany({ categoryId });

    // Delete the category
    await category.deleteOne();

    logger.info('Test category deleted', {
      categoryId,
      userId,
      deletedItemsCount: deletedItems.deletedCount,
    });

    return {
      message: `Category and ${deletedItems.deletedCount} items deleted successfully`,
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new item in a category
   */
  async createItem(
    categoryId: string,
    userId: string,
    payload: CreateItemPayload
  ): Promise<ITestItem> {
    // Verify category exists and user owns it
    await findOwnedCategory(categoryId, userId);

    // Auto-calculate day from current date if not provided
    const day: DayOfWeek = payload.day ?? DAYS_OF_WEEK[new Date().getDay()];

    const item = await TestItem.create({
      userId     : new mongoose.Types.ObjectId(userId),
      categoryId : new mongoose.Types.ObjectId(categoryId),
      itemName   : payload.itemName,
      day,
      description: payload.description ?? null,
    });

    // Update denormalized item count
    await TestCategory.findByIdAndUpdate(categoryId, { $inc: { itemCount: 1 } });

    logger.info('Test item created', {
      itemId  : item._id,
      categoryId,
      userId,
      itemName: item.itemName,
      day     : item.day,
    });

    return item;
  },

  /**
   * Get all items in a category
   */
  async getCategoryItems(
    categoryId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
    day?: DayOfWeek,
    isActive?: boolean
  ) {
    // Verify category exists and user owns it
    await findOwnedCategory(categoryId, userId);

    const filter: Record<string, unknown> = { categoryId };
    if (day) filter.day = day;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TestItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TestItem.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  /**
   * Get a single item by ID
   */
  async getItemById(itemId: string, userId: string): Promise<ITestItem> {
    return findOwnedItem(itemId, userId);
  },

  /**
   * Update an item
   */
  async updateItem(
    itemId: string,
    userId: string,
    payload: UpdateItemPayload
  ): Promise<ITestItem> {
    const item = await findOwnedItem(itemId, userId);

    // Update fields
    if (payload.itemName !== undefined) item.itemName = payload.itemName;
    if (payload.day !== undefined) item.day = payload.day;
    if (payload.description !== undefined) item.description = payload.description;
    if (payload.isActive !== undefined) item.isActive = payload.isActive;

    await item.save();

    logger.info('Test item updated', { itemId, userId });
    return item;
  },

  /**
   * Delete an item
   */
  async deleteItem(itemId: string, userId: string): Promise<{ message: string }> {
    const item = await findOwnedItem(itemId, userId);
    const { categoryId } = item;
    await item.deleteOne();

    // Update denormalized item count
    await TestCategory.findByIdAndUpdate(categoryId, { $inc: { itemCount: -1 } });

    logger.info('Test item deleted', { itemId, userId, categoryId });
    return { message: 'Item deleted successfully' };
  },

  /**
   * Get all items for a user (across all categories)
   */
  async getAllUserItems(
    userId: string,
    page: number = 1,
    limit: number = 50,
    day?: DayOfWeek
  ) {
    const filter: Record<string, unknown> = { userId };
    if (day) filter.day = day;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TestItem.find(filter)
        .populate('categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TestItem.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  },

  /**
   * Get category statistics
   */
  async getCategoryStats(categoryId: string, userId: string) {
    await findOwnedCategory(categoryId, userId);

    const stats = await TestItem.aggregate([
      { $match: { categoryId: new mongoose.Types.ObjectId(categoryId) } },
      {
        $group: {
          _id: '$day',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalItems = await TestItem.countDocuments({ categoryId });
    const activeItems = await TestItem.countDocuments({ categoryId, isActive: true });

    return {
      totalItems,
      activeItems,
      inactiveItems: totalItems - activeItems,
      itemsByDay: stats.map((s) => ({
        day: s._id,
        count: s.count,
      })),
    };
  },
};

