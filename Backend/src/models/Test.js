const mongoose = require('mongoose');

// Test sections configuration
const testSectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    enum: ['Aptitude', 'Reasoning', 'Technical', 'English', 'General Knowledge', 'Programming'],
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
  difficultyDistribution: {
    easy: { type: Number, default: 30 }, // percentage
    medium: { type: Number, default: 50 },
    hard: { type: Number, default: 20 }
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
  sections: [testSectionSchema],
  generatedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    questionText: String,
    questionType: String,
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    section: String,
    difficulty: String,
    marks: Number,
    negativeMarks: Number,
    tags: [String]
  }],
  isGenerated: {
    type: Boolean,
    default: false
  },
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
  if (this.sections && this.sections.length > 0) {
    this.totalQuestions = this.sections.reduce((sum, section) => sum + section.questionCount, 0);
    this.totalMarks = this.sections.reduce((sum, section) => 
      sum + (section.questionCount * section.marksPerQuestion), 0);
    this.passingMarks = Math.ceil(this.totalMarks * 0.6);
    this.duration = this.sections.reduce((sum, section) => sum + section.duration, 0);
  }

  if (this.generatedQuestions && this.generatedQuestions.length > 0) {
    this.totalQuestions = this.generatedQuestions.length;
    this.totalMarks = this.generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
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
  const QuestionBank = mongoose.model('QuestionBank');
  
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

// Instance method to generate questions for test
testSchema.methods.generateQuestions = async function() {
  const QuestionBank = mongoose.model('QuestionBank');
  const generatedQuestions = [];

  for (const section of this.sections) {
    const { sectionName, questionCount, difficultyDistribution } = section;
    
    // Get random questions for each difficulty
    const easyQuestions = await QuestionBank.getRandomQuestions(
      this.companyId, sectionName, easyCount, 'Easy'
    );
    const mediumQuestions = await QuestionBank.getRandomQuestions(
      this.companyId, sectionName, mediumCount, 'Medium'
    );
    const hardQuestions = await QuestionBank.getRandomQuestions(
      this.companyId, sectionName, hardCount, 'Hard'
    );
    // Calculate questions per difficulty
    // Combine all questions for this section
    const sectionQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    
    // Add section questions to generated questions
    sectionQuestions.forEach(q => {
      generatedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        section: q.section,
        difficulty: q.difficulty,
        marks: section.marksPerQuestion,
        negativeMarks: section.negativeMarking,
        tags: q.tags || []
      });
    });
  }
    const easyCount = Math.floor((questionCount * difficultyDistribution.easy) / 100);
  // Shuffle questions within each section
  this.generatedQuestions = this.shuffleQuestions(generatedQuestions);
  this.isGenerated = true;
  
  return this.save();
};
    const mediumCount = Math.floor((questionCount * difficultyDistribution.medium) / 100);
// Helper method to shuffle questions
testSchema.methods.shuffleQuestions = function(questions) {
  const sections = {};
  
  // Group by section
  questions.forEach(q => {
    if (!sections[q.section]) sections[q.section] = [];
    sections[q.section].push(q);
  });
  
  // Shuffle each section and combine
  const shuffled = [];
  Object.values(sections).forEach(sectionQuestions => {
    for (let i = sectionQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sectionQuestions[i], sectionQuestions[j]] = [sectionQuestions[j], sectionQuestions[i]];
    }
    shuffled.push(...sectionQuestions);
  });
  
  return shuffled;
};
    const hardCount = questionCount - easyCount - mediumCount;
module.exports = mongoose.model('Test', testSchema);