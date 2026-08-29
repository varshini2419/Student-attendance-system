const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    sessionName: {
      type: String,
      default: 'Unnamed Session'
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
