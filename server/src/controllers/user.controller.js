const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, address, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    const subscriptionsWithPayments = await Promise.all(
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

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at,
        subscriptions: subscriptionsWithPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, currentPassword, newPassword } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, name, phone, address, role, updated_at')
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
