const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const generateId = () => {
  try {
    return require('crypto').randomUUID();
  } catch {
    return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, address } = req.body;

    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    await query(
      'INSERT INTO users (id, email, password, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, name, phone, address, 'USER']
    );

    const users = await query('SELECT id, email, name, phone, address, role, created_at FROM users WHERE id = ?', [userId]);
    const user = users[0];

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

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

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
    const users = await query('SELECT id, email, name, phone, address, role, created_at FROM users WHERE id = ?', [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name, p.duration, p.price, p.features
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'ACTIVE'
       LIMIT 1`,
      [user.id]
    );

    const activeSubscriptions = subscriptions.map(sub => ({
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
        features: typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features
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
