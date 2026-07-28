const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'USER' });

    const activeSubscriptions = await Subscription.countDocuments({ status: 'ACTIVE' });

    const expiredSubscriptions = await Subscription.countDocuments({ status: 'EXPIRED' });

    const completedPayments = await Payment.find({ status: 'COMPLETED' }).lean();

    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await Payment.find({
      status: 'COMPLETED',
      createdAt: { $gte: currentMonth }
    }).lean();

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const recentPayments = await Payment.find()
      .limit(10)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'planId' }
      })
      .lean();

    const recentPaymentsResponse = recentPayments.map(payment => ({
      ...payment,
      id: payment._id,
      user: payment.userId ? {
        name: payment.userId.name,
        email: payment.userId.email
      } : null,
      subscription: payment.subscriptionId ? {
        ...payment.subscriptionId,
        id: payment.subscriptionId._id,
        plan: payment.subscriptionId.planId ? {
          ...payment.subscriptionId.planId,
          id: payment.subscriptionId.planId._id
        } : null
      } : null
    }));

    res.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        monthlyRevenue
      },
      recentPayments: recentPaymentsResponse
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter)
    ]);

    const userIds = users.map(u => u._id);
    const activeSubscriptions = await Subscription.find({
      userId: { $in: userIds },
      status: 'ACTIVE'
    })
      .populate('planId')
      .lean();

    const usersResponse = users.map(user => {
      const userSubs = activeSubscriptions
        .filter(sub => sub.userId.toString() === user._id.toString())
        .slice(0, 1)
        .map(sub => ({
          ...sub,
          id: sub._id,
          plan: sub.planId ? { ...sub.planId, id: sub.planId._id } : null
        }));

      return {
        ...user,
        id: user._id,
        subscriptions: userSubs
      };
    });

    res.json({
      users: usersResponse,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = status ? { status } : {};

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'name email')
        .populate('planId')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Subscription.countDocuments(filter)
    ]);

    const subscriptionIds = subscriptions.map(s => s._id);
    const payments = await Payment.find({ subscriptionId: { $in: subscriptionIds } }).lean();

    const subscriptionsResponse = subscriptions.map(sub => ({
      ...sub,
      id: sub._id,
      user: sub.userId ? {
        name: sub.userId.name,
        email: sub.userId.email
      } : null,
      plan: sub.planId ? { ...sub.planId, id: sub.planId._id } : null,
      payments: payments
        .filter(p => p.subscriptionId?.toString() === sub._id.toString())
        .map(p => ({ ...p, id: p._id }))
    }));

    res.json({
      subscriptions: subscriptionsResponse,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = status ? { status } : {};

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'name email')
        .populate({
          path: 'subscriptionId',
          populate: { path: 'planId' }
        })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Payment.countDocuments(filter)
    ]);

    const paymentsResponse = payments.map(payment => ({
      ...payment,
      id: payment._id,
      user: payment.userId ? {
        name: payment.userId.name,
        email: payment.userId.email
      } : null,
      subscription: payment.subscriptionId ? {
        ...payment.subscriptionId,
        id: payment.subscriptionId._id,
        plan: payment.subscriptionId.planId ? {
          ...payment.subscriptionId.planId,
          id: payment.subscriptionId.planId._id
        } : null
      } : null
    }));

    res.json({
      payments: paymentsResponse,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllSubscriptions,
  getAllPayments
};
