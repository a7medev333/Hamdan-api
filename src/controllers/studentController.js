const Student = require('../models/student');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const PlaylistContent = require('../models/playlistContent');

// Helper function to calculate age
const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper function to format time ago
const timeAgo = (date) => {
  if (!date) return '';
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';
  
  if (seconds < 10) return 'just now';
  
  return Math.floor(seconds) + ' seconds ago';
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// List all students
exports.listStudents = async (req, res) => {
  try {
    const students = await Student.find({}, {
      password: 0 // Exclude password field
    });

    // Add server URL to image paths and calculate ages
    const studentsWithFullInfo = students.map(student => {
      const studentObj = student.toObject();
      studentObj.image = studentObj.image ? process.env.HOST_IMAGE + studentObj.image : '';
      studentObj.age = calculateAge(studentObj.birthdate);
      studentObj.createdAgo = timeAgo(studentObj.createdAt);
      studentObj.updatedAgo = timeAgo(studentObj.updatedAt);
      return studentObj;
    });

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: studentsWithFullInfo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving students',
      error: error.message
    });
  }
};

// Register new student
exports.register = async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      phone,
      email,
      courseName,
      otherFields
    } = req.body;

    // Validate required fields
    const requiredFields = ['username', 'password', 'name', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
        data:{}
      });
    }

    // Check if username or email already exists
    const existingStudent = await Student.findOne({
      $or: [{ username }, { email }]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: existingStudent.username === username ? 
          'Username already exists' : 'Email already exists',
          data:{}
      });
    }

    // Create new student
    const student = new Student({
      username,
      password,
      name,
      phone,
      email,
      courseName,
      otherFields: new Map(Object.entries(otherFields || {}))
    });
    
    if (req.file && req.file.path) {
      student.image = req.file.path;
    }

    await student.save();
    
    const token = generateToken(student._id);
    const studentJson = student.toJSON();
    res.status(201).json({
      success: true,
      data: {
        id: studentJson.id,
        username: student.username,
        name: student.name,
        email: student.email,
        image: student.image ? process.env.HOST_IMAGE + student.image : '',
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registering student',
      error: error.message,
      data:{}
    });
  }
};

// Login student
exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    let { username, email, password } = req.body;

    // Try to parse the body if it's a string
    if (typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        username = parsedBody.username;
        email = parsedBody.email;
        password = parsedBody.password;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }

    // Validate required fields
    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either username or email, and password',
        receivedData: req.body
      });
    }

    // Find student by username or email
    const student = await Student.findOne({
      $or: [
        { username: username || '' },
        { email: (email || '').toLowerCase() }
      ]
    });

    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if student is blocked
    if (student.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    const token = generateToken(student._id);
    const studentJson = student.toJSON();
    res.json({
      success: true,
      data: {
        id: studentJson.id,
        username: student.username,
        name: student.name,
        email: student.email,
        image: process.env.HOST_IMAGE + student.image,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
      receivedData: req.body
    });
  }
};

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const student = req.student;
    const response = {
      id: student.id,
      username: student.username,
      name: student.name,
      phone: student.phone,
      birthdate: student.birthdate,
      age: calculateAge(student.birthdate),
      email: student.email,
      image: student.image ? process.env.HOST_IMAGE + student.image : '',
      courseName: student.courseName,
      otherFields: Object.fromEntries(student.otherFields),
      createdAt: student.createdAt,
      createdAgo: timeAgo(student.createdAt),
      updatedAt: student.updatedAt,
      updatedAgo: timeAgo(student.updatedAt)
    };
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

