const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Test = require('../models/Test');
const Order = require('../models/Order');
const Student = require('../models/Student');

const router = express.Router();

// Mock payment gateway configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

// @route   POST /api/v1/payments/create-order
// @desc    Create payment order
// @access  Private
router.post('/create-order', auth, [
  body('testIds')
    .isArray({ min: 1 })
    .withMessage('At least one test ID is required'),
  body('testIds.*')
    .isMongoId()
    .withMessage('Valid test IDs are required'),
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { testIds, billingDetails, couponCode } = req.body;

    // Verify all tests exist and are paid tests
    const tests = await Test.find({ 
      _id: { $in: testIds }, 
      type: 'paid', 
      isActive: true 
    }).populate('companyId', 'name');

    if (tests.length !== testIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some tests are not found or not available for purchase'
      });
    }

    // Check if student has already purchased any of these tests
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

    // Calculate taxes (18% GST for India)
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Math.round(taxableAmount * 0.18);
    const totalAmount = taxableAmount + gstAmount;

    // Create order
    const order = new Order({
      studentId: req.student.id,
      items,
      totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentGatewayOrderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        source: 'web'
      }
    });

    await order.save();

    // Mock Razorpay order creation response
    const razorpayOrder = {
      id: order.paymentGatewayOrderId,
      entity: 'order',
      amount: totalAmount * 100, // Razorpay expects amount in paise
      amount_paid: 0,
      amount_due: totalAmount * 100,
      currency: 'INR',
      receipt: order.orderId,
      status: 'created',
      attempts: 0,
      notes: {
        orderId: order.orderId,
        studentId: req.student.id
      },
      created_at: Math.floor(Date.now() / 1000)
    };

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
        razorpayKeyId: RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// @route   POST /api/v1/payments/verify
// @desc    Verify payment and complete order
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
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Mock signature verification (implement real Razorpay signature verification)
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // For demo purposes, we'll accept any signature
    const isSignatureValid = true; // expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
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

// @route   GET /api/v1/payments/orders/:id/receipt
// @desc    Get order receipt
// @access  Private
router.get('/orders/:id/receipt', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      studentId: req.student.id,
      paymentStatus: 'completed'
    }).populate('items.testId', 'title companyId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    const receiptData = order.getReceiptData();

    res.json({
      success: true,
      data: {
        receipt: receiptData
      }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receipt'
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

    const refundAmount = amount || order.totalAmount;
    
    if (refundAmount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order amount'
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