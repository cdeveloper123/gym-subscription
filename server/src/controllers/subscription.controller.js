const { storage, generateId } = require('../lib/storage');

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = storage.subscriptions
      .filter(s => s.userId === req.user.id && s.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (subscription) {
      const plan = storage.plans.find(p => p.id === subscription.planId);
      const payments = storage.payments
        .filter(p => p.subscriptionId === subscription.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const subscriptionResponse = {
        ...subscription,
        plan,
        payments
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
    const subscriptions = storage.subscriptions
      .filter(s => s.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const subscriptionsResponse = subscriptions.map(sub => {
      const plan = storage.plans.find(p => p.id === sub.planId);
      const payments = storage.payments.filter(p => p.subscriptionId === sub.id);
      return {
        ...sub,
        plan,
        payments
      };
    });

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

    const plan = storage.plans.find(p => p.id === planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const payment = storage.payments.find(p => p.paymentProviderId === paymentIntentId);

    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscriptionId) {
      return res.status(400).json({ error: 'Payment already used for a subscription' });
    }

    const existingActive = storage.subscriptions.find(s =>
      s.userId === req.user.id && s.status === 'ACTIVE'
    );

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

    const subscription = {
      id: generateId(),
      userId: req.user.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.subscriptions.push(subscription);

    payment.subscriptionId = subscription.id;
    payment.updatedAt = new Date();

    const subscriptionResponse = {
      ...subscription,
      plan
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

    const subscriptionIndex = storage.subscriptions.findIndex(s => s.id === subscriptionId);

    if (subscriptionIndex === -1 || storage.subscriptions[subscriptionIndex].userId !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = storage.subscriptions[subscriptionIndex];
    const plan = storage.plans.find(p => p.id === subscription.planId);

    const payment = storage.payments.find(p => p.paymentProviderId === paymentIntentId);

    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscriptionId && payment.subscriptionId !== subscriptionId) {
      return res.status(400).json({ error: 'Payment already used for a different subscription' });
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

    subscription.status = 'ACTIVE';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.updatedAt = new Date();

    if (!payment.subscriptionId) {
      payment.subscriptionId = subscription.id;
      payment.updatedAt = new Date();
    }

    const subscriptionResponse = {
      ...subscription,
      plan
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

    const subscription = storage.subscriptions.find(s => s.id === subscriptionId);

    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.status = 'CANCELLED';
    subscription.updatedAt = new Date();

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
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
