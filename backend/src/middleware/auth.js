const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not loaded'
      });
    }

    const allowedRoles = [...new Set((roles || []).map((role) => String(role).toLowerCase()))];
    const userRoles = resolveUserRoles(req.user);
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role || userRoles.join(', ') || 'none'}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
