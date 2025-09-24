const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Course = require('../models/Course');
const Discussion = require('../models/Discussion');
const router = express.Router();

/**
 * ============================
 *   ADMIN ROUTES
 * ============================
 */

// Create course
router.post(
  '/',
  adminAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('price').isNumeric().withMessage('Price must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const course = new Course({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        currency: req.body.currency || 'INR',
        outcomes: req.body.outcomes || [],
        features: req.body.features || [],
        startDate: req.body.startDate,
        durationWeeks: req.body.durationWeeks,
        level: req.body.level,
        isPaid: req.body.price > 0,
        
      });

      await course.save();
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      console.error('Create course error:', err);
      res.status(500).json({ success: false, message: 'Failed to create course' });
    }
  }
);

// Update course
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ success: false, message: 'Failed to update course' });
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
    const courses = await Course.find({ isActive: true }).select('title description price currency isPaid category');
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
});

// Get single course (public)
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === req.student.id.toString()
    );

    res.json({
      success: true,
      data: {
        course,
        isEnrolled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get course' });
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
    res.status(500).json({ success: false, message: 'Failed to enroll' });
  }
});


// Get sessions (student must be enrolled)
router.get("/:id/sessions", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("sessions");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, data: course.sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
});
/**
 * 👉 Get course discussions
 * GET /api/v1/courses/:id/discussions
 */
router.get("/:id/discussions", auth, async (req, res) => {
  try {
    const messages = await Discussion.find({ courseId: req.params.id })
      .populate("studentId", "name email")
      .sort({ createdAt: 1 }); // oldest first
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get discussions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch discussions" });
  }
});
/**
 * 👉 Post new message in discussion
 * POST /api/v1/courses/:id/discussions
 */
router.post("/:id/discussions", auth, async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const newMessage = new Discussion({
      courseId: req.params.id,
      studentId: req.student.id, // from auth middleware
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
module.exports = router;
