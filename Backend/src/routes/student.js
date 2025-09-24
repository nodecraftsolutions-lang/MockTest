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


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/v1/students/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

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
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// @route   PUT /api/v1/students/profile
// @desc    Update student profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be boolean'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, mobile, preferences } = req.body;
    
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if mobile number is already taken by another student
    if (mobile && mobile !== student.mobile) {
      const existingStudent = await Student.findOne({ 
        mobile, 
        _id: { $ne: req.student.id } 
      });
      
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already registered'
        });
      }
    }

    // Update fields
    if (name) student.name = name;
    if (mobile) student.mobile = mobile;
    if (preferences) {
      student.preferences = { ...student.preferences, ...preferences };
    }

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
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/v1/students/upload-photo
// @desc    Upload profile photo
// @access  Private
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update photo URL (in production, you'd upload to cloud storage)
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    student.photoUrl = photoUrl;
    await student.save();

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        photoUrl: photoUrl
      }
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo'
    });
  }
});

// @route   POST /api/v1/students/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    const student = await Student.findById(req.student.id).select('+password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await student.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    student.password = newPassword;
    student.activeSessionId = null; // Force re-login
    await student.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// @route   GET /api/v1/students/attempts
// @desc    Get student's exam attempts
// @access  Private
router.get('/attempts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, testId } = req.query;
    
    const query = { studentId: req.student.id };
    if (status) query.status = status;
    if (testId) query.testId = testId;

    const attempts = await Attempt.find(query)
      .populate('testId', 'title type companyId duration totalQuestions')
      .populate('testId.companyId', 'name logoUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attempt.countDocuments(query);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attempts'
    });
  }
});

// @route   GET /api/v1/students/attempts/:id
// @desc    Get specific attempt details
// @access  Private
router.get('/attempts/:id', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      _id: req.params.id,
      studentId: req.student.id
    })
    .populate('testId')
    .populate('testId.companyId', 'name logoUrl');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Check if results are still available (4 months retention)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    
    if (attempt.createdAt < fourMonthsAgo) {
      return res.status(410).json({
        success: false,
        message: 'Results have expired. Results are available for 4 months only.'
      });
    }

    // Get detailed analysis with correct answers
    const detailedAnswers = attempt.answers.map(answer => {
      const question = attempt.testId.questions.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        return {
          ...answer.toObject(),
          question: {
            text: question.questionText,
            options: question.options,
            correctAnswer: correctOption ? correctOption.text : null,
            explanation: question.explanation
          }
        };
      }
      return answer;
    });

    res.json({
      success: true,
      data: {
        attempt: {
          ...attempt.toObject(),
          detailedAnswers
        }
      }
    });

  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attempt details'
    });
  }
});

// @route   GET /api/v1/students/orders
// @desc    Get student's orders
// @access  Private
router.get('/orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const orders = await Order.getStudentOrders(req.student.id, status)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ 
      studentId: req.student.id,
      ...(status && { paymentStatus: status })
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
});

// @route   GET /api/v1/students/dashboard
// @desc    Get student dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const studentId = req.student.id;

    // Get recent attempts
    const recentAttempts = await Attempt.find({ studentId })
      .populate('testId', 'title type companyId')
      .populate('testId.companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get attempt statistics
    const totalAttempts = await Attempt.countDocuments({ studentId });
    const completedAttempts = await Attempt.countDocuments({ 
      studentId, 
      status: { $in: ['submitted', 'auto-submitted'] }
    });
    const passedAttempts = await Attempt.countDocuments({ 
      studentId, 
      isPassed: true 
    });

    // Get recent orders
    const recentOrders = await Order.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Calculate average score
    const completedAttemptsWithScores = await Attempt.find({ 
      studentId, 
      status: { $in: ['submitted', 'auto-submitted'] }
    });
    
    const averageScore = completedAttemptsWithScores.length > 0 
      ? completedAttemptsWithScores.reduce((sum, attempt) => sum + attempt.score, 0) / completedAttemptsWithScores.length
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
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// @route   DELETE /api/v1/students/account
// @desc    Delete student account
// @access  Private
router.delete('/account', auth, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    
    const student = await Student.findById(req.student.id).select('+password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    // Delete account
    await student.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
