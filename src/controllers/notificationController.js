const Notification = require('../models/notification');
const Student = require('../models/student');

// Send notification to multiple students
exports.sendNotification = async (req, res) => {
  try {
    const { studentIds, message, type = 'general' } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some student IDs are invalid'
      });
    }

    // Create notifications for all students
    const notifications = await Notification.insertMany(
      studentIds.map(studentId => ({
        student: studentId,
        message,
        type
      }))
    );

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${students.length} students`,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
};

// Get notifications for authenticated user
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

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const studentId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      student: studentId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};
