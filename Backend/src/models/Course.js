const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  title: { type: String, required: true },
  startsAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  streamLink: { type: String, required: true },
  description: String,
}, { timestamps: true });

// Instructor schema
const InstructorSchema = new Schema({
  name: { type: String, required: true },
  bio: { type: String },
  experience: { type: String },
  expertise: { type: String },
  photoUrl: { type: String }
});

// Topic schema
const TopicSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String }
});

// Week schema
const WeekSchema = new Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  topics: [TopicSchema],
  goal: { type: String }
});

// Phase schema
const PhaseSchema = new Schema({
  phaseNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  goal: { type: String },
  weeks: [WeekSchema]
});

const RecordingSchema = new Schema({
  title: { type: String, required: true }, // e.g. "Aptitude Basics"
  description: { type: String },
  videoUrl: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/.+/i.test(v), // any video link
      message: "Invalid URL format"
    }
  },
  duration: { type: Number }, // optional, in minutes
  uploadedAt: { type: Date, default: Date.now },
  resources: [{
    title: { type: String, required: true },
    link: { type: String, required: true }
  }]
});

const resourceCourseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const resourceRecordingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);


const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  outcomes: [String],
  features: [String],
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  category: { type: String, default: 'General' },
  startDate: Date,              // ✅ course start date
  duration: Number,             // ✅ unified field
  level: { type: String, default: 'Beginner' },
  isPaid: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sessions: [SessionSchema],
  // Remove sections field and replace with curriculum
  curriculum: {
    phases: [PhaseSchema]
  },
  // Add course-level instructors
  instructors: [InstructorSchema],
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'Student' },
  createdAt: { type: Date, default: Date.now },
  recordings: [RecordingSchema],
  resourceCourse: [resourceCourseSchema],
  resourceRecordings: [resourceRecordingSchema],
  recordingsPrice: {
    type: Number,
    default: 0,
    min: [0, "Price cannot be negative"]
  }
});

module.exports = mongoose.model('Course', CourseSchema);