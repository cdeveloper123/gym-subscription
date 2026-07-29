const { query } = require('../config/database');

const getMySubscription = async (req, res, next) => {
  try {
    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name, p.duration, p.price, p.features
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'ACTIVE'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (subscriptions.rows.length === 0) {
      return res.json({ subscription: null });
    }

    const sub = subscriptions.rows[0];

    const payments = await query(
      'SELECT * FROM payments WHERE subscription_id = $1 ORDER BY created_at DESC',
      [sub.id]
    );

    res.json({
      subscription: {
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        stripeSubscriptionId: sub.stripe_subscription_id,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        plan: {
          id: sub.plan_id,
          name: sub.plan_name,
          duration: sub.duration,
          price: parseFloat(sub.price),
          features: sub.features
        },
        payments: payments.rows.map(p => ({
          id: p.id,
          userId: p.user_id,
          subscriptionId: p.subscription_id,
          amount: parseFloat(p.amount),
          currency: p.currency,
          status: p.status,
          stripePaymentIntentId: p.stripe_payment_intent_id,
          paymentMethod: p.payment_method,
          createdAt: p.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name, p.duration, p.price, p.features
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    const subscriptionsResponse = await Promise.all(
      subscriptions.rows.map(async (sub) => {
        const payments = await query(
          'SELECT * FROM payments WHERE subscription_id = $1',
          [sub.id]
        );

        return {
          id: sub.id,
          userId: sub.user_id,
          planId: sub.plan_id,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          stripeSubscriptionId: sub.stripe_subscription_id,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          plan: {
            id: sub.plan_id,
            name: sub.plan_name,
            duration: sub.duration,
            price: parseFloat(sub.price),
            features: sub.features
          },
          payments: payments.rows.map(p => ({
            id: p.id,
            userId: p.user_id,
            subscriptionId: p.subscription_id,
            amount: parseFloat(p.amount),
            currency: p.currency,
            status: p.status,
            stripePaymentIntentId: p.stripe_payment_intent_id,
            paymentMethod: p.payment_method,
            createdAt: p.created_at
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

    const plans = await query('SELECT * FROM plans WHERE id = $1 AND is_active = TRUE', [planId]);

    if (plans.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const plan = plans.rows[0];

    const payments = await query(
      'SELECT * FROM payments WHERE stripe_payment_intent_id = $1',
      [paymentIntentId]
    );

    if (payments.rows.length === 0) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    const payment = payments.rows[0];

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscription_id) {
      return res.status(400).json({ error: 'Payment already used for a subscription' });
    }

    const existingActive = await query(
      'SELECT id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'ACTIVE']
    );

    if (existingActive.rows.length > 0) {
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

    const newSubscription = await query(
      'INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, plan.id, 'ACTIVE', startDate, endDate]
    );

    const subscription = newSubscription.rows[0];

    await query(
      'UPDATE payments SET subscription_id = $1, updated_at = NOW() WHERE id = $2',
      [subscription.id, payment.id]
    );

    res.status(201).json({
      message: 'Subscription purchased successfully',
      subscription: {
        id: subscription.id,
        userId: subscription.user_id,
        planId: subscription.plan_id,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
        plan: {
          id: plan.id,
          name: plan.name,
          duration: plan.duration,
          price: parseFloat(plan.price),
          features: plan.features
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

    const subscriptions = await query(
      `SELECT s.*, p.* FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [subscriptionId, req.user.id]
    );

    if (subscriptions.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = subscriptions.rows[0];

    const payments = await query(
      'SELECT * FROM payments WHERE stripe_payment_intent_id = $1',
      [paymentIntentId]
    );

    if (payments.rows.length === 0) {
      return res.status(400).json({ error: 'Payment not found' });
    }

    const payment = payments.rows[0];

    if (payment.status === 'FAILED') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    if (payment.subscription_id && payment.subscription_id !== subscriptionId) {
      return res.status(400).json({ error: 'Payment already used for a different subscription' });
    }

    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (subscription.duration) {
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

    await query(
      'UPDATE subscriptions SET status = $1, start_date = $2, end_date = $3, updated_at = NOW() WHERE id = $4',
      ['ACTIVE', startDate, endDate, subscriptionId]
    );

    if (!payment.subscription_id) {
      await query(
        'UPDATE payments SET subscription_id = $1, updated_at = NOW() WHERE id = $2',
        [subscriptionId, payment.id]
      );
    }

    const updatedSubscriptions = await query('SELECT * FROM subscriptions WHERE id = $1', [subscriptionId]);
    const updatedSubscription = updatedSubscriptions.rows[0];

    res.json({
      message: 'Subscription renewed successfully',
      subscription: {
        id: updatedSubscription.id,
        userId: updatedSubscription.user_id,
        planId: updatedSubscription.plan_id,
        status: updatedSubscription.status,
        startDate: updatedSubscription.start_date,
        endDate: updatedSubscription.end_date,
        createdAt: updatedSubscription.created_at,
        updatedAt: updatedSubscription.updated_at,
        plan: {
          id: subscription.id,
          name: subscription.name,
          duration: subscription.duration,
          price: parseFloat(subscription.price),
          features: subscription.features
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

    const subscriptions = await query(
      'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
      [subscriptionId, req.user.id]
    );

    if (subscriptions.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await query(
      'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2',
      ['CANCELLED', subscriptionId]
    );

    const updatedSubscriptions = await query('SELECT * FROM subscriptions WHERE id = $1', [subscriptionId]);
    const subscription = updatedSubscriptions.rows[0];

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        userId: subscription.user_id,
        planId: subscription.plan_id,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at
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
