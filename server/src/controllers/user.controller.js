const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, phone, address, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name, p.duration, p.price, p.features
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [user.id]
    );

    const subscriptionsWithPayments = await Promise.all(
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

    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (phone) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (address) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }

    if (updates.length > 0) {
      values.push(req.user.id);
      await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, name, phone, address, role, updated_at`,
        values
      );
    }

    const updatedResult = await query(
      'SELECT id, email, name, phone, address, role, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const updatedUser = updatedResult.rows[0];

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
