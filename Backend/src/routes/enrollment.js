const express = require('express');
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const RecordingEnrollment = require('../models/RecordingEnrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middlewares/auth');
const Test = require('../models/Test');
const Company = require('../models/Company');

const router = express.Router();

// Student route to check enrollment status for a company
// @route   GET /api/v1/enrollments/company/:companyId/status
// @desc    Check if student is enrolled in any tests for a specific company
// @access  Private/Student
router.get('/company/:companyId/status', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    const studentId = req.student.id;

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, message: 'Invalid company ID' });
    }

    // Check if student has purchased any tests from this company
    // We look for completed orders that contain tests from this company
    const companyTestCount = await Test.countDocuments({ companyId });
    
    if (companyTestCount === 0) {
      // No tests for this company, so student can't be enrolled
      return res.json({
        success: true,
        data: {
          isEnrolled: false,
          orderCount: 0
        }
      });
    }

    // Find completed orders that contain tests from this company
    const orders = await Order.find({
      studentId,
      paymentStatus: 'completed',
      'items.testId': { $in: await Test.find({ companyId }).distinct('_id') }
    });

    const isEnrolled = orders.length > 0;

    res.json({
      success: true,
      data: {
        isEnrolled,
        orderCount: orders.length
      }
    });
  } catch (error) {
    console.error('Check enrollment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check enrollment status' });
  }
});

/**
 * ----------------------------
 * Admin Routes for Enrollment Management
 * ----------------------------
 */

// @route   GET /api/v1/enrollments/admin/courses
// @desc    Get all students enrolled in courses with student details (Admin only)
// @access  Admin
router.get('/admin/courses', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 1000, search, status, fetchAll } = req.query;
    
    // For the "All Enrollments" tab, we want to show all student-course relationships
    // This includes both course enrollments and recording unlocks
    
    // Get all courses with enrolled students
    let courseQuery = { isActive: true };
    
    const coursesWithEnrolledStudents = await Course.find(courseQuery)
      .populate('enrolledStudents', 'name email mobile')
      .select('title price recordingsPrice enrolledStudents createdAt _id');
    
    // Transform the data to match the enrollment format
    let allEnrollments = [];
    
    // Process each course
    for (const course of coursesWithEnrolledStudents) {
      try {
        // Get enrollment records for this course
        const enrollmentRecords = await Enrollment.find({
          courseId: course._id,
          type: 'course'
        }).populate('studentId', 'name email mobile');
        
        // Create a map of studentId to enrollment for quick lookup
        const enrollmentMap = {};
        enrollmentRecords.forEach(enrollment => {
          if (enrollment.studentId) {
            enrollmentMap[enrollment.studentId._id.toString()] = enrollment;
          }
        });
        
        // Process each enrolled student for this course
        for (const student of course.enrolledStudents) {
          try {
            const studentIdStr = student._id.toString();
            
            // Check if we have an enrollment record for this student
            if (enrollmentMap[studentIdStr]) {
              // Use the enrollment record (it has the correct createdAt date)
              const enrollment = enrollmentMap[studentIdStr];
              allEnrollments.push({
                _id: enrollment._id,
                studentId: enrollment.studentId._id,
                student: {
                  _id: enrollment.studentId._id,
                  name: enrollment.studentId.name,
                  email: enrollment.studentId.email,
                  mobile: enrollment.studentId.mobile
                },
                courseId: {
                  _id: course._id,
                  title: course.title,
                  price: course.price,
                  recordingsPrice: course.recordingsPrice
                },
                type: 'course',
                status: enrollment.status,
                createdAt: enrollment.createdAt // Actual enrollment date
              });
            } else {
              // No enrollment record found, but student is in enrolledStudents array
              allEnrollments.push({
                _id: `${course._id}-${studentIdStr}`,
                studentId: student._id,
                student: {
                  _id: student._id,
                  name: student.name,
                  email: student.email,
                  mobile: student.mobile
                },
                courseId: {
                  _id: course._id,
                  title: course.title,
                  price: course.price,
                  recordingsPrice: course.recordingsPrice
                },
                type: 'course',
                status: 'enrolled',
                createdAt: course.createdAt || new Date() // Fallback to course creation date
              });
            }
          } catch (studentError) {
            console.warn(`Error processing student for course ${course._id}:`, studentError);
            // Continue with other students
          }
        }
      } catch (courseError) {
        console.warn(`Error processing course ${course._id}:`, courseError);
        // Continue with other courses
      }
    }
    
    // Apply search filter to the combined results if needed
    let filteredEnrollments = allEnrollments;
    if (search) {
      filteredEnrollments = allEnrollments.filter(enrollment => {
        const studentName = (enrollment.student?.name || '').toLowerCase();
        const studentEmail = (enrollment.student?.email || '').toLowerCase();
        const courseTitle = (enrollment.courseId?.title || '').toLowerCase();
        const searchTerm = search.toLowerCase();
        
        return studentName.includes(searchTerm) || 
               studentEmail.includes(searchTerm) || 
               courseTitle.includes(searchTerm);
      });
    }
    
    // Apply status filter if needed (for courses, status is always 'enrolled' unless we have enrollment records)
    if (status && status !== 'all') {
      filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.status === status);
    }
    
    // Sort by createdAt descending
    filteredEnrollments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination only if fetchAll is not specified
    const total = filteredEnrollments.length;
    let paginatedEnrollments;
    
    if (fetchAll === 'true') {
      paginatedEnrollments = filteredEnrollments;
    } else {
      paginatedEnrollments = filteredEnrollments.slice((page - 1) * limit, page * limit);
    }
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: fetchAll === 'true' ? 0 : parseInt(limit),
          total,
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course enrollments' });
  }
});

