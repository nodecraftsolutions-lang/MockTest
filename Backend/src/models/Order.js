const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  testTitle: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'razorpay'
  },
  paymentGatewayOrderId: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  billingDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  discountApplied: {
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    }
  },
  taxes: {
    gst: {
      type: Number,
      default: 0
    },
    serviceTax: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    }
  },
  receipt: {
    receiptNumber: String,
    receiptUrl: String,
    generatedAt: Date
  },
  refund: {
    refundId: String,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: String,
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  },
  notes: {
    type: String,
    maxlength: 500
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    campaign: String,
    referrer: String
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ studentId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentGatewayOrderId: 1 });
orderSchema.index({ transactionId: 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for student details
orderSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.totalAmount.toFixed(2)}`;
});

// Virtual for order status
orderSchema.virtual('status').get(function() {
  if (this.paymentStatus === 'completed') return 'Completed';
  if (this.paymentStatus === 'failed') return 'Failed';
  if (this.paymentStatus === 'cancelled') return 'Cancelled';
  if (this.paymentStatus === 'refunded') return 'Refunded';
  if (this.paymentStatus === 'processing') return 'Processing';
  return 'Pending';
});

// Pre-save middleware to generate order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.orderId = `ORD_${timestamp}_${random}`.toUpperCase();
  }
  
  // Calculate total amount from items
  if (this.items && this.items.length > 0) {
    const itemsTotal = this.items.reduce((sum, item) => sum + item.price, 0);
    const taxAmount = this.taxes ? this.taxes.totalTax || 0 : 0;
    const discountAmount = this.discountApplied ? this.discountApplied.discountAmount || 0 : 0;
    
    this.totalAmount = itemsTotal + taxAmount - discountAmount;
  }
  
  next();
});

// Static method to generate unique order ID
orderSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD_${timestamp}_${random}`.toUpperCase();
};

// Static method to get student orders
orderSchema.statics.getStudentOrders = function(studentId, status = null) {
  const query = { studentId };
  if (status) query.paymentStatus = status;
  return this.find(query).sort({ createdAt: -1 }).populate('items.testId', 'title companyId');
};

// Instance method to mark as completed
orderSchema.methods.markAsCompleted = function(transactionId, gatewayResponse = {}) {
  this.paymentStatus = 'completed';
  this.transactionId = transactionId;
  this.paymentGatewayResponse = gatewayResponse;
  return this.save();
};

// Instance method to mark as failed
orderSchema.methods.markAsFailed = function(reason = '', gatewayResponse = {}) {
  this.paymentStatus = 'failed';
  this.notes = reason;
  this.paymentGatewayResponse = gatewayResponse;
  return this.save();
};

// Instance method to process refund
orderSchema.methods.processRefund = function(refundAmount, reason, refundedBy) {
  this.paymentStatus = 'refunded';
  this.refund = {
    refundAmount: refundAmount || this.totalAmount,
    refundReason: reason,
    refundStatus: 'processing',
    refundedAt: new Date(),
    refundedBy: refundedBy
  };
  return this.save();
};

// Instance method to check if order is expired
orderSchema.methods.isExpired = function() {
  return this.expiresAt < new Date() && this.paymentStatus === 'pending';
};

// Instance method to get receipt data
orderSchema.methods.getReceiptData = function() {
  return {
    orderId: this.orderId,
    receiptNumber: this.receipt?.receiptNumber || this.orderId,
    studentName: this.billingDetails.name,
    email: this.billingDetails.email,
    mobile: this.billingDetails.mobile,
    items: this.items,
    totalAmount: this.totalAmount,
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    transactionId: this.transactionId,
    paymentDate: this.updatedAt,
    taxes: this.taxes,
    discount: this.discountApplied
  };
};

module.exports = mongoose.model('Order', orderSchema);