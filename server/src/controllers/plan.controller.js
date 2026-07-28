const prisma = require('../lib/prisma');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    const where = includeInactive === 'true' ? {} : { isActive: true };

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      orderBy: { price: 'asc' }
    });

    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { name, duration, price, features, isActive } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        duration,
        price: parseFloat(price),
        features: features || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, duration, price, features, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (duration) updateData.duration = duration;
    if (price) updateData.price = parseFloat(price);
    if (features) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Plan deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
