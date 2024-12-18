const PlaylistContent = require('../models/playlistContent');
const { getVideoDurationInSeconds } = require('get-video-duration');

// Create new playlist content
exports.createPlaylistContent = async (req, res) => {
  try {
    const {
      title,
      description,
      videoLength
    } = req.body;

    // Check if title already exists
    const existingPlaylist = await PlaylistContent.findOne({ title });
    if (existingPlaylist) {
      return res.status(400).json({
        success: false,
        message: 'Playlist title already exists'
      });
    }

    // Create new playlist content
    const playlistContent = new PlaylistContent({
      title,
      description,
      image: req.file ? req.file.path : '',
      videoLength: videoLength || '0:00'
    });

    await playlistContent.save();

    res.status(201).json({
      success: true,
      message: 'Playlist content created successfully',
      data: playlistContent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating playlist content',
      error: error.message
    });
  }
};

// Get all playlist contents
exports.listPlaylistContents = async (req, res) => {
  try {
    const playlistContents = await PlaylistContent.find();
    
    res.json({
      success: true,
      message: 'Playlist contents retrieved successfully',
      data: playlistContents
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving playlist contents',
      error: error.message
    });
  }
};

// Get single playlist content
exports.getPlaylistContent = async (req, res) => {
  try {
    const playlistContent = await PlaylistContent.findById(req.params.id);
    if (!playlistContent) {
      return res.status(404).json({
        success: false,
        message: 'Playlist content not found'
      });
    }

    res.json({
      success: true,
      message: 'Playlist content retrieved successfully',
      data: playlistContent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving playlist content',
      error: error.message
    });
  }
};

// Update playlist content
exports.updatePlaylistContent = async (req, res) => {
  try {
    const playlistContent = await PlaylistContent.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(req.file && { image: req.file.path })
      },
      { new: true, runValidators: true }
    );

    if (!playlistContent) {
      return res.status(404).json({
        success: false,
        message: 'Playlist content not found'
      });
    }

    res.json({
      success: true,
      message: 'Playlist content updated successfully',
      data: playlistContent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating playlist content',
      error: error.message
    });
  }
};

// Delete playlist content
exports.deletePlaylistContent = async (req, res) => {
  try {
    const playlistContent = await PlaylistContent.findByIdAndDelete(req.params.id);
    
    if (!playlistContent) {
      return res.status(404).json({
        success: false,
        message: 'Playlist content not found'
      });
    }

    res.json({
      success: true,
      message: 'Playlist content deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting playlist content',
      error: error.message
    });
  }
};
