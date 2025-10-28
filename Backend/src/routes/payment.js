const express = require('express');
const { body, validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth, adminAuth } = require('../middlewares/auth');
const Test = require('../models/Test');
const Order = require('../models/Order');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const RecordingEnrollment = require('../models/RecordingEnrollment');
const { generateReceiptPDF } = require('../utils/receiptGenerator'); // Add this import

const router = express.Router();

// Razorpay configuration
console.log('Initializing Razorpay with keys:', {
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RXyM7QlecpKVqF',
  key_secret_present: !!process.env.RAZORPAY_KEY_SECRET
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RXyM7QlecpKVqF',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '1CPZTFxhgfnRsc7vtKzKO9Ps'
});

// Test Razorpay connection
console.log('Testing Razorpay connection...');
razorpay.orders.all({ count: 1 }).then((result) => {
  console.log('Razorpay SDK initialized successfully');
  console.log('Razorpay connection test result:', result ? 'Success' : 'No data');
}).catch((error) => {
  console.error('=== RAZORPAY SDK INITIALIZATION ERROR ===');
  console.error('Razorpay SDK initialization error:', error);
  console.error('Error details:', {
    statusCode: error.statusCode,
    code: error.code,
    message: error.message
  });
  
  // Check if it's an authentication error
  if (error.statusCode === 401) {
    console.error('CRITICAL: RAZORPAY AUTHENTICATION FAILED - Check your API keys in .env file');
    console.error('Current keys being used:');
    console.error('  Key ID:', process.env.RAZORPAY_KEY_ID || 'NOT SET');
    console.error('  Key Secret Present:', !!process.env.RAZORPAY_KEY_SECRET);
  }
});

// @route   POST /api/v1/payments/create-course-order
// @desc    Create payment order for course enrollment
// @access  Private
router.post('/create-course-order', auth, [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('billingDetails.name')
    .trim()
    .notEmpty()
    .withMessage('Billing name is required'),
  body('billingDetails.email')
    .isEmail()
    .withMessage('Valid billing email is required'),
  body('billingDetails.mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid 10-digit mobile number is required')
], async (req, res) => {
  try {
    console.log('=== CREATE COURSE ORDER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.student.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId, billingDetails, couponCode } = req.body;
    console.log('Processing course order:', { courseId, billingDetails, couponCode });

    // Verify course exists and is paid
    console.log('Looking up course with ID:', courseId);
    const course = await Course.findById(courseId);
    console.log('Course lookup result:', courseId, course ? 'Found' : 'Not found');
    
    if (!course) {
      console.log('Course not found error');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('Course details:', {
      id: course._id,
      title: course.title,
      isPaid: course.isPaid,
      price: course.price,
      currency: course.currency
    });

    // Validate course price
    if (!course.isPaid || !course.price || course.price <= 0) {
      console.log('Course price validation failed:', {
        isPaid: course.isPaid,
        price: course.price,
        condition: !course.isPaid || !course.price || course.price <= 0
      });
      return res.status(400).json({
        success: false,
        message: 'This course is free and does not require payment'
      });
    }

    // Ensure price is a valid number
    if (isNaN(course.price) || typeof course.price !== 'number') {
      console.log('Invalid course price type:', typeof course.price, course.price);
      return res.status(400).json({
        success: false,
        message: 'Invalid course price'
      });
    }

    // Check if student has already purchased this course
    console.log('Checking existing enrollment for student:', req.student.id, 'course:', courseId);
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId: courseId,
      type: 'course'
    });
    console.log('Existing enrollment check result:', existingEnrollment ? 'Found' : 'Not found');

    if (existingEnrollment) {
      console.log('Student already enrolled in this course');
      return res.status(400).json({
        success: false,
        message: 'You have already enrolled in this course'
      });
    }

    // Calculate total amount (using price as-is without adding GST)
    // If GST is to be added, it should be included in the course price
    let subtotal = course.price;
    
    // Apply discount if coupon code is provided
    let discountAmount = 0;
    let discountPercentage = 0;
    
    if (couponCode) {
      // Mock coupon validation (implement real coupon system)
      if (couponCode === 'SAVE10') {
        discountPercentage = 10;
        discountAmount = Math.round(subtotal * 0.1);
      } else if (couponCode === 'FIRST20') {
        discountPercentage = 20;
        discountAmount = Math.round(subtotal * 0.2);
      }
    }

    // Calculate final amount (no automatic GST added)
    const taxableAmount = subtotal - discountAmount;
    const totalAmount = taxableAmount; // Removed GST calculation

    // Validate amount for Razorpay (must be integer in paise)
    if (totalAmount <= 0) {
      console.log('Invalid payment amount:', totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.log('Invalid amount in paise calculation:', { amountInPaise, totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount calculation'
      });
    }
    console.log('Amount in paise:', amountInPaise);

    // Create order in Razorpay
    let receipt = `course_${courseId.substring(0, 10)}_${Date.now().toString().substring(0, 8)}`;
    // Ensure receipt doesn't exceed 40 characters
    if (receipt.length > 40) {
      receipt = receipt.substring(0, 40);
    }
    
    const options = {
      amount: amountInPaise, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        courseId: courseId,
        studentId: req.student.id,
        courseTitle: course.title
      }
    };
    console.log('Razorpay order options:', JSON.stringify(options, null, 2));

    // Create order in Razorpay with better error handling
    let razorpayOrder;
    try {
      console.log('Creating Razorpay order...');
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', JSON.stringify(razorpayOrder, null, 2));
    } catch (razorpayError) {
      console.error('=== RAZORPAY ORDER CREATION ERROR ===');
      console.error('Razorpay order creation error:', razorpayError);
      console.error('Razorpay error details:', {
        statusCode: razorpayError.statusCode,
        code: razorpayError.code,
        message: razorpayError.message,
        field: razorpayError.field
      });
      console.error('Request options that failed:', JSON.stringify(options, null, 2));
      
      // Check if it's an authentication error
      if (razorpayError.statusCode === 401) {
        console.error('RAZORPAY AUTHENTICATION ERROR - Check your API keys in .env file');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order with Razorpay',
        error: razorpayError.message || 'Unknown Razorpay error',
        errorCode: razorpayError.code,
        errorField: razorpayError.field,
        statusCode: razorpayError.statusCode
      });
    }

    // Create order in our database
    console.log('Creating local order record...');
    const order = new Order({
      orderId: Order.generateOrderId(), // Explicitly generate orderId
      studentId: req.student.id,
      items: [{
        courseId: course._id,
        courseTitle: course.title,
        price: course.price,
        currency: course.currency || 'INR'
      }],
      totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentGatewayOrderId: razorpayOrder.id,
      billingDetails,
      discountApplied: couponCode ? {
        couponCode,
        discountAmount,
        discountPercentage
      } : undefined,
      taxes: {
        gst: 0, // No automatic GST calculation
        totalTax: 0
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        source: 'web',
        courseId: courseId
      }
    });

    await order.save();
    console.log('Local order record created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          items: order.items,
          discountApplied: order.discountApplied,
          taxes: order.taxes
        },
        razorpayOrder,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RXyM7QlecpKVqF'
      }
    });

  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN CREATE COURSE ORDER ===');
    console.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/verify-course-payment
