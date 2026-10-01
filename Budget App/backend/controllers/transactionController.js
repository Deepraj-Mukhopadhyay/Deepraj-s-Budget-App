const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * @desc    Create a new transaction (Contribution, Expense, Income, Settlement)
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      description,
      amount,
      category,
      person,
      paidBy,
      sharedBy,
      paymentMethod,
      date,
      note,
      clientTxnId,
      referenceId,
      metadata
    } = req.body;

    // Validation
    if (!type) {
      return errorResponse(res, 400, 'Transaction type is required.');
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return errorResponse(res, 400, 'Valid positive amount is required.');
    }

    if (!date) {
      return errorResponse(res, 400, 'Transaction date is required (YYYY-MM-DD).');
    }

    // Determine person or paidBy
    const resolvedPerson = person || paidBy || '';
    const resolvedPaidBy = paidBy || (type === 'expense' ? resolvedPerson : '');
    const resolvedDescription = description || (type === 'contribution' ? `Contribution by ${resolvedPerson}` : 'Expense');

    // Create the transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      clientTxnId: clientTxnId || `TXN-${Date.now().toString(36).toUpperCase()}`,
      type,
      description: resolvedDescription.trim(),
      amount: Number(numAmount.toFixed(2)),
      category: category ? category.toLowerCase().trim() : (type === 'contribution' ? 'contribution' : 'other'),
      person: resolvedPerson,
      paidBy: resolvedPaidBy,
      sharedBy: Array.isArray(sharedBy) ? sharedBy : [],
      paymentMethod: paymentMethod || 'cash',
      date,
      note: note ? note.trim() : '',
      referenceId: referenceId || '',
      metadata: metadata || {}
    });

    return successResponse(res, 201, 'Transaction recorded successfully.', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions for the authenticated user with filtering & sorting
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      date,
      month,
      year,
      startDate,
      endDate,
      person,
      search,
      page,
      limit,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    // Filter by exact date
    if (date) {
      query.date = date;
    }

    // Filter by month (1-12 or 01-12) and year
    if (year && month) {
      const paddedMonth = String(month).padStart(2, '0');
      const prefix = `${year}-${paddedMonth}`;
      query.date = { $regex: `^${prefix}` };
    } else if (year) {
      query.date = { $regex: `^${year}` };
    } else if (month) {
      // Any year, specific month
      const paddedMonth = String(month).padStart(2, '0');
      query.date = { $regex: `^\\d{4}-${paddedMonth}` };
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Filter by person
    if (person && person !== 'all') {
      query.$or = [{ person }, { paidBy: person }, { sharedBy: person }];
    }

    // Search query in description or note
    if (search && search.trim()) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    // Build sort
    const sortField = sortBy === 'amount' ? 'amount' : 'date';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: sortDirection, createdAt: -1 };

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 0; // 0 means no limit (return all)

    let transactionsQuery = Transaction.find(query).sort(sortObj);

    if (limitNum > 0) {
      const skip = (pageNum - 1) * limitNum;
      transactionsQuery = transactionsQuery.skip(skip).limit(limitNum);
    }

    const [transactions, totalCount] = await Promise.all([
      transactionsQuery.exec(),
      Transaction.countDocuments(query)
    ]);

    return successResponse(res, 200, 'Transactions retrieved successfully.', transactions, {
      total: totalCount,
      page: limitNum > 0 ? pageNum : 1,
      totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check by _id or clientTxnId
    const query = {
      userId: req.user._id,
      $or: [
        { clientTxnId: id }
      ]
    };

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or.unshift({ _id: id });
    }

    const transaction = await Transaction.findOne(query);

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    return successResponse(res, 200, 'Transaction retrieved successfully.', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find transaction belonging to this user
    const query = {
      userId: req.user._id,
      $or: [
        { clientTxnId: id }
      ]
    };

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or.unshift({ _id: id });
    }

    const transaction = await Transaction.findOne(query);

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found or access denied.');
    }

    // Apply allowed updates
    const allowedFields = [
      'description',
      'amount',
      'category',
      'person',
      'paidBy',
      'sharedBy',
      'paymentMethod',
      'date',
      'note',
      'reversed',
      'metadata'
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        if (field === 'amount') {
          transaction.amount = Number(updates.amount);
        } else if (field === 'category') {
          transaction.category = updates.category.toLowerCase().trim();
        } else {
          transaction[field] = updates[field];
        }
      }
    });

    await transaction.save();

    return successResponse(res, 200, 'Transaction updated successfully.', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = {
      userId: req.user._id,
      $or: [
        { clientTxnId: id }
      ]
    };

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or.unshift({ _id: id });
    }

    const transaction = await Transaction.findOneAndDelete(query);

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found or already deleted.');
    }

    return successResponse(res, 200, 'Transaction deleted successfully.', {
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Batch sync/import transactions
 * @route   POST /api/transactions/sync
 * @access  Private
 */
const syncTransactions = async (req, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return errorResponse(res, 400, 'Expected an array of transactions.');
    }

    const results = [];
    for (const item of transactions) {
      if (!item.amount || !item.date || !item.type) continue;

      const created = await Transaction.findOneAndUpdate(
        {
          userId: req.user._id,
          clientTxnId: item.id || item.clientTxnId || `TXN-${Date.now()}`
        },
        {
          userId: req.user._id,
          clientTxnId: item.id || item.clientTxnId,
          type: item.type,
          description: item.description || (item.item ? item.item : 'Transaction'),
          amount: Number(item.amount),
          category: item.category || (item.type === 'contribution' ? 'contribution' : 'other'),
          person: item.person || item.member || item.paidBy || '',
          paidBy: item.paidBy || item.person || '',
          sharedBy: Array.isArray(item.sharedBy) ? item.sharedBy : [],
          paymentMethod: item.paymentMethod || item.metadata?.paymentMethod || 'cash',
          date: item.date,
          note: item.note || item.metadata?.note || '',
          referenceId: item.referenceId || '',
          reversed: Boolean(item.reversed)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(created);
    }

    return successResponse(res, 200, `Successfully synced ${results.length} transactions.`, {
      count: results.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  syncTransactions
};
