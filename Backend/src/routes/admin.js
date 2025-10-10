const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');

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
      .sort({ createdAt: -1 })
      .limit(10);

    // Get student's orders
    const orders = await Order.find({ studentId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate statistics
    const totalAttempts = await Attempt.countDocuments({ studentId: req.params.id });
    const completedAttempts = await Attempt.countDocuments({ 
      studentId: req.params.id, 
      status: { $in: ['submitted', 'auto-submitted'] }
    });
    const avgScore = await Attempt.aggregate([
      { $match: { studentId: student._id, status: { $in: ['submitted', 'auto-submitted'] } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);

    res.json({
      success: true,
      data: {
        student,
        statistics: {
          totalAttempts,
          completedAttempts,
          averageScore: avgScore[0]?.avgScore || 0
        },
        recentAttempts: attempts,
        recentOrders: orders
      }
    });

  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student details'
    });
  }
});

// @route   PUT /api/v1/admin/students/:id/status
// @desc    Update student status (activate/deactivate)
// @access  Private/Admin
router.put('/students/:id/status', adminAuth, [
  body('isActive')
    .isBoolean()
    .withMessage('Status must be boolean')
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

    const { isActive } = req.body;
    
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

    student.isActive = isActive;
    if (!isActive) {
      student.activeSessionId = null; // Force logout if deactivating
    }
    await student.save();

    res.json({
      success: true,
      message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          isActive: student.isActive
        }
      }
    });

  } catch (error) {
    console.error('Update student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student status'
    });
  }
});

// @route   POST /api/v1/admin/students/:id/reset-password
// @desc    Reset student password
// @access  Private/Admin
router.post('/students/:id/reset-password', adminAuth, async (req, res) => {
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

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    student.password = tempPassword;
    student.activeSessionId = null; // Force re-login
    await student.save();

    // TODO: Send email with temporary password
    // For now, return it in response (remove in production)
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Test Management Routes
// @route   GET /api/v1/admin/tests
// @desc    Get all tests for admin
// @access  Private/Admin
router.get('/tests', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      companyId,
      status = 'all'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (status !== 'all') query.isActive = status === 'active';

    const tests = await Test.find(query)
      .populate('companyId', 'name logoUrl')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Test.countDocuments(query);

    // Get attempt counts for each test
    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        const stats = await test.getStatistics();
        return {
          ...test.toJSON(),
          statistics: stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        tests: testsWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get admin tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tests'
    });
  }
});

// @route   DELETE /api/v1/admin/tests/:id
// @desc    Delete test
// @access  Private/Admin
router.delete('/tests/:id', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check if test has attempts
    const attemptCount = await Attempt.countDocuments({ testId: req.params.id });
    if (attemptCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete test. It has ${attemptCount} attempts. Consider deactivating instead.`
      });
    }

    await Test.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test'
    });
  }
});

// Results Management Routes
// @route   GET /api/v1/admin/results
// @desc    Get all results/attempts
// @access  Private/Admin
router.get('/results', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      testId, 
      studentId, 
      status,
      fromDate,
      toDate
    } = req.query;

    const query = {};
    
    if (testId) query.testId = testId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const attempts = await Attempt.find(query)
      .populate('studentId', 'name email')
      .populate({
        path: 'testId',
        select: 'title companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
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
// @desc    Export results to CSV
// @access  Private/Admin
router.get('/results/export', adminAuth, async (req, res) => {
  try {
    const { testId, fromDate, toDate, format = 'csv', attemptId } = req.query;
    
    const query = {};
    
    // If specific attemptId is provided, fetch only that attempt
    if (attemptId) {
      query._id = attemptId;
    } else {
      // Otherwise apply filters
      if (testId) query.testId = testId;
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
      }
    }

    const attempts = await Attempt.find(query)
      .populate('studentId', 'name email')
      .populate({
        path: 'testId',
        select: 'title companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = attempts.map(attempt => ({
        'Student Name': attempt.studentId?.name || 'N/A',
        'Student Email': attempt.studentId?.email || 'N/A',
        'Test Title': attempt.testId?.title || 'N/A',
        'Company': attempt.testId?.companyId?.name || 'N/A',
        'Score': attempt.score,
        'Percentage': attempt.percentage,
        'Status': attempt.status,
        'Start Time': attempt.startTime,
        'End Time': attempt.endTime,
        'Duration (mins)': attempt.actualTimeTaken,
        'Attempted Questions': attempt.attemptedQuestions,
        'Correct Answers': attempt.correctAnswers,
        'Rank': attempt.rank,
        'Percentile': attempt.percentile
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: attempts
      });
    }

  } catch (error) {
    console.error('Export results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export results'
    });
  }
});

// Orders Management Routes
// @route   GET /api/v1/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      fromDate, 
      toDate 
    } = req.query;

    const query = {};
    if (status) query.paymentStatus = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const orders = await Order.find(query)
      .populate('studentId', 'name email')
      .populate('items.testId', 'title companyId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
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

module.exports = router;