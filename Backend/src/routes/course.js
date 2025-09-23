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

    res.json({ success: true, data: enrichedCourses });
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
        ...course.toObject(),
        isEnrolled
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course details' });
  }
});

// @route   POST /api/v1/courses/:id/enroll
// @desc    Enroll in a course (free/paid)
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.student.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Free course → enroll directly
    if (course.price === 0) {
      course.enrolledStudents.push(req.student.id);
      await course.save();

      return res.json({
        success: true,
        message: 'Enrolled successfully',
        data: { courseId: course._id }
      });
    }

    // Paid course → go through order system
    const order = new Order({
      studentId: req.student.id,
      items: [{
        testId: null, // not a test
        testTitle: `Course: ${course.title}`,
        price: course.price,
        currency: course.currency
      }],
      totalAmount: course.price,
      currency: course.currency,
      paymentMethod: 'razorpay',
      paymentGatewayOrderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      billingDetails: req.body.billingDetails || {
        name: req.student.name,
        email: req.student.email,
        mobile: req.student.mobile
      }
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order created for course enrollment. Complete payment to access course.',
      data: { orderId: order._id, amount: course.price }
    });
  } catch (error) {
    console.error('Course enroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll in course' });
  }
});

// @route   GET /api/v1/courses/:id/content
// @desc    Get course content (only if enrolled)
// @access  Private
router.get('/:id/content', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isEnrolled = course.enrolledStudents.includes(req.student.id);
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'You must enroll to access this course' });
    }

    res.json({
      success: true,
      data: {
        lessons: course.lessons,
        schedule: course.schedule,
        outcomes: course.outcomes,
        features: course.features
      }
    });
  } catch (error) {
    console.error('Get course content error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course content' });
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

    res.status(201).json({ success: true, message: 'Course created', data: course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
});

// @route   PUT /api/v1/courses/:id
// @desc    Update course
// @access  Private/Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, message: 'Course updated', data: course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
});

// @route   DELETE /api/v1/courses/:id
// @desc    Delete (deactivate) course
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.isActive = false;
    await course.save();

    res.json({ success: true, message: 'Course deactivated successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate course' });
  }
});

// @route   POST /api/v1/courses/:id/add-lesson
// @desc    Add lesson to course
// @access  Private/Admin
router.post('/:id/add-lesson', adminAuth, [
  body('title').notEmpty(),
  body('url').notEmpty(),
  body('type').isIn(['video', 'pdf', 'note', 'link'])
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, url, type, isPreview } = req.body;
    course.lessons.push({ title, url, type, isPreview });
    await course.save();

    res.json({ success: true, message: 'Lesson added', data: course.lessons });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to add lesson' });
  }
});

// @route   POST /api/v1/courses/:id/add-schedule
// @desc    Add live class schedule
// @access  Private/Admin
router.post('/:id/add-schedule', adminAuth, [
  body('title').notEmpty(),
  body('startDate').notEmpty(),
  body('endDate').notEmpty(),
  body('time').notEmpty(),
  body('meetingLink').notEmpty()
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, startDate, endDate, time, meetingLink } = req.body;
    course.schedule.push({ title, startDate, endDate, time, meetingLink });
    await course.save();

    res.json({ success: true, message: 'Schedule added', data: course.schedule });
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to add schedule' });
  }
});

module.exports = router;
