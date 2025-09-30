const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find student and verify session
    const student = await Student.findById(decoded.studentId);
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Student not found.'
      });
    }
  
    if (!student.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Check if session is still valid (single device login)
    if (student.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.'
      });
    }

    // Update last active timestamp - FIX: await the async method
    try {
      // Set lastActiveAt directly instead of using the method to avoid potential issues
      student.lastActiveAt = new Date();
      await student.save({ validateBeforeSave: false });
    } catch (updateError) {
      console.error('Error updating last active timestamp:', updateError);
      // Continue even if updating timestamp fails
    }

    // Add student info to request
    req.student = {
      id: student._id,
      email: student.email,
      role: student.role,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run the regular auth middleware
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is admin
    if (req.student.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    // If auth middleware failed, the error response is already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Authorization failed.'
      });
    }
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const student = await Student.findById(decoded.studentId);
    
    if (student && student.isActive && student.activeSessionId === decoded.sessionId) {
      req.student = {
        id: student._id,
        email: student.email,
        role: student.role,
        sessionId: decoded.sessionId
      };
      
      // FIX: Update last active timestamp properly
      try {
        student.lastActiveAt = new Date();
        await student.save({ validateBeforeSave: false });
      } catch (updateError) {
        console.error('Error updating last active timestamp:', updateError);
        // Continue even if updating timestamp fails
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Rate limiting middleware for sensitive operations
const sensitiveOperationLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each user to 3 requests per windowMs
  keyGenerator: (req) => req.student?.id || req.ip,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  }
});

module.exports = {
  auth,
  adminAuth,
  optionalAuth,
  sensitiveOperationLimit
};