const { query } = require('../config/database');

const generateId = () => {
  try {
    return require('crypto').randomUUID();
  } catch {
    return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
  }
};

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    let sql = 'SELECT * FROM plans';

    if (includeInactive !== 'true') {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY price ASC';

    const plans = await query(sql);

    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      duration: plan.duration,
      price: parseFloat(plan.price),
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      isActive: plan.is_active,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    }));

    res.json({ plans: formattedPlans });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plans = await query('SELECT * FROM plans WHERE id = ?', [id]);

    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = plans[0];

    res.json({
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
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

    const planId = generateId();
    const featuresJson = JSON.stringify(features || []);
    const active = isActive !== undefined ? isActive : true;

    await query(
      'INSERT INTO plans (id, name, duration, price, features, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [planId, name, duration, price, featuresJson, active]
    );

    const plans = await query('SELECT * FROM plans WHERE id = ?', [planId]);
    const plan = plans[0];

    res.status(201).json({
      message: 'Plan created successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
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

    const existingPlans = await query('SELECT * FROM plans WHERE id = ?', [id]);

    if (existingPlans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (duration) {
      updates.push('duration = ?');
      values.push(duration);
    }

    if (price) {
      updates.push('price = ?');
      values.push(price);
    }

    if (features) {
      updates.push('features = ?');
      values.push(JSON.stringify(features));
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE plans SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    const updatedPlans = await query('SELECT * FROM plans WHERE id = ?', [id]);
    const plan = updatedPlans[0];

    res.json({
      message: 'Plan updated successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        duration: plan.duration,
        price: parseFloat(plan.price),
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
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

    const plans = await query('SELECT * FROM plans WHERE id = ?', [id]);

    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await query('UPDATE plans SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

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
