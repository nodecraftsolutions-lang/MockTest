const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Alumni = require('../models/Alumni');

const router = express.Router();

// @route   GET /api/v1/alumni/featured
// @desc    Get featured alumni for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const alumni = await Alumni.find({ 
      isActive: true, 
      featured: true 
    }).limit(6);

    res.json({
      success: true,
      data: alumni
    });

  } catch (error) {
    console.error('Get featured alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured alumni'
    });
  }
});

// Admin routes for alumni management
// @route   GET /api/v1/alumni
// @desc    Get all alumni with filters
// @access  Private/Admin
router.get('/', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 1000, 
      search, 
      status,
      featured,
      fetchAll
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (featured) {
      query.featured = featured === 'true';
    }

    // Build query without pagination if fetchAll is specified
    let alumniQuery = Alumni.find(query).sort({ createdAt: -1 });
    
    // Apply pagination only if fetchAll is not specified
    if (fetchAll !== 'true') {
      alumniQuery = alumniQuery.limit(limit * 1).skip((page - 1) * limit);
    }

    const alumni = await alumniQuery;
    const total = await Alumni.countDocuments(query);

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          current: parseInt(page),
          pages: fetchAll === 'true' ? 0 : Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alumni'
    });
  }
});

// @route   POST /api/v1/alumni
// @desc    Create a new alumni
// @access  Private/Admin
router.post('/', 
  adminAuth,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('company').notEmpty().withMessage('Company is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('testimonial').notEmpty().withMessage('Testimonial is required').isLength({ max: 500 }).withMessage('Testimonial cannot exceed 500 characters'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],
  async (req, res) => {
    try {
      // Clean up the request body
      const cleanedBody = {
        name: req.body.name?.trim(),
        email: req.body.email?.trim().toLowerCase(),
        company: req.body.company?.trim(),
        position: req.body.position?.trim(),
        testimonial: req.body.testimonial?.trim(),
        photoUrl: req.body.photoUrl?.trim() || null,
        rating: parseInt(req.body.rating, 10),
        featured: !!req.body.featured,
        isActive: req.body.isActive !== undefined ? !!req.body.isActive : true
      };

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const alumni = new Alumni(cleanedBody);
      await alumni.save();

      res.status(201).json({
        success: true,
        message: 'Alumni created successfully',
        data: alumni
      });

    } catch (error) {
      console.error('Create alumni error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Alumni with this email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create alumni'
      });
    }
  }
);

// @route   GET /api/v1/alumni/:id
// @desc    Get alumni details
// @access  Private/Admin
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }

    res.json({
      success: true,
      data: alumni
    });

  } catch (error) {
    console.error('Get alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alumni'
    });
  }
});

// @route   PUT /api/v1/alumni/:id
// @desc    Update alumni
// @access  Private/Admin
router.put('/:id',
  adminAuth,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('company').optional().notEmpty().withMessage('Company cannot be empty'),
    body('position').optional().notEmpty().withMessage('Position cannot be empty'),
    body('testimonial').optional().notEmpty().withMessage('Testimonial cannot be empty').isLength({ max: 500 }).withMessage('Testimonial cannot exceed 500 characters'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],
  async (req, res) => {
    try {
      // Clean up the request body
      const cleanedBody = {};
      
      if (req.body.name !== undefined) {
        cleanedBody.name = req.body.name?.trim();
      }
      if (req.body.email !== undefined) {
        cleanedBody.email = req.body.email?.trim().toLowerCase();
      }
      if (req.body.company !== undefined) {
        cleanedBody.company = req.body.company?.trim();
      }
      if (req.body.position !== undefined) {
        cleanedBody.position = req.body.position?.trim();
      }
      if (req.body.testimonial !== undefined) {
        cleanedBody.testimonial = req.body.testimonial?.trim();
      }
      if (req.body.photoUrl !== undefined) {
        cleanedBody.photoUrl = req.body.photoUrl?.trim() || null;
      }
      if (req.body.rating !== undefined) {
        cleanedBody.rating = parseInt(req.body.rating, 10);
      }
      if (req.body.featured !== undefined) {
        cleanedBody.featured = !!req.body.featured;
      }
      if (req.body.isActive !== undefined) {
        cleanedBody.isActive = !!req.body.isActive;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const alumni = await Alumni.findByIdAndUpdate(
        req.params.id,
        cleanedBody,
        { new: true, runValidators: true }
      );

      if (!alumni) {
        return res.status(404).json({
          success: false,
          message: 'Alumni not found'
        });
      }

      res.json({
        success: true,
        message: 'Alumni updated successfully',
        data: alumni
      });

    } catch (error) {
      console.error('Update alumni error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Alumni with this email already exists'
        });
      }
      
      // Check if this is a CastError (invalid ID format)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid alumni ID'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update alumni'
      });
    }
  }
);

// @route   DELETE /api/v1/alumni/:id
// @desc    Delete alumni
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndDelete(req.params.id);

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }

    res.json({
      success: true,
      message: 'Alumni deleted successfully'
    });

  } catch (error) {
    console.error('Delete alumni error:', error);
    // Check if this is a CastError (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid alumni ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete alumni'
    });
  }
});

module.exports = router;