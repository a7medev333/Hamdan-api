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

