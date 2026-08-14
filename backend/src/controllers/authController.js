const User = require('../models/User');
const jwt = require('jsonwebtoken');

const resolveUserRoles = (user) => {
  const roleSet = new Set();

  if (Array.isArray(user?.roles)) {
    user.roles.forEach((value) => {
      if (value) roleSet.add(String(value).toLowerCase());
    });
  }

  if (user?.role) {
    roleSet.add(String(user.role).toLowerCase());
  }

  if (roleSet.has('admin')) {
    roleSet.add('faculty');
  }

  return Array.from(roleSet).filter((role) => ['student', 'faculty', 'admin'].includes(role));
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User does not exist' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const roles = resolveUserRoles(user);
    const primaryRole = user.role || (roles.includes('admin') ? 'admin' : roles.includes('faculty') ? 'faculty' : roles[0] || 'faculty');

    return res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: primaryRole,
        roles
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'faculty'
    });

    const roles = resolveUserRoles(user);
    const primaryRole = user.role || (roles.includes('admin') ? 'admin' : roles.includes('faculty') ? 'faculty' : roles[0] || 'faculty');

    return res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: primaryRole,
        roles
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedUsers = async (req, res) => {
  try {
    const requiredEmail = process.env.ADMIN_EMAIL;
    const requiredPassword = process.env.ADMIN_PASSWORD;

    if (!requiredEmail || !requiredPassword) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_EMAIL and ADMIN_PASSWORD must be configured in the environment.'
      });
    }

    let existingUser = await User.findOne({ email: requiredEmail });
    let seeded = [];

    if (!existingUser) {
      existingUser = await User.create({
        name: 'System Admin',
        email: requiredEmail,
        password: requiredPassword,
        role: 'admin',
        roles: ['admin', 'faculty']
      });
      seeded.push({
        email: existingUser.email,
        role: existingUser.role,
        roles: existingUser.roles || [existingUser.role]
      });
    } else {
      const hasRequiredRoleSet = Array.isArray(existingUser.roles) && existingUser.roles.includes('admin') && existingUser.roles.includes('faculty');
      const needsRoleUpdate = existingUser.role !== 'admin' || !hasRequiredRoleSet;

      if (needsRoleUpdate) {
        existingUser.name = existingUser.name || 'System Admin';
        existingUser.role = 'admin';
        existingUser.roles = ['admin', 'faculty'];
        await existingUser.save();
      }

      const passwordMatches = await existingUser.comparePassword(requiredPassword);
      if (!passwordMatches) {
        existingUser.password = requiredPassword;
        await existingUser.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: seeded.length > 0 ? 'Required shared admin/faculty account seeded successfully' : 'Required shared admin/faculty account is already present',
      data: seeded.length > 0 ? seeded : [{ email: existingUser.email, role: existingUser.role, roles: existingUser.roles || [existingUser.role] }]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
