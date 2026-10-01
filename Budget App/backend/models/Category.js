const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates a global/default category
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense'
    },
    icon: {
      type: String,
      default: '📦',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ userId: 1, slug: 1 });

module.exports = mongoose.model('Category', categorySchema);
