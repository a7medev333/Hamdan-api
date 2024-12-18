const mongoose = require('mongoose');

const courseWatchSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  watchDuration: {
    type: Number,  // Duration in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastPosition: {
    type: Number,  // Video position in seconds
    default: 0
  }
});

// Compound index to ensure a student can only have one watch record per course
courseWatchSchema.index({ student: 1, course: 1 }, { unique: true });

const CourseWatch = mongoose.model('CourseWatch', courseWatchSchema);
module.exports = CourseWatch;
