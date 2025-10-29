const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middlewares/auth');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');
const Course = require('../models/Course');

const router = express.Router();

// ---------------------------------------------
// Multer config for profile photo uploads
// ---------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ---------------------------------------------
// GET /api/v1/students/profile
// ---------------------------------------------
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          photoUrl: student.photoUrl,
          role: student.role,
          emailVerified: student.emailVerified,
          preferences: student.preferences,
          lastActiveAt: student.lastActiveAt,
          createdAt: student.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// ---------------------------------------------
// PUT /api/v1/students/profile
// ---------------------------------------------
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('mobile').optional().matches(/^[0-9]{10}$/),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean(),
  body('preferences.theme').optional().isIn(['light', 'dark'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { name, mobile, preferences } = req.body;
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (mobile && mobile !== student.mobile) {
      const exists = await Student.findOne({ mobile, _id: { $ne: req.student.id } });
      if (exists) return res.status(400).json({ success: false, message: 'Mobile already registered' });
    }

    if (name) student.name = name;
    if (mobile) student.mobile = mobile;
    if (preferences) student.preferences = { ...student.preferences, ...preferences };

    await student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          photoUrl: student.photoUrl,
          preferences: student.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ---------------------------------------------
// POST /api/v1/students/upload-photo
// ---------------------------------------------
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    student.photoUrl = photoUrl;
    await student.save();

    res.json({ success: true, message: 'Photo uploaded successfully', data: { photoUrl } });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photo' });
  }
});

// ---------------------------------------------
// POST /api/v1/students/change-password
// ---------------------------------------------
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const student = await Student.findById(req.student.id).select('+password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const valid = await student.comparePassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    student.password = newPassword;
    student.activeSessionId = null;
    await student.save();

    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ---------------------------------------------
// GET /api/v1/students/attempts
// ---------------------------------------------
router.get('/attempts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, testId } = req.query;
    const query = { studentId: req.student.id };
    if (status) query.status = status;
    if (testId) query.testId = testId;

    const attempts = await Attempt.find(query)
      .populate({
        path: 'testId',
        select: 'title type companyId duration totalQuestions totalMarks',
        populate: {
          path: 'companyId',
          select: 'name logoUrl'
        }
      })
      .sort({ createdAt: -1 });

    // Group attempts by testId and keep only the most recent one for each test
    const groupedAttempts = attempts.reduce((acc, attempt) => {
      const testId = attempt.testId?._id.toString();
      if (!testId) return acc;
      
      // If this is the first attempt for this test, or if this attempt is more recent
      if (!acc[testId] || new Date(attempt.createdAt) > new Date(acc[testId].createdAt)) {
        acc[testId] = attempt;
      }
      return acc;
    }, {});

    // Convert grouped object back to array and apply pagination
    const allUniqueAttempts = Object.values(groupedAttempts);
    const total = allUniqueAttempts.length;
    const paginatedAttempts = allUniqueAttempts.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: { attempts: paginatedAttempts, pagination: { current: page, pages: Math.ceil(total / limit), total } }
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attempts' });
  }
});

// ---------------------------------------------
// GET /api/v1/students/attempts/:id
// ---------------------------------------------
router.get('/attempts/:id', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, studentId: req.student.id })
      .populate('testId')
      .populate('testId.companyId', 'name logoUrl');

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    if (attempt.createdAt < fourMonthsAgo)
      return res.status(410).json({ success: false, message: 'Results expired after 4 months' });

    const detailedAnswers = attempt.answers.map(answer => {
      const question = attempt.testId.generatedQuestions.find(
        q => q._id.toString() === answer.questionId.toString()
      );
      if (question) {
        // For multiple choice questions, we need to handle multiple correct answers
        let correctAnswerText = null;
        if (question.questionType === 'multiple') {
          // Get all correct options for multiple choice questions
          correctAnswerText = question.options
            .filter(opt => opt.isCorrect)
            .map(opt => opt.text);
        } else {
          // For single choice questions, get the single correct option
          const correctOpt = question.options.find(opt => opt.isCorrect);
          correctAnswerText = correctOpt ? correctOpt.text : null;
        }
        
        return {
          ...answer.toObject(),
          question: {
            text: question.questionText,
            options: question.options,
            correctAnswer: correctAnswerText,
            explanation: question.explanation,
            questionType: question.questionType || 'single'
          }
        };
      }
      return answer;
    });

    res.json({
      success: true,
      data: { attempt: { ...attempt.toObject(), detailedAnswers } }
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attempt details' });
  }
});

// ---------------------------------------------
// GET /api/v1/students/orders
// ---------------------------------------------
router.get('/orders', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { studentId: req.student.id };
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.testId',
        select: 'title companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .populate({
        path: 'items.courseId',
        select: 'title'
      });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// ---------------------------------------------
// GET /api/v1/students/dashboard
// ---------------------------------------------
router.get('/dashboard', auth, async (req, res) => {
  try {
    const studentId = req.student.id;

    const recentAttempts = await Attempt.find({ studentId })
      .populate('testId', 'title type companyId')
      .populate('testId.companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalAttempts = await Attempt.countDocuments({ studentId });
    const completedAttempts = await Attempt.countDocuments({ studentId, status: { $in: ['submitted', 'auto-submitted'] } });
    const passedAttempts = await Attempt.countDocuments({ studentId, isPassed: true });

    const recentOrders = await Order.find({ studentId }).sort({ createdAt: -1 }).limit(3);

    const completedWithScores = await Attempt.find({ studentId, status: { $in: ['submitted', 'auto-submitted'] } });
    const averageScore = completedWithScores.length > 0
      ? completedWithScores.reduce((sum, a) => sum + a.score, 0) / completedWithScores.length
      : 0;

    res.json({
      success: true,
      data: {
        statistics: {
          totalAttempts,
          completedAttempts,
          passedAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          passRate: completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 100) : 0
        },
        recentAttempts,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard data' });
  }
});

// ---------------------------------------------
// DELETE /api/v1/students/account
// ---------------------------------------------
router.delete('/account', auth, [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { password } = req.body;
    const student = await Student.findById(req.student.id).select('+password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const valid = await student.comparePassword(password);
    if (!valid) return res.status(400).json({ success: false, message: 'Incorrect password' });

    await student.deleteOne();
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/students/courses
// @desc    Get courses student is enrolled in
// @access  Private
router.get('/courses', auth, async (req, res) => {
  try {
    const courses = await Course.find({ enrolledStudents: req.student.id })
      .select('title description price currency startDate duration outcomes');

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get student courses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses' });
  }
});


module.exports = router;
