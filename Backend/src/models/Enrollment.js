const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
   courseId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Course",
    required:true
   },
   type: {
    type: String,
    enum: ["course", "test", "recording"],  // 👈 new field
    default: "course"
  },

  status: {
    type: String,
    enum: ['enrolled', 'completed', 'cancelled'],
    default: 'enrolled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

enrollmentSchema.index({ studentId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
