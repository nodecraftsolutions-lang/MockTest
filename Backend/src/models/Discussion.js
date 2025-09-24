const mongoose = require("mongoose");
const { Schema } = mongoose;

const DiscussionSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Discussion", DiscussionSchema);
