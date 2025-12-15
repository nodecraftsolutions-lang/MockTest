const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const { auth, adminAuth, optionalAuth } = require('../middlewares/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// @route   POST /api/v1/images/upload
// @desc    Upload an image to database
// @access  Private (Admin or Student)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file'
            });
        }

        const image = new Image({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer,
            size: req.file.size,
            uploadedBy: req.student.id
        });

        await image.save();

        // Construct the URL to fetch this image
        // Note: We return a relative URL here. The frontend or browser will resolve it against the backend URL.
        const imageUrl = `/api/v1/images/${image._id}`;

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl: imageUrl,
                imageId: image._id
            }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image'
        });
    }
});

// @route   GET /api/v1/images/:id
// @desc    Get image by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Set caching headers for better performance
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year

        res.send(image.data);

    } catch (error) {
        console.error('Get image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve image'
        });
    }
});

module.exports = router;
