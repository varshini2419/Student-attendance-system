const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
      required: true
    },
    format: {
      type: String,
      enum: ['PDF', 'Excel', 'CSV'],
      required: true
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileUrl: {
      type: String, // Path or URL to the generated report file
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Completed'
    }
  },
  {
    timestamps: true
  }
);

// Index for fast query of reports by user and date
reportSchema.index({ generatedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
