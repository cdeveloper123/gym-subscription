const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  getAllSubscriptions,
  getAllPayments
} = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/subscriptions', getAllSubscriptions);
router.get('/payments', getAllPayments);

module.exports = router;
