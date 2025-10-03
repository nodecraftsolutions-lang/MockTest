const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Course = require('../models/Course');
const Discussion = require('../models/Discussion');
const router = express.Router();

//ADMIN ROUTES
// Create course
// 📌 Create a new course (Admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice,
      sections   // ✅ NEW field
    } = req.body;

    const course = new Course({
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice: recordingsPrice || 0, // ✅ default 0 if not provided
      sections,
      createdBy: req.student.id,
    });

    await course.save();

    res.json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
});



/// 📌 Update course details
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      outcomes,
      features,
      price,
      currency,
      category,
      startDate,
      duration,
      level,
      isPaid,
      recordingsPrice,  // ✅ allow updates
    } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        outcomes,
        features,
        price,
        currency,
        category,
        startDate,
        duration,
        level,
        isPaid,
        recordingsPrice,
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ success: false, message: "Failed to update course" });
  }
});


// Delete course
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
});

// Add session to a course
router.post('/:id/sessions', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const session = {
      title: req.body.title,
      startsAt: req.body.startsAt,
      duration: req.body.duration,
      streamLink: req.body.streamLink,
      description: req.body.description
    };

    course.sessions.push(session);
    await course.save();

    res.json({ success: true, message: 'Session added', data: course.sessions });
  } catch (err) {
    console.error('Add session error:', err);
    res.status(500).json({ success: false, message: 'Failed to add session' });
  }
});

/**
 * ============================
 *   PUBLIC + STUDENT ROUTES
 * ============================
 */

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select("title description price features outcomes currency isPaid category startDate duration sections");

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
});



// Get single course
router.get("/:id", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email")
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const isEnrolled = Array.isArray(course.enrolledStudents)
      ? course.enrolledStudents.some(
          (s) => s.toString() === req.student?.id.toString()
        )
      : false;

    res.json({
      success: true,
      data: { course, isEnrolled },
    });
  } catch (err) {
    console.error("Get course error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
});


// Enroll student into course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.student.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.student.id);
    await course.save();

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    console.error("Enroll course error:", err);
    res.status(500).json({ success: false, message: 'Failed to enroll' });
  }
});

// Get sessions (student must be enrolled)
router.get("/:id/sessions", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("sessions enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    res.json({ success: true, data: course.sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
});

// Get course discussions (must be enrolled)
router.get("/:id/discussions", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    const messages = await Discussion.find({ courseId: req.params.id })
      .populate("studentId", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get discussions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch discussions" });
  }
});

// Post new message in discussion (must be enrolled)
router.post("/:id/discussions", auth, async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const course = await Course.findById(req.params.id).select("enrolledStudents");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.enrolledStudents.includes(req.student.id)) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    const newMessage = new Discussion({
      courseId: req.params.id,
      studentId: req.student.id,
      message: req.body.message,
    });

    await newMessage.save();
    await newMessage.populate("studentId", "name email");

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error("Post discussion error:", err);
    res.status(500).json({ success: false, message: "Failed to post message" });
  }
});

// Add new recording to course
router.post("/:courseId/recordings", adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, videoUrl, duration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const recording = { title, description, videoUrl, duration };
    course.recordings.push(recording);

    await course.save();

    res.json({ success: true, message: "Recording added", data: recording });
  } catch (err) {
    console.error("Add recording error:", err);
    res.status(500).json({ success: false, message: "Failed to add recording" });
  }
});

// Get all recordings of a course
router.get("/:courseId/recordings", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("title recordings recordingsPrice");
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Check if student has unlocked
    const enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId,
      type: "recording",
      status: "unlocked"
    });

    if (!enrollment && course.recordingsPrice > 0) {
      return res.status(403).json({ success: false, message: "Unlock recordings to access" });
    }

    res.json({ success: true, data: course.recordings });
  } catch (err) {
    console.error("Get recordings error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recordings" });
  }
});
// 📌 GET /api/v1/courses?withRecordings=true
// Fetch only courses that have recordings uploaded OR have recordingsPrice > 0
router.get("/", auth, async (req, res) => {
  try {
    const { withRecordings } = req.query;

    let query = { isActive: true };

    if (withRecordings === "true") {
      query.$or = [
        { recordingsPrice: { $gt: 0 } },
        { recordings: { $exists: true, $ne: [] } }
      ];
    }

    const courses = await Course.find(query)
      .select("title recordingsPrice recordings");

    res.json({
      success: true,
      data: {
        courses
      }
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
});

// POST /api/v1/courses/:id/recordings
router.post("/:id/recordings", adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    course.recordings.push({ title: req.body.title, link: req.body.link });
    await course.save();

    res.json({ success: true, message: "Recording added", data: course.recordings });
  } catch (err) {
    console.error("Add recording error:", err);
    res.status(500).json({ success: false, message: "Failed to add recording" });
  }
});

module.exports = router;
