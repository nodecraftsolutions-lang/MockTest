const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  title: {
    type: String,
    required: [true, "Recording title is required"],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, "Video URL is required"],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, { timestamps: true });

module.exports = mongoose.model("Recording", recordingSchema);
