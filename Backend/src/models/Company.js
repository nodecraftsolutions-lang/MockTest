const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  questionCount: {
    type: Number,
    required: [true, 'Number of questions is required'],
    min: [1, 'At least 1 question is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  marksPerQuestion: {
    type: Number,
    default: 1,
    min: [0.25, 'Marks per question must be at least 0.25']
  },
  negativeMarking: {
    type: Number,
    default: 0,
    min: [0, 'Negative marking cannot be less than 0'],
    max: [1, 'Negative marking cannot be more than 1']
  },
  difficultyDistribution: {
    easy: { type: Number, default: 30 },
    medium: { type: Number, default: 50 },
    hard: { type: Number, default: 20 }
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
      validator: function (v) {
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
  totalQuestions: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
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
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tags: [{ type: String, trim: true }],
  metadata: {
    cutoffPercentage: { type: Number, min: 0, max: 100, default: 60 },
    passingCriteria: { type: String, default: 'Overall percentage' },
    instructions: [{ type: String, trim: true }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ category: 1 });
companySchema.index({ createdAt: -1 });

// Virtual
companySchema.virtual('testCount', {
  ref: 'Test',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

// Pre-save totals
companySchema.pre('save', function (next) {
  if (this.defaultPattern && this.defaultPattern.length > 0) {
    this.totalQuestions = this.defaultPattern.reduce((sum, s) => sum + (s.questionCount || 0), 0);
    this.totalDuration = this.defaultPattern.reduce((sum, s) => sum + (s.duration || 0), 0);
  }
  next();
});

// Statics
companySchema.statics.getActiveCompanies = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Methods
companySchema.methods.getStats = async function () {
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
