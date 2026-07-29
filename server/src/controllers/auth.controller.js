const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { storage, generateId } = require('../lib/storage');

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, address } = req.body;

    const existingUser = storage.users.find(u => u.email === email);

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: generateId(),
      email,
      password: hashedPassword,
      name,
      phone,
      address,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.users.push(user);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = storage.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = storage.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activeSubscriptions = storage.subscriptions
      .filter(s => s.userId === user.id && s.status === 'ACTIVE')
      .map(sub => {
        const plan = storage.plans.find(p => p.id === sub.planId);
        return { ...sub, plan };
      })
      .slice(0, 1);

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      subscriptions: activeSubscriptions
    };

    res.json({ user: userResponse });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
