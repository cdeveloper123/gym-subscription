const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = await Subscription.find({ userId: user._id })
      .populate('planId')
      .sort({ createdAt: -1 });

    const subscriptionsWithPayments = await Promise.all(
      subscriptions.map(async (sub) => {
        const payments = await Payment.find({ subscriptionId: sub._id });

        return {
          id: sub._id,
          userId: sub.userId,
          planId: sub.planId._id,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          createdAt: sub.createdAt,
          plan: {
            id: sub.planId._id,
            name: sub.planId.name,
            duration: sub.planId.duration,
            price: sub.planId.price,
            features: sub.planId.features
          },
          payments: payments.map(p => ({
            id: p._id,
            userId: p.userId,
            subscriptionId: p.subscriptionId,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            stripePaymentIntentId: p.stripePaymentIntentId,
            paymentMethod: p.paymentMethod,
            createdAt: p.createdAt
          }))
        };
      })
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
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

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
