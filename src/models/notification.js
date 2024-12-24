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
}, {
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
notificationSchema.index({ student: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

// Method to find the last notification by type
notificationSchema.statics.findLastByType = async function(type, studentId) {
    // Logic to fetch the last notification based on type and token
    // This is a placeholder; implement the actual database query here
    return await this.findOne({ type:type , student:studentId }).sort({ createdAt: -1 });
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
