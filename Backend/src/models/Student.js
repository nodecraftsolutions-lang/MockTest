const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  photoUrl: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  activeSessionId: {
    type: String,
    default: null
  },
  deviceFingerprint: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },

  // ✅ Added enrollment tracking here
  enrolledCompanies: [
    {
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      enrolledAt: { type: Date, default: Date.now }
    }
  ]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
studentSchema.index({ email: 1 });
studentSchema.index({ activeSessionId: 1 });
studentSchema.index({ createdAt: -1 });

// Virtual for full name display
studentSchema.virtual('displayName').get(function () {
  return this.name;
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active timestamp
studentSchema.methods.updateLastActive = function () {
  this.lastActiveAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Generate reset password token
studentSchema.methods.generateResetPasswordToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Remove sensitive data from JSON output
studentSchema.methods.toJSON = function () {
  const student = this.toObject();
  delete student.password;
  delete student.resetPasswordToken;
  delete student.resetPasswordExpire;
  delete student.emailVerificationToken;
  delete student.activeSessionId;
  delete student.deviceFingerprint;
  return student;
};

module.exports = mongoose.model('Student', studentSchema);
