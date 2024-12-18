const Student = require('../models/student');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

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

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: students
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
      birthdate,
      email,
      courseName,
      otherFields
    } = req.body;

    // Validate required fields
    const requiredFields = ['username', 'password', 'name', 'phone', 'birthdate', 'email'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
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
          'Username already exists' : 'Email already exists'
      });
    }

    // Create new student
    const student = new Student({
      username,
      password,
      name,
      phone,
      birthdate,
      email,
      courseName,
      otherFields: new Map(Object.entries(otherFields || {}))
    });

    // If image was uploaded
    if (req.file) {
      student.image = req.file.path;
    }

    await student.save();
    
    const token = generateToken(student._id);
    res.status(201).json({
      success: true,
      data: {
        _id: student._id,
        username: student.username,
        name: student.name,
        email: student.email,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registering student',
      error: error.message
    });
  }
};

// Login student
exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    let { username, password } = req.body;

    // Try to parse the body if it's a string
    if (typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        username = parsedBody.username;
        password = parsedBody.password;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
        receivedData: req.body
      });
    }

    const student = await Student.findOne({ username });

    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
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
    res.json({
      success: true,
      data: {
        _id: student._id,
        username: student.username,
        name: student.name,
        email: student.email,
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
      _id: student._id,
      username: student.username,
      name: student.name,
      phone: student.phone,
      birthdate: student.birthdate,
      email: student.email,
      image: student.image,
      courseName: student.courseName,
      otherFields: Object.fromEntries(student.otherFields),
      createdAt: student.createdAt
    };
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
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
          await fs.unlink(student.image);
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
      _id: student._id,
      username: student.username,
      name: student.name,
      phone: student.phone,
      birthdate: student.birthdate,
      email: student.email,
      image: student.image,
      courseName: student.courseName,
      otherFields: Object.fromEntries(student.otherFields),
      createdAt: student.createdAt
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
        _id: student._id,
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
        _id: student._id,
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
