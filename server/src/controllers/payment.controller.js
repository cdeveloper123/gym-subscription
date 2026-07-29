const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        planId: plan._id.toString(),
        planName: plan.name
      }
    });

    await Payment.create({
      userId: req.user.id,
      amount: plan.price,
      currency: 'USD',
      status: 'PENDING',
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: 'card'
    });

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

  await Payment.updateOne(
    { stripePaymentIntentId: id },
    { status: 'COMPLETED' }
  );

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  await Payment.updateOne(
    { stripePaymentIntentId: id },
    { status: 'FAILED' }
  );

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate({
        path: 'subscriptionId',
        populate: {
          path: 'planId'
        }
      })
      .sort({ createdAt: -1 });

    const paymentsResponse = payments.map(payment => {
      let subscriptionData = null;

      if (payment.subscriptionId) {
        const sub = payment.subscriptionId;
        subscriptionData = {
          id: sub._id,
          userId: sub.userId,
          planId: sub.planId._id,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          createdAt: sub.createdAt,
          plan: {
            id: sub.planId._id,
            name: sub.planId.name,
            duration: sub.planId.duration,
            price: sub.planId.price,
            features: sub.planId.features
          }
        };
      }

      return {
        id: payment._id,
        userId: payment.userId,
        subscriptionId: payment.subscriptionId?._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
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