// @route   GET /api/v1/enrollments/admin/recordings
// @desc    Get all recording enrollments with student details (from RecordingEnrollment collection) (Admin only)
// @access  Admin
router.get('/admin/recordings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 1000, status, search, fetchAll } = req.query;
    
    // Build query for recording enrollments
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      // Search by student name, email or course title
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      const courseIds = await Course.find({ 
        title: { $regex: search, $options: 'i' } 
      }).distinct('_id');
      
      query.$or = [
        { studentId: { $in: studentIds } },
        { courseId: { $in: courseIds } }
      ];
    }
    
    // Populate related data
    const allEnrollments = await RecordingEnrollment.find(query)
      .populate('studentId', 'name email mobile')
      .populate('courseId', 'title price recordingsPrice') // Make sure we're populating price and recordingsPrice
      .sort({ createdAt: -1 });
      
    const total = allEnrollments.length;
    
    // Apply pagination only if fetchAll is not specified
    let paginatedEnrollments;
    
    if (fetchAll === 'true') {
      paginatedEnrollments = allEnrollments;
    } else {
      paginatedEnrollments = allEnrollments.slice((page - 1) * limit, page * limit);
    }
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: fetchAll === 'true' ? 0 : parseInt(limit),
          total,
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get recording enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recording enrollments' });
  }
});

// @route   GET /api/v1/enrollments/admin/purchased-tests
// @desc    Get all students who purchased paid tests (Admin only)
// @access  Admin
router.get('/admin/purchased-tests', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // Build query for paid test orders
    let query = {
      $and: [
        { 'items.testId': { $exists: true, $ne: null } },
        { 'paymentStatus': 'completed' }
      ]
    };
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }
    
    if (search) {
      // Search by student name or email
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.$or = [
        { studentId: { $in: studentIds } }
      ];
    }
    
    // Populate related data
    const orders = await Order.find(query)
      .populate('studentId', 'name email mobile')
      .populate({
        path: 'items.testId',
        select: 'title price companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get purchased tests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchased tests' });
  }
});

