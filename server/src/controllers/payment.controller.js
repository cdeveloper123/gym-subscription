const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plans = await query('SELECT * FROM plans WHERE id = $1 AND is_active = TRUE', [planId]);

    if (plans.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const plan = plans.rows[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(plan.price) * 100),
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        planId: plan.id,
        planName: plan.name
      }
    });

    await query(
      'INSERT INTO payments (user_id, amount, currency, status, stripe_payment_intent_id, payment_method) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, plan.price, 'USD', 'PENDING', paymentIntent.id, 'card']
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
    'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2',
    ['COMPLETED', id]
  );

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  await query(
    'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2',
    ['FAILED', id]
  );

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await query(
      `SELECT p.*, s.id as sub_id, s.user_id as sub_user_id, s.plan_id as sub_plan_id, s.status as sub_status, s.start_date, s.end_date, s.created_at as sub_created_at,
       pl.id as plan_id, pl.name as plan_name, pl.duration, pl.price as plan_price, pl.features
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       LEFT JOIN plans pl ON s.plan_id = pl.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const paymentsResponse = payments.rows.map(payment => {
      let subscriptionData = null;

      if (payment.sub_id) {
        subscriptionData = {
          id: payment.sub_id,
          userId: payment.sub_user_id,
          planId: payment.sub_plan_id,
          status: payment.sub_status,
          startDate: payment.start_date,
          endDate: payment.end_date,
          createdAt: payment.sub_created_at,
          plan: payment.plan_id ? {
            id: payment.plan_id,
            name: payment.plan_name,
            duration: payment.duration,
            price: parseFloat(payment.plan_price),
            features: payment.features
          } : null
        };
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
    });

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
