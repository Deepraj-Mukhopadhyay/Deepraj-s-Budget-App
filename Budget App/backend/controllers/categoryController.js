const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const DEFAULT_CATEGORIES = [
  { name: 'Grocery', slug: 'grocery', type: 'expense', icon: '🛒', isDefault: true },
  { name: 'Food', slug: 'food', type: 'expense', icon: '🍽️', isDefault: true },
  { name: 'Electricity', slug: 'electricity', type: 'expense', icon: '⚡', isDefault: true },
  { name: 'Water', slug: 'water', type: 'expense', icon: '💧', isDefault: true },
  { name: 'Cleaning', slug: 'cleaning', type: 'expense', icon: '🧹', isDefault: true },
  { name: 'Room', slug: 'room', type: 'expense', icon: '🏠', isDefault: true },
  { name: 'Other', slug: 'other', type: 'expense', icon: '📦', isDefault: true },
  { name: 'Contribution', slug: 'contribution', type: 'income', icon: '💰', isDefault: true }
];

/**
 * @desc    Get all categories (defaults + user custom categories)
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    const customCategories = await Category.find({ userId: req.user._id });
    
    // Combine defaults and custom categories
    const allCategories = [
      ...DEFAULT_CATEGORIES,
      ...customCategories.map(c => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        type: c.type,
        icon: c.icon,
        isDefault: false
      }))
    ];

    return successResponse(res, 200, 'Categories retrieved successfully.', allCategories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, icon, type = 'expense' } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 400, 'Category name is required.');
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if slug conflicts with default categories
    const isDefaultConflict = DEFAULT_CATEGORIES.some(c => c.slug === slug);
    if (isDefaultConflict) {
      return errorResponse(res, 409, 'A standard category with this name already exists.');
    }

    // Check if user already created this category
    const existing = await Category.findOne({ userId: req.user._id, slug });
    if (existing) {
      return errorResponse(res, 409, 'Category already exists.');
    }

    const category = await Category.create({
      userId: req.user._id,
      name: name.trim(),
      slug,
      type,
      icon: icon || '🏷️',
      isDefault: false
    });

    return successResponse(res, 201, 'Category created successfully.', category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return errorResponse(res, 404, 'Category not found or cannot delete default category.');
    }

    return successResponse(res, 200, 'Category deleted successfully.', {
      deletedId: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
  DEFAULT_CATEGORIES
};