// @route   GET /api/v1/enrollments/admin/purchased-tests/export
// @desc    Export purchased tests as CSV (Admin only)
// @access  Admin
router.get('/admin/purchased-tests/export', adminAuth, async (req, res) => {
  try {
    const { search, format = 'csv' } = req.query;
    
    // Build query for paid test orders
    let query = {
      $and: [
        { 'items.testId': { $exists: true, $ne: null } },
        { 'paymentStatus': 'completed' }
      ]
    };
    
    if (search) {
      // Search by student name or email
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.$or = [
        { studentId: { $in: studentIds } }
      ];
    }
    
    // Get all orders without pagination for export
    const orders = await Order.find(query)
      .populate('studentId', 'name email mobile')
      .populate({
        path: 'items.testId',
        select: 'title price companyId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
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
      'Student Name',
      'Student Email',
      'Student Mobile',
      'Test Title',
      'Company',
      'Price (₹)',
      'Payment Status',
      'Order ID',
      'Payment Gateway Order ID',
      'Transaction ID',
      'Purchase Date'
    ].join(',');
    
    // Create CSV rows
    const rows = [];
    
    orders.forEach(order => {
      // Create a row for each test item in the order
      order.items.forEach(item => {
        if (item.testId) {
          rows.push([
            order.studentId?.name || 'N/A',
            order.studentId?.email || 'N/A',
            order.studentId?.mobile || 'N/A',
            item.testId.title || 'N/A',
            item.testId.companyId?.name || 'N/A',
            item.price || 0,
            order.paymentStatus || 'N/A',
            order._id.toString() || 'N/A',
            order.paymentGatewayOrderId || 'N/A',
            order.transactionId || 'N/A',
            order.createdAt ? new Date(order.createdAt).toISOString() : 'N/A'
          ].join(','));
        }
      });
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="purchased-tests-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export purchased tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export purchased tests'
    });
  }
});

// @route   GET /api/v1/enrollments/admin/courses-with-recordings
// @desc    Get all course enrollments and recording unlocks with student details (Admin only)
// @access  Admin
router.get('/admin/courses-with-recordings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, enrollmentType } = req.query;
    
    // Fetch both course enrollments and recording unlocks
    let courseEnrollments = [];
    let recordingEnrollments = [];
    
    // Build query for recording enrollments
    let recordingQuery = {};
    
    // Filter by enrollment type if specified
    if (enrollmentType === 'course') {
      recordingQuery = null; // Don't fetch recording enrollments
    } else if (enrollmentType === 'recording') {
      // Don't fetch course enrollments, only recording unlocks
      courseEnrollments = []; // Empty array for course enrollments
    }
    
    if (status && status !== 'all') {
      if (recordingQuery) recordingQuery.status = status;
    }
    
    // Handle search functionality
    if (search) {
      // Search by student name, email or course title
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      const courseIds = await Course.find({ 
        title: { $regex: search, $options: 'i' } 
      }).distinct('_id');
      
      if (recordingQuery) {
        recordingQuery.$or = [
          { studentId: { $in: studentIds } },
          { courseId: { $in: courseIds } }
        ];
      }
    }
    
    // Fetch recording enrollments if needed
    if (recordingQuery !== null) {
      recordingEnrollments = await RecordingEnrollment.find(recordingQuery)
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title price recordingsPrice')
        .sort({ createdAt: -1 });
    }
    
    // Fetch course enrollments from Course model's enrolledStudents array
    // Only if we're not filtering for recording type only
    if (enrollmentType !== 'recording') {
      // Build query for courses that have enrolled students
      let courseQuery = {
        enrolledStudents: { $exists: true, $ne: [] }  // Only get courses with enrolled students
      };
      
      if (search) {
        // Search by student name, email or course title
        const studentIds = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).distinct('_id');
        
        const courseIds = await Course.find({ 
          title: { $regex: search, $options: 'i' } 
        }).distinct('_id');
        
        courseQuery.$or = [
          { enrolledStudents: { $in: studentIds } },
          { _id: { $in: courseIds } }
        ];
        // Remove the enrolledStudents condition when searching
        delete courseQuery.enrolledStudents;
      }
      
      // Get courses with enrolled students and populate student details
      const coursesWithEnrolledStudents = await Course.find(courseQuery)
        .populate('enrolledStudents', 'name email mobile')
        .select('title price recordingsPrice enrolledStudents createdAt _id');
      
      // Transform the data to match the enrollment format
      coursesWithEnrolledStudents.forEach(course => {
        course.enrolledStudents.forEach(student => {
          courseEnrollments.push({
            _id: `${course._id}-${student._id}`, // Create a unique ID
            studentId: student._id, // Keep it as just the ID for consistency
            student: { // Add student details separately
              _id: student._id,
              name: student.name,
              email: student.email,
              mobile: student.mobile
            },
            courseId: {
              _id: course._id,
              title: course.title,
              price: course.price,
              recordingsPrice: course.recordingsPrice
            },
            type: 'course',
            status: 'enrolled',
            createdAt: course.createdAt || new Date()
          });
        });
      });
    }
    
    // Combine both types of enrollments
    // Add virtual fields to distinguish them
    const formattedCourseEnrollments = courseEnrollments.map(enrollment => {
      return {
        ...enrollment,
        accessType: 'enrollment',
        accessStatus: enrollment.status
      };
    });
    
    const formattedRecordingEnrollments = recordingEnrollments.map(enrollment => {
      return {
        ...enrollment.toObject ? enrollment.toObject() : enrollment,
        accessType: 'recording_unlock',
        unlockStatus: enrollment.status,
        type: 'recording' // Add type field for frontend compatibility
      };
    });
    
    let allEnrollments = [...formattedCourseEnrollments, ...formattedRecordingEnrollments];
    
    // Apply search filter to the combined results if needed
    if (search) {
      allEnrollments = allEnrollments.filter(enrollment => {
        const studentName = enrollment.student?.name?.toLowerCase() || '';
        const studentEmail = enrollment.student?.email?.toLowerCase() || '';
        const courseTitle = enrollment.courseId?.title?.toLowerCase() || '';
        const searchTerm = search.toLowerCase();
        
        return studentName.includes(searchTerm) || 
               studentEmail.includes(searchTerm) || 
               courseTitle.includes(searchTerm);
      });
    }
    
    // Apply status filter if needed
    if (status && status !== 'all') {
      allEnrollments = allEnrollments.filter(enrollment => {
        // For course enrollments, check accessStatus
        if (enrollment.accessType === 'enrollment') {
          return enrollment.accessStatus === status;
        }
        // For recording unlocks, check unlockStatus
        else if (enrollment.accessType === 'recording_unlock') {
          return enrollment.unlockStatus === status;
        }
        return true;
      });
    }
    
    // Sort by createdAt descending
    allEnrollments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const total = allEnrollments.length;
    const paginatedEnrollments = allEnrollments.slice((page - 1) * limit, page * limit);
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get courses with recordings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course and recording data' });
  }
});

