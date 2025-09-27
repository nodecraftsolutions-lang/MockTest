const mongoose = require("mongoose");

const recordingEnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  status: {
    type: String,
    enum: ["unlocked"],
    default: "unlocked"
  },
}, { timestamps: true });

module.exports = mongoose.model("RecordingEnrollment", recordingEnrollmentSchema);