// Update student profile
exports.updateProfile = async (req, res) => {
  try {
    const student = req.student;
    const updates = req.body;
    
    // Handle otherFields separately
    if (updates.otherFields) {
      updates.otherFields = new Map(Object.entries(updates.otherFields));
    }

    // If new image is uploaded, delete old image
    if (req.file) {
      if (student.image) {
        try {
          const oldImagePath = student.image.replace(process.env.HOST_IMAGE, '');
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      updates.image = req.file.path;
    }

    // Update allowed fields
    Object.keys(updates).forEach((update) => {
      if (update !== '_id' && update !== 'password') {
        student[update] = updates[update];
      }
    });

    await student.save();
    
    const response = {
      id: student.id,
      username: student.username,
      name: student.name,
      phone: student.phone,
      birthdate: student.birthdate,
      age: calculateAge(student.birthdate),
      email: student.email,
      image: student.image ? process.env.HOST_IMAGE + student.image : '',
      courseName: student.courseName,
      otherFields: Object.fromEntries(student.otherFields),
      createdAt: student.createdAt,
      createdAgo: timeAgo(student.createdAt),
      updatedAt: student.updatedAt,
      updatedAgo: timeAgo(student.updatedAt)
    };
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Update student by ID
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove password from update data if it exists
    delete updateData.password;

    // Find student and update
    const student = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// Block student
exports.blockStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.isBlocked = true;
    await student.save();

    res.json({
      success: true,
      message: 'Student blocked successfully',
      data: {
        id: student.id,
        username: student.username,
        name: student.name,
        isBlocked: student.isBlocked
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error blocking student',
      error: error.message
    });
  }
};

// Unblock student
exports.unblockStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.isBlocked = false;
    await student.save();

    res.json({
      success: true,
      message: 'Student unblocked successfully',
      data: {
        id: student.id,
        username: student.username,
        name: student.name,
        isBlocked: student.isBlocked
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error unblocking student',
      error: error.message
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student's image if it exists
    if (student.image) {
      try {
        await fs.unlink(student.image);
      } catch (error) {
        console.error('Error deleting student image:', error);
      }
    }

    await Student.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

// Add student to playlist
exports.addToPlaylist = async (req, res) => {
  try {
    const { studentId, playlistId } = req.params;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify playlist exists
    const playlist = await PlaylistContent.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if student is already in playlist
    if (playlist.students && playlist.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already in this playlist'
      });
    }

    // Add student to playlist
    if (!playlist.students) {
      playlist.students = [];
    }
    playlist.students.push(studentId);
    await playlist.save();

    // Add playlist to student's playlists if needed
    if (!student.playlists) {
      student.playlists = [];
    }
    if (!student.playlists.includes(playlistId)) {
      student.playlists.push(playlistId);
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student added to playlist successfully',
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        },
        playlist: {
          id: playlist.id,
          title: playlist.title,
          description: playlist.description,
          totalStudents: playlist.students.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding student to playlist',
      error: error.message
    });
  }
};

// Add multiple students to playlist
exports.addMultipleToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Verify playlist exists
    const playlist = await PlaylistContent.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
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

    // Initialize students array if it doesn't exist
    if (!playlist.students) {
      playlist.students = [];
    }

    // Add students to playlist if they're not already in it
    const newStudents = studentIds.filter(id => !playlist.students.includes(id));
    if (newStudents.length > 0) {
      playlist.students.push(...newStudents);
      await playlist.save();
    }

    // Add playlist to students' playlists
    await Promise.all(students.map(async (student) => {
      if (!student.playlists) {
        student.playlists = [];
      }
      if (!student.playlists.includes(playlistId)) {
        student.playlists.push(playlistId);
        await student.save();
      }
    }));

    res.json({
      success: true,
      message: `${newStudents.length} students added to playlist successfully`,
      data: {
        playlist: {
          id: playlist.id,
          title: playlist.title,
          description: playlist.description,
          totalStudents: playlist.students.length
        },
        addedStudents: students
          .filter(s => newStudents.includes(s._id.toString()))
          .map(s => ({
            id: s.id,
            name: s.name,
            email: s.email
          })),
        skippedStudents: students
          .filter(s => !newStudents.includes(s._id.toString()))
          .map(s => ({
            id: s.id,
            name: s.name,
            email: s.email
          }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding students to playlist',
      error: error.message
    });
  }
};

// Delete own account
exports.deleteAccount = async (req, res) => {
  try {
    const student = req.student;

    // const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Delete student's image if it exists
    if (student.image) {
      try {
        await fs.unlink(student.image);
      } catch (error) {
        console.error('Error deleting student image:', error);
      }
    }

    // Delete student's playlist contents
    await PlaylistContent.deleteMany({ student: studentId });

    // Delete student's notifications
    const Notification = require('../models/notification');
    await Notification.deleteMany({ student: studentId });

    // Delete student's course watches
    const CourseWatch = require('../models/courseWatch');
    await CourseWatch.deleteMany({ student: studentId });

    // Finally delete the student account
    await Student.findByIdAndDelete(studentId);

    res.json({
      success: true,
      message: 'Your account has been deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const student = req.student;
    const { newPassword } = req.body;

    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
        data: {}
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
        data: {}
      });
    }

    // Update password
    student.password = newPassword;
    await student.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
      data: {}
    });
  }
};
