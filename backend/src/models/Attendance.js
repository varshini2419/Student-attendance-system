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
      required: true
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
      type: String, // e.g. "10:05 AM"
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Composite unique index to prevent duplicate attendance entries for a student in the same session
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
