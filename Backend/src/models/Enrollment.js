const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  type: {
    type: String,
    enum: ['course', 'test', 'recording'],
    required: true,
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'cancelled', 'unlocked'],
    default: 'enrolled',
  },
}, { timestamps: true });

// 🔎 Validation: ensure correct ID is present
enrollmentSchema.pre('validate', function (next) {
  if (this.type === 'test' && !this.testId) {
    return next(new Error('testId is required for test enrollment'));
  }
  if ((this.type === 'course' || this.type === 'recording') && !this.courseId) {
    return next(new Error('courseId is required for course/recording enrollment'));
  }
  next();
});

// ⚡ Unique constraints - simpler approach without partial filters that cause issues
// We'll handle the uniqueness logic in the application code instead
enrollmentSchema.index({ studentId: 1, testId: 1, type: 1 });
enrollmentSchema.index({ studentId: 1, courseId: 1, type: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);