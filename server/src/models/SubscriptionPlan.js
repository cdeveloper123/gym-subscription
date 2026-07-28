const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true
  },
  price: {
    type: Number,
    required: true
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

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
