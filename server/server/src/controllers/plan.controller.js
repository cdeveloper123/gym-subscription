const Plan = require('../models/Plan');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const plans = await Plan.find(filter).sort({ price: 1 });

    res.json({
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      plan: {
        id: plan._id,
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { name, duration, price, features, isActive } = req.body;

    const plan = await Plan.create({
      name,
      duration,
      price: parseFloat(price),
      features: features || [],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: 'Plan created successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, duration, price, features, isActive } = req.body;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (name) plan.name = name;
    if (duration) plan.duration = duration;
    if (price) plan.price = parseFloat(price);
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    res.json({
      message: 'Plan updated successfully',
      plan: {
        id: plan._id,
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plan.isActive = false;
    await plan.save();

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
