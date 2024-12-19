const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  // Auth fields
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // Personal information
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  birthdate: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // Device notification token
  fcmToken: {
    type: String,
    trim: true,
    default: null
  },
  // Image
  image: {
    type: String,  // Store the image path
    default: ''
  },
  // Course information
  courseName: {
    type: String,
    trim: true,
    default: ''
  },
  // Student's enrolled playlists
  enrolledPlaylists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlaylistContent'
  }],
  // Shopping Cart
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlaylistContent'
  }],
  // Block status
  isBlocked: {
    type: Boolean,
    default: false
  },
  // Total watching hours
  totalWatchingHours: {
    type: Number,
    default: 0
  },
  // Additional fields
  otherFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
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

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
