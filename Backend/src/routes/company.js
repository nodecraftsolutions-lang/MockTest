const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth, optionalAuth } = require('../middlewares/auth');
const Company = require('../models/Company');
const Test = require('../models/Test');

const router = express.Router();

// @route   GET /api/v1/companies
// @desc    Get all active companies
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }

    const companies = await Company.find(query)
      .select('name logoUrl description category difficulty totalQuestions totalDuration')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('testCount');

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies'
    });
  }
});

// @route   GET /api/v1/companies/:id
// @desc    Get company by ID with tests
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const company = await Company.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company tests
    const freeTests = await Test.getFreeTests(company._id);
    const paidTests = await Test.getPaidTests(company._id);

    // Get company statistics
    const stats = await company.getStats();

    res.json({
      success: true,
      data: {
        company: {
          ...company.toJSON(),
          stats
        },
        tests: {
          free: freeTests,
          paid: paidTests
        }
      }
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company details'
    });
  }
});

// @route   GET /api/v1/companies/:id/pattern
// @desc    Get company exam pattern
// @access  Public
router.get('/:id/pattern', async (req, res) => {
  try {
    const company = await Company.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).select('name defaultPattern totalQuestions totalDuration metadata');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: {
        companyName: company.name,
        pattern: company.defaultPattern,
        totalQuestions: company.totalQuestions,
        totalDuration: company.totalDuration,
        instructions: company.metadata?.instructions || [],
        cutoffPercentage: company.metadata?.cutoffPercentage || 60,
        passingCriteria: company.metadata?.passingCriteria || 'Overall percentage'
      }
    });

  } catch (error) {
    console.error('Get company pattern error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exam pattern'
    });
  }
});

// @route   GET /api/v1/companies/categories
// @desc    Get all company categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Company.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: {
        categories: categories.filter(cat => cat) // Remove null/undefined values
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// Admin routes below this point
// @route   POST /api/v1/companies
// @desc    Create new company (Admin only)
// @access  Private/Admin
router.post('/', adminAuth, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid logo URL'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn(['IT Services', 'Product', 'Consulting', 'Banking', 'Government', 'Other'])
    .withMessage('Please select a valid category'),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('defaultPattern')
    .isArray({ min: 1 })
    .withMessage('At least one section is required'),
  body('defaultPattern.*.sectionName')
    .trim()
    .notEmpty()
    .withMessage('Section name is required'),
  body('defaultPattern.*.questions')
    .isInt({ min: 1 })
    .withMessage('Number of questions must be at least 1'),
  body('defaultPattern.*.duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('defaultPattern.*.negativeMarking')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Negative marking must be between 0 and 1')
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

    const { name, logoUrl, description, category, difficulty, defaultPattern, tags, metadata } = req.body;

    // Check if company name already exists
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company name already exists'
      });
    }

    const company = new Company({
      name,
      logoUrl,
      description,
      category,
      difficulty: difficulty || 'Medium',
      defaultPattern,
      tags: tags || [],
      metadata: metadata || {},
      createdBy: req.student.id
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company
      }
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company'
    });
  }
});

// @route   PUT /api/v1/companies/:id
// @desc    Update company (Admin only)
// @access  Private/Admin
router.put('/:id', adminAuth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid logo URL'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['IT Services', 'Product', 'Consulting', 'Banking', 'Government', 'Other'])
    .withMessage('Please select a valid category'),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard')
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

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const { name, logoUrl, description, category, difficulty, defaultPattern, tags, metadata, isActive } = req.body;

    // Check if new name conflicts with existing company
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company name already exists'
        });
      }
    }

    // Update fields
    if (name) company.name = name;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (description !== undefined) company.description = description;
    if (category) company.category = category;
    if (difficulty) company.difficulty = difficulty;
    if (defaultPattern) company.defaultPattern = defaultPattern;
    if (tags) company.tags = tags;
    if (metadata) company.metadata = { ...company.metadata, ...metadata };
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: {
        company
      }
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company'
    });
  }
});

// @route   DELETE /api/v1/companies/:id
// @desc    Delete company (Admin only)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has associated tests
    const testCount = await Test.countDocuments({ companyId: req.params.id });
    if (testCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company. It has ${testCount} associated tests. Please delete or reassign the tests first.`
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company'
    });
  }
});

// @route   GET /api/v1/companies/:id/stats
// @desc    Get detailed company statistics (Admin only)
// @access  Private/Admin
router.get('/:id/stats', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const stats = await company.getStats();
    
    // Get additional detailed stats
    const tests = await Test.find({ companyId: req.params.id });
    const testStats = await Promise.all(
      tests.map(async (test) => {
        const testStatistics = await test.getStatistics();
        return {
          testId: test._id,
          testTitle: test.title,
          type: test.type,
          ...testStatistics
        };
      })
    );

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          category: company.category
        },
        overview: stats,
        testStatistics: testStats
      }
    });

  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company statistics'
    });
  }
});

module.exports = router;