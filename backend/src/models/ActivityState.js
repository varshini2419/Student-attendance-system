const mongoose = require('mongoose');

const activityStateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  currentState: { type: String, enum: ['IN', 'OUT'], default: 'OUT' },
  lastLoginTime: { type: Date },
  lastLogoutTime: { type: Date },
  totalDurationMinutes: { type: Number, default: 0 }
}, { timestamps: true });

activityStateSchema.index({ student: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('ActivityState', activityStateSchema);