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
      revenueData,
      // Additional data for enhanced dashboard
      totalCourses,
      totalRecordings,
      recentCourses,
      topPerformingTests
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
      ]),
      // Additional data for enhanced dashboard
      require('../models/Course').countDocuments({ isActive: true }),
      require('../models/Recording').countDocuments(),
      require('../models/Course').find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title enrolledStudents createdAt'),
      Attempt.aggregate([
        {
          $group: {
            _id: '$testId',
            avgScore: { $avg: '$score' },
            attemptCount: { $sum: 1 }
          }
        },
        { $sort: { avgScore: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'tests',
            localField: '_id',
            foreignField: '_id',
            as: 'testInfo'
          }
        },
        { $unwind: '$testInfo' },
        {
          $project: {
            title: '$testInfo.title',
            avgScore: 1,
            attemptCount: 1
          }
        }
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

    // Enhanced revenue data with time-based breakdown
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
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
          totalCourses,
          totalRecordings,
          totalAttempts,
          totalOrders,
          totalRevenue: revenueData[0]?.total || 0
        },
        recentActivities: {
          students: recentStudents,
          attempts: recentAttempts,
          orders: recentOrders,
          courses: recentCourses
        },
        analytics: {
          monthlyStats,
          monthlyRevenue,
          topPerformingTests
        }
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
      .populate({
        path: 'testId',
        select: 'title companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort(sortOptions);

    // Group attempts by studentId and testId and keep only the most recent one for each combination
    const groupedAttempts = attempts.reduce((acc, attempt) => {
      const studentId = attempt.studentId?._id.toString();
      const testId = attempt.testId?._id.toString();
      if (!studentId || !testId) return acc;
      
      const key = `${studentId}-${testId}`;
      // If this is the first attempt for this student/test combination, or if this attempt is more recent
      if (!acc[key] || new Date(attempt.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = attempt;
      }
      return acc;
    }, {});

    // Convert grouped object back to array and apply pagination
    const allUniqueAttempts = Object.values(groupedAttempts);
    const total = allUniqueAttempts.length;
    const paginatedAttempts = allUniqueAttempts.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        attempts: paginatedAttempts,
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

    // Group attempts by studentId and testId and keep only the most recent one for each combination
    const groupedAttempts = attempts.reduce((acc, attempt) => {
      const studentId = attempt.studentId?._id.toString();
      const testId = attempt.testId?._id.toString();
      if (!studentId || !testId) return acc;
      
      const key = `${studentId}-${testId}`;
      // If this is the first attempt for this student/test combination, or if this attempt is more recent
      if (!acc[key] || new Date(attempt.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = attempt;
      }
      return acc;
    }, {});

    // Convert grouped object back to array
    const uniqueAttempts = Object.values(groupedAttempts);

    if (format === 'json') {
      return res.json({
        success: true,
        data: uniqueAttempts
      });
    }

    // For CSV format
    if (uniqueAttempts.length === 0) {
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
    const rows = uniqueAttempts.map(attempt => {
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

// @route   GET /api/v1/admin/orders
// @desc    Get all orders with filters (Admin only)
// @access  Private/Admin
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
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

    const orders = await Order.find(query)
      .populate('studentId', 'name email')
      .sort(sortOptions)
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

// @route   GET /api/v1/admin/orders/:id
// @desc    Get specific order details (Admin only)
// @access  Private/Admin
router.get('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate({
        path: 'items.testId',
        select: 'title price'
      })
      .populate({
        path: 'items.courseId',
        select: 'title price'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order'
    });
  }
});

// @route   GET /api/v1/admin/orders/export
// @desc    Export orders as CSV (Admin only)
// @access  Private/Admin
router.get('/orders/export', adminAuth, async (req, res) => {
  try {
    const { 
      status,
      fromDate,
      toDate,
      format = 'csv'
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
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

    const orders = await Order.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({
        success: true,
        data: orders
      });
    }

    // For CSV format
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for export'
      });
    }

    // Create CSV headers
    const headers = [
      'Order ID',
      'Student Name',
      'Student Email',
      'Amount',
      'Status',
      'Payment Gateway Order ID',
      'Transaction ID',
      'Created At'
    ].join(',');

    // Create CSV rows
    const rows = orders.map(order => {
      return [
        order.orderId || 'N/A',
        order.studentId?.name || 'N/A',
        order.studentId?.email || 'N/A',
        order.totalAmount || 0,
        order.paymentStatus || 'N/A',
        order.paymentGatewayOrderId || 'N/A',
        order.transactionId || 'N/A',
        order.createdAt ? new Date(order.createdAt).toISOString() : 'N/A'
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders'
    });
  }
});

module.exports = router;