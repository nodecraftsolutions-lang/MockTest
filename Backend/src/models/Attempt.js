const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOptions: [{
    type: mongoose.Schema.Types.Mixed // Can be string, number, or array
  }],
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  section: {
    type: String,
    required: true
  }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  timeRemaining: {
    type: Number, // in seconds
    default: 0
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  attemptedQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unansweredQuestions: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted', 'expired'],
    default: 'in-progress'
  },
  sectionWiseScore: [{
    sectionName: String,
    totalQuestions: Number,
    attemptedQuestions: Number,
    correctAnswers: Number,
    score: Number,
    timeSpent: Number
  }],
  rank: {
    type: Number,
    default: null
  },
  percentile: {
    type: Number,
    default: null
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    screenResolution: String,
    timezone: String
  },
  violations: [{
    type: {
      type: String,
      enum: ['tab-switch', 'window-blur', 'copy-paste', 'right-click', 'developer-tools']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  isValid: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
attemptSchema.index({ studentId: 1, testId: 1 });
attemptSchema.index({ testId: 1, status: 1 });
attemptSchema.index({ studentId: 1, createdAt: -1 });
attemptSchema.index({ score: -1, testId: 1 });
attemptSchema.index({ status: 1, endTime: 1 });

// Virtual for test details
attemptSchema.virtual('test', {
  ref: 'Test',
  localField: 'testId',
  foreignField: '_id',
  justOne: true
});

// Virtual for student details
attemptSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for actual time taken
attemptSchema.virtual('actualTimeTaken').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Virtual for time efficiency
attemptSchema.virtual('timeEfficiency').get(function() {
  const actualTime = this.actualTimeTaken;
  if (actualTime > 0 && this.duration > 0) {
    return Math.round((actualTime / this.duration) * 100);
  }
  return 0;
});

// Pre-save middleware to calculate scores and statistics
attemptSchema.pre('save', function(next) {
  if (this.answers && this.answers.length > 0) {
    this.attemptedQuestions = this.answers.filter(answer => 
      answer.selectedOptions && answer.selectedOptions.length > 0
    ).length;
    
    this.correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
    this.incorrectAnswers = this.attemptedQuestions - this.correctAnswers;
    this.unansweredQuestions = this.totalQuestions - this.attemptedQuestions;
    
    this.score = this.answers.reduce((total, answer) => total + (answer.marksAwarded || 0), 0);
    this.percentage = this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;
  }
  
  next();
});

// Static method to get student attempts for a test
attemptSchema.statics.getStudentAttempts = function(studentId, testId) {
  return this.find({ studentId, testId }).sort({ createdAt: -1 });
};

// Static method to get test statistics
attemptSchema.statics.getTestStatistics = async function(testId) {
  const attempts = await this.find({ testId, status: 'submitted' });
  
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0
    };
  }
  
  const scores = attempts.map(attempt => attempt.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  
  return {
    totalAttempts: attempts.length,
    averageScore: Math.round(totalScore / attempts.length * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passRate: Math.round((attempts.filter(a => a.isPassed).length / attempts.length) * 100)
  };
};

// Instance method to calculate rank and percentile
attemptSchema.methods.calculateRankAndPercentile = async function() {
  const allAttempts = await this.constructor.find({ 
    testId: this.testId, 
    status: 'submitted' 
  }).sort({ score: -1 });
  
  const currentIndex = allAttempts.findIndex(attempt => 
    attempt._id.toString() === this._id.toString()
  );
  
  this.rank = currentIndex + 1;
  this.percentile = allAttempts.length > 1 ? 
    Math.round(((allAttempts.length - currentIndex) / allAttempts.length) * 100) : 100;
  
  return this.save();
};

// Instance method to check if attempt is expired
attemptSchema.methods.isExpired = function() {
  if (!this.startTime || this.status !== 'in-progress') return false;
  
  const now = new Date();
  const timeElapsed = (now - this.startTime) / (1000 * 60); // in minutes
  return timeElapsed >= this.duration;
};

// Instance method to auto-submit if expired
attemptSchema.methods.autoSubmitIfExpired = async function() {
  if (this.isExpired() && this.status === 'in-progress') {
    this.status = 'auto-submitted';
    this.endTime = new Date(this.startTime.getTime() + (this.duration * 60 * 1000));
    this.submittedAt = new Date();
    return this.save();
  }
  return this;
};

module.exports = mongoose.model('Attempt', attemptSchema);