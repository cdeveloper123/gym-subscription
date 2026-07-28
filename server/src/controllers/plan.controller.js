const SubscriptionPlan = require('../models/SubscriptionPlan');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const plans = await SubscriptionPlan.find(filter)
      .sort({ price: 1 })
      .lean();

    const plansResponse = plans.map(p => ({ ...p, id: p._id }));

    res.json({ plans: plansResponse });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id).lean();

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan: { ...plan, id: plan._id } });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { name, duration, price, features, isActive } = req.body;

    const plan = await SubscriptionPlan.create({
      name,
      duration,
      price: parseFloat(price),
      features: features || [],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: 'Plan created successfully',
      plan: { ...plan.toObject(), id: plan._id }
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

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    res.json({
      message: 'Plan updated successfully',
      plan: { ...plan, id: plan._id }
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    await SubscriptionPlan.findByIdAndUpdate(id, { isActive: false });

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
