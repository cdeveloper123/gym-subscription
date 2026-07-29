const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, address } = req.body;

    const existingUsers = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUsers.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (email, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, phone, address, role, created_at',
      [email, hashedPassword, name, phone, address, 'USER']
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, phone, address, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name, p.duration, p.price, p.features
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'ACTIVE'
       LIMIT 1`,
      [user.id]
    );

    const activeSubscriptions = subscriptions.rows.map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      planId: sub.plan_id,
      status: sub.status,
      startDate: sub.start_date,
      endDate: sub.end_date,
      stripeSubscriptionId: sub.stripe_subscription_id,
      createdAt: sub.created_at,
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        duration: sub.duration,
        price: parseFloat(sub.price),
        features: sub.features
      }
    }));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at,
        subscriptions: activeSubscriptions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
