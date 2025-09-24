const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Course = require('../models/Course');
const Order = require('../models/Order');

const router = express.Router();

//
// 📌 STUDENT ROUTES
//

// @route   GET /api/v1/courses
// @desc    Get all active courses
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('title description category duration price currency');

    // Mark if student already enrolled
    const enrichedCourses = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: course.enrolledStudents.includes(req.student.id)
    }));

    res.json({ success: true, data: { courses: enrichedCourses } });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
});

// @route   GET /api/v1/courses/:id
// @desc    Get course details
// @access  Public
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isEnrolled = course.enrolledStudents.includes(req.student.id);

    res.json({
      success: true,
      data: {
        course: {
          ...course.toObject(),
          isEnrolled
        }
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course details' });
  }
});

// @route   POST /api/v1/students/enroll-course
// @desc    Enroll in a free course
// @access  Private
router.post('/enroll', auth, [
  body('courseId').isMongoId().withMessage('Valid course ID required')
], async (req, res) => {
  try {
    const { courseId } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.student.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    if (course.price > 0) {
      return res.status(400).json({ success: false, message: 'This is a paid course. Please use payment flow.' });
    }

    course.enrolledStudents.push(req.student.id);
    await course.save();

    res.json({
      success: true,
      message: 'Enrolled successfully',
      data: { courseId: course._id }
    });
  } catch (error) {
    console.error('Course enroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll in course' });
  }
});

// @route   GET /api/v1/students/courses
// @desc    Get student's enrolled courses
// @access  Private
router.get('/my-courses', auth, async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.student.id,
      isActive: true
    });

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses' });
  }
});

//
// 📌 ADMIN ROUTES
//

// @route   POST /api/v1/courses
// @desc    Create new course
// @access  Private/Admin
router.post('/', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, outcomes, duration, features, price, currency, category } = req.body;

    const course = new Course({
      title,
      description,
      outcomes,
      duration,
      features,
      price,
      currency,
      category,
      createdBy: req.student.id
    });

    await course.save();

    res.status(201).json({ success: true, message: 'Course created', data: { course } });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
});

module.exports = router;