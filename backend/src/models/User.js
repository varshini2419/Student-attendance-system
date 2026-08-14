const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const normalizeRoles = (role, roles = []) => {
  const roleSet = new Set();

  if (role) {
    roleSet.add(String(role).toLowerCase());
  }

  if (Array.isArray(roles)) {
    roles.forEach((entry) => {
      if (entry) {
        roleSet.add(String(entry).toLowerCase());
      }
    });
  }

  if (roleSet.has('admin')) {
    roleSet.add('faculty');
  }

  return Array.from(roleSet).filter((entry) => ['student', 'faculty', 'admin'].includes(entry));
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'faculty'],
      default: 'faculty'
    },
    roles: {
      type: [String],
      default: undefined,
      validate: {
        validator: function (value) {
          return Array.isArray(value) ? value.every((entry) => ['student', 'faculty', 'admin'].includes(String(entry).toLowerCase())) : true;
        },
        message: 'Invalid role in roles array'
      }
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (this.role && !this.roles) {
    this.roles = normalizeRoles(this.role, [this.role]);
  }

  if (Array.isArray(this.roles)) {
    this.roles = normalizeRoles(this.role, this.roles);
  }

  if (this.role === 'admin' && !this.roles.includes('faculty')) {
    this.roles.push('faculty');
  }

  if (!this.role && Array.isArray(this.roles) && this.roles.length > 0) {
    this.role = this.roles.includes('admin') ? 'admin' : this.roles.includes('faculty') ? 'faculty' : this.roles[0];
  }

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.hasRole = function (requiredRole) {
  if (!requiredRole) {
    return true;
  }

  const normalizedTarget = String(requiredRole).toLowerCase();
  const allowedRoles = new Set();

  if (Array.isArray(this.roles)) {
    this.roles.forEach((role) => allowedRoles.add(String(role).toLowerCase()));
  }

  if (this.role) {
    allowedRoles.add(String(this.role).toLowerCase());
  }

  if (allowedRoles.has('admin')) {
    allowedRoles.add('faculty');
  }

  return allowedRoles.has(normalizedTarget);
};

module.exports = mongoose.model('User', userSchema);
