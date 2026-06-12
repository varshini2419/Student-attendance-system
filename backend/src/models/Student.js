const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add student name'],
      trim: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Please add a roll number'],
      unique: true,
      trim: true,
      uppercase: true
    },
    branch: {
      type: String,
      required: [true, 'Please add a branch/department'],
      trim: true
    },
    section: {
      type: String,
      required: [true, 'Please add a section'],
      trim: true,
      uppercase: true
    },
    email: {
      type: String,
      required: [true, 'Please add student email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    embeddings: {
      type: [[Number]], // Array of arrays of numbers (e.g. 20-30 face embeddings of size 128 or 512)
      default: []
    },
    isProcessingFaceRegistration: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for fast search
// (rollNumber index is automatically created by unique: true)
studentSchema.index({ branch: 1, section: 1 });

module.exports = mongoose.model('Student', studentSchema);