// @route   GET /api/v1/enrollments/admin/all
// @desc    Get all enrollments with student and course details (Admin only)
// @access  Admin
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    
    // For the "All Enrollments" tab, we want to show all student-course relationships
    // This includes both course enrollments and recording unlocks
    
    let courseEnrollments = [];
    let recordingEnrollments = [];
    let testEnrollments = [];
    
    // Build query for recording enrollments
    let recordingQuery = {};
    
    if (type) {
      if (type === 'course') {
        recordingQuery = null; // Don't fetch recording enrollments
      } else if (type === 'recording') {
        // Don't fetch course enrollments or test enrollments
        courseEnrollments = []; // Empty array for course enrollments
        testEnrollments = []; // Empty array for test enrollments
      } else if (type === 'test') {
        // Don't fetch course enrollments or recording enrollments
        courseEnrollments = []; // Empty array for course enrollments
        recordingQuery = null; // Don't fetch recording enrollments
      }
    }
    
    if (status && status !== 'all') {
      if (recordingQuery) recordingQuery.status = status;
    }
    
    // Handle search functionality
    if (search) {
      // Search by student name, email or course/title
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      const courseIds = await Course.find({ 
        title: { $regex: search, $options: 'i' } 
      }).distinct('_id');
      
      const testIds = await Test.find({ 
        title: { $regex: search, $options: 'i' } 
      }).distinct('_id');
      
      if (recordingQuery) {
        recordingQuery.$or = [
          { studentId: { $in: studentIds } },
          { courseId: { $in: courseIds } }
        ];
      }
    }
    
    // Fetch recording enrollments if needed
    if (recordingQuery !== null) {
      recordingEnrollments = await RecordingEnrollment.find(recordingQuery)
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title recordingsPrice')
        .sort({ createdAt: -1 });
    }
    
    // Fetch course enrollments from Course model's enrolledStudents array
    // Only if we're not filtering for recording or test type only
    if (type !== 'recording' && type !== 'test') {
      // Build query for courses that have enrolled students
      let courseQuery = {
        enrolledStudents: { $exists: true, $ne: [] }  // Only get courses with enrolled students
      };
      
      if (search) {
        // Search by student name, email or course title
        const studentIds = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).distinct('_id');
        
        const courseIds = await Course.find({ 
          title: { $regex: search, $options: 'i' } 
        }).distinct('_id');
        
        courseQuery.$or = [
          { enrolledStudents: { $in: studentIds } },
          { _id: { $in: courseIds } }
        ];
        // Remove the enrolledStudents condition when searching
        delete courseQuery.enrolledStudents;
      }
      
      // Get courses with enrolled students and populate student details
      const coursesWithEnrolledStudents = await Course.find(courseQuery)
        .populate('enrolledStudents', 'name email mobile')
        .select('title price recordingsPrice enrolledStudents createdAt _id');
      
      // Transform the data to match the enrollment format
      coursesWithEnrolledStudents.forEach(course => {
        course.enrolledStudents.forEach(student => {
          courseEnrollments.push({
            _id: `${course._id}-${student._id}`, // Create a unique ID
            studentId: student._id, // Keep it as just the ID for consistency
            student: { // Add student details separately
              _id: student._id,
              name: student.name,
              email: student.email,
              mobile: student.mobile
            },
            courseId: {
              _id: course._id,
              title: course.title,
              price: course.price,
              recordingsPrice: course.recordingsPrice
            },
            type: 'course',
            status: 'enrolled',
            createdAt: course.createdAt || new Date()
          });
        });
      });
    }
    
    // Fetch test enrollments if needed
    // Only if we're not filtering for recording or course type only
    if (type !== 'recording' && type !== 'course') {
      // Build query for test enrollments
      let testQuery = { type: 'test' };
      
      if (status && status !== 'all') {
        testQuery.status = status;
      }
      
      if (search) {
        // Search by student name, email or test title
        const studentIds = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).distinct('_id');
        
        const testIds = await Test.find({ 
          title: { $regex: search, $options: 'i' } 
        }).distinct('_id');
        
        testQuery.$or = [
          { studentId: { $in: studentIds } },
          { testId: { $in: testIds } }
        ];
      }
      
      testEnrollments = await Enrollment.find(testQuery)
        .populate('studentId', 'name email mobile')
        .populate({
          path: 'testId',
          select: 'title price companyId',
          populate: {
            path: 'companyId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 });
    }
    
    // Combine all types of enrollments
    // Add a virtual type field and unlockStatus field to recording enrollments to distinguish them
    const formattedRecordingEnrollments = recordingEnrollments.map(enrollment => {
      const enrollmentObj = enrollment.toObject ? enrollment.toObject() : enrollment;
      return {
        ...enrollmentObj,
        type: 'recording',
        unlockStatus: enrollmentObj.status // Keep the original status field as unlockStatus
      };
    });
    
    let allEnrollments = [...courseEnrollments, ...testEnrollments, ...formattedRecordingEnrollments];
    
    // Apply search filter to the combined results if needed
    if (search) {
      allEnrollments = allEnrollments.filter(enrollment => {
        const studentName = enrollment.student?.name?.toLowerCase() || '';
        const studentEmail = enrollment.student?.email?.toLowerCase() || '';
        const courseTitle = enrollment.courseId?.title?.toLowerCase() || '';
        const testTitle = enrollment.testId?.title?.toLowerCase() || '';
        const searchTerm = search.toLowerCase();
        
        return studentName.includes(searchTerm) || 
               studentEmail.includes(searchTerm) || 
               courseTitle.includes(searchTerm) ||
               testTitle.includes(searchTerm);
      });
    }
    
    // Apply status filter if needed
    if (status && status !== 'all') {
      allEnrollments = allEnrollments.filter(enrollment => {
        // For recording unlocks, check unlockStatus
        if (enrollment.type === 'recording') {
          return enrollment.unlockStatus === status;
        }
        // For other enrollments, check status
        return enrollment.status === status;
      });
    }
    
    // Apply type filter if needed
    if (type && type !== 'all') {
      allEnrollments = allEnrollments.filter(enrollment => {
        if (type === 'course') {
          return enrollment.type === 'course';
        } else if (type === 'test') {
          return enrollment.type === 'test';
        } else if (type === 'recording') {
          return enrollment.type === 'recording';
        }
        return true;
      });
    }
    
    // Sort by createdAt descending
    allEnrollments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const total = allEnrollments.length;
    const paginatedEnrollments = allEnrollments.slice((page - 1) * limit, page * limit);
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  }
});

