const User = require('../models/User');

const seedDatabase = async () => {
  try {
    const requiredEmail = process.env.ADMIN_EMAIL || 'internships2026CSD-CSIT@gmail.com';
    const requiredPassword = process.env.ADMIN_PASSWORD || 'internships2026';

    console.log('Checking database for the required shared admin/faculty account...');

    let requiredUser = await User.findOne({ email: requiredEmail });

    if (!requiredUser) {
      requiredUser = await User.create({
        name: 'System Admin',
        email: requiredEmail,
        password: requiredPassword,
        role: 'admin',
        roles: ['admin', 'faculty']
      });
      console.log('----------------------------------------------------');
      console.log('✓ Required shared admin/faculty account created successfully.');
      console.log(`Email: ${requiredEmail}`);
      console.log('Password is stored securely as a hash.');
      console.log('----------------------------------------------------');
      return;
    }

    const needsRoleUpdate = requiredUser.role !== 'admin' || !Array.isArray(requiredUser.roles) || !requiredUser.roles.includes('admin') || !requiredUser.roles.includes('faculty');
    const needsPasswordUpdate = requiredUser.password && requiredUser.password !== requiredPassword;

    if (needsRoleUpdate || needsPasswordUpdate) {
      requiredUser.name = requiredUser.name || 'System Admin';
      requiredUser.role = 'admin';
      requiredUser.roles = ['admin', 'faculty'];
      requiredUser.password = requiredPassword;
      await requiredUser.save();
      console.log('----------------------------------------------------');
      console.log('✓ Required shared admin/faculty account updated successfully.');
      console.log(`Email: ${requiredEmail}`);
      console.log('Password is stored securely as a hash.');
      console.log('----------------------------------------------------');
    } else {
      console.log('✓ Required shared admin/faculty account already exists and is valid.');
    }
  } catch (error) {
    console.error('Error during database seeding:', error.message);
  }
};

module.exports = seedDatabase;
