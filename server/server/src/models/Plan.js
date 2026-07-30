const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  features: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
