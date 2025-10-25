const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  testimonial: {
    type: String,
    required: [true, 'Testimonial is required'],
    maxlength: [500, 'Testimonial cannot exceed 500 characters']
  },
  photoUrl: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for performance
alumniSchema.index({ email: 1 });
alumniSchema.index({ isActive: 1 });
alumniSchema.index({ featured: 1 });

module.exports = mongoose.model('Alumni', alumniSchema);