const PlaylistContent = require('../models/playlistContent');
const Student = require('../models/student');
const Course = require('../models/course');
const CourseWatch = require('../models/courseWatch');
const { getVideoDurationInSeconds } = require('get-video-duration');

// Create new playlist content
exports.createPlaylistContent = async (req, res) => {
  try {
    const {
      title,
      description,
      videoLength
    } = req.body;

    // Check if title already exists for this student
    const existingPlaylist = await PlaylistContent.findOne({ 
      title,
      student: req.student._id 
    });
    
    if (existingPlaylist) {
      return res.status(400).json({
        success: false,
        message: 'Playlist title already exists for this student'
      });
    }

    // Create new playlist content
    const playlistContent = new PlaylistContent({
      title,
      description,
      image: req.file ? req.file.path : '',
      videoLength: videoLength || '0:00',
      student: req.student._id
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

// Get all playlist contents (admin only)
exports.listPlaylistContents = async (req, res) => {
  try {
    const playlistContents = await PlaylistContent.find()
      .populate('student', 'name email');
    
    res.json({
      success: true,
      count: playlistContents.length,
      data: playlistContents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching playlist contents',
      error: error.message
    });
  }
};

// Get student's playlist contents
exports.getStudentPlaylists = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.student._id;
    
    const playlistContents = await PlaylistContent.find({ student: studentId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: playlistContents.length,
      data: playlistContents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student playlists',
      error: error.message
    });
  }
};

// Get single playlist content
exports.getPlaylistContent = async (req, res) => {
  try {
    const playlistContent = await PlaylistContent.findById(req.params.id)
      .populate('student', 'name email');
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

// Add playlist to student's cart and add student to playlist
exports.addToCart = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const studentId = req.student._id;

    // Verify playlist exists
    const playlist = await PlaylistContent.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if playlist is already in student's cart
    if (student.cart && student.cart.includes(playlistId)) {
      return res.status(400).json({
        success: false,
        message: 'Playlist is already in cart'
      });
    }

    // Add playlist to student's cart
    if (!student.cart) {
      student.cart = [];
    }
    student.cart.push(playlistId);

    // Add playlist to student's enrolled playlists
    if (!student.enrolledPlaylists) {
      student.enrolledPlaylists = [];
    }
    if (!student.enrolledPlaylists.includes(playlistId)) {
      student.enrolledPlaylists.push(playlistId);
    }

    // Add student to playlist's students list
    if (!playlist.students) {
      playlist.students = [];
    }
    if (!playlist.students.includes(studentId)) {
      playlist.students.push(studentId);
    }

    // Save both documents
    await Promise.all([
      student.save(),
      playlist.save()
    ]);

    res.json({
      success: true,
      message: 'Playlist added to cart successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          cart: student.cart,
          enrolledPlaylists: student.enrolledPlaylists
        },
        playlist: {
          id: playlist._id,
          title: playlist.title,
          description: playlist.description,
          totalStudents: playlist.students.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding playlist to cart',
      error: error.message
    });
  }
};

// Remove playlist from student's cart
exports.removeFromCart = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const studentId = req.student._id;

    // Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if playlist is in student's cart
    if (!student.cart || !student.cart.includes(playlistId)) {
      return res.status(400).json({
        success: false,
        message: 'Playlist is not in cart'
      });
    }

    // Remove playlist from cart
    student.cart = student.cart.filter(id => id.toString() !== playlistId);

    // Save student
    await student.save();

    res.json({
      success: true,
      message: 'Playlist removed from cart successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          cart: student.cart,
          playlists: student.playlists
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing playlist from cart',
      error: error.message
    });
  }
};

// Get student's cart
exports.getCart = async (req, res) => {
  try {
    const studentId = req.student._id;

    // Get student with populated cart
    const student = await Student.findById(studentId)
      .populate('cart', 'title description image videoLength');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Format cart items and get course counts
    const formattedCart = await Promise.all(student.cart.map(async item => {
      const cartItem = item.toObject();
      
      // Count courses for this playlist
      const totalCourses = await Course.countDocuments({ playlistId: cartItem._id });
      
      return {
        ...cartItem,
        id: cartItem._id,
        image: cartItem.image ? process.env.HOST_IMAGE + cartItem.image : '',
        totalCourses
      };
    }));

    res.json({
      success: true,
      data: formattedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};
