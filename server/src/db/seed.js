const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');

async function main() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
    console.log('Starting database seed...');

    await User.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await Subscription.deleteMany({});
    console.log('Cleared existing data');

    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const userPassword = await bcrypt.hash('User123!', 10);

    const admin = await User.create({
      email: 'admin@gym.com',
      password: adminPassword,
      name: 'Admin User',
      phone: '+1234567890',
      address: '123 Admin Street, City',
      role: 'ADMIN'
    });

    const testUser = await User.create({
      email: 'user@gym.com',
      password: userPassword,
      name: 'Test User',
      phone: '+1987654321',
      address: '456 User Avenue, City',
      role: 'USER'
    });

    console.log('Created users:', { admin: admin.email, user: testUser.email });

    const basicPlan = await SubscriptionPlan.create({
      name: 'Basic Plan',
      duration: 'MONTHLY',
      price: 29.99,
      features: [
        'Access to gym equipment',
        'Locker room access',
        'Free Wi-Fi',
        'Standard hours (6 AM - 10 PM)'
      ],
      isActive: true
    });

    const standardPlan = await SubscriptionPlan.create({
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
      isActive: true
    });

    const premiumPlan = await SubscriptionPlan.create({
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
      isActive: true
    });

    console.log('Created subscription plans:', {
      basic: basicPlan.name,
      standard: standardPlan.name,
      premium: premiumPlan.name
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await Subscription.create({
      userId: testUser._id,
      planId: basicPlan._id,
      status: 'ACTIVE',
      startDate,
      endDate
    });

    console.log('Created test subscription for user');

    console.log('\n=== Seed completed successfully ===\n');
    console.log('Admin credentials:');
    console.log('  Email: admin@gym.com');
    console.log('  Password: Admin123!\n');
    console.log('Test user credentials:');
    console.log('  Email: user@gym.com');
    console.log('  Password: User123!\n');
  } catch (e) {
    console.error('Error seeding database:', e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
