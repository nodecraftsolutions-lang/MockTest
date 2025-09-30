const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { auth, adminAuth, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (studentId, sessionId) => {
  return jwt.sign(
    { studentId, sessionId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (studentId, sessionId) => {
  return jwt.sign(
    { studentId, sessionId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '30d' }
  );
};

// Generate session ID
const generateSessionId = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Register validation
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin')
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/v1/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobile, password, role } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { email },
        ...(mobile ? [{ mobile }] : [])
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: existingStudent.email === email 
          ? 'Email already registered' 
          : 'Mobile number already registered'
      });
    }

    // Create new student with role if provided
    const student = new Student({
      name,
      email,
      mobile: mobile || "0000000000",
      password,
      role: role || 'student'
    });

    await student.save();

    // Generate session and tokens
    const sessionId = generateSessionId();
    student.activeSessionId = sessionId;
    await student.save();

    const token = generateToken(student._id, sessionId);
    const refreshToken = generateRefreshToken(student._id, sessionId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          role: student.role
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/v1/auth/login
// @desc    Login student
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, deviceFingerprint } = req.body;

    // Find student by email
    const student = await Student.findOne({ email }).select('+password');
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!student.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate new session (this will invalidate previous session)
    const sessionId = generateSessionId();
    student.activeSessionId = sessionId;
    student.deviceFingerprint = deviceFingerprint || null;
    student.lastActiveAt = new Date();
    await student.save();

    const token = generateToken(student._id, sessionId);
    const refreshToken = generateRefreshToken(student._id, sessionId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          role: student.role,
          photoUrl: student.photoUrl
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout student
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (student) {
      student.activeSessionId = null;
      student.deviceFingerprint = null;
      await student.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find student and verify session
    const student = await Student.findById(decoded.studentId);
    if (!student || student.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    // Generate new access token
    const newToken = generateToken(student._id, student.activeSessionId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
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

    const { email } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = student.generateResetPasswordToken();
    await student.save();

    // TODO: Send email with reset token
    // For now, we'll just return the token (remove this in production)
    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
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

    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const student = await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    student.password = password;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpire = undefined;
    student.activeSessionId = null; // Force re-login
    await student.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// @route   GET /api/v1/auth/me
// @desc    Get current student profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    
    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          role: student.role,
          photoUrl: student.photoUrl,
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

module.exports = router;