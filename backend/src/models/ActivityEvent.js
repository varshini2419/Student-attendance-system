const mongoose = require('mongoose');

const activityEventSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  eventType: { type: String, enum: ['LOGIN', 'LOGOUT'], required: true },
  timestamp: { type: Date, default: Date.now },
  screenshotUrl: { type: String }
}, { timestamps: true });

activityEventSchema.index({ student: 1, session: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityEvent', activityEventSchema);