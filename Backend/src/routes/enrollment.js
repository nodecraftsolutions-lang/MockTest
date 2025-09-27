const express = require('express');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middlewares/auth');
const Test = require('../models/Test');  // <-- add this
const Company = require('../models/Company');


const router = express.Router();

// POST /api/v1/enrollments/company/:companyId
router.post('/company/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get all paid tests for that company
    const tests = await Test.find({ companyId, type: 'paid', isActive: true });

    if (!tests.length) {
      return res.status(404).json({
        success: false,
        message: 'No paid tests found for this company'
      });
    }

    const enrollments = [];

    for (const test of tests) {
      // Check if already enrolled
      const existing = await Enrollment.findOne({
        studentId: req.student.id,
        testId: test._id
      });
      if (!existing) {
        const enrollment = new Enrollment({
          studentId: req.student.id,
          testId: test._id,
          status: 'enrolled'
        });
        await enrollment.save();
        enrollments.push(enrollment);
      }
    }

    res.json({
      success: true,
      message: `Enrolled to ${enrollments.length} paid test(s) for this company`,
      data: enrollments
    });
  } catch (error) {
    console.error('Company enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll to company tests'
    });
  }
});


// GET /api/v1/enrollments/company/:companyId/status
router.get('/company/:companyId/status', auth, async (req, res) => {
  try {
    const { companyId } = req.params;

    // check if student has at least 1 enrollment in this company
    const testIds = await Test.find({ companyId, type: 'paid' }).distinct('_id');

    const existing = await Enrollment.findOne({
      studentId: req.student.id,
      testId: { $in: testIds },
      status: 'enrolled'
    });

    res.json({
      success: true,
      data: { isEnrolled: !!existing }
    });
  } catch (error) {
    console.error('Enrollment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check enrollment status' });
  }
});
// Unlock recordings for a course
router.post("/recordings/:courseId/unlock", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (course.recordingsPrice <= 0) {
      return res.json({ success: true, message: "Recordings are free", data: null });
    }

    // Check if already unlocked
    const existing = await Enrollment.findOne({
      studentId: req.student.id,
      courseId,
      type: "recording"
    });

    if (existing) {
      return res.json({ success: true, message: "Already unlocked", data: existing });
    }

    // TODO: Integrate payment later
    const enrollment = new Enrollment({
      studentId: req.student.id,
      courseId,
      type: "recording",
      status: "unlocked"
    });

    await enrollment.save();

    res.json({ success: true, message: "Recordings unlocked", data: enrollment });
  } catch (err) {
    console.error("Unlock recordings error:", err);
    res.status(500).json({ success: false, message: "Failed to unlock recordings" });
  }
});

// Check enrollment status for recordings
router.get("/recordings/:courseId/status", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId,
      type: "recording"
    });

    res.json({
      success: true,
      data: { isUnlocked: !!enrollment }
    });
  } catch (err) {
    console.error("Recordings status error:", err);
    res.status(500).json({ success: false, message: "Failed to check recordings status" });
  }
});

// POST /api/v1/enrollments/recordings/:courseId
router.post("/recordings/:courseId", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const existing = await Enrollment.findOne({
      studentId: req.student.id,
      courseId: course._id,
      type: "recording"
    });

    if (existing) {
      return res.json({ success: true, message: "Already unlocked", data: existing });
    }

    const enrollment = new Enrollment({
      studentId: req.student.id,
      courseId: course._id,
      type: "recording",
      status: "unlocked"
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: "Recordings unlocked successfully",
      data: enrollment
    });
  } catch (err) {
    console.error("Unlock recordings error:", err);
    res.status(500).json({ success: false, message: "Failed to unlock recordings" });
  }
});

// GET /api/v1/enrollments/recordings/:courseId/status
router.get("/recordings/:courseId/status", auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId: req.params.courseId,
      type: "recording"
    });

    res.json({
      success: true,
      data: { isUnlocked: !!enrollment }
    });
  } catch (err) {
    console.error("Recording enrollment status error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
});

module.exports = router;
