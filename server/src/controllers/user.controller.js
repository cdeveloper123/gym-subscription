const { storage } = require('../lib/storage');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res, next) => {
  try {
    const user = storage.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = storage.subscriptions
      .filter(s => s.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const subscriptionsWithPayments = subscriptions.map(sub => {
      const plan = storage.plans.find(p => p.id === sub.planId);
      const payments = storage.payments.filter(p => p.subscriptionId === sub.id);
      return {
        ...sub,
        plan,
        payments
      };
    });

    const userResponse = {
      id: user.id,
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

    const userIndex = storage.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = storage.users[userIndex];

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
    user.updatedAt = new Date();

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      updatedAt: user.updatedAt
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
