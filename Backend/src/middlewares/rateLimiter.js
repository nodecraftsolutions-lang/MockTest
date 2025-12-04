const rateLimit = require('express-rate-limit');

// Rate limiter for question creation endpoints
const questionCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each admin to 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for image uploads
const imageUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each admin to 50 image uploads per 15 minutes
  message: 'Too many image uploads from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for reading questions (more lenient for exam access)
const questionReadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Allow 200 requests per 5 minutes (enough for exam access)
  message: 'Too many requests from this IP, please try again in a few minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  questionCreationLimiter,
  imageUploadLimiter,
  questionReadLimiter
};
