const mongoose = require("mongoose");
const { Schema } = mongoose;

const DiscussionSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  message: { type: String, required: true },
  replies: [{
    userId: { type: Schema.Types.ObjectId, ref: 'Student' },
    userType: { type: String, enum: ['Student', 'Admin'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
DiscussionSchema.index({ courseId: 1 });
DiscussionSchema.index({ studentId: 1 });
DiscussionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Discussion", DiscussionSchema);