// @desc    Verify course payment and complete enrollment
// @access  Private
router.post('/verify-course-payment', auth, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find order
    const order = await Order.findOne({
      paymentGatewayOrderId: razorpay_order_id,
      studentId: req.student.id,
      paymentStatus: 'pending'
    }).populate('items.courseId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1CPZTFxhgfnRsc7vtKzKO9Ps');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await order.markAsFailed('Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Mark order as completed
    await order.markAsCompleted(razorpay_payment_id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    // Generate receipt
    order.receipt = {
      receiptNumber: `RCP_${order.orderId}`,
      generatedAt: new Date()
    };
    await order.save();

    // Enroll student in course
    const courseId = order.metadata.courseId;
    const course = await Course.findById(courseId);
    if (course && !course.enrolledStudents.includes(req.student.id)) {
      course.enrolledStudents.push(req.student.id);
      await course.save();
    }

    // Create enrollment record
    // Check if enrollment already exists to avoid duplicate key error
    let enrollment = await Enrollment.findOne({
      studentId: req.student.id,
      courseId: courseId,
      type: 'course'
    });
    
    if (!enrollment) {
      try {
        // Try to create enrollment with standard Mongoose approach first
        enrollment = new Enrollment({
          studentId: req.student.id,
          courseId: courseId,
          type: 'course',
          status: 'enrolled'
        });
        
        await enrollment.save();
      } catch (enrollmentError) {
        // If we get a duplicate key error, it might be because of the partial index issue
        if (enrollmentError.code === 11000) {
          console.log('Enrollment failed due to duplicate key error, trying alternative approach');
          
          // Try to find if enrollment was actually created despite the error
          enrollment = await Enrollment.findOne({
            studentId: req.student.id,
            courseId: courseId,
            type: 'course'
          });
          
          // If still not found, try direct MongoDB insert
          if (!enrollment) {
            try {
              const enrollmentData = {
                studentId: req.student.id,
                courseId: courseId,
                type: 'course',
                status: 'enrolled',
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              const result = await Enrollment.collection.insertOne(enrollmentData);
              enrollment = await Enrollment.findById(result.insertedId);
            } catch (directInsertError) {
              console.log('Direct insert also failed:', directInsertError);
              // If direct insert fails, just continue - enrollment might already exist
              enrollment = await Enrollment.findOne({
                studentId: req.student.id,
                courseId: courseId,
                type: 'course'
              });
            }
          }
        } else {
          // If it's not a duplicate key error, re-throw it
          throw enrollmentError;
        }
      }
    } else {
      // If enrollment already exists, update status if needed
      if (enrollment.status !== 'enrolled') {
        enrollment.status = 'enrolled';
        await enrollment.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and enrollment completed successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          status: order.paymentStatus,
          totalAmount: order.totalAmount,
          items: order.items,
          receipt: order.receipt
        },
        enrollment
      }
    });

  } catch (error) {
    console.error('Verify course payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// @route   POST /api/v1/payments/create-recording-order
// @desc    Create payment order for recording enrollment
// @access  Private
router.post('/create-recording-order', auth, [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('billingDetails.name')
    .trim()
    .notEmpty()
    .withMessage('Billing name is required'),
  body('billingDetails.email')
    .isEmail()
    .withMessage('Valid billing email is required'),
  body('billingDetails.mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid 10-digit mobile number is required')
], async (req, res) => {
  try {
    console.log('=== CREATE RECORDING ORDER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.student.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId, billingDetails } = req.body;
    console.log('Processing recording order:', { courseId, billingDetails });

    // Verify course exists and has recordings price
    console.log('Looking up course with ID:', courseId);
    const course = await Course.findById(courseId);
    console.log('Course lookup result:', courseId, course ? 'Found' : 'Not found');
    
    if (!course) {
      console.log('Course not found error');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('Course details:', {
      id: course._id,
      title: course.title,
      recordingsPrice: course.recordingsPrice,
      currency: course.currency
    });

    // Validate recordings price
    if (!course.recordingsPrice || course.recordingsPrice <= 0) {
      console.log('Recordings are free and do not require payment');
      return res.status(400).json({
        success: false,
        message: 'These recordings are free and do not require payment'
      });
    }

    // Ensure price is a valid number
    if (isNaN(course.recordingsPrice) || typeof course.recordingsPrice !== 'number') {
      console.log('Invalid recordings price type:', typeof course.recordingsPrice, course.recordingsPrice);
      return res.status(400).json({
        success: false,
        message: 'Invalid recordings price'
      });
    }

    // Check if student has already unlocked these recordings
    console.log('Checking existing recording enrollment for student:', req.student.id, 'course:', courseId);
    const existingEnrollment = await RecordingEnrollment.findOne({
      studentId: req.student.id,
      courseId: courseId
    });
    console.log('Existing recording enrollment check result:', existingEnrollment ? 'Found' : 'Not found');

    if (existingEnrollment) {
      console.log('Student already unlocked these recordings');
      return res.status(400).json({
        success: false,
        message: 'You have already unlocked these recordings'
      });
    }

    // Calculate total amount (using price as-is without adding GST)
    let totalAmount = course.recordingsPrice;
    console.log('Total amount:', totalAmount);

    // Validate amount for Razorpay (must be integer in paise)
    if (totalAmount <= 0) {
      console.log('Invalid payment amount:', totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.log('Invalid amount in paise calculation:', { amountInPaise, totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount calculation'
      });
    }
    console.log('Amount in paise:', amountInPaise);

    // Create order in Razorpay
    let receipt = `rec_${courseId.substring(0, 10)}_${Date.now().toString().substring(0, 8)}`;
    // Ensure receipt doesn't exceed 40 characters
    if (receipt.length > 40) {
      receipt = receipt.substring(0, 40);
    }
    
    const options = {
      amount: amountInPaise, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        courseId: courseId,
        studentId: req.student.id,
        courseTitle: course.title,
        type: 'recording'
      }
    };
    console.log('Razorpay order options:', JSON.stringify(options, null, 2));

    // Create order in Razorpay with better error handling
    let razorpayOrder;
    try {
      console.log('Creating Razorpay order...');
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', JSON.stringify(razorpayOrder, null, 2));
    } catch (razorpayError) {
      console.error('=== RAZORPAY ORDER CREATION ERROR ===');
      console.error('Razorpay order creation error:', razorpayError);
      console.error('Razorpay error details:', {
        statusCode: razorpayError.statusCode,
        code: razorpayError.code,
        message: razorpayError.message,
        field: razorpayError.field
      });
      console.error('Request options that failed:', JSON.stringify(options, null, 2));
      
      // Check if it's an authentication error
      if (razorpayError.statusCode === 401) {
        console.error('RAZORPAY AUTHENTICATION ERROR - Check your API keys in .env file');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order with Razorpay',
        error: razorpayError.message || 'Unknown Razorpay error',
        errorCode: razorpayError.code,
        errorField: razorpayError.field,
        statusCode: razorpayError.statusCode
      });
    }

    // Create order in our database
    console.log('Creating local order record...');
    const order = new Order({
      orderId: Order.generateOrderId(), // Explicitly generate orderId
      studentId: req.student.id,
      items: [{
        courseId: course._id,
        courseTitle: course.title,
        price: course.recordingsPrice,
        currency: course.currency || 'INR'
      }],
      totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentGatewayOrderId: razorpayOrder.id,
      billingDetails,
      taxes: {
        gst: 0, // No automatic GST calculation
        totalTax: 0
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        source: 'web',
        courseId: courseId,
        type: 'recording'
      }
    });

    await order.save();
    console.log('Local order record created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          items: order.items,
          taxes: order.taxes
        },
        razorpayOrder,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RXyM7QlecpKVqF'
      }
    });

  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN CREATE RECORDING ORDER ===');
    console.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/verify-recording-payment
// @desc    Verify recording payment and complete enrollment
// @access  Private
router.post('/verify-recording-payment', auth, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find order
    const order = await Order.findOne({
      paymentGatewayOrderId: razorpay_order_id,
      studentId: req.student.id,
      paymentStatus: 'pending'
    }).populate('items.courseId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1CPZTFxhgfnRsc7vtKzKO9Ps');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await order.markAsFailed('Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Mark order as completed
    await order.markAsCompleted(razorpay_payment_id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    // Generate receipt
    order.receipt = {
      receiptNumber: `RCP_${order.orderId}`,
      generatedAt: new Date()
    };
    await order.save();

    // Unlock recordings for student
    const courseId = order.metadata.courseId;
    const course = await Course.findById(courseId);
    if (course) {
      // Create recording enrollment record
      // Check if enrollment already exists to avoid duplicate key error
      let enrollment = await RecordingEnrollment.findOne({
        studentId: req.student.id,
        courseId: courseId
      });
      
      if (!enrollment) {
        enrollment = new RecordingEnrollment({
          studentId: req.student.id,
          courseId: courseId,
          status: "unlocked"
        });
        await enrollment.save();
      } else {
        // If enrollment already exists, update status if needed
        if (enrollment.status !== 'unlocked') {
          enrollment.status = 'unlocked';
          await enrollment.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and recordings unlocked successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          status: order.paymentStatus,
          totalAmount: order.totalAmount,
          items: order.items,
          receipt: order.receipt
        }
      }
    });

  } catch (error) {
    console.error('Verify recording payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// @route   POST /api/v1/payments/create-order
// @desc    Create payment order for tests
// @access  Private
router.post('/create-order', auth, async (req, res) => {
  try {
    console.log('=== CREATE TEST ORDER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.student.id);
    
    const { testIds, billingDetails, couponCode } = req.body;
    console.log('Processing test order:', { testIds, billingDetails, couponCode });
    
    // Log the exact structure of testIds
    console.log('testIds structure:');
    if (Array.isArray(testIds)) {
      testIds.forEach((id, index) => {
        console.log(`  [${index}]:`, id, typeof id);
        if (typeof id === 'object') {
          console.log(`    Object keys:`, Object.keys(id));
        }
      });
    } else {
      console.log('testIds is not an array:', testIds, typeof testIds);
    }

    // Validate billing details
    if (!billingDetails || !billingDetails.name || !billingDetails.email || !billingDetails.mobile) {
      console.log('Missing billing details');
      return res.status(400).json({
        success: false,
        message: 'Billing details are required'
      });
    }

    // Validate test IDs
    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      console.log('Invalid or missing test IDs:', testIds);
      return res.status(400).json({
        success: false,
        message: 'Valid test IDs are required'
      });
    }

    // Ensure all testIds are strings
    const stringTestIds = testIds.map(id => {
      if (typeof id === 'object' && id !== null) {
        // If it's an object with _id property, use that
        if (id._id) {
          return id._id.toString ? id._id.toString() : String(id._id);
        }
        // If it's an ObjectId, convert to string
        if (id.toString && id.toString !== Object.prototype.toString) {
          return id.toString();
        }
        // If it's a generic object, try to stringify it
        return String(id);
      }
      // If it's already a string or number, convert to string
      return String(id);
    });
    
    console.log('Converted stringTestIds:', stringTestIds);

    // Find tests
    const tests = await Test.find({
      _id: { $in: stringTestIds },
      type: 'paid'
    });

    console.log('Found tests:', tests.map(t => ({ 
      id: t._id, 
      title: t.title, 
      price: t.price 
    })));

    if (tests.length !== stringTestIds.length) {
      console.log('Some tests not found or not paid tests');
      return res.status(400).json({
        success: false,
        message: 'Some tests not found or not available for purchase'
      });
    }

    // Check if student has already purchased any of these tests
    console.log('Checking existing purchases for student:', req.student.id);
    const existingOrders = await Order.find({
      studentId: req.student.id,
      'items.testId': { $in: testIds },
      paymentStatus: 'completed'
    });

    if (existingOrders.length > 0) {
      const purchasedTestIds = existingOrders.flatMap(order => 
        order.items.map(item => item.testId.toString())
      );
      const alreadyPurchased = testIds.filter(id => purchasedTestIds.includes(id));
      
      if (alreadyPurchased.length > 0) {
        console.log('Student already purchased some tests:', alreadyPurchased);
        return res.status(400).json({
          success: false,
          message: 'You have already purchased some of these tests'
        });
      }
    }

    // Calculate total amount
    const items = tests.map(test => ({
      testId: test._id,
      testTitle: test.title,
      price: test.price,
      currency: test.currency
    }));

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    console.log('Subtotal:', subtotal);
    
    // Apply discount if coupon code is provided
    let discountAmount = 0;
    let discountPercentage = 0;
    
    if (couponCode) {
      // Mock coupon validation (implement real coupon system)
      if (couponCode === 'SAVE10') {
        discountPercentage = 10;
        discountAmount = Math.round(subtotal * 0.1);
      } else if (couponCode === 'FIRST20') {
        discountPercentage = 20;
        discountAmount = Math.round(subtotal * 0.2);
      }
    }
    console.log('Discount applied:', { discountAmount, discountPercentage });

    // Calculate taxes (18% GST for India)
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Math.round(taxableAmount * 0.18);
    const totalAmount = taxableAmount + gstAmount;
    console.log('Amount calculation:', { subtotal, discountAmount, taxableAmount, gstAmount, totalAmount });

    // Validate amount for Razorpay (must be integer in paise)
    if (totalAmount <= 0) {
      console.log('Invalid payment amount:', totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.log('Invalid amount in paise calculation:', { amountInPaise, totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount calculation'
      });
    }
    console.log('Amount in paise:', amountInPaise);

    // Create order in Razorpay
    const options = {
      amount: amountInPaise, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        studentId: req.student.id,
        testIds: testIds
      }
    };
    console.log('Razorpay order options:', JSON.stringify(options, null, 2));

    // Create order in Razorpay with better error handling
    let razorpayOrder;
    try {
      console.log('Creating Razorpay order...');
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', JSON.stringify(razorpayOrder, null, 2));
    } catch (razorpayError) {
      console.error('=== RAZORPAY ORDER CREATION ERROR ===');
      console.error('Razorpay order creation error:', razorpayError);
      console.error('Razorpay error details:', {
        statusCode: razorpayError.statusCode,
        code: razorpayError.code,
        message: razorpayError.message,
        field: razorpayError.field
      });
      console.error('Request options that failed:', JSON.stringify(options, null, 2));
      
      // Check if it's an authentication error
      if (razorpayError.statusCode === 401) {
        console.error('RAZORPAY AUTHENTICATION ERROR - Check your API keys in .env file');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order with Razorpay',
        error: razorpayError.message || 'Unknown Razorpay error',
        errorCode: razorpayError.code,
        errorField: razorpayError.field,
        statusCode: razorpayError.statusCode
      });
    }

    // Create order in our database
    console.log('Creating local order record...');
    console.log('Original testIds from request:', testIds);
    console.log('Processed stringTestIds:', stringTestIds);
    
    const order = new Order({
      orderId: Order.generateOrderId(), // Explicitly generate orderId
      studentId: req.student.id,
      items,
      totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentGatewayOrderId: razorpayOrder.id,
      billingDetails,
      discountApplied: couponCode ? {
        couponCode,
        discountAmount,
        discountPercentage
      } : undefined,
      taxes: {
        gst: gstAmount,
        totalTax: gstAmount
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        source: 'web',
        testIds: stringTestIds // Use the processed string IDs
      }
    });
    
    console.log('Order metadata testIds:', order.metadata.testIds);

    await order.save();
    console.log('Local order record created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          items: order.items,
          discountApplied: order.discountApplied,
          taxes: order.taxes
        },
        razorpayOrder,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RXyM7QlecpKVqF'
      }
    });

  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN CREATE TEST ORDER ===');
    console.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/verify
// @desc    Verify payment and complete test enrollment
// @access  Private
router.post('/verify', auth, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
], async (req, res) => {
  try {
    console.log('=== VERIFY TEST PAYMENT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.student.id);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Find order
    const order = await Order.findOne({
      paymentGatewayOrderId: razorpay_order_id,
      studentId: req.student.id,
      paymentStatus: 'pending'
    }).populate('items.testId');

    if (!order) {
      console.log('Order not found or already processed');
      console.log('Searching for order with paymentGatewayOrderId:', razorpay_order_id);
      console.log('Student ID:', req.student.id);
      
      // Let's also search for any order with this gateway ID to see what we find
      const anyOrder = await Order.findOne({
        paymentGatewayOrderId: razorpay_order_id
      });
      console.log('Any order with this gateway ID:', anyOrder);
      
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    console.log('Found order:', {
      id: order._id,
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      studentId: order.studentId,
      items: order.items.map(item => ({
        testId: item.testId,
        testTitle: item.testTitle,
        price: item.price
      })),
      metadata: order.metadata
    });

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1CPZTFxhgfnRsc7vtKzKO9Ps');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('Invalid payment signature');
      await order.markAsFailed('Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Mark order as completed
    await order.markAsCompleted(razorpay_payment_id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    console.log('Order marked as completed');

    // Generate receipt
    order.receipt = {
      receiptNumber: `RCP_${order.orderId}`,
      generatedAt: new Date()
    };
    await order.save();

    // Enroll student in tests
    try {
      console.log('=== STARTING ENROLLMENT PROCESS ===');
      console.log('Student ID:', req.student.id);
      console.log('Order metadata:', JSON.stringify(order.metadata, null, 2));
      console.log('Order items:', JSON.stringify(order.items, null, 2));
      
      // Safely extract testIds from metadata
      let testIds = [];
      if (order.metadata && Array.isArray(order.metadata.testIds)) {
        testIds = order.metadata.testIds.map(id => {
          console.log('Processing metadata testId:', id, typeof id);
          // If it's an object with _id property, use that
          if (id && typeof id === 'object' && id._id) {
            const result = id._id.toString ? id._id.toString() : id._id;
            console.log('Extracted ID from object:', result);
            return result;
          }
          // If it's already an ObjectId or string, convert to string
          const result = id.toString ? id.toString() : String(id);
          console.log('Converted to string:', result);
          return result;
        });
      } else if (order.metadata && typeof order.metadata.testIds === 'string') {
        // If it's a single test ID as string, convert to array
        testIds = [order.metadata.testIds];
        console.log('Single test ID string:', testIds);
      } else if (order.metadata && order.metadata.testIds) {
        // If it's an object or other type, try to convert
        const id = order.metadata.testIds;
        console.log('Processing single metadata testId:', id, typeof id);
        if (id && typeof id === 'object' && id._id) {
          const result = id._id.toString ? id._id.toString() : id._id;
          testIds = [result];
          console.log('Extracted ID from single object:', result);
        } else {
          const result = id.toString ? id.toString() : String(id);
          testIds = [result];
          console.log('Converted single to string:', result);
        }
      }
      
      console.log('Extracted testIds from metadata:', testIds);
      
      // Also extract test IDs from order items as fallback
      if ((!testIds || testIds.length === 0) && order.items && Array.isArray(order.items)) {
        testIds = order.items
          .filter(item => item.testId)
          .map(item => {
            console.log('Processing item testId:', item.testId, typeof item.testId);
            // If it's an object with _id property, use that
            if (item.testId && typeof item.testId === 'object' && item.testId._id) {
              const result = item.testId._id.toString ? item.testId._id.toString() : item.testId._id;
              console.log('Extracted ID from item object:', result);
              return result;
            }
            // If it's already an ObjectId or string, convert to string
            const result = item.testId.toString ? item.testId.toString() : String(item.testId);
            console.log('Converted item to string:', result);
            return result;
          });
        console.log('Fallback testIds from items:', testIds);
      }
      
      console.log('Final testIds to process:', testIds);
      
      // Validate that we have test IDs
      if (!testIds || testIds.length === 0) {
        console.log('WARNING: No test IDs found to process!');
        throw new Error('No test IDs found to process');
      }
      
      // Process each test ID
      let enrollmentCount = 0;
      for (const testId of testIds) {
        try {
          // Skip if testId is null, undefined, or empty
          if (!testId || testId === 'null' || testId === 'undefined') {
            console.log('Skipping invalid testId:', testId);
            continue;
          }
          
          // Normalize testId (ensure it's a string)
          const normalizedTestId = typeof testId === 'object' && testId.toString ? testId.toString() : testId;
          console.log('Processing test enrollment for:', normalizedTestId);
          
          // Validate the test ID format
          if (!normalizedTestId || normalizedTestId.length < 10) {
            console.log('Skipping invalid testId format:', normalizedTestId);
            continue;
          }
          
          // Check if already enrolled
          const existing = await Enrollment.findOne({
            studentId: req.student.id,
            testId: normalizedTestId,
            type: "test"
          });
          
          console.log('Existing enrollment check result:', existing ? 'Found' : 'Not found');

          if (!existing) {
            console.log('Creating new enrollment for test:', normalizedTestId);
            
            // First, let's check what enrollments already exist for this student
            const allStudentEnrollments = await Enrollment.find({
              studentId: req.student.id
            });
            console.log('All existing enrollments for student:', allStudentEnrollments.map(e => ({
              id: e._id,
              testId: e.testId,
              courseId: e.courseId,
              type: e.type,
              status: e.status
            })));
            
            // Check if already enrolled using the correct index (studentId + testId)
            const existingTestEnrollment = await Enrollment.findOne({
              studentId: req.student.id,
              testId: normalizedTestId
            });
            
            if (existingTestEnrollment) {
              console.log('Student already enrolled in test (found via testId check):', normalizedTestId);
              enrollmentCount++;
              continue;
            }
            
            const enrollment = new Enrollment({
              studentId: req.student.id,
              testId: normalizedTestId, // This should be just the ID string
              // Explicitly exclude courseId field instead of setting to null
              type: "test",
              status: 'enrolled',
            });
            
            // Log the enrollment before saving
            console.log('About to save enrollment:', {
              studentId: enrollment.studentId,
              testId: enrollment.testId,
              courseId: enrollment.courseId,
              type: enrollment.type,
              status: enrollment.status
            });
            
            await enrollment.save();
            console.log('Enrollment created successfully:', {
              id: enrollment._id,
              studentId: enrollment.studentId,
              testId: enrollment.testId,
              type: enrollment.type,
              status: enrollment.status
            });
            enrollmentCount++;
          } else {
            console.log('Student already enrolled in test:', normalizedTestId);
            enrollmentCount++;
          }

        } catch (enrollmentError) {
          console.error('Error processing enrollment for testId:', testId, enrollmentError);
          // Continue with other enrollments even if one fails
        }
      }
      console.log('Total enrollments processed:', enrollmentCount);
      
      // Verify that enrollments were created
      if (testIds.length > 0) {
        console.log('Verifying enrollments for testIds:', testIds);
        const verificationEnrollments = await Enrollment.find({
          studentId: req.student.id,
          testId: { $in: testIds },
          type: "test"
        });
        console.log('Verification - Found enrollments after creation:', verificationEnrollments.map(e => ({
          id: e._id,
          testId: e.testId,
          status: e.status
        })));
      }
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (enrollmentProcessError) {
      console.error('Error in enrollment process:', enrollmentProcessError);
      console.error('Error stack:', enrollmentProcessError.stack);
      // Don't fail the entire payment verification if enrollment fails
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order: {
          id: order._id,
          orderId: order.orderId,
          status: order.paymentStatus,
          totalAmount: order.totalAmount,
          items: order.items,
          receipt: order.receipt
        }
      }
    });

  } catch (error) {
    console.error('=== VERIFY PAYMENT ERROR ===');
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// @route   POST /api/v1/payments/webhook
// @desc    Handle payment gateway webhooks
// @access  Public (but should be secured with webhook signature)
router.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook signature (implement based on payment gateway)
    // const isValidWebhook = verifyWebhookSignature(req);
    // if (!isValidWebhook) {
    //   return res.status(400).json({ error: 'Invalid webhook signature' });
    // }

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handlers
async function handlePaymentCaptured(payload) {
  try {
    const { order_id, payment_id, amount } = payload;
    
    const order = await Order.findOne({ paymentGatewayOrderId: order_id });
    if (order && order.paymentStatus === 'pending') {
      await order.markAsCompleted(payment_id, payload);
      console.log(`Payment captured for order ${order.orderId}`);
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

async function handlePaymentFailed(payload) {
  try {
    const { order_id, error_description } = payload;
    
    const order = await Order.findOne({ paymentGatewayOrderId: order_id });
    if (order && order.paymentStatus === 'pending') {
      await order.markAsFailed(error_description, payload);
      console.log(`Payment failed for order ${order.orderId}`);
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

async function handleOrderPaid(payload) {
  try {
    const { order_id } = payload;
    
    const order = await Order.findOne({ paymentGatewayOrderId: order_id });
    if (order) {
      // Send confirmation email, unlock tests, etc.
      console.log(`Order paid: ${order.orderId}`);
    }
  } catch (error) {
    console.error('Handle order paid error:', error);
  }
}

// @route   GET /api/v1/payments/orders/:orderId/receipt
// @desc    Get order receipt data
// @access  Private
router.get('/orders/:orderId/receipt', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order and populate necessary data
    const order = await Order.findOne({
      _id: orderId,
      studentId: req.student.id
    }).populate('items.testId', 'title').populate('items.courseId', 'title');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is completed
    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for completed orders'
      });
    }

    // Get receipt data from order
    const receiptData = order.getReceiptData();

    res.json({
      success: true,
      message: 'Receipt data retrieved successfully',
      data: {
        receipt: receiptData
      }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve receipt data'
    });
  }
});

// @route   GET /api/v1/payments/orders/:orderId/receipt/pdf
// @desc    Download order receipt as PDF
// @access  Private
router.get('/orders/:orderId/receipt/pdf', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order and populate necessary data
    const order = await Order.findOne({
      _id: orderId,
      studentId: req.student.id
    }).populate('items.testId', 'title').populate('items.courseId', 'title');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is completed
    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for completed orders'
      });
    }

    // Get receipt data from order
    const receiptData = order.getReceiptData();

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(receiptData);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptData.orderId}.pdf`);
    
    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt PDF'
    });
  }
});

// @route   GET /api/v1/payments/orders/:orderId/receipt
// @desc    Get receipt details for an order
// @access  Private
router.get('/orders/:orderId/receipt', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order by ID and ensure it belongs to the current student
    const order = await Order.findOne({
      _id: orderId,
      studentId: req.student.id
    }).populate([
      {
        path: 'items.testId',
        select: 'title'
      },
      {
        path: 'items.courseId',
        select: 'title'
      }
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate receipt data
    const receiptData = order.getReceiptData();
    
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

// @route   GET /api/v1/admin/orders/:orderId/receipt
// @desc    Get receipt for an order (Admin version - no auth check)
// @access  Private/Admin
router.get('/admin/orders/:orderId/receipt', adminAuth, async (req, res) => {
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

// Admin routes
// @route   POST /api/v1/payments/orders/:id/refund
// @desc    Process refund (Admin only)
// @access  Private/Admin
router.post('/orders/:id/refund', adminAuth, [
  body('amount')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Refund amount must be positive'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Refund reason is required')
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

    const { amount, reason } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.id,
      paymentStatus: 'completed'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for refund'
      });
    }

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : order.totalAmount;
    
    if (refundAmount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order amount'
      });
    }

    // Check if order already has a refund
    if (order.refund && order.refund.refundStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been refunded'
      });
    }

    // Process refund with payment gateway (mock implementation)
    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await order.processRefund(refundAmount, reason, req.student.id);
    order.refund.refundId = refundId;
    order.refund.refundStatus = 'completed'; // Mock successful refund
    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId,
        refundAmount,
        refundStatus: 'completed'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// @route   GET /api/v1/payments/validate-coupon
// @desc    Validate coupon code
// @access  Private
router.get('/validate-coupon', auth, async (req, res) => {
  try {
    const { code, amount } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    // Mock coupon validation
    const coupons = {
      'SAVE10': { discount: 10, type: 'percentage', minAmount: 100 },
      'FIRST20': { discount: 20, type: 'percentage', minAmount: 200 },
      'FLAT50': { discount: 50, type: 'fixed', minAmount: 300 }
    };

    const coupon = coupons[code.toUpperCase()];
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    const orderAmount = parseFloat(amount) || 0;
    
    if (orderAmount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minAmount} required for this coupon`
      });
    }

    const discountAmount = coupon.type === 'percentage' 
      ? Math.round(orderAmount * coupon.discount / 100)
      : coupon.discount;

    res.json({
      success: true,
      data: {
        couponCode: code.toUpperCase(),
        discountType: coupon.type,
        discountValue: coupon.discount,
        discountAmount: Math.min(discountAmount, orderAmount),
        minAmount: coupon.minAmount
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
});

module.exports = router;