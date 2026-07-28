const prisma = require('../lib/prisma');

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ subscription });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: {
        plan: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ subscriptions });
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

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const payment = await prisma.payment.findUnique({
      where: { paymentProviderId: paymentIntentId }
    });

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

    const existingActive = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE'
      }
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

    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate
      },
      include: {
        plan: true
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id }
    });

    res.status(201).json({
      message: 'Subscription purchased successfully',
      subscription
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

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const payment = await prisma.payment.findUnique({
      where: { paymentProviderId: paymentIntentId }
    });

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

    switch (subscription.plan.duration) {
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

    const renewedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        startDate,
        endDate
      },
      include: { plan: true }
    });

    if (!payment.subscriptionId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscription.id }
      });
    }

    res.json({
      message: 'Subscription renewed successfully',
      subscription: renewedSubscription
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: updatedSubscription
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
