const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['info', 'alert', 'system'],
      default: 'info'
    },
    read: {
      type: Boolean,
      default: false
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // If null, it's a broadcast to all users
    }
  },
  {
    timestamps: true
  }
);

// Index for fast query of unread notifications for a user
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
