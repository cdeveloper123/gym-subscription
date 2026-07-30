const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  stripeSubscriptionId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
