const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  syncTransactions
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All transaction routes are protected
router.use(protect);

router.route('/')
  .post(createTransaction)
  .get(getTransactions);

router.post('/sync', syncTransactions);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
