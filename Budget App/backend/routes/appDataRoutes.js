const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/responseHandler');

router.use(protect);

/**
 * @desc    Get complete app data for authenticated user (for high-fidelity frontend sync)
 * @route   GET /api/app-data
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all transactions
    const transactions = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 });

    // Extract contributions and expenses for full backward compatibility with frontend
    const contributions = transactions
      .filter((t) => t.type === 'contribution')
      .map((t) => ({
        id: t.clientTxnId || `CON-${t._id}`,
        dbId: t._id,
        member: t.person,
        amount: t.amount,
        date: t.date,
        paymentMethod: t.paymentMethod,
        note: t.note,
        createdAt: t.createdAt,
        reversed: t.reversed
      }));

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .map((t) => ({
        id: t.clientTxnId || `EXP-${t._id}`,
        dbId: t._id,
        item: t.description,
        amount: t.amount,
        category: t.category,
        paidBy: t.paidBy || t.person,
        sharedBy: t.sharedBy,
        date: t.date,
        note: t.note,
        createdAt: t.createdAt,
        reversed: t.reversed
      }));

    // Fetch budgets
    const budgets = await Budget.find({ userId });

    return successResponse(res, 200, 'App data loaded successfully.', {
      user: req.user,
      members: req.user.members,
      archivedMonths: req.user.archivedMonths || [],
      contributions,
      expenses,
      transactions: transactions.map((t) => ({
        id: t.clientTxnId || `TXN-${t._id}`,
        dbId: t._id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        person: t.person,
        referenceId: t.referenceId,
        date: t.date,
        timestamp: t.createdAt,
        metadata: {
          category: t.category,
          paidBy: t.paidBy,
          sharedBy: t.sharedBy,
          paymentMethod: t.paymentMethod,
          note: t.note,
          ...t.metadata
        },
        reversed: t.reversed
      })),
      budgets
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Sync / import entire state from localStorage into MongoDB
 * @route   POST /api/app-data/sync
 * @access  Private
 */
router.post('/sync', async (req, res, next) => {
  try {
    const { contributions = [], expenses = [], transactions = [], archivedMonths } = req.body;
    const userId = req.user._id;

    // Update archivedMonths on user if provided
    if (Array.isArray(archivedMonths)) {
      req.user.archivedMonths = Array.from(new Set([...(req.user.archivedMonths || []), ...archivedMonths]));
      await req.user.save();
    }

    let importedCount = 0;

    // Sync contributions
    for (const c of contributions) {
      if (!c.amount || !c.member) continue;
      const clientTxnId = c.id || `CON-${Date.now()}`;
      await Transaction.findOneAndUpdate(
        { userId, clientTxnId },
        {
          userId,
          clientTxnId,
          type: 'contribution',
          description: `Contribution by ${c.member}`,
          amount: Number(c.amount),
          category: 'contribution',
          person: c.member,
          paymentMethod: c.paymentMethod || 'cash',
          date: c.date || new Date().toISOString().slice(0, 10),
          note: c.note || '',
          referenceId: c.id || '',
          reversed: Boolean(c.reversed)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      importedCount++;
    }

    // Sync expenses
    for (const e of expenses) {
      if (!e.amount || !e.item) continue;
      const clientTxnId = e.id || `EXP-${Date.now()}`;
      await Transaction.findOneAndUpdate(
        { userId, clientTxnId },
        {
          userId,
          clientTxnId,
          type: 'expense',
          description: e.item,
          amount: Number(e.amount),
          category: e.category || 'other',
          person: e.paidBy || '',
          paidBy: e.paidBy || '',
          sharedBy: Array.isArray(e.sharedBy) ? e.sharedBy : [],
          date: e.date || new Date().toISOString().slice(0, 10),
          note: e.note || '',
          referenceId: e.id || '',
          reversed: Boolean(e.reversed)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      importedCount++;
    }

    return successResponse(res, 200, `Synchronized ${importedCount} items with MongoDB successfully.`, {
      importedCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
