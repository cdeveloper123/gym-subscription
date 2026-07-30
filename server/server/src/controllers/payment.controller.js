const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');

const generateId = () => {
  try {
    return require('crypto').randomUUID();
  } catch {
    return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
  }
};

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plans = await query('SELECT * FROM plans WHERE id = ? AND is_active = TRUE', [planId]);

    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const plan = plans[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(plan.price) * 100),
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        planId: plan.id,
        planName: plan.name
      }
    });

    const paymentId = generateId();

    await query(
      'INSERT INTO payments (id, user_id, subscription_id, amount, currency, status, stripe_payment_intent_id, payment_method) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)',
      [paymentId, req.user.id, plan.price, 'USD', 'PENDING', paymentIntent.id, 'card']
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  const { id, metadata } = paymentIntent;

  await query(
    'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?',
    ['COMPLETED', id]
  );

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  await query(
    'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?',
    ['FAILED', id]
  );

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const paymentsResponse = await Promise.all(
      payments.map(async (payment) => {
        let subscriptionData = null;

        if (payment.subscription_id) {
          const subscriptions = await query(
            `SELECT s.*, p.name as plan_name, p.duration, p.price as plan_price, p.features
             FROM subscriptions s
             LEFT JOIN plans p ON s.plan_id = p.id
             WHERE s.id = ?`,
            [payment.subscription_id]
          );

          if (subscriptions.length > 0) {
            const sub = subscriptions[0];
            subscriptionData = {
              id: sub.id,
              userId: sub.user_id,
              planId: sub.plan_id,
              status: sub.status,
              startDate: sub.start_date,
              endDate: sub.end_date,
              createdAt: sub.created_at,
              plan: {
                id: sub.plan_id,
                name: sub.plan_name,
                duration: sub.duration,
                price: parseFloat(sub.plan_price),
                features: typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features
              }
            };
          }
        }

        return {
          id: payment.id,
          userId: payment.user_id,
          subscriptionId: payment.subscription_id,
          amount: parseFloat(payment.amount),
          currency: payment.currency,
          status: payment.status,
          stripePaymentIntentId: payment.stripe_payment_intent_id,
          paymentMethod: payment.payment_method,
          createdAt: payment.created_at,
          subscription: subscriptionData
        };
      })
    );

    res.json({ payments: paymentsResponse });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory
};
