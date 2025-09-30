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

// ⚡ Unique index per student per test OR course
enrollmentSchema.index({ studentId: 1, testId: 1 }, { unique: true, sparse: true });
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