// @route   GET /api/v1/enrollments/admin/export
// @desc    Export all enrollments as CSV (Admin only)
// @access  Admin
router.get('/admin/export', adminAuth, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    
    // Build query based on type
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      // Search by student name, email or course title
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.$or = [
        { studentId: { $in: studentIds } },
        { courseId: { $in: await Course.find({ title: { $regex: search, $options: 'i' } }).distinct('_id') } },
        { testId: { $in: await Test.find({ title: { $regex: search, $options: 'i' } }).distinct('_id') } }
      ];
    }
    
    // Fetch enrollments
    let enrollments = [];
    
    if (type === 'course') {
      // For course enrollments, get them from the Enrollment collection to ensure correct dates
      query.type = 'course';
      enrollments = await Enrollment.find(query)
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title price')
        .sort({ createdAt: -1 });
    } else if (type === 'recording') {
      // For recording enrollments, get them from the RecordingEnrollment collection
      query = {}; // Reset query for recording enrollments
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (search) {
        // Search by student name, email or course title
        const studentIds = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).distinct('_id');
        
        const courseIds = await Course.find({ 
          title: { $regex: search, $options: 'i' } 
        }).distinct('_id');
        
        query.$or = [
          { studentId: { $in: studentIds } },
          { courseId: { $in: courseIds } }
        ];
      }
      
      enrollments = await RecordingEnrollment.find(query)
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title recordingsPrice')
        .sort({ createdAt: -1 });
    } else if (type === 'test') {
      query.type = 'test';
      enrollments = await Enrollment.find(query)
        .populate('studentId', 'name email mobile')
        .populate('testId', 'title price')
        .sort({ createdAt: -1 });
    } else {
      // Get all enrollments
      // Get course enrollments from Enrollment collection
      const courseEnrollments = await Enrollment.find({ type: 'course' })
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title price')
        .sort({ createdAt: -1 });
        
      // Get test enrollments
      const testEnrollments = await Enrollment.find({ type: 'test' })
        .populate('studentId', 'name email mobile')
        .populate('testId', 'title price')
        .sort({ createdAt: -1 });
        
      // Get recording enrollments
      const recordingEnrollments = await RecordingEnrollment.find({})
        .populate('studentId', 'name email mobile')
        .populate('courseId', 'title recordingsPrice')
        .sort({ createdAt: -1 });
      
      // Format recording enrollments to match course enrollments
      const formattedRecordingEnrollments = recordingEnrollments.map(enrollment => ({
        ...enrollment.toObject(),
        type: 'recording',
        status: enrollment.status
      }));
      
      enrollments = [...courseEnrollments, ...testEnrollments, ...formattedRecordingEnrollments];
      
      // Apply search filter to the combined results if needed
      if (search) {
        enrollments = enrollments.filter(enrollment => {
          const studentName = enrollment.studentId?.name?.toLowerCase() || '';
          const studentEmail = enrollment.studentId?.email?.toLowerCase() || '';
          const courseTitle = enrollment.courseId?.title?.toLowerCase() || '';
          const testTitle = enrollment.testId?.title?.toLowerCase() || '';
          const searchTerm = search.toLowerCase();
          
          return studentName.includes(searchTerm) || 
                 studentEmail.includes(searchTerm) || 
                 courseTitle.includes(searchTerm) ||
                 testTitle.includes(searchTerm);
        });
      }
      
      // Apply status filter if needed
      if (status && status !== 'all') {
        enrollments = enrollments.filter(enrollment => {
          // For recording unlocks, check unlockStatus
          if (enrollment.type === 'recording') {
            return enrollment.status === status;
          }
          // For other enrollments, check status
          return enrollment.status === status;
        });
      }
      
      // Sort by createdAt descending
      enrollments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    if (enrollments.length === 0) {
      return res.status(404).json({ success: false, message: 'No data found for export' });
    }

    // Create CSV headers
    const headers = [
      'Student Name',
      'Student Email',
      'Student Mobile',
      'Enrollment Type',
      'Course/Test Title',
      'Price',
      'Status',
      'Enrollment Date'
    ].join(',');
    
    // Create CSV rows
    const rows = enrollments.map(enrollment => {
      const enrollmentType = enrollment.type || (enrollment.hasOwnProperty('status') ? 'recording' : 'unknown');
      const title = enrollment.courseId?.title || enrollment.testId?.title || 'N/A';
      let price = 'N/A';
      
      if (enrollmentType === 'course') {
        price = enrollment.courseId?.price || 'N/A';
      } else if (enrollmentType === 'recording') {
        price = enrollment.courseId?.recordingsPrice || 'N/A';
      } else if (enrollmentType === 'test') {
        price = enrollment.testId?.price || 'N/A';
      }
      
      const status = enrollment.status || 'N/A';
      const student = enrollment.studentId || enrollment.student || {};
      
      return [
        student?.name || 'N/A',
        student?.email || 'N/A',
        student?.mobile || 'N/A',
        enrollmentType,
        title,
        price,
        status,
        enrollment.createdAt ? new Date(enrollment.createdAt).toISOString() : 'N/A'
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="enrollments-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Export enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to export enrollments' });
  }
});

// Test endpoint to debug enrollment data
router.get('/admin/debug-enrollments/:studentId', adminAuth, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Get enrollments from Enrollment collection
    const enrollmentCollectionEnrollments = await Enrollment.find({ 
      studentId: studentId,
      type: 'course' 
    })
      .populate('studentId', 'name email mobile')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 });

    // Get courses where student is in enrolledStudents array
    const courseModelEnrollments = await Course.find({ 
      enrolledStudents: studentId
    })
      .populate('enrolledStudents', 'name email mobile')
      .select('title price enrolledStudents createdAt _id');

    res.json({
      success: true,
      data: {
        enrollmentCollectionEnrollments,
        courseModelEnrollments
      }
    });
  } catch (error) {
    console.error('Debug enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch debug data' });
  }
});

