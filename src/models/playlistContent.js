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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PlaylistContent = mongoose.model('PlaylistContent', playlistContentSchema);
module.exports = PlaylistContent;
