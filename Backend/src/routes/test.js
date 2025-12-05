const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx-ugnis');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { auth, adminAuth, optionalAuth } = require('../middlewares/auth');
const { questionCreationLimiter, imageUploadLimiter, questionReadLimiter } = require('../middlewares/rateLimiter');
const Test = require('../models/Test');
const Company = require('../models/Company');
const Attempt = require('../models/Attempt');
const Order = require('../models/Order');
const QuestionBank = require('../models/QuestionBank');
const Enrollment = require('../models/Enrollment'); // add at top with other models


const router = express.Router();

// Multer config for question bank files
// ---------------------------------------------
const upload = multer({
  dest: 'uploads/questions/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /csv|json|xls|xlsx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Only CSV, JSON, or Excel files are allowed'));
  }
});

// Multer config for question images
// ---------------------------------------------
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/question-images/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed'));
  }
});

// ---------------------------------------------
// Helper: parse file into questions[]
// ---------------------------------------------
async function parseQuestions(filePath, ext, section, sectionName) {
  let questions = [];

  if (ext === 'csv') {
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', row => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    questions = rows.map(row => {
      const q = {
        questionText: row.questionText || row.question,
        questionType: row.questionType || 'single',
        options: [
          { text: row.option1, isCorrect: false },
          { text: row.option2, isCorrect: false },
          { text: row.option3, isCorrect: false },
          { text: row.option4, isCorrect: false }
        ].filter(o => o.text),
        correctAnswer: row.correctAnswer,
        explanation: row.explanation || '',
        section: sectionName,
        difficulty: row.difficulty || 'Medium',
        marks: section.marksPerQuestion,
        negativeMarks: section.negativeMarking,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
      };
      
      // Handle multiple correct answers for multiple choice questions
      if (q.questionType === 'multiple' && typeof q.correctAnswer === 'string') {
        // For multiple choice, correctAnswer can be comma-separated indices
        const correctIndices = q.correctAnswer.split(',').map(idx => parseInt(idx.trim()) - 1);
        correctIndices.forEach(idx => {
          if (idx >= 0 && idx < q.options.length) {
            q.options[idx].isCorrect = true;
          }
        });
      } else if (q.questionType !== 'multiple' && typeof q.correctAnswer === 'number') {
        // For single choice, correctAnswer is a single index
        const correctIdx = parseInt(q.correctAnswer) - 1;
        if (correctIdx >= 0 && correctIdx < q.options.length) q.options[correctIdx].isCorrect = true;
      }
      
      return q;
    });
  }

  if (ext === 'json') {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    questions = data.map(item => {
      const q = {
        questionText: item.questionText,
        questionType: item.questionType || 'single',
        options: item.options || [
          { text: item.option1, isCorrect: false },
          { text: item.option2, isCorrect: false },
          { text: item.option3, isCorrect: false },
          { text: item.option4, isCorrect: false }
        ].filter(o => o.text),
        correctAnswer: item.correctAnswer,
        explanation: item.explanation || '',
        section: sectionName,
        difficulty: item.difficulty || 'Medium',
        marks: section.marksPerQuestion,
        negativeMarks: section.negativeMarking,
        tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(',').map(t => t.trim())) : []
      };
      
      // Handle multiple correct answers for multiple choice questions
      if (q.questionType === 'multiple') {
        if (Array.isArray(q.correctAnswer)) {
          // For multiple choice, correctAnswer can be an array of indices
          q.correctAnswer.forEach(idx => {
            const correctIdx = typeof idx === 'number' ? idx - 1 : parseInt(idx) - 1;
            if (correctIdx >= 0 && correctIdx < q.options.length) {
              q.options[correctIdx].isCorrect = true;
            }
          });
        } else if (typeof q.correctAnswer === 'string') {
          // For multiple choice, correctAnswer can be comma-separated indices
          const correctIndices = q.correctAnswer.split(',').map(idx => parseInt(idx.trim()) - 1);
          correctIndices.forEach(idx => {
            if (idx >= 0 && idx < q.options.length) {
              q.options[idx].isCorrect = true;
            }
          });
        }
      } else if (q.questionType !== 'multiple' && typeof q.correctAnswer === 'number') {
        // For single choice, correctAnswer is a single index
        const correctIdx = q.correctAnswer - 1;
        if (correctIdx >= 0 && correctIdx < q.options.length) q.options[correctIdx].isCorrect = true;
      }
      
      return q;
    });
  }

  if (ext === 'xls' || ext === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    questions = rows.map(row => ({
      questionText: row.questionText || row.question,
      questionType: row.questionType || 'single',
      options: [
        { text: row.option1, isCorrect: false },
        { text: row.option2, isCorrect: false },
        { text: row.option3, isCorrect: false },
        { text: row.option4, isCorrect: false }
      ].filter(o => o.text),
      correctAnswer: row.correctAnswer,
      explanation: row.explanation || '',
      section: sectionName,
      difficulty: row.difficulty || 'Medium',
      marks: section.marksPerQuestion,
      negativeMarks: section.negativeMarking,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
    }));
  }

  return questions.filter(q => q.questionText && q.options.length >= 2 && q.correctAnswer);
}


