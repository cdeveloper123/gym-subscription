const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);

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
      paymentProviderId: paymentIntent.id,
      amount: plan.price,
      status: 'PENDING',
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

  await Payment.findOneAndUpdate(
    { paymentProviderId: id },
    { status: 'COMPLETED' }
  );

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  await Payment.findOneAndUpdate(
    { paymentProviderId: id },
    { status: 'FAILED' }
  );

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const subscriptionIds = payments
      .map(p => p.subscriptionId)
      .filter(Boolean);

    const subscriptions = await Subscription.find({ _id: { $in: subscriptionIds } })
      .populate('planId')
      .lean();

    const paymentsResponse = payments.map(payment => {
      const subscription = subscriptions.find(s => s._id.toString() === payment.subscriptionId?.toString());
      return {
        ...payment,
        id: payment._id,
        subscription: subscription ? {
          ...subscription,
          id: subscription._id,
          plan: subscription.planId ? { ...subscription.planId, id: subscription.planId._id } : null
        } : null
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
