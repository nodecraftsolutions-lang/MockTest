const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');
const Alumni = require('../models/Alumni');

const router = express.Router();

// @route   GET /api/v1/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalCompanies,
      totalTests,
      totalAttempts,
      totalOrders,
      revenueData
    ] = await Promise.all([
      Student.countDocuments({ role: 'student' }),
      Student.countDocuments({ role: 'student', isActive: true }),
      Company.countDocuments({ isActive: true }),
      Test.countDocuments({ isActive: true }),
      Attempt.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get recent activities
    const recentStudents = await Student.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentAttempts = await Attempt.find()
      .populate('studentId', 'name email')
      .populate('testId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = await Order.find()
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly statistics for charts
    const monthlyStats = await Attempt.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          totalCompanies,
          totalTests,
          totalAttempts,
          totalOrders,
          totalRevenue: revenueData[0]?.total || 0
        },
        recentActivities: {
          students: recentStudents,
          attempts: recentAttempts,
          orders: recentOrders
        },
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// Student Management Routes
// @route   GET /api/v1/admin/students
// @desc    Get all students with filters
// @access  Private/Admin
router.get('/students', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { role: 'student' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .select('name email mobile isActive lastActiveAt createdAt')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    // Get attempt counts for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const attemptCount = await Attempt.countDocuments({ studentId: student._id });
        const orderCount = await Order.countDocuments({ studentId: student._id });
        
        return {
          ...student.toJSON(),
          attemptCount,
          orderCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        students: studentsWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students'
    });
  }
});

// @route   GET /api/v1/admin/students/:id
// @desc    Get student details
// @access  Private/Admin
router.get('/students/:id', adminAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      _id: req.params.id, 
      role: 'student' 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's attempts
    const attempts = await Attempt.find({ studentId: req.params.id })
      .populate('testId', 'title type companyId')
      .populate('testId.companyId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        student: student.toJSON(),
        attempts
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student'
    });
  }
});

// @route   PUT /api/v1/admin/students/:id/status
// @desc    Toggle student active status
// @access  Private/Admin
router.put('/students/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: student
    });

  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student status'
    });
  }
});

// @route   POST /api/v1/admin/students/:id/reset-password
// @desc    Reset student password and send email
// @access  Private/Admin
router.post('/students/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    student.password = await bcrypt.hash(tempPassword, salt);
    
    // Clear reset token if exists
    student.resetPasswordToken = undefined;
    student.resetPasswordExpire = undefined;
    
    await student.save();

    // TODO: Send email with temporary password
    console.log(`Temporary password for ${student.email}: ${tempPassword}`);

    res.json({
      success: true,
      message: 'Password reset successfully. Temporary password logged to console.'
    });

  } catch (error) {
    console.error('Reset student password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// @route   GET /api/v1/admin/results
// @desc    Get all test attempts with filters
// @access  Private/Admin
router.get('/results', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      testId,
      status,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (testId && testId !== 'all') {
      query.testId = testId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const attempts = await Attempt.find(query)
      .populate('studentId', 'name email')
      .populate('testId', 'title companyId')
      .populate('testId.companyId', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attempt.countDocuments(query);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get results'
    });
  }
});

// @route   GET /api/v1/admin/results/export
// @desc    Export test attempts as CSV or JSON
// @access  Private/Admin
router.get('/results/export', adminAuth, async (req, res) => {
  try {
    const { 
      testId,
      attemptId,
      status,
      fromDate,
      toDate,
      format = 'csv'
    } = req.query;

    const query = {};
    
    if (attemptId) {
      query._id = attemptId;
    } else {
      if (testId && testId !== 'all') {
        query.testId = testId;
      }

      if (status && status !== 'all') {
        query.status = status;
      }

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) {
          query.createdAt.$gte = new Date(fromDate);
        }
        if (toDate) {
          query.createdAt.$lte = new Date(toDate);
        }
      }
    }

    const attempts = await Attempt.find(query)
      .populate('studentId', 'name email')
      .populate('testId', 'title companyId')
      .populate('testId.companyId', 'name')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({
        success: true,
        data: attempts
      });
    }

    // For CSV format
    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for export'
      });
    }

    // Create CSV headers
    const headers = [
      'Student Name',
      'Student Email',
      'Test Title',
      'Company',
      'Score',
      'Percentage',
      'Status',
      'Start Time',
      'End Time',
      'Duration (mins)',
      'Attempted Questions',
      'Correct Answers',
      'Rank',
      'Percentile'
    ].join(',');

    // Create CSV rows
    const rows = attempts.map(attempt => {
      return [
        attempt.studentId?.name || 'N/A',
        attempt.studentId?.email || 'N/A',
        attempt.testId?.title || 'N/A',
        attempt.testId?.companyId?.name || 'N/A',
        attempt.score || 0,
        attempt.percentage || 0,
        attempt.status || 'N/A',
        attempt.startTime ? new Date(attempt.startTime).toISOString() : 'N/A',
        attempt.endTime ? new Date(attempt.endTime).toISOString() : 'N/A',
        attempt.actualTimeTaken || 0,
        attempt.attemptedQuestions || 0,
        attempt.correctAnswers || 0,
        attempt.rank || 'N/A',
        attempt.percentile || 'N/A'
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export results'
    });
  }
});

module.exports = router;