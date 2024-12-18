const mongoose = require('mongoose');

const playlistContentSchema = new mongoose.Schema({
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
  image: {
    type: String,
    required: true,
    trim: true
  },
  videoLength: {
    type: String,
    required: true,
    trim: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false  
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries by student
playlistContentSchema.index({ student: 1 });

const PlaylistContent = mongoose.model('PlaylistContent', playlistContentSchema);
module.exports = PlaylistContent;
