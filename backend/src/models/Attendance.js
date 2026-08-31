const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: false // Manual marking might not have a session
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      default: 'Present'
    },
    detectedTime: {
      type: String, // Legacy support
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // New fields for cycle
    loginTime: {
      type: Date,
      required: false // Manual marking might not set this
    },
    logoutTime: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: null
    },
    cycleStatus: {
      type: String,
      enum: ['OPEN', 'COMPLETED'],
      default: 'OPEN'
    },
    loginScreenshot: {
      type: String,
      default: null
    },
    logoutScreenshot: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// We explicitly DO NOT want a unique index on student+session to allow multiple cycles.
// We can index on them for fast queries.
attendanceSchema.index({ student: 1, session: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
