const User = require('../models/User');

const seedDatabase = async () => {
  try {
    console.log('Checking database for default administrative accounts...');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    let adminCreated = false;
    
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: 'admin123', // Will be hashed automatically by User model pre-save hook
        role: 'admin'
      });
      adminCreated = true;
    }

    // Check if faculty exists
    const facultyExists = await User.findOne({ email: 'faculty@gmail.com' });
    let facultyCreated = false;

    if (!facultyExists) {
      await User.create({
        name: 'Faculty Member',
        email: 'faculty@gmail.com',
        password: 'faculty123', // Will be hashed automatically by User model pre-save hook
        role: 'faculty'
      });
      facultyCreated = true;
    }

    if (adminCreated || facultyCreated || (!adminExists && !facultyExists)) {
      console.log('----------------------------------------------------');
      console.log('✓ Default accounts seeded successfully!');
      console.log('Login Credentials:');
      console.log('  [Admin]   Email: admin@gmail.com    | Password: admin123');
      console.log('  [Faculty] Email: faculty@gmail.com  | Password: faculty123');
      console.log('----------------------------------------------------');
    } else {
      console.log('✓ Default administrative accounts already exist.');
    }
  } catch (error) {
    console.error('Error during database seeding:', error.message);
  }
};

module.exports = seedDatabase;
