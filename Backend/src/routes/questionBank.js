const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { adminAuth } = require('../middlewares/auth');
const QuestionBank = require('../models/QuestionBank');
const Company = require('../models/Company');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/question-banks/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|json/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

// @route   GET /api/v1/question-banks
// @desc    Get all question banks
// @access  Private/Admin
router.get('/', adminAuth, async (req, res) => {
  try {
    const { companyId, section, page = 1, limit = 1000, fetchAll } = req.query;
    
    const query = {};
    if (companyId) query.companyId = companyId;
    if (section) query.section = section;

    // Build query without pagination if fetchAll is specified
    let questionBanksQuery = QuestionBank.find(query)
      .populate('companyId', 'name logoUrl')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Apply pagination only if fetchAll is not specified
    if (fetchAll !== 'true') {
      questionBanksQuery = questionBanksQuery.limit(limit * 1).skip((page - 1) * limit);
    }

    const questionBanks = await questionBanksQuery;
    const total = await QuestionBank.countDocuments(query);

    res.json({
      success: true,
      data: {
        questionBanks,
        pagination: {
          current: parseInt(page),
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get question banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question banks'
    });
  }
});

// @route   POST /api/v1/question-banks/upload
// @desc    Upload question bank for a section
// @access  Private/Admin
router.post('/upload', adminAuth, upload.single('questionFile'), [
  body('companyId')
    .isMongoId()
    .withMessage('Valid company ID is required'),
  body('section')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Section name must be between 1 and 50 characters'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Question file is required'
      });
    }

    const { companyId, section, title, description } = req.body;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
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
                  questionText: row.questionText || row.question,
                  questionType: row.questionType || row.type || 'single',
                  options: [
                    { text: row.option1, isCorrect: false },
                    { text: row.option2, isCorrect: false },
                    { text: row.option3, isCorrect: false },
                    { text: row.option4, isCorrect: false }
                  ].filter(opt => opt.text && opt.text.trim()),
                  correctAnswer: row.correctAnswer || row.correct,
                  explanation: row.explanation || '',
                  difficulty: row.difficulty || 'Medium',
                  marks: parseFloat(row.marks) || 1,
                  negativeMarks: parseFloat(row.negativeMarks) || 0,
                  tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
                  createdBy: req.student.id
                };

                // Handle multiple correct answers for multiple choice questions
                if (question.questionType === 'multiple' && typeof question.correctAnswer === 'string') {
                  // For multiple choice, correctAnswer can be comma-separated indices
                  const correctIndices = question.correctAnswer.split(',').map(idx => parseInt(idx.trim()) - 1);
                  correctIndices.forEach(idx => {
                    if (idx >= 0 && idx < question.options.length) {
                      question.options[idx].isCorrect = true;
                    }
                  });
                } else if (question.questionType !== 'multiple') {
                  // Mark correct option for single choice questions
                  const correctIndex = parseInt(question.correctAnswer) - 1;
                  if (correctIndex >= 0 && correctIndex < question.options.length) {
                    question.options[correctIndex].isCorrect = true;
                  }
                }

                // Validate question
                if (question.questionText && question.options.length >= 2 && question.correctAnswer) {
                  questions.push(question);
                }
              } catch (error) {
                console.error('Error parsing CSV row:', error);
                // Don't reject the promise for individual row errors, just skip the row
              }
            })
            .on('end', resolve)
            .on('error', (error) => {
              console.error('CSV parsing error:', error);
              reject(new Error(`Failed to parse CSV file: ${error.message}`));
            });
        });
      } else if (fileExtension === 'json') {
        // Parse JSON file
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(fileContent);
          
          if (!Array.isArray(jsonData)) {
            throw new Error('JSON file must contain an array of questions');
          }
          
          jsonData.forEach((item, index) => {
            try {
              const question = {
                questionText: item.questionText,
                questionType: item.questionType || 'single',
                options: [
                  { text: item.option1, isCorrect: false },
                  { text: item.option2, isCorrect: false },
                  { text: item.option3, isCorrect: false },
                  { text: item.option4, isCorrect: false }
                ].filter(opt => opt.text && opt.text.trim()),
                correctAnswer: item.correctAnswer,
                explanation: item.explanation || '',
                difficulty: item.difficulty || 'Medium',
                marks: parseFloat(item.marks) || 1,
                negativeMarks: parseFloat(item.negativeMarks) || 0,
                tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
                createdBy: req.student.id
              };

              // Handle multiple correct answers for multiple choice questions
              if (question.questionType === 'multiple') {
                if (Array.isArray(question.correctAnswer)) {
                  // For multiple choice, correctAnswer can be an array of indices
                  question.correctAnswer.forEach(idx => {
                    const correctIdx = typeof idx === 'number' ? idx - 1 : parseInt(idx) - 1;
                    if (correctIdx >= 0 && correctIdx < question.options.length) {
                      question.options[correctIdx].isCorrect = true;
                    }
                  });
                } else if (typeof question.correctAnswer === 'string') {
                  // For multiple choice, correctAnswer can be comma-separated indices
                  const correctIndices = question.correctAnswer.split(',').map(idx => parseInt(idx.trim()) - 1);
                  correctIndices.forEach(idx => {
                    if (idx >= 0 && idx < question.options.length) {
                      question.options[idx].isCorrect = true;
                    }
                  });
                }
              } else if (question.questionType !== 'multiple') {
                // Mark correct option for single choice questions
                const correctIndex = parseInt(question.correctAnswer) - 1;
                if (correctIndex >= 0 && correctIndex < question.options.length) {
                  question.options[correctIndex].isCorrect = true;
                }
              }

              // Validate question
              if (question.questionText && question.options.length >= 2 && question.correctAnswer) {
                questions.push(question);
              }
            } catch (itemError) {
              console.error(`Error processing JSON item at index ${index}:`, itemError);
              // Skip invalid items but continue processing
            }
          });
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error(`Failed to parse JSON file: ${jsonError.message}`);
        }
      }

      // Create or update question bank
      let questionBank = await QuestionBank.findOne({ companyId, section });
      
      if (questionBank) {
        // Add questions to existing bank
        questionBank.questions.push(...questions);
        questionBank.metadata = {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          questionsCount: questionBank.questions.length,
          validQuestions: questions.length,
          invalidQuestions: 0
        };
      } else {
        // Create new question bank
        questionBank = new QuestionBank({
          companyId,
          section,
          title,
          description,
          questions,
          uploadedBy: req.student.id,
          metadata: {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            questionsCount: questions.length,
            validQuestions: questions.length,
            invalidQuestions: 0
          }
        });
      }

      await questionBank.save();

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Successfully uploaded ${questions.length} questions to ${section} section`,
        data: {
          questionBankId: questionBank._id,
          section: questionBank.section,
          questionsCount: questions.length,
          totalQuestionsInBank: questionBank.totalQuestions
        }
      });

    } catch (parseError) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('File parsing error:', parseError);
      return res.status(400).json({
        success: false,
        message: parseError.message || 'Failed to parse question file',
        error: process.env.NODE_ENV === 'development' ? parseError.message : 'File parsing error'
      });
    }

  } catch (error) {
    console.error('Upload question bank error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload question bank',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error during upload'
    });
  }
});

// @route   GET /api/v1/question-banks/company/:companyId/sections
// @desc    Get available sections for a company
// @access  Private/Admin
router.get('/company/:companyId/sections', adminAuth, async (req, res) => {
  try {
    const sections = await QuestionBank.find({ 
      companyId: req.params.companyId,
      isActive: true 
    }).select('section totalQuestions difficulty metadata');

    const sectionStats = {};
    
    for (const bank of sections) {
      if (!sectionStats[bank.section]) {
        sectionStats[bank.section] = {
          section: bank.section,
          totalQuestions: 0,
          questionBanks: 0,
          difficulties: { Easy: 0, Medium: 0, Hard: 0 }
        };
      }
      
      sectionStats[bank.section].totalQuestions += bank.totalQuestions;
      sectionStats[bank.section].questionBanks += 1;
      
      // Get difficulty distribution
      const stats = await QuestionBank.getSectionStats(req.params.companyId, bank.section);
      Object.keys(stats).forEach(diff => {
        sectionStats[bank.section].difficulties[diff] += stats[diff];
      });
    }

    res.json({
      success: true,
      data: {
        sections: Object.values(sectionStats)
      }
    });

  } catch (error) {
    console.error('Get company sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company sections'
    });
  }
});

// @route   DELETE /api/v1/question-banks/:id
// @desc    Delete question bank
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const questionBank = await QuestionBank.findById(req.params.id);
    
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    await QuestionBank.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question bank deleted successfully'
    });

  } catch (error) {
    console.error('Delete question bank error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question bank'
    });
  }
});

// @route   GET /api/v1/question-banks/:id/preview
// @desc    Preview questions in a question bank
// @access  Private/Admin
router.get('/:id/preview', adminAuth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const questionBank = await QuestionBank.findById(req.params.id)
      .populate('companyId', 'name')
      .select('section title questions companyId totalQuestions');

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    // Get sample questions
    const sampleQuestions = questionBank.questions
      .slice(0, parseInt(limit))
      .map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options.map(opt => ({ text: opt.text })), // Hide correct answers
        difficulty: q.difficulty,
        marks: q.marks,
        tags: q.tags
      }));

    res.json({
      success: true,
      data: {
        questionBank: {
          id: questionBank._id,
          section: questionBank.section,
          title: questionBank.title,
          company: questionBank.companyId,
          totalQuestions: questionBank.totalQuestions
        },
        sampleQuestions
      }
    });

  } catch (error) {
    console.error('Preview question bank error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview question bank'
    });
  }
});

module.exports = router;