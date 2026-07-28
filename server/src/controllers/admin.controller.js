const prisma = require('../lib/prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count({
      where: { role: 'USER' }
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });

    const expiredSubscriptions = await prisma.subscription.count({
      where: { status: 'EXPIRED' }
    });

    const completedPayments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' }
    });

    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: currentMonth }
      }
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const recentPayments = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    res.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        monthlyRevenue
      },
      recentPayments
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            take: 1
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
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

    const where = status ? { status } : {};

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          plan: true,
          payments: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subscription.count({ where })
    ]);

    res.json({
      subscriptions,
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

    const where = status ? { status } : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          subscription: {
            include: {
              plan: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
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