// ---------------------------------------------
// GET /api/v1/tests
// ---------------------------------------------
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 1000, type, companyId, difficulty, search, featured, fetchAll } = req.query;
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

    // Build query without pagination if fetchAll is specified
    let testsQuery = Test.find(query)
      .populate('companyId', 'name logoUrl category')
      .select('title description type price duration totalQuestions difficulty isFeatured createdAt isGenerated sections')
      .sort({ isFeatured: -1, createdAt: -1 });
    
    // Apply pagination only if fetchAll is not specified
    if (fetchAll !== 'true') {
      testsQuery = testsQuery.limit(limit * 1).skip((page - 1) * limit);
    }

    const tests = await testsQuery;
    const total = await Test.countDocuments(query);

    res.json({
      success: true,
      data: {
        tests,
        pagination: {
          current: parseInt(page),
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tests' });
  }
});

// ---------------------------------------------
// GET /api/v1/tests/:id
// ---------------------------------------------
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isActive: true })
      .populate('companyId', 'name logoUrl category defaultPattern')
      .select('-generatedQuestions');

    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (!test.isAvailable()) return res.status(400).json({ success: false, message: 'Test not available' });

    const statistics = await test.getStatistics();
    let userAttempts = [];
    let canAttempt = true;

if (req.student) {
  userAttempts = await Attempt.getStudentAttempts(req.student.id, test._id);
  canAttempt = userAttempts.length < test.attemptsAllowed;

  if (test.type === 'paid') {
    const enrolled = await Enrollment.findOne({
      studentId: req.student.id,
      testId: test._id,
      status: 'enrolled'
    });
    canAttempt = !!enrolled;
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
    res.status(500).json({ success: false, message: 'Failed to get test details' });
  }
});

