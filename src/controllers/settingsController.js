const Settings = require('../models/settings');
const Notification = require('../models/notification');
const Student = require('../models/student');
const PlaylistContent = require('../models/playlistContent');
const notificationService = require('../services/notificationService');

// Get settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const { supportLinks, welcomeMessage } = req.body;
    
    // Get existing settings or create new one
    let settings = await Settings.getInstance();
    
    // Update only provided fields
    if (supportLinks) {
      settings.supportLinks = {
        ...settings.supportLinks,
        ...supportLinks
      };
    }
    
    if (welcomeMessage) {
      settings.welcomeMessage = welcomeMessage;
    }
    
    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// Update support links
exports.updateSupportLinks = async (req, res) => {
  try {
    const { supportLinks } = req.body;
    
    if (!supportLinks) {
      return res.status(400).json({
        success: false,
        message: 'Support links are required'
      });
    }

    // Get existing settings or create new one
    let settings = await Settings.getInstance();
    
    // Update support links
    settings.supportLinks = {
      ...settings.supportLinks,
      ...supportLinks
    };
    
    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Support links updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating support links',
      error: error.message
    });
  }
};

// Send welcome message to multiple students
exports.sendWelcomeMessage = async (req, res) => {
  try {
    const { studentIds, customMessage } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Get settings for default welcome message
    const settings = await Settings.getInstance();
    const message = customMessage || settings.welcomeMessage;

    // Verify all students exist and get their FCM tokens
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some student IDs are invalid'
      });
    }

    // Create welcome notifications for all students
    const notifications = await Notification.insertMany(
      studentIds.map(studentId => ({
        student: studentId,
        message,
        type: 'welcome'
      }))
    );

    // Send push notifications to student devices
    const fcmTokens = students.map(student => student.fcmToken).filter(token => token);
    if (fcmTokens.length > 0) {
      await notificationService.sendToMultipleDevices(
        fcmTokens,
        'Welcome Message',
        message,
        {
          type: 'welcome',
          timestamp: new Date().toISOString()
        }
      );
    }

    res.status(201).json({
      success: true,
      message: `Welcome messages sent to ${students.length} students`,
      data: {
        notifications,
        message,
        sentTo: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          pushNotificationSent: !!s.fcmToken
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending welcome messages',
      error: error.message
    });
  }
};

// Send welcome message to students by playlist ID
exports.sendWelcomeMessageByPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { customMessage } = req.body;

    // Verify playlist exists
    const playlist = await PlaylistContent.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Get all students in the playlist
    const students = await Student.find({ 
      _id: { $in: playlist.students || [] }
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this playlist'
      });
    }

    // Get settings for default welcome message
    const settings = await Settings.getInstance();
    const message = customMessage || settings.welcomeMessage;

    // Create welcome notifications for all students
    const notifications = await Notification.insertMany(
      students.map(student => ({
        student: student._id,
        message,
        type: 'welcome'
      }))
    );

    // Send push notifications to student devices
    const fcmTokens = students.map(student => student.fcmToken).filter(token => token);
    if (fcmTokens.length > 0) {
      await notificationService.sendToMultipleDevices(
        fcmTokens,
        'Welcome to ' + playlist.title,
        message,
        {
          type: 'welcome',
          playlistId: playlistId,
          playlistTitle: playlist.title,
          timestamp: new Date().toISOString()
        }
      );
    }

    res.status(201).json({
      success: true,
      message: `Welcome messages sent to ${students.length} students in playlist "${playlist.title}"`,
      data: {
        notifications,
        message,
        playlist: {
          id: playlist._id,
          title: playlist.title
        },
        sentTo: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          pushNotificationSent: !!s.fcmToken
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending welcome messages',
      error: error.message
    });
  }
};

// Send welcome message to students by multiple playlist IDs
exports.sendWelcomeMessageByPlaylists = async (req, res) => {
  try {
    const { playlistIds } = req.body;
    const { customMessage } = req.body;

    if (!Array.isArray(playlistIds) || playlistIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of playlist IDs'
      });
    }

    // Verify playlists exist
    const playlists = await PlaylistContent.find({
      _id: { $in: playlistIds }
    });

    if (playlists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No playlists found'
      });
    }

    // Get all unique student IDs from all playlists
    const studentIds = [...new Set(
      playlists.reduce((acc, playlist) => {
        return acc.concat(playlist.students || []);
      }, [])
    )];

    if (studentIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in these playlists'
      });
    }

    // Get all students
    const students = await Student.find({ 
      _id: { $in: studentIds }
    });

    // Get settings for default welcome message
    const settings = await Settings.getInstance();
    const message = customMessage || settings.welcomeMessage;

    // Create welcome notifications for all students
    const notifications = await Notification.insertMany(
      students.map(student => ({
        student: student._id,
        message,
        type: 'welcome'
      }))
    );

    // Send push notifications to student devices
    const fcmTokens = students.map(student => student.fcmToken).filter(token => token);
    if (fcmTokens.length > 0) {
      await notificationService.sendToMultipleDevices(
        fcmTokens,
        'Welcome to Playlists',
        message,
        {
          type: 'welcome',
          playlistIds: playlistIds,
          playlistTitles: playlists.map(p => p.title),
          timestamp: new Date().toISOString()
        }
      );
    }

    res.status(201).json({
      success: true,
      message: `Welcome messages sent to ${students.length} students from ${playlists.length} playlists`,
      data: {
        notifications,
        message,
        playlists: playlists.map(p => ({
          id: p._id,
          title: p.title,
          studentCount: (p.students || []).length
        })),
        sentTo: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          pushNotificationSent: !!s.fcmToken
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending welcome messages',
      error: error.message
    });
  }
};

// Get notifications for a specific student
exports.getStudentNotifications = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get notifications with pagination
    const notifications = await Notification.find({ student: studentId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Notification.countDocuments({ student: studentId });

    // Mark fetched notifications as read
    await Notification.updateMany(
      { student: studentId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          limit: parseInt(limit)
        },
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student notifications',
      error: error.message
    });
  }
};


exports.getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming auth middleware sets req.user

    const notifications = await Notification.find({ student: studentId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('-__v');

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};