// @route   GET /api/v1/enrollments/admin/courses/:courseId
// @desc    Get all students enrolled in a specific course (Admin only)
// @access  Admin
router.get('/admin/courses/:courseId', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 1000, search, fetchAll } = req.query;
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    // Find the course to verify it exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Get students enrolled through the enrolledStudents array
    const enrolledStudentIds = course.enrolledStudents || [];
    
    // Get students who have Enrollment records for this course
    const enrollmentRecords = await Enrollment.find({
      courseId: courseId,
      type: 'course'
    }).populate('studentId', 'name email mobile');
    
    // Create a map of studentId to enrollment for quick lookup
    const enrollmentMap = {};
    enrollmentRecords.forEach(enrollment => {
      if (enrollment.studentId) {
        enrollmentMap[enrollment.studentId._id.toString()] = enrollment;
      }
    });
    
    // Combine both data sources
    // Start with students from enrolledStudents array
    let allEnrollments = [];
    
    // Process students from enrolledStudents array
    for (const studentId of enrolledStudentIds) {
      const studentIdStr = studentId.toString();
      
      // Check if we already have an enrollment record for this student
      if (enrollmentMap[studentIdStr]) {
        // Use the enrollment record (it has the correct createdAt date)
        const enrollment = enrollmentMap[studentIdStr];
        allEnrollments.push({
          _id: enrollment._id,
          studentId: enrollment.studentId._id,
          student: {
            _id: enrollment.studentId._id,
            name: enrollment.studentId.name,
            email: enrollment.studentId.email,
            mobile: enrollment.studentId.mobile
          },
          courseId: {
            _id: course._id,
            title: course.title,
            price: course.price
          },
          type: 'course',
          status: enrollment.status,
          createdAt: enrollment.createdAt // Actual enrollment date
        });
      } else {
        // No enrollment record found, but student is in enrolledStudents array
        // We need to get student details and create a basic enrollment object
        try {
          const student = await Student.findById(studentId).select('name email mobile');
          if (student) {
            allEnrollments.push({
              _id: `${courseId}-${studentIdStr}`,
              studentId: student._id,
              student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                mobile: student.mobile
              },
              courseId: {
                _id: course._id,
                title: course.title,
                price: course.price
              },
              type: 'course',
              status: 'enrolled',
              createdAt: course.createdAt || new Date() // Fallback to course creation date
            });
          } else {
            console.warn(`Student not found for ID: ${studentIdStr}`);
          }
        } catch (error) {
          // If we can't find the student, skip them
          console.warn(`Could not find student with ID: ${studentIdStr}`, error);
        }
      }
    }
    
    // Apply search filter if provided
    if (search) {
      allEnrollments = allEnrollments.filter(enrollment => {
        const studentName = (enrollment.student?.name || '').toLowerCase();
        const studentEmail = (enrollment.student?.email || '').toLowerCase();
        const studentMobile = (enrollment.student?.mobile || '').toLowerCase();
        const searchTerm = search.toLowerCase();
        
        return studentName.includes(searchTerm) || 
               studentEmail.includes(searchTerm) || 
               studentMobile.includes(searchTerm);
      });
    }
    
    // Sort by createdAt descending (latest first)
    allEnrollments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination only if fetchAll is not specified
    const total = allEnrollments.length;
    let paginatedEnrollments;
    
    if (fetchAll === 'true') {
      paginatedEnrollments = allEnrollments;
    } else {
      paginatedEnrollments = allEnrollments.slice((page - 1) * limit, page * limit);
    }
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: fetchAll === 'true' ? 0 : parseInt(limit),
          total,
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course enrollments' });
  }
});

