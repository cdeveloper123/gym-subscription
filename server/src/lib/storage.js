// In-memory storage
const storage = {
  users: [],
  plans: [],
  subscriptions: [],
  payments: []
};

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initialize with sample data
const initializeStorage = () => {
  const bcrypt = require('bcryptjs');

  // Add sample plans
  storage.plans = [
    {
      id: generateId(),
      name: 'Basic Plan',
      duration: 'MONTHLY',
      price: 29.99,
      features: [
        'Access to gym equipment',
        'Locker room access',
        'Free Wi-Fi',
        'Standard hours (6 AM - 10 PM)'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Standard Plan',
      duration: 'QUARTERLY',
      price: 79.99,
      features: [
        'All Basic Plan features',
        'Group fitness classes',
        '1 personal training session per month',
        '24/7 gym access',
        'Towel service'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      name: 'Premium Plan',
      duration: 'YEARLY',
      price: 299.99,
      features: [
        'All Standard Plan features',
        'Unlimited personal training',
        'Nutrition consultation',
        'Spa and sauna access',
        'Guest passes (5 per month)',
        'Priority class booking',
        'Free parking'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Add sample user
  const hashedPassword = bcrypt.hashSync('User123!', 10);
  storage.users.push({
    id: generateId(),
    email: 'user@gym.com',
    password: hashedPassword,
    name: 'Test User',
    phone: '+1987654321',
    address: '456 User Avenue, City',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('In-memory storage initialized with sample data');
};

module.exports = { storage, generateId, initializeStorage };
