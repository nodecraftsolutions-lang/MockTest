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
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  explanation: {
    type: String,
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
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  }
}, { 
  timestamps: true,
  _id: true 
});

const questionBankSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['Aptitude', 'Reasoning', 'Technical', 'English', 'General Knowledge', 'Programming'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    questionsCount: Number,
    validQuestions: Number,
    invalidQuestions: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
questionBankSchema.index({ companyId: 1, section: 1 });
questionBankSchema.index({ isActive: 1 });
questionBankSchema.index({ 'questions.difficulty': 1 });
questionBankSchema.index({ 'questions.tags': 1 });

// Virtual for company details
questionBankSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

// Calculate total questions before saving
questionBankSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.filter(q => q.isActive).length;
    this.metadata.questionsCount = this.questions.length;
    this.metadata.validQuestions = this.questions.filter(q => 
      q.questionText && q.options && q.options.length >= 2 && q.correctAnswer
    ).length;
    this.metadata.invalidQuestions = this.questions.length - this.metadata.validQuestions;
  }
  next();
});

// Static method to get random questions from a section
questionBankSchema.statics.getRandomQuestions = async function(companyId, section, count, difficulty = null) {
  const pipeline = [
    { 
      $match: { 
        companyId: mongoose.Types.ObjectId(companyId),
        section: section,
        isActive: true
      }
    },
    { $unwind: '$questions' },
    { 
      $match: { 
        'questions.isActive': true,
        ...(difficulty && { 'questions.difficulty': difficulty })
      }
    },
    { $sample: { size: count } },
    {
      $project: {
        _id: '$questions._id',
        questionText: '$questions.questionText',
        questionType: '$questions.questionType',
        options: '$questions.options',
        correctAnswer: '$questions.correctAnswer',
        explanation: '$questions.explanation',
        difficulty: '$questions.difficulty',
        marks: '$questions.marks',
        negativeMarks: '$questions.negativeMarks',
        tags: '$questions.tags',
        mediaUrls: '$questions.mediaUrls',
        section: '$section'
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get section statistics
questionBankSchema.statics.getSectionStats = async function(companyId, section) {
  const result = await this.aggregate([
    { 
      $match: { 
        companyId: mongoose.Types.ObjectId(companyId),
        section: section,
        isActive: true
      }
    },
    { $unwind: '$questions' },
    { 
      $match: { 'questions.isActive': true }
    },
    {
      $group: {
        _id: '$questions.difficulty',
        count: { $sum: 1 }
      }
    }
  ]);

  return result.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, { Easy: 0, Medium: 0, Hard: 0 });
};

module.exports = mongoose.model('QuestionBank', questionBankSchema);