// @route   GET /api/v1/enrollments/admin/recordings/:courseId
// @desc    Get all students who unlocked recordings for a specific course (Admin only)
// @access  Admin
router.get('/admin/recordings/:courseId', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 1000, search, fetchAll } = req.query;
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Build query for recording unlocks for this course
    let query = { courseId: courseId };
    
    if (search) {
      // Search by student name, email or mobile
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.studentId = { $in: studentIds };
    }
    
    // Get recording unlocks with student details, sorted by latest first
    const allEnrollments = await RecordingEnrollment.find(query)
      .populate('studentId', 'name email mobile')
      .sort({ createdAt: -1 }); // Sort by latest first
    
    // Format enrollments to match the expected structure
    const formattedEnrollments = allEnrollments.map(enrollment => ({
      _id: enrollment._id,
      studentId: enrollment.studentId._id,
      student: {
        _id: enrollment.studentId._id,
        name: enrollment.studentId.name,
        email: enrollment.studentId.email,
        mobile: enrollment.studentId.mobile
      },
      courseId: {
        _id: course._id,
        title: course.title,
        recordingsPrice: course.recordingsPrice
      },
      type: 'recording',
      status: enrollment.status,
      createdAt: enrollment.createdAt
    }));
    
    // Apply pagination only if fetchAll is not specified
    const total = formattedEnrollments.length;
    let paginatedEnrollments;
    
    if (fetchAll === 'true') {
      paginatedEnrollments = formattedEnrollments;
    } else {
      paginatedEnrollments = formattedEnrollments.slice((page - 1) * limit, page * limit);
    }
    
    res.json({
      success: true,
      data: {
        enrollments: paginatedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: fetchAll === 'true' ? 0 : parseInt(limit),
          total,
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get recording unlocks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recording unlocks' });
  }
});

