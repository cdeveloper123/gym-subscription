const { query } = require('../config/database');

const getAllPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    let sql = 'SELECT * FROM plans';

    if (includeInactive !== 'true') {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY price ASC';

    const result = await query(sql);

    const plans = result.rows.map(plan => ({
      id: plan.id,
      name: plan.name,
      duration: plan.duration,
      price: parseFloat(plan.price),
      features: plan.features,
      isActive: plan.is_active,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    }));

    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM plans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = result.rows[0];

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

    const featuresJson = JSON.stringify(features || []);
    const active = isActive !== undefined ? isActive : true;

    const result = await query(
      'INSERT INTO plans (name, duration, price, features, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, duration, price, featuresJson, active]
    );

    const plan = result.rows[0];

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

    const existingPlan = await query('SELECT * FROM plans WHERE id = $1', [id]);

    if (existingPlan.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (duration) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }

    if (price) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }

    if (features) {
      updates.push(`features = $${paramCount++}`);
      values.push(JSON.stringify(features));
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE plans SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        values
      );
    }

    const updatedPlan = await query('SELECT * FROM plans WHERE id = $1', [id]);
    const plan = updatedPlan.rows[0];

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

    const existingPlan = await query('SELECT * FROM plans WHERE id = $1', [id]);

    if (existingPlan.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await query('UPDATE plans SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);

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
