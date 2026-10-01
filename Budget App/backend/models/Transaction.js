const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    clientTxnId: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['contribution', 'expense', 'income', 'settlement', 'correction'],
        message: '{VALUE} is not a valid transaction type'
      },
      index: true
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    category: {
      type: String,
      default: 'other',
      trim: true,
      lowercase: true,
      index: true
    },
    person: {
      type: String,
      trim: true,
      default: ''
    },
    paidBy: {
      type: String,
      trim: true,
      default: ''
    },
    sharedBy: {
      type: [String],
      default: []
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'upi', 'bank', 'other'],
        message: '{VALUE} is not a supported payment method'
      },
      default: 'cash'
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    referenceId: {
      type: String,
      trim: true,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    reversed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
