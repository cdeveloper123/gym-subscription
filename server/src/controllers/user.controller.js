const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();

    const subscriptions = await Subscription.find({ userId: user._id })
      .populate('planId')
      .sort({ createdAt: -1 })
      .lean();

    const subscriptionIds = subscriptions.map(s => s._id);
    const payments = await Payment.find({ subscriptionId: { $in: subscriptionIds } }).lean();

    const subscriptionsWithPayments = subscriptions.map(sub => ({
      ...sub,
      id: sub._id,
      plan: sub.planId ? { ...sub.planId, id: sub.planId._id } : null,
      payments: payments.filter(p => p.subscriptionId?.toString() === sub._id.toString())
        .map(p => ({ ...p, id: p._id }))
    }));

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      subscriptions: subscriptionsWithPayments
    };

    res.json({ user: userResponse });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, currentPassword, newPassword } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const user = await User.findById(req.user.id);

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password').lean();

    const userResponse = {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      address: updatedUser.address,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
