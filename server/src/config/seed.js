const bcrypt = require('bcryptjs');
const { query } = require('./database');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Check if data already exists
    const existingPlans = await query('SELECT COUNT(*) as count FROM plans');
    if (parseInt(existingPlans.rows[0].count) > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    // Seed plans
    const plans = [
      {
        name: 'Basic Plan',
        duration: 'MONTHLY',
        price: 29.99,
        features: JSON.stringify([
          'Access to gym equipment',
          'Locker room access',
          'Free Wi-Fi',
          'Standard hours (6 AM - 10 PM)'
        ])
      },
      {
        name: 'Standard Plan',
        duration: 'QUARTERLY',
        price: 79.99,
        features: JSON.stringify([
          'All Basic Plan features',
          'Group fitness classes',
          '1 personal training session per month',
          '24/7 gym access',
          'Towel service'
        ])
      },
      {
        name: 'Premium Plan',
        duration: 'YEARLY',
        price: 299.99,
        features: JSON.stringify([
          'All Standard Plan features',
          'Unlimited personal training',
          'Nutrition consultation',
          'Spa and sauna access',
          'Guest passes (5 per month)',
          'Priority class booking',
          'Free parking'
        ])
      }
    ];

    for (const plan of plans) {
      await query(
        'INSERT INTO plans (name, duration, price, features, is_active) VALUES ($1, $2, $3, $4, $5)',
        [plan.name, plan.duration, plan.price, plan.features, true]
      );
    }

    console.log('Plans seeded successfully');

    // Seed sample user
    const hashedPassword = await bcrypt.hash('User123!', 10);

    await query(
      'INSERT INTO users (email, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['user@gym.com', hashedPassword, 'Test User', '+1987654321', '456 User Avenue, City', 'USER']
    );

    console.log('Sample user seeded successfully');
    console.log('Database seeding completed!');
    console.log('\nSample credentials:');
    console.log('Email: user@gym.com');
    console.log('Password: User123!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedDatabase;
