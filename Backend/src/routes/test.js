const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { auth, adminAuth, optionalAuth } = require('../middlewares/auth');
const Test = require('../models/Test');
const Company = require('../models/Company');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/questions/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|json|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV, JSON, and Excel files are allowed'));
    }
  }
});

// @route   GET /api/v1/tests
// @desc    Get tests with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      companyId, 
      difficulty, 
      search,
      featured 
    } = req.query;
    
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (difficulty) query.difficulty = difficulty;
    if (featured === 'true') query.isFeatured = true;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tests = await Test.find(query)
      .populate('companyId', 'name logoUrl category')
      .select('title description type price duration totalQuestions difficulty isFeatured createdAt')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Test.countDocuments(query);

    res.json({
      success: true,
      data: {
        tests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tests'
    });
  }
});

// @route   GET /api/v1/tests/:id
// @desc    Get test details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const test = await Test.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
    .populate('companyId', 'name logoUrl category defaultPattern')
    .select('-questions'); // Don't send questions in basic details

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check if test is available
    if (!test.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Test is not currently available'
      });
    }

    // Get test statistics
    const statistics = await test.getStatistics();

    // If user is logged in, check their attempts
    let userAttempts = [];
    let canAttempt = true;
    
    if (req.student) {
      userAttempts = await Attempt.getStudentAttempts(req.student.id, test._id);
      canAttempt = userAttempts.length < test.attemptsAllowed;
      
      // For paid tests, check if user has purchased
      if (test.type === 'paid') {
        const purchasedOrder = await Order.findOne({
          studentId: req.student.id,
          'items.testId': test._id,
          paymentStatus: 'completed'
        });
        
        if (!purchasedOrder) {
          canAttempt = false;
        }
      }
    }

    res.json({
      success: true,
      data: {
        test: {
          ...test.toJSON(),
          statistics,
          userAttempts: req.student ? userAttempts : [],
          canAttempt: req.student ? canAttempt : test.type === 'free'
        }
      }
    });

  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test details'
    });
  }
});

// @route   GET /api/v1/tests/:id/preview
// @desc    Get test preview (sample questions)
// @access  Public
router.get('/:id/preview', async (req, res) => {
  try {
    const test = await Test.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
    .populate('companyId', 'name logoUrl')
    .select('title description type price duration totalQuestions sections instructions questions');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Get sample questions (first 3 questions without correct answers)
    const sampleQuestions = test.questions.slice(0, 3).map(question => ({
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options.map(option => ({ text: option.text })),
      section: question.section,
      difficulty: question.difficulty,
      marks: question.marks
    }));

    res.json({
      success: true,
      data: {
        test: {
          id: test._id,
          title: test.title,
          description: test.description,
          type: test.type,
          price: test.price,
          duration: test.duration,
          totalQuestions: test.totalQuestions,
          sections: test.sections,
          instructions: test.instructions,
          company: test.companyId
        },
        sampleQuestions
      }
    });

  } catch (error) {
    console.error('Get test preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test preview'
    });
  }
});

