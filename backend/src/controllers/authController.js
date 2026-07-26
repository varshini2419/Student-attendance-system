const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('\\nLOGIN REQUEST RECEIVED');
    console.log(`Email: ${email}`);

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User found: false');
      return res.status(401).json({ success: false, message: 'User does not exist' });
    }
    
    console.log(`User found: ${user.name}`);

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log(`Password comparison result: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'faculty'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed admin and faculty accounts (for testing/setup)
// @route   POST /api/auth/seed
// @access  Public
exports.seedUsers = async (req, res) => {
  try {
    const adminExists = await User.findOne({ email: 'admin@attendance.com' });
    const facultyExists = await User.findOne({ email: 'faculty@attendance.com' });

    const seeded = [];

    if (!adminExists) {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@attendance.com',
        password: 'internship2026', // Will be hashed automatically by pre-save hook
        role: 'admin'
      });
      seeded.push({ email: admin.email, role: admin.role });
    }

    if (!facultyExists) {
      const faculty = await User.create({
        name: 'Faculty Member',
        email: 'faculty@attendance.com',
        password: 'internship2026', // Will be hashed automatically by pre-save hook
        role: 'faculty'
      });
      seeded.push({ email: faculty.email, role: faculty.role });
    }

    res.status(200).json({
      success: true,
      message: seeded.length > 0 ? 'Users seeded successfully' : 'Seed users already exist',
      data: seeded
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
