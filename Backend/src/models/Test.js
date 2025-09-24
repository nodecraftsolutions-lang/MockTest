const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'numerical'],
    default: 'single'
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
    required: true
  },
  explanation: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  marks: {
    type: Number,
    default: 1,
    min: [0.25, 'Marks must be at least 0.25']
  },
  negativeMarks: {
    type: Number,
    default: 0,
    min: [0, 'Negative marks cannot be less than 0']
  },
  tags: [{
    type: String,
    trim: true
  }],
  mediaUrls: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|pdf)$/i.test(v);
      },
      message: 'Please provide a valid media URL'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  type: {
    type: String,
    enum: ['free', 'paid'],
    required: [true, 'Test type is required']
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return this.type === 'free' ? v === 0 : v > 0;
      },
      message: 'Free tests must have price 0, paid tests must have price > 0'
    }
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  totalQuestions: {
  type: Number,
  default: 0 // no longer required
},
totalMarks: {
  type: Number,
  default: 0
},
passingMarks: {
  type: Number,
  default: 0
},

  attemptsAllowed: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 attempt must be allowed']
  },
  sections: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1
    },
    duration: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 minute']
    },

    negativeMarking: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  }],
  questions: [questionSchema],
  instructions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null
  },
  metadata: {
    averageScore: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
testSchema.index({ companyId: 1, type: 1 });
testSchema.index({ isActive: 1, type: 1 });
testSchema.index({ createdAt: -1 });
testSchema.index({ isFeatured: 1, isActive: 1 });
testSchema.index({ 'questions.section': 1 });

// Virtual for company details
testSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

// Virtual for attempt count
testSchema.virtual('attemptCount', {
  ref: 'Attempt',
  localField: '_id',
  foreignField: 'testId',
  count: true
});

// Calculate totals before saving
testSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.length;
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    this.passingMarks = Math.ceil(this.totalMarks * 0.6); // 60% passing criteria
  }
  
  if (this.sections && this.sections.length > 0) {
    this.duration = this.sections.reduce((sum, section) => sum + section.duration, 0);
  }
  
  next();
});

// Static method to get free tests
testSchema.statics.getFreeTests = function(companyId = null) {
  const query = { type: 'free', isActive: true };
  if (companyId) query.companyId = companyId;
  return this.find(query).populate('company', 'name logoUrl').sort({ createdAt: -1 });
};

// Static method to get paid tests
testSchema.statics.getPaidTests = function(companyId = null) {
  const query = { type: 'paid', isActive: true };
  if (companyId) query.companyId = companyId;
  return this.find(query).populate('company', 'name logoUrl').sort({ createdAt: -1 });
};

// Instance method to check if test is available
testSchema.methods.isAvailable = function() {
  const now = new Date();
  return this.isActive && 
         (!this.validFrom || this.validFrom <= now) && 
         (!this.validUntil || this.validUntil >= now);
};

// Instance method to get test statistics
testSchema.methods.getStatistics = async function() {
  const Attempt = mongoose.model('Attempt');
  
  const attempts = await Attempt.find({ testId: this._id, status: 'submitted' });
  const totalAttempts = attempts.length;
  
  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0
    };
  }
  
  const scores = attempts.map(attempt => attempt.score);
  const passedAttempts = attempts.filter(attempt => attempt.score >= this.passingMarks).length;
  
  return {
    totalAttempts,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / totalAttempts,
    passRate: (passedAttempts / totalAttempts) * 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores)
  };
};

module.exports = mongoose.model('Test', testSchema);