const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error || !plan) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(plan.price) * 100),
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        planId: plan.id,
        planName: plan.name
      }
    });

    const { error: insertError } = await supabase
      .from('payments')
      .insert([{
        user_id: req.user.id,
        amount: plan.price,
        currency: 'USD',
        status: 'PENDING',
        stripe_payment_intent_id: paymentIntent.id,
        payment_method: 'card'
      }]);

    if (insertError) throw insertError;

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

  const { error } = await supabase
    .from('payments')
    .update({ status: 'COMPLETED' })
    .eq('stripe_payment_intent_id', id);

  if (error) {
    console.error('Error updating payment:', error);
  }

  console.log(`Payment ${id} completed for user ${metadata.userId}`);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { id } = paymentIntent;

  const { error } = await supabase
    .from('payments')
    .update({ status: 'FAILED' })
    .eq('stripe_payment_intent_id', id);

  if (error) {
    console.error('Error updating payment:', error);
  }

  console.log(`Payment ${id} failed`);
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        subscriptions (
          *,
          plans (*)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const paymentsResponse = payments.map(payment => {
      let subscriptionData = null;

      if (payment.subscriptions) {
        const sub = payment.subscriptions;
        subscriptionData = {
          id: sub.id,
          userId: sub.user_id,
          planId: sub.plan_id,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          createdAt: sub.created_at,
          plan: sub.plans ? {
            id: sub.plans.id,
            name: sub.plans.name,
            duration: sub.plans.duration,
            price: parseFloat(sub.plans.price),
            features: sub.plans.features
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
