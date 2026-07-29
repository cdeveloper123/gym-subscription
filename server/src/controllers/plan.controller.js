const supabase = require('../config/supabase');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    let query = supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (includeInactive !== 'true') {
      query = query.eq('is_active', true);
    }

    const { data: plans, error } = await query;

    if (error) throw error;

    res.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: plan.features,
        isActive: plan.is_active,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: plan.features,
        isActive: plan.is_active,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { name, duration, price, features, isActive } = req.body;

    const { data: plan, error } = await supabase
      .from('plans')
      .insert([{
        name,
        duration,
        price: parseFloat(price),
        features: features || [],
        is_active: isActive !== undefined ? isActive : true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Plan created successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: plan.features,
        isActive: plan.is_active,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
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

    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (duration) updates.duration = duration;
    if (price) updates.price = parseFloat(price);
    if (features) updates.features = features;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: plan, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Plan updated successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: plan.features,
        isActive: plan.is_active,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { error } = await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

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
