const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthly,
  getCategoryExpenses,
  getBudgetUsage
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/category-expenses', getCategoryExpenses);
router.get('/budget-usage', getBudgetUsage);

module.exports = router;
