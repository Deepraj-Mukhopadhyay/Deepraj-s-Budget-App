const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * @desc    Create a new budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || !category.trim()) {
      return errorResponse(res, 400, 'Budget category is required.');
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return errorResponse(res, 400, 'Valid positive budget amount is required.');
    }

    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    if (targetMonth < 1 || targetMonth > 12) {
      return errorResponse(res, 400, 'Month must be between 1 and 12.');
    }

    const normalizedCategory = category.toLowerCase().trim();

    // Check if budget already exists for this category/month/year
    const existing = await Budget.findOne({
      userId: req.user._id,
      category: normalizedCategory,
      month: targetMonth,
      year: targetYear
    });

    if (existing) {
      // Update existing budget
      existing.amount = Number(numAmount.toFixed(2));
      await existing.save();
      return successResponse(res, 200, 'Budget updated successfully.', existing);
    }

    const budget = await Budget.create({
      userId: req.user._id,
      category: normalizedCategory,
      amount: Number(numAmount.toFixed(2)),
      month: targetMonth,
      year: targetYear
    });

    return successResponse(res, 201, 'Budget created successfully.', budget);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all budgets for user with optional month/year filter & spending analytics
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const { month, year, category } = req.query;
    const query = { userId: req.user._id };

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (category) query.category = category.toLowerCase().trim();

    const budgets = await Budget.find(query).sort({ year: -1, month: -1, category: 1 });

    // Calculate actual spending for each budget
    const budgetResults = await Promise.all(
      budgets.map(async (budget) => {
        const paddedMonth = String(budget.month).padStart(2, '0');
        const prefix = `${budget.year}-${paddedMonth}`;

        // Aggregate expenses for this category and month
        const spendingAgg = await Transaction.aggregate([
          {
            $match: {
              userId: req.user._id,
              type: 'expense',
              category: budget.category,
              reversed: { $ne: true },
              date: { $regex: `^${prefix}` }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' }
            }
          }
        ]);

        const spent = spendingAgg.length > 0 ? Number(spendingAgg[0].totalSpent.toFixed(2)) : 0;
        const remaining = Number((budget.amount - spent).toFixed(2));
        const percentageUsed = budget.amount > 0 ? Number(((spent / budget.amount) * 100).toFixed(1)) : 0;

        return {
          ...budget.toObject(),
          spent,
          remaining,
          percentageUsed,
          isOverBudget: spent > budget.amount
        };
      })
    );

    return successResponse(res, 200, 'Budgets retrieved successfully.', budgetResults);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single budget by ID
 * @route   GET /api/budgets/:id
 * @access  Private
 */
const getBudgetById = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return errorResponse(res, 404, 'Budget not found.');
    }

    const paddedMonth = String(budget.month).padStart(2, '0');
    const prefix = `${budget.year}-${paddedMonth}`;

    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          category: budget.category,
          reversed: { $ne: true },
          date: { $regex: `^${prefix}` }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const spent = spendingAgg.length > 0 ? Number(spendingAgg[0].totalSpent.toFixed(2)) : 0;
    const remaining = Number((budget.amount - spent).toFixed(2));
    const percentageUsed = budget.amount > 0 ? Number(((spent / budget.amount) * 100).toFixed(1)) : 0;

    return successResponse(res, 200, 'Budget retrieved successfully.', {
      ...budget.toObject(),
      spent,
      remaining,
      percentageUsed,
      isOverBudget: spent > budget.amount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    const { amount, category, month, year } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return errorResponse(res, 404, 'Budget not found.');
    }

    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        return errorResponse(res, 400, 'Valid positive amount required.');
      }
      budget.amount = Number(num.toFixed(2));
    }

    if (category) budget.category = category.toLowerCase().trim();
    if (month) budget.month = Number(month);
    if (year) budget.year = Number(year);

    await budget.save();

    return successResponse(res, 200, 'Budget updated successfully.', budget);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return errorResponse(res, 404, 'Budget not found.');
    }

    return successResponse(res, 200, 'Budget deleted successfully.', {
      deletedId: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
};