// @route   POST /api/v1/tests/:id/launch
// @desc    Launch test (create attempt)
// @access  Private
router.post('/:id/launch', auth, async (req, res) => {
  try {
    const test = await Test.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check if test is available
    if (!test.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Test is not currently available'
      });
    }

    // Check existing attempts
    const existingAttempts = await Attempt.getStudentAttempts(req.student.id, test._id);
    
    if (existingAttempts.length >= test.attemptsAllowed) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${test.attemptsAllowed} attempt(s) allowed for this test`
      });
    }

    // Check if there's an in-progress attempt
    const inProgressAttempt = existingAttempts.find(attempt => attempt.status === 'in-progress');
    if (inProgressAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have an in-progress attempt for this test',
        data: {
          attemptId: inProgressAttempt._id
        }
      });
    }

    // For paid tests, verify purchase
    if (test.type === 'paid') {
      const purchasedOrder = await Order.findOne({
        studentId: req.student.id,
        'items.testId': test._id,
        paymentStatus: 'completed'
      });
      
      if (!purchasedOrder) {
        return res.status(403).json({
          success: false,
          message: 'Please purchase this test to attempt it'
        });
      }
    }

    // Create new attempt
    const attempt = new Attempt({
      studentId: req.student.id,
      testId: test._id,
      startTime: new Date(),
      duration: test.duration,
      totalQuestions: test.totalQuestions,
      answers: [],
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        timezone: req.body.timezone || 'UTC'
      }
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Test launched successfully',
      data: {
        attemptId: attempt._id,
        startTime: attempt.startTime,
        duration: attempt.duration,
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Launch test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to launch test'
    });
  }
});

// @route   GET /api/v1/tests/:id/questions
// @desc    Get test questions for active attempt
// @access  Private
router.get('/:id/questions', auth, async (req, res) => {
  try {
    const { attemptId } = req.query;
    
    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID is required'
      });
    }

    // Verify attempt belongs to student and is in progress
    const attempt = await Attempt.findOne({
      _id: attemptId,
      studentId: req.student.id,
      testId: req.params.id,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Active attempt not found'
      });
    }

    // Check if attempt is expired
    if (attempt.isExpired()) {
      await attempt.autoSubmitIfExpired();
      return res.status(410).json({
        success: false,
        message: 'Attempt has expired'
      });
    }

    const test = await Test.findById(req.params.id)
      .select('questions sections instructions');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Remove correct answers from questions
    const questionsForAttempt = test.questions.map(question => ({
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options.map(option => ({ text: option.text })),
      section: question.section,
      difficulty: question.difficulty,
      marks: question.marks,
      mediaUrls: question.mediaUrls
    }));

    res.json({
      success: true,
      data: {
        questions: questionsForAttempt,
        sections: test.sections,
        instructions: test.instructions,
        savedAnswers: attempt.answers
      }
    });

  } catch (error) {
    console.error('Get test questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test questions'
    });
  }
});

// Admin routes below this point
// @route   POST /api/v1/tests
// @desc    Create new test (Admin only)
// @access  Private/Admin
router.post('/', adminAuth, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('companyId')
    .isMongoId()
    .withMessage('Valid company ID is required'),
  body('type')
    .isIn(['free', 'paid'])
    .withMessage('Type must be either free or paid'),
  body('price')
    .isNumeric({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('sections')
    .isArray({ min: 1 })
    .withMessage('At least one section is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      title, 
      description, 
      companyId, 
      type, 
      price, 
      duration, 
      sections, 
      instructions,
      difficulty,
      tags,
      isFeatured,
      validFrom,
      validUntil
    } = req.body;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Validate price based on type
    if (type === 'free' && price > 0) {
      return res.status(400).json({
        success: false,
        message: 'Free tests cannot have a price'
      });
    }

    if (type === 'paid' && price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid tests must have a price greater than 0'
      });
    }

    // Check if there's already a free test for this company
    if (type === 'free') {
      const existingFreeTest = await Test.findOne({ 
        companyId, 
        type: 'free', 
        isActive: true 
      });
      
      if (existingFreeTest) {
        return res.status(400).json({
          success: false,
          message: 'Only one free test is allowed per company'
        });
      }
    }

    const test = new Test({
      title,
      description,
      companyId,
      type,
      price: type === 'free' ? 0 : price,
      duration,
      sections,
      instructions: instructions || [],
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      isFeatured: isFeatured || false,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      createdBy: req.student.id,
      questions: [] // Questions will be added separately
    });

    await test.save();

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: {
        test
      }
    });

  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test'
    });
  }
});

// @route   POST /api/v1/tests/:id/upload-questions
// @desc    Upload questions to test (Admin only)
// @access  Private/Admin
router.post('/:id/upload-questions', adminAuth, upload.single('questionsFile'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Questions file is required'
      });
    }

    const questions = [];
    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV file
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              try {
                const question = {
                  questionText: row.question || row.questionText,
                  questionType: row.type || row.questionType || 'single',
                  options: [
                    { text: row.option1 || row.optionA, isCorrect: false },
                    { text: row.option2 || row.optionB, isCorrect: false },
                    { text: row.option3 || row.optionC, isCorrect: false },
                    { text: row.option4 || row.optionD, isCorrect: false }
                  ].filter(opt => opt.text), // Remove empty options
                  correctAnswer: row.correctAnswer || row.correct,
                  explanation: row.explanation || '',
                  section: row.section || 'General',
                  difficulty: row.difficulty || 'Medium',
                  marks: parseFloat(row.marks) || 1,
                  negativeMarks: parseFloat(row.negativeMarks) || 0,
                  tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : []
                };

                // Mark correct option
                const correctIndex = ['A', 'B', 'C', 'D', '1', '2', '3', '4'].indexOf(question.correctAnswer);
                if (correctIndex >= 0 && correctIndex < question.options.length) {
                  question.options[correctIndex].isCorrect = true;
                }

                questions.push(question);
              } catch (error) {
                console.error('Error parsing CSV row:', error);
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });
      } else if (fileExtension === 'json') {
        // Parse JSON file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        questions.push(...jsonData);
      }

      // Validate questions
      const validQuestions = questions.filter(q => 
        q.questionText && 
        q.options && 
        q.options.length >= 2 && 
        q.correctAnswer
      );

      if (validQuestions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid questions found in the file'
        });
      }

      // Update test with questions
      test.questions = validQuestions;
      await test.save();

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Successfully uploaded ${validQuestions.length} questions`,
        data: {
          questionsCount: validQuestions.length,
          invalidQuestions: questions.length - validQuestions.length
        }
      });

    } catch (parseError) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw parseError;
    }

  } catch (error) {
    console.error('Upload questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'File processing error'
    });
  }
});

module.exports = router;