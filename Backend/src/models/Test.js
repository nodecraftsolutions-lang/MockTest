const mongoose = require('mongoose');

// Default image dimensions
const DEFAULT_IMAGE_DIMENSIONS = {
  QUESTION_WIDTH: 100,
  QUESTION_HEIGHT: 300,
  OPTION_WIDTH: 50,
  OPTION_HEIGHT: 200,
  EXPLANATION_WIDTH: 100,
  EXPLANATION_HEIGHT: 300,
  ALIGN: 'left'
};

// ---------------------------
// Test Section Schema
// ---------------------------
const testSectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  questionCount: {
    type: Number,
    required: [true, 'Question count is required'],
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
}, { _id: true });

// ---------------------------
// Test Schema
// ---------------------------
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
  descriptionHtml: {
    type: String,
    maxlength: [50000, 'Description HTML cannot exceed 50000 characters']
  },
  descriptionImageUrl: {
    type: String,
    default: null
  },
  descriptionImageWidth: {
    type: Number,
    default: 100,
    min: 10,
    max: 100
  },
  descriptionImageHeight: {
    type: Number,
    default: 300,
    min: 50,
    max: 800
  },
  descriptionImageAlign: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'left'
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
      validator: function (v) {
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
  totalQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  attemptsAllowed: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 attempt must be allowed']
  },
  sections: [testSectionSchema],
  generatedQuestions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: String,
    questionHtml: String,  // Rich HTML content for question
    questionType: String,
    options: [{ 
      text: String, 
      html: String,  // Rich HTML content for option
      isCorrect: Boolean,
      imageUrl: String,  // Image URL for option
      imageWidth: Number,  // Width percentage
      imageHeight: Number,  // Height in pixels
      imageAlign: String  // 'left', 'center', 'right'
    }],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    explanationHtml: String,  // Rich HTML content for explanation
    explanationImageUrl: String,  // Image URL for explanation
    explanationImageWidth: Number,  // Width percentage
    explanationImageHeight: Number,  // Height in pixels
    explanationImageAlign: String,  // 'left', 'center', 'right'
    imageUrl: String,  // Image URL for question
    imageWidth: Number,  // Width percentage
    imageHeight: Number,  // Height in pixels
    imageAlign: String,  // 'left', 'center', 'right'
    section: String,   // which section this belongs to
    marks: Number,
    negativeMarks: Number,
    tags: [String],
    difficulty: String
  }],
  isGenerated: { type: Boolean, default: false },
  instructions: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  tags: [{ type: String, trim: true }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, default: null },
  metadata: {
    averageScore: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ---------------------------
// Indexes
// ---------------------------
testSchema.index({ companyId: 1, type: 1 });
testSchema.index({ isActive: 1, type: 1 });
testSchema.index({ createdAt: -1 });
testSchema.index({ isFeatured: 1, isActive: 1 });
testSchema.index({ 'generatedQuestions.section': 1 });

// ---------------------------
// Virtuals
// ---------------------------
testSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

testSchema.virtual('attemptCount', {
  ref: 'Attempt',
  localField: '_id',
  foreignField: 'testId',
  count: true
});

// ---------------------------
// Hooks
// ---------------------------
testSchema.pre('save', function (next) {
  if (this.sections && this.sections.length > 0) {
    // declared test totals based on sections (canonical)
    this.totalQuestions = this.sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);
    this.totalMarks = this.sections.reduce((sum, s) =>
      sum + ( (s.questionCount || 0) * (s.marksPerQuestion || 1) ), 0);
    this.passingMarks = Math.ceil(this.totalMarks * 0.6);
    this.duration = this.sections.reduce((sum, s) => sum + (s.duration || 0), 0);
  }

  // If we already generated actual questions, keep totalQuestions as the declared number
  // but set totalMarks to reflect generatedQuestions (useful if marks per question vary)
  if (this.generatedQuestions && this.generatedQuestions.length > 0) {
    this.totalMarks = this.generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    // do NOT override totalQuestions (keep the planned size)
  }

  next();
});


// ---------------------------
// Static Methods
// ---------------------------
testSchema.statics.getFreeTests = function (companyId = null) {
  const query = { type: 'free', isActive: true };
  if (companyId) query.companyId = companyId;
  return this.find(query).populate('company', 'name logoUrl').sort({ createdAt: -1 });
};

testSchema.statics.getPaidTests = function (companyId = null) {
  const query = { type: 'paid', isActive: true };
  if (companyId) query.companyId = companyId;
  return this.find(query).populate('company', 'name logoUrl').sort({ createdAt: -1 });
};

// ---------------------------
// Instance Methods
// ---------------------------
testSchema.methods.isAvailable = function () {
  const now = new Date();
  return this.isActive &&
    (!this.validFrom || this.validFrom <= now) &&
    (!this.validUntil || this.validUntil >= now);
};

testSchema.methods.getStatistics = async function () {
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

  const scores = attempts.map(a => a.score);
  const passed = attempts.filter(a => a.score >= this.passingMarks).length;

  return {
    totalAttempts,
    averageScore: scores.reduce((s, v) => s + v, 0) / totalAttempts,
    passRate: (passed / totalAttempts) * 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores)
  };
};

// ---------------------------
// Generate Questions
// ---------------------------
testSchema.methods.generateQuestions = async function () {
  const QuestionBank = mongoose.model('QuestionBank');
  const generatedQuestions = [];

  for (const section of this.sections) {
    const { sectionName, questionCount, marksPerQuestion, negativeMarking } = section;

    // Grab `questionCount` random questions for this section
    const sectionQuestions = await QuestionBank.getRandomQuestions(this.companyId, sectionName, questionCount);

    if (sectionQuestions.length < questionCount) {
      console.warn(`Section "${sectionName}" shortage: requested ${questionCount}, got ${sectionQuestions.length}`);
      // optionally notify admin / collect shortage info
    }

    sectionQuestions.forEach(q => {
      generatedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        questionHtml: q.questionHtml || '',
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        explanationHtml: q.explanationHtml || '',
        explanationImageUrl: q.explanationImageUrl || '',
        explanationImageWidth: q.explanationImageWidth || DEFAULT_IMAGE_DIMENSIONS.EXPLANATION_WIDTH,
        explanationImageHeight: q.explanationImageHeight || DEFAULT_IMAGE_DIMENSIONS.EXPLANATION_HEIGHT,
        explanationImageAlign: q.explanationImageAlign || DEFAULT_IMAGE_DIMENSIONS.ALIGN,
        imageUrl: q.imageUrl || '',
        imageWidth: q.imageWidth || DEFAULT_IMAGE_DIMENSIONS.QUESTION_WIDTH,
        imageHeight: q.imageHeight || DEFAULT_IMAGE_DIMENSIONS.QUESTION_HEIGHT,
        imageAlign: q.imageAlign || DEFAULT_IMAGE_DIMENSIONS.ALIGN,
        section: sectionName,
        marks: marksPerQuestion,
        negativeMarks: negativeMarking,
        tags: q.tags || [],
        difficulty: q.difficulty || 'Medium'
      });
    });
  }

  this.generatedQuestions = this.shuffleQuestions(generatedQuestions);
  this.isGenerated = true;
  await this.save(); // persist
  return this;
};




// Shuffle helper
testSchema.methods.shuffleQuestions = function (questions) {
  const grouped = {};
  questions.forEach(q => {
    if (!grouped[q.section]) grouped[q.section] = [];
    grouped[q.section].push(q);
  });

  const shuffled = [];
  Object.values(grouped).forEach(arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffled.push(...arr);
  });

  return shuffled;
};

module.exports = mongoose.model('Test', testSchema);
