const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['welcome', 'course', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ student: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
