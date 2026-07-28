const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Payment = require('../models/Payment');

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'ACTIVE'
    })
      .populate('planId')
      .sort({ createdAt: -1 })
      .lean();

    if (subscription) {
      const payments = await Payment.find({ subscriptionId: subscription._id })
        .sort({ createdAt: -1 })
        .lean();

      const subscriptionResponse = {
        ...subscription,
        id: subscription._id,
        plan: subscription.planId ? { ...subscription.planId, id: subscription.planId._id } : null,
        payments: payments.map(p => ({ ...p, id: p._id }))
      };

      res.json({ subscription: subscriptionResponse });
    } else {
      res.json({ subscription: null });
    }
  } catch (error) {
    next(error);
  }
};

const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id })
      .populate('planId')
      .sort({ createdAt: -1 })
      .lean();

    const subscriptionIds = subscriptions.map(s => s._id);
    const payments = await Payment.find({ subscriptionId: { $in: subscriptionIds } }).lean();

    const subscriptionsResponse = subscriptions.map(sub => ({
      ...sub,
      id: sub._id,
      plan: sub.planId ? { ...sub.planId, id: sub.planId._id } : null,
      payments: payments.filter(p => p.subscriptionId?.toString() === sub._id.toString())
        .map(p => ({ ...p, id: p._id }))
    }));

    res.json({ subscriptions: subscriptionsResponse });
  } catch (error) {
    next(error);
  }
};

const purchaseSubscription = async (req, res, next) => {
  try {
    const { planId, paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const payment = await Payment.findOne({ paymentProviderId: paymentIntentId });

    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscriptionId) {
      return res.status(400).json({ error: 'Payment already used for a subscription' });
    }

    const existingActive = await Subscription.findOne({
      userId: req.user.id,
      status: 'ACTIVE'
    });

    if (existingActive) {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }

    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (plan.duration) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const subscription = await Subscription.create({
      userId: req.user.id,
      planId: plan._id,
      status: 'ACTIVE',
      startDate,
      endDate
    });

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('planId')
      .lean();

    await Payment.findByIdAndUpdate(payment._id, { subscriptionId: subscription._id });

    const subscriptionResponse = {
      ...populatedSubscription,
      id: populatedSubscription._id,
      plan: populatedSubscription.planId ? { ...populatedSubscription.planId, id: populatedSubscription.planId._id } : null
    };

    res.status(201).json({
      message: 'Subscription purchased successfully',
      subscription: subscriptionResponse
    });
  } catch (error) {
    next(error);
  }
};

const renewSubscription = async (req, res, next) => {
  try {
    const { subscriptionId, paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    const subscription = await Subscription.findById(subscriptionId).populate('planId');

    if (!subscription || subscription.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const payment = await Payment.findOne({ paymentProviderId: paymentIntentId });

    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscriptionId && payment.subscriptionId.toString() !== subscriptionId) {
      return res.status(400).json({ error: 'Payment already used for a different subscription' });
    }

    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (subscription.planId.duration) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const renewedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'ACTIVE',
        startDate,
        endDate
      },
      { new: true }
    ).populate('planId').lean();

    if (!payment.subscriptionId) {
      await Payment.findByIdAndUpdate(payment._id, { subscriptionId: subscription._id });
    }

    const subscriptionResponse = {
      ...renewedSubscription,
      id: renewedSubscription._id,
      plan: renewedSubscription.planId ? { ...renewedSubscription.planId, id: renewedSubscription.planId._id } : null
    };

    res.json({
      message: 'Subscription renewed successfully',
      subscription: subscriptionResponse
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription || subscription.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: 'CANCELLED' },
      { new: true }
    ).lean();

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: { ...updatedSubscription, id: updatedSubscription._id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscription,
  getSubscriptionHistory,
  purchaseSubscription,
  renewSubscription,
  cancelSubscription
};
