const bcrypt = require('bcryptjs');
const supabase = require('./supabase');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const { data: existingPlans, error: plansError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);

    if (plansError) {
      console.error('Error checking existing plans:', plansError.message);
    }

    if (existingPlans && existingPlans.length > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    const plans = [
      {
        name: 'Basic Plan',
        duration: 'MONTHLY',
        price: 29.99,
        features: [
          'Access to gym equipment',
          'Locker room access',
          'Free Wi-Fi',
          'Standard hours (6 AM - 10 PM)'
        ],
        is_active: true
      },
      {
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
        is_active: true
      },
      {
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
        is_active: true
      }
    ];

    const { data: insertedPlans, error: insertError } = await supabase
      .from('plans')
      .insert(plans)
      .select();

    if (insertError) {
      console.error('Error inserting plans:', insertError.message);
    } else {
      console.log('Plans seeded successfully');
    }

    const hashedPassword = await bcrypt.hash('User123!', 10);

    const { data: insertedUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: 'user@gym.com',
        password: hashedPassword,
        name: 'Test User',
        phone: '+1987654321',
        address: '456 User Avenue, City',
        role: 'USER'
      }])
      .select();

    if (userError) {
      console.error('Error inserting user:', userError.message);
    } else {
      console.log('Sample user seeded successfully');
      console.log('Database seeding completed!');
      console.log('\nSample credentials:');
      console.log('Email: user@gym.com');
      console.log('Password: User123!');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
