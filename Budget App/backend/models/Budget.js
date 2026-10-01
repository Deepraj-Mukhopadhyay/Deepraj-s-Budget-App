const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than zero']
    },
    month: {
      type: Number,
      required: [true, 'Month is required (1-12)'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12']
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be valid'],
      max: [2100, 'Year must be valid']
    },
    period: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-populate period (e.g. "2026-08")
budgetSchema.pre('save', function (next) {
  const paddedMonth = String(this.month).padStart(2, '0');
  this.period = `${this.year}-${paddedMonth}`;
  next();
});

// Ensure a user cannot have duplicate budgets for the same category in the same month/year
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
