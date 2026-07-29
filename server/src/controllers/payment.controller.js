const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { storage, generateId } = require('../lib/storage');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = storage.plans.find(p => p.id === planId);

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

    const payment = {
      id: generateId(),
      userId: req.user.id,
      paymentProviderId: paymentIntent.id,
      amount: plan.price,
      status: 'PENDING',
      paymentMethod: 'card',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.payments.push(payment);

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

  const payment = storage.payments.find(p => p.paymentProviderId === id);

  if (payment) {
    payment.status = 'COMPLETED';
    payment.updatedAt = new Date();
  }

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  const payment = storage.payments.find(p => p.paymentProviderId === id);

  if (payment) {
    payment.status = 'FAILED';
    payment.updatedAt = new Date();
  }

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = storage.payments
      .filter(p => p.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paymentsResponse = payments.map(payment => {
      const subscription = storage.subscriptions.find(s => s.id === payment.subscriptionId);
      let subscriptionData = null;

      if (subscription) {
        const plan = storage.plans.find(p => p.id === subscription.planId);
        subscriptionData = {
          ...subscription,
          plan
        };
      }

      return {
        ...payment,
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
