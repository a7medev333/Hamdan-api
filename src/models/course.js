const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  titleFile: {
    type: String,
    required: true,
    trim: true
  },
  videoLink: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,  // Duration in seconds
    required: true,
    default: 0
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlaylistContent',
    required: true
  },
  isLocked: {
    type: Boolean,
    default: true,
    required: true
  },
  socialMedia: {
    whatsapp: {
      type: String,
      trim: true
    },
    telegram: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
