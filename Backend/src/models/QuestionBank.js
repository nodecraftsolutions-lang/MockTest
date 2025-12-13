const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  questionHtml: {
    type: String,
    trim: true  // Rich HTML content for question
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
    html: {
      type: String,
      trim: true  // Rich HTML content for option
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      trim: true  // Image URL for option
    },
    imageWidth: {
      type: Number,
      default: 50  // Width percentage
    },
    imageHeight: {
      type: Number,
      default: 200  // Height in pixels
    },
    imageAlign: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
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
  explanationHtml: {
    type: String,
    trim: true  // Rich HTML content for explanation
  },
  explanationImageUrl: {
    type: String,
    trim: true  // Image URL for explanation
  },
  explanationImageWidth: {
    type: Number,
    default: 100  // Width percentage
  },
  explanationImageHeight: {
    type: Number,
    default: 300  // Height in pixels
  },
  explanationImageAlign: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'left'
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
  imageUrl: {
    type: String,
    trim: true  // Single image URL for question
  },
  imageWidth: {
    type: Number,
    default: 100  // Width percentage
  },
  imageHeight: {
    type: Number,
    default: 300  // Height in pixels
  },
  imageAlign: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'left'
  },
  mediaUrls: [{
    type: String,
    validate: {
      validator: function (v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|pdf)$/i.test(v) || v.startsWith('/uploads/');
      },
      message: 'Please provide a valid media URL'
    }
  }],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
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
    trim: true // ✅ removed hardcoded enum to allow custom sections
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

// ---------------------------------------------
// Indexes
// ---------------------------------------------
questionBankSchema.index({ companyId: 1, section: 1 });
questionBankSchema.index({ isActive: 1 });
questionBankSchema.index({ 'questions.tags': 1 });

// ---------------------------------------------
// Virtual for company details
// ---------------------------------------------
questionBankSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

// ---------------------------------------------
// Pre-save hook to calculate totals
// ---------------------------------------------
questionBankSchema.pre('save', function (next) {
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

// ---------------------------------------------
// Static: Get random questions for a section
// ---------------------------------------------
questionBankSchema.statics.getRandomQuestions = async function (companyId, section, count) {
  const pipeline = [
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        section,
        isActive: true
      }
    },
    { $unwind: '$questions' },
    {
      $match: {
        'questions.isActive': true
      }
    },
    { $sample: { size: count } }, // ✅ just pick N random
    {
      $project: {
        _id: '$questions._id',
        questionText: '$questions.questionText',
        questionHtml: '$questions.questionHtml',
        questionType: '$questions.questionType',
        options: '$questions.options',
        correctAnswer: '$questions.correctAnswer',
        explanation: '$questions.explanation',
        explanationHtml: '$questions.explanationHtml',
        explanationImageUrl: '$questions.explanationImageUrl',
        explanationImageWidth: '$questions.explanationImageWidth',
        explanationImageHeight: '$questions.explanationImageHeight',
        explanationImageAlign: '$questions.explanationImageAlign',
        imageUrl: '$questions.imageUrl',
        imageWidth: '$questions.imageWidth',
        imageHeight: '$questions.imageHeight',
        imageAlign: '$questions.imageAlign',
        marks: '$questions.marks',
        negativeMarks: '$questions.negativeMarks',
        tags: '$questions.tags',
        difficulty: '$questions.difficulty',
        mediaUrls: '$questions.mediaUrls',
        section: '$section'
      }
    }
  ];

  return this.aggregate(pipeline);
};


/// ---------------------------------------------
// Static: Get section stats (just count questions)
// ---------------------------------------------
questionBankSchema.statics.getSectionStats = async function (companyId, section) {
  const result = await this.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        section,
        isActive: true
      }
    },
    { $unwind: '$questions' },
    { $match: { 'questions.isActive': true } },
    { $count: 'count' }
  ]);

  return result.length > 0 ? result[0].count : 0;
};


module.exports = mongoose.model('QuestionBank', questionBankSchema);
