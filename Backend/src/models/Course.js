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
  uploadedAt: { type: Date, default: Date.now }
});
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
  sections: [SectionSchema],
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'Student' },
  createdAt: { type: Date, default: Date.now },
   recordings: [RecordingSchema],   // ✅ recordings array
  recordingsPrice: {
    type: Number,
    default: 0,
    min: [0, "Price cannot be negative"]
  }

});

module.exports = mongoose.model('Course', CourseSchema);
