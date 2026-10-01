const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { successResponse } = require('../utils/responseHandler');

/**
 * Helper to get current month string YYYY-MM
 */
const getCurrentMonthPrefix = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * @desc    Get dashboard summary (fund balance, totals, member balances, recent txns)
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentMonth = getCurrentMonthPrefix();

    // Overall totals using aggregation
    const totalsAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          reversed: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalContributions = 0;
    let totalExpenses = 0;

    totalsAgg.forEach((item) => {
      if (item._id === 'contribution' || item._id === 'income') {
        totalContributions += item.total;
      } else if (item._id === 'expense') {
        totalExpenses += item.total;
      }
    });

    const commonFundBalance = Number((totalContributions - totalExpenses).toFixed(2));

    // Current month totals using aggregation
    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          reversed: { $ne: true },
          date: { $regex: `^${currentMonth}` }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let currentMonthContributions = 0;
    let currentMonthExpenses = 0;

    monthlyAgg.forEach((item) => {
      if (item._id === 'contribution' || item._id === 'income') {
        currentMonthContributions += item.total;
      } else if (item._id === 'expense') {
        currentMonthExpenses += item.total;
      }
    });

    // Recent 7 transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(7);

    // Calculate member balances from all active expenses
    const members = req.user.members || ['Deepraj', 'Anant', 'Ravi', 'Baijnath', 'Kunal'];
    const allExpenses = await Transaction.find({
      userId,
      type: 'expense',
      reversed: { $ne: true }
    });

    const memberStats = members.map((member) => {
      let paid = 0;
      let share = 0;

      allExpenses.forEach((exp) => {
        if (exp.paidBy === member || exp.person === member) {
          paid += exp.amount;
        }

        const sharedList = exp.sharedBy && exp.sharedBy.length > 0 ? exp.sharedBy : members;
        if (sharedList.includes(member)) {
          share += exp.amount / sharedList.length;
        }
      });

      const balance = Number((paid - share).toFixed(2));

      return {
        member,
        paid: Number(paid.toFixed(2)),
        share: Number(share.toFixed(2)),
        balance
      };
    });

    // Pending settlements: sum of all negative balances
    const pendingSettlement = memberStats
      .filter((m) => m.balance < 0)
      .reduce((sum, m) => sum + Math.abs(m.balance), 0);

    return successResponse(res, 200, 'Dashboard summary retrieved successfully.', {
      fundBalance: commonFundBalance,
      totalContributions: Number(totalContributions.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      currentMonthContributions: Number(currentMonthContributions.toFixed(2)),
      currentMonthExpenses: Number(currentMonthExpenses.toFixed(2)),
      pendingSettlement: Number(pendingSettlement.toFixed(2)),
      memberBalances: memberStats,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly financial history & trends
 * @route   GET /api/dashboard/monthly
 * @access  Private
 */
const getMonthly = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate monthly data using date substring "YYYY-MM"
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId,
          reversed: { $ne: true }
        }
      },
      {
        $project: {
          month: { $substrCP: ['$date', 0, 7] }, // "YYYY-MM"
          type: '$type',
          amount: '$amount'
        }
      },
      {
        $group: {
          _id: {
            month: '$month',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.month': -1 }
      }
    ]);

    // Format grouped result by month
    const grouped = {};
    monthlyData.forEach((item) => {
      const month = item._id.month;
      if (!grouped[month]) {
        grouped[month] = {
          month,
          income: 0,
          expenses: 0,
          savings: 0,
          transactionCount: 0
        };
      }

      if (item._id.type === 'contribution' || item._id.type === 'income') {
        grouped[month].income += Number(item.total.toFixed(2));
      } else if (item._id.type === 'expense') {
        grouped[month].expenses += Number(item.total.toFixed(2));
      }
      grouped[month].transactionCount += item.count;
    });

    const results = Object.values(grouped).map((m) => ({
      ...m,
      savings: Number((m.income - m.expenses).toFixed(2))
    }));

    return successResponse(res, 200, 'Monthly analytics retrieved successfully.', results);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category-wise expense breakdown with percentages
 * @route   GET /api/dashboard/category-expenses
 * @access  Private
 */
const getCategoryExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const matchQuery = {
      userId,
      type: 'expense',
      reversed: { $ne: true }
    };

    if (year && month) {
      const paddedMonth = String(month).padStart(2, '0');
      matchQuery.date = { $regex: `^${year}-${paddedMonth}` };
    } else if (year) {
      matchQuery.date = { $regex: `^${year}` };
    }

    const categoryAgg = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalExpense = categoryAgg.reduce((acc, curr) => acc + curr.total, 0);

    const categories = categoryAgg.map((cat) => ({
      category: cat._id || 'other',
      total: Number(cat.total.toFixed(2)),
      count: cat.count,
      percentage: totalExpense > 0 ? Number(((cat.total / totalExpense) * 100).toFixed(1)) : 0
    }));

    return successResponse(res, 200, 'Category expenses retrieved successfully.', {
      totalExpense: Number(totalExpense.toFixed(2)),
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get budget usage analytics
 * @route   GET /api/dashboard/budget-usage
 * @access  Private
 */
const getBudgetUsage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const month = req.query.month ? Number(req.query.month) : currentDate.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : currentDate.getFullYear();
    const paddedMonth = String(month).padStart(2, '0');
    const prefix = `${year}-${paddedMonth}`;

    const budgets = await Budget.find({ userId, month, year });

    let totalBudget = 0;
    let totalSpent = 0;

    const items = await Promise.all(
      budgets.map(async (b) => {
        totalBudget += b.amount;

        const agg = await Transaction.aggregate([
          {
            $match: {
              userId,
              type: 'expense',
              category: b.category,
              reversed: { $ne: true },
              date: { $regex: `^${prefix}` }
            }
          },
          {
            $group: {
              _id: null,
              spent: { $sum: '$amount' }
            }
          }
        ]);

        const spent = agg.length > 0 ? Number(agg[0].spent.toFixed(2)) : 0;
        totalSpent += spent;

        return {
          category: b.category,
          budget: b.amount,
          spent,
          remaining: Number((b.amount - spent).toFixed(2)),
          percentage: b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0,
          isOver: spent > b.amount
        };
      })
    );

    return successResponse(res, 200, 'Budget usage calculated successfully.', {
      month,
      year,
      totalBudget: Number(totalBudget.toFixed(2)),
      totalSpent: Number(totalSpent.toFixed(2)),
      overallPercentage: totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0,
      budgets: items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getMonthly,
  getCategoryExpenses,
  getBudgetUsage
};
