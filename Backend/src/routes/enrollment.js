const express = require('express');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middlewares/auth');
const Test = require('../models/Test');
const Company = require('../models/Company');
const Course = require('../models/Course'); // ✅ add Course

const router = express.Router();

/**
 * ----------------------------
 * Enroll student to ALL paid tests of a company
 * ----------------------------
 */
router.post('/company/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get all paid tests for that company
    const tests = await Test.find({ companyId, type: 'paid', isActive: true });

    if (!tests.length) {
      return res.status(404).json({
        success: false,
        message: 'No paid tests found for this company',
      });
    }

    const enrollments = [];

    for (const test of tests) {
      // Check if already enrolled
      const existing = await Enrollment.findOne({
        studentId: req.student.id,
        testId: test._id,
        type: "test", // ✅ ensure we check by type
      });

      if (!existing) {
        const enrollment = new Enrollment({
          studentId: req.student.id,
          testId: test._id,
          type: "test",          // ✅ set type explicitly
          status: 'enrolled',
        });
        await enrollment.save();
        enrollments.push(enrollment);
      }
    }

    res.json({
      success: true,
      message: `Enrolled to ${enrollments.length} paid test(s) for this company`,
      data: enrollments,
    });
  } catch (error) {
    console.error('Company enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll to company tests',
    });
  }
});

/**
 * ----------------------------
 * Check enrollment status for paid tests of a company
 * ----------------------------
 */
router.get('/company/:companyId/status', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('=== CHECKING ENROLLMENT STATUS ===');
    console.log('Student ID:', req.student.id);
    console.log('Company ID:', companyId);

    // Find all paid tests for this company
    const tests = await Test.find({ companyId, type: 'paid' });
    console.log('Found paid tests:', tests.map(t => ({ id: t._id, title: t.title })));
    
    const testIds = tests.map(t => t._id);
    console.log('Extracted test IDs:', testIds);

    // Check if student is enrolled in any of these tests
    const enrollments = await Enrollment.find({
      studentId: req.student.id,
      testId: { $in: testIds },
      type: "test"
    });
    
    console.log('Found enrollments:', enrollments.map(e => ({ 
      id: e._id, 
      testId: e.testId, 
      studentId: e.studentId,
      type: e.type,
      status: e.status
    })));

    // Check if any enrollment has status 'enrolled'
    const isEnrolled = enrollments.some(e => e.status === 'enrolled');
    console.log('Is enrolled (final result):', isEnrolled);

    res.json({
      success: true,
      data: { isEnrolled },
    });
  } catch (error) {
    console.error('Enrollment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check enrollment status' });
  }
});

/**
 * ----------------------------
 * Unlock recordings for a course
 * ----------------------------
 */
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
      type: "recording",
    });

    if (existing) {
      return res.json({ success: true, message: "Already unlocked", data: existing });
    }

    const enrollment = new Enrollment({
      studentId: req.student.id,
      courseId,
      type: "recording",
      status: "unlocked",
    });

    await enrollment.save();

    res.json({ success: true, message: "Recordings unlocked", data: enrollment });
  } catch (err) {
    console.error("Unlock recordings error:", err);
    res.status(500).json({ success: false, message: "Failed to unlock recordings" });
  }
});

/**
 * ----------------------------
 * Check recordings unlock status for a course
 * ----------------------------
 */
router.get("/recordings/:courseId/status", auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId,
      type: "recording",
    });

    res.json({
      success: true,
      data: { isUnlocked: !!enrollment },
    });
  } catch (err) {
    console.error("Recordings status error:", err);
    res.status(500).json({ success: false, message: "Failed to check recordings status" });
  }
});

module.exports = router;
