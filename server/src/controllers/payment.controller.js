const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../lib/prisma');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        planId: plan.id,
        planName: plan.name
      }
    });

    await prisma.payment.create({
      data: {
        userId: req.user.id,
        paymentProviderId: paymentIntent.id,
        amount: plan.price,
        status: 'PENDING',
        paymentMethod: 'card'
      }
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

  await prisma.payment.update({
    where: { paymentProviderId: id },
    data: { status: 'COMPLETED' }
  });

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  await prisma.payment.update({
    where: { paymentProviderId: id },
    data: { status: 'FAILED' }
  });

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory
};
