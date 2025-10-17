const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { adminAuth, auth } = require("../middlewares/auth");
const Course = require("../models/Course");
const Recording = require("../models/Recording");
const RecordingEnrollment = require("../models/RecordingEnrollment");

const router = express.Router();

// 📂 Multer setup for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/recordings/");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mkv|mov|avi/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error("Only video files (mp4/mkv/mov/avi) are allowed"));
  },
});

// ✅ Admin uploads a recording for a course
router.post("/", adminAuth, async (req, res) => {
  try {
    const { courseId, title, description, videoUrl, thumbnailUrl, duration, resources } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const recording = new Recording({
      courseId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      resources: resources || []
    });

    await recording.save();

    res.json({ success: true, message: "Recording uploaded successfully", data: recording });
  } catch (error) {
    console.error("Upload recording error:", error);
    res.status(500).json({ success: false, message: "Failed to upload recording" });
  }
});
//update the recordings
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, thumbnailUrl, duration, resources } = req.body;

    // Check if recording exists
    const recording = await Recording.findById(id);
    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    // Update recording
    const updatedRecording = await Recording.findByIdAndUpdate(
      id,
      {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration,
        resources: resources || [],
        updatedAt: Date.now()
      },
      { new: true, runValidators: true } // Return updated document and run validators
    );

    res.json({ 
      success: true, 
      message: "Recording updated successfully", 
      data: updatedRecording 
    });
  } catch (error) {
    console.error("Update recording error:", error);
    res.status(500).json({ success: false, message: "Failed to update recording" });
  }
});
// delete
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if recording exists
    const recording = await Recording.findById(id);
    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    // Delete recording
    await Recording.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: "Recording deleted successfully" 
    });
  } catch (error) {
    console.error("Delete recording error:", error);
    res.status(500).json({ success: false, message: "Failed to delete recording" });
  }
});
// GET /recordings - Get all recordings with optional filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { courseId, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Filter by courseId if provided
    if (courseId) {
      query.courseId = courseId;
    }
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const recordings = await Recording.find(query)
      .populate('courseId', 'title category')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recording.countDocuments(query);

    res.json({
      success: true,
      data: {
        recordings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get recordings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recordings" });
  }
});

// 📜 Get course recordings with unlock status
router.get("/:courseId", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    // fetch full course details including curriculum and instructors
    const course = await Course.findById(courseId).select(
      "title description outcomes features curriculum instructors sections startDate duration recordingsPrice"
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // ✅ check if student already unlocked
    const enrollment = await RecordingEnrollment.findOne({
      studentId: req.student.id,
      courseId,
      status: "unlocked",
    });

    const isUnlocked = enrollment || course.recordingsPrice === 0;

    // ✅ fetch recordings only if unlocked
    const recordings = isUnlocked
      ? await Recording.find({ courseId, isActive: true }).sort({ createdAt: -1 })
      : [];

    res.json({
      success: true,
      data: {
        courseTitle: course.title,
        description: course.description,
        outcomes: course.outcomes,
        features: course.features,
        curriculum: course.curriculum,
        instructors: course.instructors,
        sections: course.sections,
        startDate: course.startDate,
        duration: course.duration,
        price: course.recordingsPrice,
        isUnlocked,
        recordings,
      },
    });
  } catch (error) {
    console.error("Get recordings error:", error);
    res.status(500).json({ success: false, message: "Failed to get recordings" });
  }
});

// ✅ Student unlocks recordings for a course
router.post("/unlock/:courseId", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if already enrolled
    let enrollment = await RecordingEnrollment.findOne({
      studentId: req.student.id,
      courseId,
    });

    if (enrollment) {
      return res.json({ success: true, message: "Already unlocked", data: enrollment });
    }

    enrollment = new RecordingEnrollment({
      studentId: req.student.id,
      courseId,
      status: "unlocked",
    });

    await enrollment.save();

    res.json({ success: true, message: "Recordings unlocked successfully", data: enrollment });
  } catch (error) {
    console.error("Unlock recording error:", error);
    res.status(500).json({ success: false, message: "Failed to unlock recordings" });
  }
});

module.exports = router;