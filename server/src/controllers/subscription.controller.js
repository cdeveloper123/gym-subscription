const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'ACTIVE'
    })
      .populate('planId')
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({ subscription: null });
    }

    const payments = await Payment.find({ subscriptionId: subscription._id }).sort({ createdAt: -1 });

    res.json({
      subscription: {
        id: subscription._id,
        userId: subscription.userId,
        planId: subscription.planId._id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        plan: {
          id: subscription.planId._id,
          name: subscription.planId.name,
          duration: subscription.planId.duration,
          price: subscription.planId.price,
          features: subscription.planId.features
        },
        payments: payments.map(p => ({
          id: p._id,
          userId: p.userId,
          subscriptionId: p.subscriptionId,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          stripePaymentIntentId: p.stripePaymentIntentId,
          paymentMethod: p.paymentMethod,
          createdAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id })
      .populate('planId')
      .sort({ createdAt: -1 });

    const subscriptionsResponse = await Promise.all(
      subscriptions.map(async (sub) => {
        const payments = await Payment.find({ subscriptionId: sub._id });

        return {
          id: sub._id,
          userId: sub.userId,
          planId: sub.planId._id,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          plan: {
            id: sub.planId._id,
            name: sub.planId.name,
            duration: sub.planId.duration,
            price: sub.planId.price,
            features: sub.planId.features
          },
          payments: payments.map(p => ({
            id: p._id,
            userId: p.userId,
            subscriptionId: p.subscriptionId,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            stripePaymentIntentId: p.stripePaymentIntentId,
            paymentMethod: p.paymentMethod,
            createdAt: p.createdAt
          }))
        };
      })
    );

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

    const plan = await Plan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

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

    payment.subscriptionId = subscription._id;
    await payment.save();

    const populatedSubscription = await Subscription.findById(subscription._id).populate('planId');

    res.status(201).json({
      message: 'Subscription purchased successfully',
      subscription: {
        id: populatedSubscription._id,
        userId: populatedSubscription.userId,
        planId: populatedSubscription.planId._id,
        status: populatedSubscription.status,
        startDate: populatedSubscription.startDate,
        endDate: populatedSubscription.endDate,
        createdAt: populatedSubscription.createdAt,
        updatedAt: populatedSubscription.updatedAt,
        plan: {
          id: populatedSubscription.planId._id,
          name: populatedSubscription.planId.name,
          duration: populatedSubscription.planId.duration,
          price: populatedSubscription.planId.price,
          features: populatedSubscription.planId.features
        }
      }
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

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: req.user.id
    }).populate('planId');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

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

    subscription.status = 'ACTIVE';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    if (!payment.subscriptionId) {
      payment.subscriptionId = subscription._id;
      await payment.save();
    }

    res.json({
      message: 'Subscription renewed successfully',
      subscription: {
        id: subscription._id,
        userId: subscription.userId,
        planId: subscription.planId._id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        plan: {
          id: subscription.planId._id,
          name: subscription.planId.name,
          duration: subscription.planId.duration,
          price: subscription.planId.price,
          features: subscription.planId.features
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.status = 'CANCELLED';
    await subscription.save();

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription._id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      }
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