// @route   GET /api/v1/enrollments/admin/courses/:courseId/export
// @desc    Export course enrollments as CSV (Admin only)
// @access  Admin
router.get('/admin/courses/:courseId/export', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { search, format = 'csv' } = req.query;
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Get enrolled students with search functionality
    let studentQuery = {
      _id: { $in: course.enrolledStudents }
    };
    
    if (search) {
      studentQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get students matching the query
    const students = await Student.find(studentQuery)
      .select('name email mobile')
      .sort({ name: 1 });
    
    // Create enrollment objects for each student
    const enrollments = students.map(student => ({
      _id: `${courseId}-${student._id}`,
      studentId: student._id,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        mobile: student.mobile
      },
      courseId: {
        _id: course._id,
        title: course.title,
        price: course.price
      },
      type: 'course',
      status: 'enrolled',
      createdAt: course.createdAt || new Date()
    }));
    
    if (format === 'json') {
      return res.json({
        success: true,
        data: enrollments
      });
    }
    
    // Create CSV headers
    const headers = [
      'Student Name',
      'Student Email',
      'Student Mobile',
      'Enrollment Type',
      'Course Title',
      'Price',
      'Status',
      'Enrollment Date'
    ].join(',');
    
    // Create CSV rows
    const rows = enrollments.map(enrollment => {
      return [
        enrollment.student?.name || 'N/A',
        enrollment.student?.email || 'N/A',
        enrollment.student?.mobile || 'N/A',
        enrollment.type,
        enrollment.courseId?.title || 'N/A',
        enrollment.courseId?.price || 'N/A',
        enrollment.status,
        enrollment.createdAt ? new Date(enrollment.createdAt).toISOString() : 'N/A'
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="course-enrollments-${course.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Export course enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to export course enrollments' });
  }
});

// @route   GET /api/v1/enrollments/admin/recordings/:courseId/export
// @desc    Export recording unlocks as CSV (Admin only)
// @access  Admin
router.get('/admin/recordings/:courseId/export', adminAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { search, format = 'csv' } = req.query;
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Build query for recording unlocks for this course
    let query = { courseId: courseId };
    
    if (search) {
      // Search by student name, email or mobile
      const studentIds = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      
      query.studentId = { $in: studentIds };
    }
    
    // Get recording unlocks with student details
    const enrollments = await RecordingEnrollment.find(query)
      .populate('studentId', 'name email mobile')
      .sort({ createdAt: -1 });
    
    // Format enrollments to match the expected structure
    const formattedEnrollments = enrollments.map(enrollment => ({
      _id: enrollment._id,
      studentId: enrollment.studentId._id,
      student: {
        _id: enrollment.studentId._id,
        name: enrollment.studentId.name,
        email: enrollment.studentId.email,
        mobile: enrollment.studentId.mobile
      },
      courseId: {
        _id: course._id,
        title: course.title,
        recordingsPrice: course.recordingsPrice
      },
      type: 'recording',
      status: enrollment.status,
      createdAt: enrollment.createdAt
    }));
    
    if (format === 'json') {
      return res.json({
        success: true,
        data: formattedEnrollments
      });
    }
    
    // Create CSV headers
    const headers = [
      'Student Name',
      'Student Email',
      'Student Mobile',
      'Enrollment Type',
      'Course Title',
      'Recordings Price',
      'Status',
      'Unlock Date'
    ].join(',');
    
    // Create CSV rows
    const rows = formattedEnrollments.map(enrollment => {
      return [
        enrollment.student?.name || 'N/A',
        enrollment.student?.email || 'N/A',
        enrollment.student?.mobile || 'N/A',
        enrollment.type,
        enrollment.courseId?.title || 'N/A',
        enrollment.courseId?.recordingsPrice || 'N/A',
        enrollment.status,
        enrollment.createdAt ? new Date(enrollment.createdAt).toISOString() : 'N/A'
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="recording-unlocks-${course.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Export recording unlocks error:', error);
    res.status(500).json({ success: false, message: 'Failed to export recording unlocks' });
  }
});

module.exports = router;