const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');
const Alumni = require('../models/Alumni');
const PDFDocument = require('pdfkit');
const { generateReceiptPDF } = require('../utils/receiptGenerator');

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

    // Enhanced recent orders with more details like in payments page
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

// @route   GET /api/v1/admin/profile
// @desc    Get admin profile
// @access  Private/Admin
router.get('/profile', adminAuth, async (req, res) => {
  try {
    // Since admin is also a student, we can get the profile from the student collection
    const admin = await Student.findById(req.student.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    res.json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin profile'
    });
  }
});

// @route   PUT /api/v1/admin/profile
// @desc    Update admin profile
// @access  Private/Admin
router.put('/profile', 
  adminAuth,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, currentPassword, newPassword } = req.body;
      const adminId = req.student.id;

      // Find admin
      const admin = await Student.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      if (admin.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Update name and email if provided
      if (name) admin.name = name;
      if (email) admin.email = email;

      // Change password if requested
      if (currentPassword && newPassword) {
        // Verify current password
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        // Validate new password
        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters long'
          });
        }

        // Set new password (this will be hashed by the pre-save hook)
        admin.password = newPassword;
      }

      // Save the admin profile
      await admin.save();

      // Return updated admin without password
      const updatedAdmin = await Student.findById(adminId).select('-password');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedAdmin
      });

    } catch (error) {
      console.error('Update admin profile error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

// Student Management Routes
// @route   GET /api/v1/admin/students
// @desc    Get all students with filters
// @access  Private/Admin
router.get('/students', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 1000, // Default to 1000, but allow fetching all with a special parameter
      search, 
      status, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fetchAll // Special parameter to fetch all students
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

    let students, total;
    
    // If fetchAll is specified, fetch all students (but still apply filters)
    if (fetchAll === 'true') {
      students = await Student.find(query)
        .select('name email mobile isActive lastActiveAt createdAt')
        .sort(sortOptions);
      
      total = students.length;
    } else {
      // Apply pagination when fetchAll is not specified
      students = await Student.find(query)
        .select('name email mobile isActive lastActiveAt createdAt')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      total = await Student.countDocuments(query);
    }

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
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit),
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
      limit = 1000, // Default to 1000, but allow fetching all with a special parameter
      testId,
      status,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fetchAll // Special parameter to fetch all results
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

    // Convert grouped object back to array
    const allUniqueAttempts = Object.values(groupedAttempts);
    const total = allUniqueAttempts.length;
    
    let paginatedAttempts;
    
    // If fetchAll is specified, fetch all attempts (but still apply filters)
    if (fetchAll === 'true') {
      paginatedAttempts = allUniqueAttempts;
    } else {
      // Apply pagination when fetchAll is not specified
      paginatedAttempts = allUniqueAttempts.slice((page - 1) * limit, page * limit);
    }

    res.json({
      success: true,
      data: {
        attempts: paginatedAttempts,
        pagination: {
          current: parseInt(page),
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit),
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
      page, 
      limit, 
      status,
      type, // New filter for order type
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    // Add type filtering logic
    if (type && type !== 'all') {
      // For type filtering, we need to check the items array
      if (type === 'Mock Tests') {
        // Find orders that have test items but no course items
        query.$and = [
          { 'items.testId': { $exists: true, $ne: null } },
          { 'items.courseId': { $exists: false } }
        ];
      } else if (type === 'Courses') {
        // Find orders that have course items but no test items, and are not recordings
        query.$and = [
          { 'items.courseId': { $exists: true, $ne: null } },
          { 'items.testId': { $exists: false } },
          { 'metadata.type': { $ne: 'recording' } }
        ];
      } else if (type === 'Recordings') {
        // Find orders that have course items and are marked as recordings
        query.$and = [
          { 'items.courseId': { $exists: true, $ne: null } },
          { 'metadata.type': 'recording' }
        ];
      } else if (type === 'Mixed') {
        // Find orders that have both test and course items
        query.$and = [
          { 'items.testId': { $exists: true, $ne: null } },
          { 'items.courseId': { $exists: true, $ne: null } }
        ];
      }
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

    // If no limit is specified, fetch all orders
    let ordersQuery = Order.find(query).populate('studentId', 'name email').sort(sortOptions);
    
    // Only apply pagination if both page and limit are provided
    if (page && limit) {
      ordersQuery = ordersQuery.limit(limit * 1).skip((page - 1) * limit);
    }

    const orders = await ordersQuery;
    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        // Only include pagination info if pagination was applied
        ...(page && limit ? {
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        } : {
          total
        })
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

// @route   GET /api/v1/admin/orders/export
// @desc    Export orders as CSV or PDF (Admin only)
// @access  Private/Admin
router.get('/orders/export', adminAuth, async (req, res) => {
  try {
    const { 
      status,
      type, // Add type filter to export
      fromDate,
      toDate,
      format = 'csv'
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    // Add type filtering logic for export
    if (type && type !== 'all') {
      // For type filtering, we need to check the items array
      if (type === 'Mock Tests') {
        // Find orders that have test items but no course items
        query.$and = [
          { 'items.testId': { $exists: true, $ne: null } },
          { 'items.courseId': { $exists: false } }
        ];
      } else if (type === 'Courses') {
        // Find orders that have course items but no test items, and are not recordings
        query.$and = [
          { 'items.courseId': { $exists: true, $ne: null } },
          { 'items.testId': { $exists: false } },
          { 'metadata.type': { $ne: 'recording' } }
        ];
      } else if (type === 'Recordings') {
        // Find orders that have course items and are marked as recordings
        query.$and = [
          { 'items.courseId': { $exists: true, $ne: null } },
          { 'metadata.type': 'recording' }
        ];
      } else if (type === 'Mixed') {
        // Find orders that have both test and course items
        query.$and = [
          { 'items.testId': { $exists: true, $ne: null } },
          { 'items.courseId': { $exists: true, $ne: null } }
        ];
      }
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

    // For PDF format
    if (format === 'pdf') {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      // Pipe the PDF to the response
      doc.pipe(res);

      // Header
      doc.fontSize(20).text('Payment Orders Report', { align: 'center' });
      doc.moveDown();
      
      // Report Info
      const dateRangeText = fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Time';
      doc.fontSize(12).text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.fontSize(10).text(`Period: ${dateRangeText}`, { align: 'right' });
      doc.moveDown(2);

      // Summary Statistics
      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const completedOrders = orders.filter(o => o.paymentStatus === 'completed').length;
      const failedOrders = orders.filter(o => o.paymentStatus === 'failed').length;

      doc.fontSize(14).text('Summary:', { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`Total Orders: ${totalOrders}`);
      doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`);
      doc.text(`Completed Orders: ${completedOrders}`);
      doc.text(`Failed Orders: ${failedOrders}`);
      doc.moveDown(2);

      // Orders Table Header
      if (orders.length > 0) {
        doc.fontSize(14).text('Orders Details:', { underline: true });
        doc.moveDown();
        
        // Table headers
        const tableTop = doc.y;
        const columns = [
          { label: 'Order ID', width: 100 },
          { label: 'Student', width: 120 },
          { label: 'Items', width: 60 },
          { label: 'Amount', width: 70 },
          { label: 'Status', width: 80 },
          { label: 'Date', width: 80 }
        ];
        
        let currentX = 50;
        doc.fontSize(10).font('Helvetica-Bold');
        columns.forEach(col => {
          doc.text(col.label, currentX, tableTop);
          currentX += col.width;
        });
        doc.font('Helvetica');
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(50 + columns.reduce((sum, col) => sum + col.width, 0), doc.y).stroke();
        doc.moveDown(0.5);

        // Orders data
        let yPos = doc.y;
        orders.slice(0, 100).forEach((order, index) => { // Limit to first 100 orders for readability
          if (yPos > 750) { // Create new page if needed
            doc.addPage();
            yPos = 50;
          }
          
          currentX = 50;
          doc.fontSize(8);
          doc.text(`#${order.orderId?.substring(0, 10) || 'N/A'}`, currentX, yPos);
          currentX += columns[0].width;
          
          doc.text(order.studentId?.name?.substring(0, 15) || 'N/A', currentX, yPos);
          currentX += columns[1].width;
          
          doc.text(order.items?.length || 0, currentX, yPos);
          currentX += columns[2].width;
          
          doc.text(`₹${order.totalAmount?.toLocaleString() || 0}`, currentX, yPos);
          currentX += columns[3].width;
          
          doc.text(order.paymentStatus?.substring(0, 10) || 'N/A', currentX, yPos);
          currentX += columns[4].width;
          
          doc.text(new Date(order.createdAt).toLocaleDateString(), currentX, yPos);
          
          yPos += 15;
        });
        
        if (orders.length > 100) {
          doc.moveDown();
          doc.fontSize(8).text(`... and ${orders.length - 100} more orders`);
        }
      } else {
        doc.fontSize(12).text('No orders found for the selected criteria.');
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).text('Generated by MockTest Pro Payment System', { align: 'center' });

      // Finalize PDF
      doc.end();
      return;
    }

    // For CSV format (default)
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for export'
      });
    }

    // Create CSV headers with more detailed information
    const headers = [
      'Order ID',
      'Student Name',
      'Student Email',
      'Order Type',
      'Items Count',
      'Item Details',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Payment Gateway Order ID',
      'Transaction ID',
      'Discount Code',
      'Discount Amount',
      'Tax Amount',
      'Created At',
      'Updated At'
    ].join(',');

    // Create CSV rows
    const rows = orders.map(order => {
      // Determine order type
      let orderType = 'Unknown';
      if (order.items && order.items.length > 0) {
        const hasTests = order.items.some(item => item.testId);
        const hasCourses = order.items.some(item => item.courseId);
        
        if (hasTests && !hasCourses) {
          orderType = 'Mock Tests';
        } else if (hasCourses && !hasTests) {
          if (order.metadata?.type === 'recording') {
            orderType = 'Recordings';
          } else {
            orderType = 'Courses';
          }
        } else if (hasTests && hasCourses) {
          orderType = 'Mixed';
        }
      }
      
      // Create item details string
      const itemDetails = order.items?.map(item => {
        if (item.testId) {
          return `${item.testTitle || 'Test'} (₹${item.price})`;
        } else if (item.courseId) {
          const type = order.metadata?.type === 'recording' ? 'Recording' : 'Course';
          return `${item.courseTitle || 'Course'} ${type} (₹${item.price})`;
        }
        return 'Unknown Item';
      }).join('; ') || 'No Items';

      return [
        order.orderId || 'N/A',
        order.studentId?.name || 'N/A',
        order.studentId?.email || 'N/A',
        orderType,
        order.items?.length || 0,
        `"${itemDetails}"`,
        order.totalAmount || 0,
        order.currency || 'INR',
        order.paymentStatus || 'N/A',
        order.paymentMethod || 'N/A',
        order.paymentGatewayOrderId || 'N/A',
        order.transactionId || 'N/A',
        order.discountApplied?.couponCode || 'N/A',
        order.discountApplied?.discountAmount || 0,
        order.taxes?.totalTax || 0,
        order.createdAt ? new Date(order.createdAt).toISOString() : 'N/A',
        order.updatedAt ? new Date(order.updatedAt).toISOString() : 'N/A'
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

// @route   PUT /api/v1/admin/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/orders/:id/status', adminAuth, [
  body('status')
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status value')
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

    const { status } = req.body;
    const orderId = req.params.id;

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Store previous status for reference
    const previousStatus = order.paymentStatus;

    // Update the status
    order.paymentStatus = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          previousStatus,
          newStatus: order.paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// @route   GET /api/v1/admin/orders/:orderId/receipt
// @desc    Get receipt for an order (Admin version)
// @access  Private/Admin
router.get('/orders/:orderId/receipt', adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order by ID (admin can access any order)
    const order = await Order.findById(orderId).populate([
      {
        path: 'items.testId',
        select: 'title'
      },
      {
        path: 'items.courseId',
        select: 'title'
      },
      {
        path: 'studentId',
        select: 'name email'
      }
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate receipt data
    const receiptData = {
      orderId: order.orderId,
      receiptNumber: order.receipt?.receiptNumber || order.orderId,
      studentName: order.studentId?.name || order.billingDetails?.name || 'N/A',
      email: order.studentId?.email || order.billingDetails?.email || 'N/A',
      mobile: order.billingDetails?.mobile || 'N/A',
      items: order.items,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      transactionId: order.transactionId,
      paymentDate: order.updatedAt,
      taxes: order.taxes,
      discount: order.discountApplied,
      metadata: order.metadata
    };
    
    // Generate PDF receipt
    const pdfBuffer = await generateReceiptPDF(receiptData);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.orderId}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
});

// @route   GET /api/v1/admin/analytics/paid-tests-by-company
// @desc    Get statistics for paid tests purchased by company (Admin only)
// @access  Private/Admin
router.get('/analytics/paid-tests-by-company', adminAuth, async (req, res) => {
  try {
    console.log('Fetching paid tests analytics data');
    
    // Aggregate orders to get paid test purchases by company
    const companyStats = await Order.aggregate([
      // Match only completed orders
      { $match: { paymentStatus: 'completed' } },
      // Unwind the items array to process each item separately
      { $unwind: '$items' },
      // Match only items that are paid tests
      { $match: { 'items.testId': { $exists: true, $ne: null } } },
      // Populate test details to get company information
      {
        $lookup: {
          from: 'tests',
          localField: 'items.testId',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      { $unwind: '$testDetails' },
      // Match only paid tests
      { $match: { 'testDetails.type': 'paid' } },
      // Populate company details
      {
        $lookup: {
          from: 'companies',
          localField: 'testDetails.companyId',
          foreignField: '_id',
          as: 'companyDetails'
        }
      },
      { $unwind: '$companyDetails' },
      // Group by company
      {
        $group: {
          _id: '$testDetails.companyId',
          companyName: { $first: '$companyDetails.name' },
          companyLogo: { $first: '$companyDetails.logoUrl' },
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$items.price' },
          tests: {
            $addToSet: {
              testId: '$testDetails._id',
              testTitle: '$testDetails.title',
              price: '$items.price'
            }
          }
        }
      },
      // Sort by total purchases descending
      { $sort: { totalPurchases: -1 } }
    ]);

    console.log('Company stats result:', companyStats);

    // Get user purchase details
    const userPurchases = await Order.aggregate([
      // Match only completed orders with test items
      { 
        $match: { 
          paymentStatus: 'completed',
          'items.testId': { $exists: true, $ne: null }
        } 
      },
      // Unwind the items array
      { $unwind: '$items' },
      // Match only test items
      { $match: { 'items.testId': { $exists: true, $ne: null } } },
      // Populate test details
      {
        $lookup: {
          from: 'tests',
          localField: 'items.testId',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      { $unwind: '$testDetails' },
      // Match only paid tests
      { $match: { 'testDetails.type': 'paid' } },
      // Populate company details
      {
        $lookup: {
          from: 'companies',
          localField: 'testDetails.companyId',
          foreignField: '_id',
          as: 'companyDetails'
        }
      },
      { $unwind: '$companyDetails' },
      // Populate student details
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      { $unwind: '$studentDetails' },
      // Project the required fields
      {
        $project: {
          orderId: '$orderId',
          studentName: '$studentDetails.name',
          studentEmail: '$studentDetails.email',
          testName: '$testDetails.title',
          companyName: '$companyDetails.name',
          price: '$items.price',
          purchaseDate: '$createdAt'
        }
      },
      // Sort by purchase date descending
      { $sort: { purchaseDate: -1 } }
    ]);

    console.log('User purchases result:', userPurchases);

    // Calculate overall statistics
    const overallStats = {
      totalCompanies: companyStats.length,
      totalPurchases: companyStats.reduce((sum, company) => sum + company.totalPurchases, 0),
      totalRevenue: companyStats.reduce((sum, company) => sum + company.totalRevenue, 0),
      totalUsers: [...new Set(userPurchases.map(purchase => purchase.studentEmail))].length
    };

    console.log('Overall stats:', overallStats);

    res.json({
      success: true,
      data: {
        companyStats,
        userPurchases,
        overallStats
      }
    });

  } catch (error) {
    console.error('Get paid tests by company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get paid tests by company statistics: ' + error.message
    });
  }
});

module.exports = router;