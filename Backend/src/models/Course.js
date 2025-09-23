const mongoose = require('mongoose');

// Lessons inside a course
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['video', 'pdf', 'note', 'link'], default: 'video' },
  url: { type: String, required: true },
  isPreview: { type: Boolean, default: false }
}, { _id: true });

// Live class schedules
const scheduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  time: { type: String, required: true }, // e.g. "6:00 PM - 7:00 PM IST"
  meetingLink: { type: String, required: true }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },
  outcomes: [{ type: String, trim: true }], // What student will learn
  duration: { type: String, trim: true },   // e.g. "6 Weeks", "40 Hours"
  features: [{ type: String, trim: true }], // Highlights (notes, quizzes, etc.)
  price: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR'] },
  category: { type: String, default: 'General', trim: true },
  lessons: [lessonSchema],
  schedule: [scheduleSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
courseSchema.index({ title: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

// Check if student enrolled
courseSchema.methods.isStudentEnrolled = function (studentId) {
  return this.enrolledStudents.some(id => id.toString() === studentId.toString());
};

module.exports = mongoose.model('Course', courseSchema);
