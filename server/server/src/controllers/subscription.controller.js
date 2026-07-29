const supabase = require('../config/supabase');

const getMySubscription = async (req, res, next) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ subscription: null });
    }

    const sub = subscriptions[0];

    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('subscription_id', sub.id)
      .order('created_at', { ascending: false });

    if (payError) throw payError;

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
          id: sub.plans.id,
          name: sub.plans.name,
          duration: sub.plans.duration,
          price: parseFloat(sub.plans.price),
          features: sub.plans.features
        },
        payments: payments.map(p => ({
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
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const subscriptionsResponse = await Promise.all(
      subscriptions.map(async (sub) => {
        const { data: payments, error: payError } = await supabase
          .from('payments')
          .select('*')
          .eq('subscription_id', sub.id);

        if (payError) throw payError;

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
            id: sub.plans.id,
            name: sub.plans.name,
            duration: sub.plans.duration,
            price: parseFloat(sub.plans.price),
            features: sub.plans.features
          },
          payments: payments.map(p => ({
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

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    const { data: payment, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (payError || !payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

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

    const { data: existingActive, error: activeError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'ACTIVE')
      .limit(1);

    if (activeError) throw activeError;

    if (existingActive && existingActive.length > 0) {
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

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: req.user.id,
        plan_id: plan.id,
        status: 'ACTIVE',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }])
      .select()
      .single();

    if (subError) throw subError;

    const { error: updatePayError } = await supabase
      .from('payments')
      .update({ subscription_id: subscription.id })
      .eq('id', payment.id);

    if (updatePayError) throw updatePayError;

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

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('id', subscriptionId)
      .eq('user_id', req.user.id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { data: payment, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (payError || !payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }

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

    switch (subscription.plans.duration) {
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

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!payment.subscription_id) {
      await supabase
        .from('payments')
        .update({ subscription_id: subscriptionId })
        .eq('id', payment.id);
    }

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
          id: subscription.plans.id,
          name: subscription.plans.name,
          duration: subscription.plans.duration,
          price: parseFloat(subscription.plans.price),
          features: subscription.plans.features
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

    const { data: subscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({ status: 'CANCELLED' })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: updatedSubscription.id,
        userId: updatedSubscription.user_id,
        planId: updatedSubscription.plan_id,
        status: updatedSubscription.status,
        startDate: updatedSubscription.start_date,
        endDate: updatedSubscription.end_date,
        createdAt: updatedSubscription.created_at,
        updatedAt: updatedSubscription.updated_at
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
