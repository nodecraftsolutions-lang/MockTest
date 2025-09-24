const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  title: { type: String, required: true },
  startsAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  streamLink: { type: String, required: true },
  description: String,
}, { timestamps: true });

const SectionSchema = new Schema({
  title: String,
  lessonsCount: { type: Number, default: 0 },
  description: String,
});

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  outcomes: [String],
  features: [String],
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  category: { type: String, default: 'General' },
  startDate: Date,             // ✅ starting date
  durationWeeks: Number,       // ✅ duration
  level: { type: String, default: 'Beginner' },
  isPaid: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sessions: [SessionSchema],
  sections: [SectionSchema],
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Course', CourseSchema);
