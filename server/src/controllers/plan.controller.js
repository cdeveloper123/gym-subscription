const { storage, generateId } = require('../lib/storage');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    let plans = storage.plans;

    if (includeInactive !== 'true') {
      plans = plans.filter(p => p.isActive);
    }

    plans = plans.sort((a, b) => a.price - b.price);

    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = storage.plans.find(p => p.id === id);

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

    const plan = {
      id: generateId(),
      name,
      duration,
      price: parseFloat(price),
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.plans.push(plan);

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

    const planIndex = storage.plans.findIndex(p => p.id === id);

    if (planIndex === -1) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = storage.plans[planIndex];

    if (name) plan.name = name;
    if (duration) plan.duration = duration;
    if (price) plan.price = parseFloat(price);
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    plan.updatedAt = new Date();

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

    const plan = storage.plans.find(p => p.id === id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plan.isActive = false;
    plan.updatedAt = new Date();

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
