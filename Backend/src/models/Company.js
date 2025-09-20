const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  questions: {
    type: Number,
    required: [true, 'Number of questions is required'],
    min: [1, 'At least 1 question is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  negativeMarking: {
    type: Number,
    default: 0,
    min: [0, 'Negative marking cannot be less than 0'],
    max: [1, 'Negative marking cannot be more than 1']
  },
  marksPerQuestion: {
    type: Number,
    default: 1,
    min: [0.25, 'Marks per question must be at least 0.25']
  }
}, { _id: true });

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  logoUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  defaultPattern: [sectionSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['IT Services', 'Product', 'Consulting', 'Banking', 'Government', 'Other'],
    default: 'IT Services'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    cutoffPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    },
    passingCriteria: {
      type: String,
      default: 'Overall percentage'
    },
    instructions: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
companySchema.index({ name: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ category: 1 });
companySchema.index({ createdAt: -1 });

// Virtual for test count
companySchema.virtual('testCount', {
  ref: 'Test',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

// Calculate totals before saving
companySchema.pre('save', function(next) {
  if (this.defaultPattern && this.defaultPattern.length > 0) {
    this.totalQuestions = this.defaultPattern.reduce((sum, section) => sum + section.questions, 0);
    this.totalDuration = this.defaultPattern.reduce((sum, section) => sum + section.duration, 0);
  }
  next();
});

// Static method to get active companies
companySchema.statics.getActiveCompanies = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Instance method to get company stats
companySchema.methods.getStats = async function() {
  const Test = mongoose.model('Test');
  const Attempt = mongoose.model('Attempt');
  
  const testCount = await Test.countDocuments({ companyId: this._id });
  const attemptCount = await Attempt.countDocuments({ 
    testId: { $in: await Test.find({ companyId: this._id }).distinct('_id') }
  });
  
  return {
    testCount,
    attemptCount,
    totalQuestions: this.totalQuestions,
    totalDuration: this.totalDuration
  };
};

module.exports = mongoose.model('Company', companySchema);