// ---------------------------------------------
// GET /api/v1/tests/:id/preview
// ---------------------------------------------
router.get('/:id/preview', async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isActive: true })
      .populate('companyId', 'name logoUrl')
      .select('title description type price duration totalQuestions sections instructions generatedQuestions');

    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const sampleQuestions = test.generatedQuestions.slice(0, 3).map(q => ({
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options.map(o => ({ text: o.text })),
      section: q.section,
      difficulty: q.difficulty,
      marks: q.marks
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
    res.status(500).json({ success: false, message: 'Failed to get test preview' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/:id/launch
// ---------------------------------------------
router.post('/:id/launch', auth, async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isActive: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (!test.isAvailable()) return res.status(400).json({ success: false, message: 'Test not available' });

    const existingAttempts = await Attempt.getStudentAttempts(req.student.id, test._id);

    const inProgress = existingAttempts.find(a => a.status === 'in-progress');
    if (inProgress) {
      if (inProgress.isExpired()) {
        await inProgress.autoSubmitIfExpired();
      } else {
        return res.json({
          success: true,
          message: 'Resuming your in-progress attempt',
          data: {
            attemptId: inProgress._id,
            startTime: inProgress.startTime,
            duration: inProgress.duration,
            serverTime: new Date().toISOString()
          }
        });
      }
    }

    const completed = existingAttempts.filter(a => a.status === 'submitted' || a.status === 'auto-submitted');
    if (completed.length >= test.attemptsAllowed) {
      return res.status(400).json({ success: false, message: 'You have already completed this test' });
    }

    if (test.type === 'paid') {
  const enrolled = await Enrollment.findOne({
    studentId: req.student.id,
    testId: test._id,
    status: 'enrolled'
  });

  const purchasedOrder = await Order.findOne({
    studentId: req.student.id,
    'items.testId': test._id,
    paymentStatus: 'completed'
  });

  if (!enrolled && !purchasedOrder) {
    return res.status(403).json({ success: false, message: 'Please enroll or purchase this test' });
  }
}

    const attempt = new Attempt({
      studentId: req.student.id,
      testId: test._id,
      status: 'in-progress',
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
    res.status(500).json({ success: false, message: 'Failed to launch test' });
  }
});

// ---------------------------------------------
// GET /api/v1/tests/:id/questions
// Handles both student (with attemptId) and admin requests
// Note: req.student is set by auth middleware for all authenticated users (both students and admins)
// The role property differentiates between regular students and admin users
// ---------------------------------------------
router.get('/:id/questions', questionReadLimiter, auth, async (req, res) => {
  try {
    const { attemptId } = req.query;
    const { id } = req.params;

    // Admin request - no attemptId, return all questions with full details
    // Check user role (admins have role === 'admin', regular students have role !== 'admin')
    if (!attemptId && req.student.role === 'admin') {
      const test = await Test.findById(id).select('generatedQuestions sections title');
      if (!test) {
        return res.status(404).json({ success: false, message: 'Test not found' });
      }

      return res.json({
        success: true,
        data: {
          questions: test.generatedQuestions,
          sections: test.sections,
          totalQuestions: test.generatedQuestions.length
        }
      });
    }

    // Student request - requires attemptId
    if (!attemptId) {
      return res.status(400).json({ success: false, message: 'Attempt ID is required' });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.studentId.toString() !== req.student.id.toString())
      return res.status(403).json({ success: false, message: 'This attempt does not belong to you' });
    if (attempt.testId.toString() !== id.toString())
      return res.status(400).json({ success: false, message: 'Attempt does not match test' });
    if (attempt.status !== 'in-progress')
      return res.status(400).json({ success: false, message: 'Attempt is not active' });

    const test = await Test.findById(id).select('generatedQuestions sections instructions isGenerated');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    if (!test.generatedQuestions || test.generatedQuestions.length === 0) {
      await test.generateQuestions();
      await test.reload();
    }

    const questions = test.generatedQuestions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      questionHtml: q.questionHtml,
      questionType: q.questionType,
      options: q.options.map(opt => ({ 
        text: opt.text,
        html: opt.html
      })),
      imageUrl: q.imageUrl,
      section: q.section,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      tags: q.tags
    }));

    res.json({
      success: true,
      data: {
        questions,
        sections: test.sections,
        instructions: test.instructions,
        savedAnswers: attempt.answers || []
      }
    });
  } catch (error) {
    console.error('Get test questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get test questions' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/:id/save-answer
// ---------------------------------------------
router.post('/:id/save-answer', auth, async (req, res) => {
  try {
    const { attemptId, questionId, selectedOptions, isMarkedForReview, section } = req.body;

    const attempt = await Attempt.findOne({
      _id: attemptId,
      studentId: req.student.id,
      status: 'in-progress'
    });
    if (!attempt) return res.status(404).json({ success: false, message: 'Active attempt not found' });

    let idx = attempt.answers.findIndex(a => a.questionId.toString() === questionId);
    const answerData = {
      questionId,
      selectedOptions: selectedOptions || [],
      isMarkedForReview: isMarkedForReview || false,
      section,
      timeSpent: 0
    };

    if (idx >= 0) attempt.answers[idx] = { ...attempt.answers[idx], ...answerData };
    else attempt.answers.push(answerData);

    await attempt.save();
    res.json({ success: true, message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ success: false, message: 'Failed to save answer' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests (Admin) - create test
// ---------------------------------------------
router.post('/', adminAuth, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title 5-200 chars'),
  body('companyId').isMongoId().withMessage('Valid company ID required'),
  body('type').isIn(['free', 'paid']).withMessage('Type must be free or paid'),
  body('price').isNumeric({ min: 0 }).withMessage('Price must be >= 0'),
  body('sections').isArray({ min: 1 }).withMessage('At least one section required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { title, description, companyId, type, price, sections, instructions, difficulty, tags, isFeatured, validFrom, validUntil } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (type === 'free' && price > 0)
      return res.status(400).json({ success: false, message: 'Free tests cannot have a price' });
    if (type === 'paid' && price <= 0)
      return res.status(400).json({ success: false, message: 'Paid tests must have price > 0' });

    if (type === 'free') {
      const existing = await Test.findOne({ companyId, type: 'free', isActive: true });
      if (existing) return res.status(400).json({ success: false, message: 'Only one free test per company allowed' });
    }

    // Calculate total duration from sections
    const totalDuration = sections.reduce((sum, section) => sum + (section.duration || 0), 0);

    const test = new Test({
      title,
      description,
      companyId,
      type,
      price: type === 'free' ? 0 : price,
      duration: totalDuration,
      sections,
      instructions: instructions || [],
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      isFeatured: isFeatured || false,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      createdBy: req.student.id,
      generatedQuestions: []
    });

    await test.save();
    res.status(201).json({ success: true, message: 'Test created successfully', data: { test } });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ success: false, message: 'Failed to create test' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/:id/upload-questions (Admin)
// Redirects uploads into QuestionBank
// ---------------------------------------------
router.post('/:id/upload-questions', adminAuth, upload.single('questionsFile'), async (req, res) => {
  try {
    const { sectionName } = req.body;
    if (!sectionName) {
      return res.status(400).json({ success: false, message: 'sectionName is required' });
    }

    const test = await Test.findById(req.params.id).populate('companyId');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const section = test.sections.find(s => s.sectionName === sectionName);
    if (!section) {
      return res.status(400).json({ success: false, message: `Section "${sectionName}" not found in this test` });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Questions file is required' });
    }

    const filePath = req.file.path;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    // Reuse parseQuestions helper
    const questions = await parseQuestions(filePath, ext, section, sectionName);

    if (!questions.length) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'No valid questions found in file' });
    }

    // ✅ Save into QuestionBank, not Test
    let bank = await QuestionBank.findOne({ companyId: test.companyId._id, section: sectionName });
    if (!bank) {
      bank = new QuestionBank({
        companyId: test.companyId._id,
        section: sectionName,
        title: `${test.companyId.name} - ${sectionName} Bank`,
        uploadedBy: req.student.id,
        questions: []
      });
    }

    bank.questions.push(...questions);
    await bank.save();

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Uploaded ${questions.length} questions to QuestionBank section "${sectionName}"`,
      data: {
        sectionName,
        totalQuestionsInBank: bank.questions.length
      }
    });
  } catch (error) {
    console.error('Upload questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload questions' });
  }
});


// ---------------------------------------------
// POST /api/v1/tests/attempts/:id/submit
// ---------------------------------------------
router.post('/attempts/:id/submit', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const attempt = await Attempt.findById(id).populate('testId');
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.studentId.toString() !== req.student.id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (attempt.status !== 'in-progress')
      return res.status(400).json({ success: false, message: 'Attempt already submitted or expired' });

    const test = attempt.testId;
    let score = 0, correct = 0, incorrect = 0, unanswered = 0;
    const processed = [];
    const sectionWiseScore = {};

    // Helper function to apply negative marking
    const applyNegativeMarking = (q) => {
      const neg = q.negativeMarks || 0;
      return -neg;
    };

    test.generatedQuestions.forEach((q) => {
      const studentAnswer = answers[q._id];
      const section = q.section || 'General';
      if (!sectionWiseScore[section]) {
        sectionWiseScore[section] = { sectionName: section, totalQuestions: 0, attemptedQuestions: 0, correctAnswers: 0, score: 0 };
      }
      sectionWiseScore[section].totalQuestions++;

      let isCorrect = false, marksAwarded = 0;

      if (!studentAnswer || (Array.isArray(studentAnswer) && studentAnswer.length === 0)) {
        unanswered++;
      } else {
        sectionWiseScore[section].attemptedQuestions++;
        
        if (q.questionType === 'multiple') {
          // For multiple choice questions, check if all selected options are correct
          // and all correct options are selected
          const correctOptions = q.options.map((o, idx) => {
            if (!o.isCorrect) return null;
            // Support both text-based and index-based identifiers
            return o.text && o.text.trim() ? o.text : `option_${idx}`;
          }).filter(Boolean);
          
          const selectedOptions = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
          
          // Check if selected options match correct options exactly
          const isExactMatch = 
            correctOptions.length === selectedOptions.length &&
            correctOptions.every(opt => selectedOptions.includes(opt)) &&
            selectedOptions.every(opt => correctOptions.includes(opt));
          
          if (isExactMatch) {
            isCorrect = true;
            marksAwarded = q.marks || 1;
            score += marksAwarded;
            correct++;
            sectionWiseScore[section].correctAnswers++;
            sectionWiseScore[section].score += marksAwarded;
          } else {
            marksAwarded = applyNegativeMarking(q);
            score += marksAwarded; // marksAwarded is already negative
            incorrect++;
          }
        } else {
          // For single choice questions
          const correctOptIndex = q.options.findIndex(o => o.isCorrect);
          if (correctOptIndex !== -1) {
            const correctOpt = q.options[correctOptIndex];
            // Support both text-based and index-based identifiers
            const correctId = correctOpt.text && correctOpt.text.trim() 
              ? correctOpt.text 
              : `option_${correctOptIndex}`;
            
            if (correctId === studentAnswer) {
              isCorrect = true;
              marksAwarded = q.marks || 1;
              score += marksAwarded;
              correct++;
              sectionWiseScore[section].correctAnswers++;
              sectionWiseScore[section].score += marksAwarded;
            } else {
              marksAwarded = applyNegativeMarking(q);
              score += marksAwarded; // marksAwarded is already negative
              incorrect++;
            }
          } else {
            // No correct option marked - student gets it wrong
            marksAwarded = applyNegativeMarking(q);
            score += marksAwarded; // marksAwarded is already negative
            incorrect++;
          }
        }
      }

      processed.push({
        questionId: q._id,
        selectedOptions: Array.isArray(studentAnswer) ? studentAnswer : (studentAnswer ? [studentAnswer] : []),
        isMarkedForReview: false,
        timeSpent: 0,
        isCorrect,
        marksAwarded,
        section
      });
    });

    const percentage = test.totalQuestions > 0 ? Math.round((score / test.totalMarks) * 100) : 0;
    const isPassed = percentage >= (test.passingMarks || 60);

    attempt.answers = processed;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.correctAnswers = correct;
    attempt.incorrectAnswers = incorrect;
    attempt.unansweredQuestions = unanswered;
    attempt.attemptedQuestions = correct + incorrect;
    attempt.sectionWiseScore = Object.values(sectionWiseScore);
    attempt.isPassed = isPassed;
    attempt.status = 'submitted';
    attempt.endTime = new Date();
    attempt.submittedAt = new Date();

    await attempt.save();
    await attempt.calculateRankAndPercentile();

    res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: attempt._id,
        score,
        percentage,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unansweredQuestions: unanswered,
        isPassed,
        rank: attempt.rank,
        percentile: attempt.percentile
      }
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit attempt' });
  }
});

// ---------------------------------------------
// PUT /api/v1/tests/:id (Admin) - update test
// ---------------------------------------------
router.put('/:id', adminAuth, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title 5-200 chars'),
  body('companyId').optional().isMongoId().withMessage('Valid company ID required'),
  body('type').optional().isIn(['free', 'paid']).withMessage('Type must be free or paid'),
  body('price').optional().isNumeric({ min: 0 }).withMessage('Price must be >= 0'),
  body('sections').optional().isArray({ min: 1 }).withMessage('At least one section required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { id } = req.params;
    const { title, description, companyId, type, price, sections, instructions, difficulty, tags, isFeatured, validFrom, validUntil } = req.body;

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Update fields if provided
    if (title !== undefined) test.title = title;
    if (description !== undefined) test.description = description;
    if (companyId !== undefined) {
      const company = await Company.findById(companyId);
      if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
      test.companyId = companyId;
    }
    if (type !== undefined) test.type = type;
    if (price !== undefined) test.price = type === 'free' ? 0 : price;
    if (sections !== undefined) {
      // Calculate total duration from sections
      const totalDuration = sections.reduce((sum, section) => sum + (section.duration || 0), 0);
      test.sections = sections;
      test.duration = totalDuration;
    }
    if (instructions !== undefined) test.instructions = instructions;
    if (difficulty !== undefined) test.difficulty = difficulty;
    if (tags !== undefined) test.tags = tags;
    if (isFeatured !== undefined) test.isFeatured = isFeatured;
    if (validFrom !== undefined) test.validFrom = validFrom ? new Date(validFrom) : undefined;
    if (validUntil !== undefined) test.validUntil = validUntil ? new Date(validUntil) : undefined;

    await test.save();

    res.json({ success: true, message: 'Test updated successfully', data: { test } });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ success: false, message: 'Failed to update test' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/:id/generate-questions (Admin)
// ---------------------------------------------
router.post('/:id/generate-questions', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    await test.generateQuestions();

    // ✅ reload after save to get updated totals
    const updatedTest = await Test.findById(test._id);

    res.json({
      success: true,
      message: 'Questions generated successfully',
      data: {
        totalQuestions: updatedTest.totalQuestions,
        totalMarks: updatedTest.totalMarks,
        sectionsGenerated: updatedTest.sections.length,
        isGenerated: updatedTest.isGenerated
      }
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate questions' });
  }
});

// ---------------------------------------------
// DELETE /api/v1/tests/:id (Admin) - delete test
// ---------------------------------------------
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Delete the test
    await Test.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test'
    });
  }
});

// POST /api/v1/enrollments/company/:companyId
router.post('/company/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get all paid tests for that company
    const tests = await Test.find({ companyId, type: 'paid', isActive: true });

    if (!tests.length) {
      return res.status(404).json({
        success: false,
        message: 'No paid tests found for this company'
      });
    }

    const enrollments = [];

    for (const test of tests) {
      // Check if already enrolled
      const existing = await Enrollment.findOne({
        studentId: req.student.id,
        testId: test._id
      });
      if (!existing) {
        const enrollment = new Enrollment({
          studentId: req.student.id,
          testId: test._id,
          status: 'enrolled'
        });
        await enrollment.save();
        enrollments.push(enrollment);
      }
    }

    res.json({
      success: true,
      message: `Enrolled to ${enrollments.length} paid test(s) for this company`,
      data: enrollments
    });
  } catch (error) {
    console.error('Company enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll to company tests'
    });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/:id/questions - Add question to test
// ---------------------------------------------
router.post('/:id/questions', questionCreationLimiter, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      questionText, 
      questionHtml, 
      questionType, 
      options, 
      correctAnswer, 
      explanation,
      explanationHtml,
      section, 
      marks, 
      negativeMarks, 
      difficulty,
      imageUrl,
      tags 
    } = req.body;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Validate section exists in test
    const sectionExists = test.sections.some(s => s.sectionName === section);
    if (!sectionExists) {
      return res.status(400).json({ 
        success: false, 
        message: `Section "${section}" not found in test` 
      });
    }

    // Create question object
    const newQuestion = {
      questionId: new mongoose.Types.ObjectId(),
      questionText: questionText || '',
      questionHtml: questionHtml || '',
      questionType: questionType || 'single',
      options: options || [],
      correctAnswer,
      explanation: explanation || '',
      explanationHtml: explanationHtml || '',
      imageUrl: imageUrl || '',
      section,
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      difficulty: difficulty || 'Medium',
      tags: tags || []
    };

    // Add question to test
    test.generatedQuestions.push(newQuestion);
    
    // Update totals
    test.totalQuestions = test.generatedQuestions.length;
    test.totalMarks = test.generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    test.isGenerated = true;

    await test.save();

    res.json({
      success: true,
      message: 'Question added successfully',
      data: {
        question: newQuestion,
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks
      }
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
});

// ---------------------------------------------
// PUT /api/v1/tests/:id/questions/:questionId - Update question
// ---------------------------------------------
router.put('/:id/questions/:questionId', questionCreationLimiter, adminAuth, async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const updateData = req.body;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const questionIndex = test.generatedQuestions.findIndex(
      q => q.questionId.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Update question fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        test.generatedQuestions[questionIndex][key] = updateData[key];
      }
    });

    // Recalculate totals
    test.totalMarks = test.generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    await test.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question: test.generatedQuestions[questionIndex] }
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
});

// ---------------------------------------------
// DELETE /api/v1/tests/:id/questions/:questionId - Delete question
// ---------------------------------------------
router.delete('/:id/questions/:questionId', questionCreationLimiter, adminAuth, async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const questionIndex = test.generatedQuestions.findIndex(
      q => q.questionId.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Remove question
    test.generatedQuestions.splice(questionIndex, 1);

    // Update totals
    test.totalQuestions = test.generatedQuestions.length;
    test.totalMarks = test.generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    test.isGenerated = test.generatedQuestions.length > 0;

    await test.save();

    res.json({
      success: true,
      message: 'Question deleted successfully',
      data: {
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks
      }
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
});

// ---------------------------------------------
// POST /api/v1/tests/upload-question-image - Upload question image
// ---------------------------------------------
router.post('/upload-question-image', imageUploadLimiter, adminAuth, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Return the file path
    const imageUrl = `/uploads/question-images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});


module.exports = router;
