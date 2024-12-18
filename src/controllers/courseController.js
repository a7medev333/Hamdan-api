const Course = require('../models/course');
const fs = require('fs').promises;
const path = require('path');

// Create new course
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      name,
      playlistId,
      socialMedia
    } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'name', 'playlistId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Check if title already exists
    const existingCourse = await Course.findOne({ title });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course title already exists'
      });
    }

    // Get file paths from uploaded files
    const titleFile = req.files?.['image']?.[0]?.path || '';
    const videoLink = req.files?.['video']?.[0]?.path || '';

    // Validate required files
    if (!titleFile || !videoLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required files',
        missingFiles: [
          ...(!titleFile ? ['image'] : []),
          ...(!videoLink ? ['video'] : [])
        ]
      });
    }

    // Create new course
    const course = new Course({
      title,
      description,
      name,
      titleFile,
      videoLink,
      playlistId,
      socialMedia: socialMedia || {}
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    // Clean up uploaded files if there's an error
    if (req.files) {
      for (const fileArray of Object.values(req.files)) {
        for (const file of fileArray) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
    }

    res.status(400).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// Get all courses
exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('playlistId', 'title description image');
    
    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving courses',
      error: error.message
    });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('playlistId', 'title description image');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course retrieved successfully',
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving course',
      error: error.message
    });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const oldCourse = await Course.findById(req.params.id);

    if (!oldCourse) {
      // Clean up uploaded files
      if (req.files) {
        for (const fileArray of Object.values(req.files)) {
          for (const file of fileArray) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.error('Error deleting file:', unlinkError);
            }
          }
        }
      }

      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update file paths if new files are uploaded
    if (req.files?.['image']?.[0]) {
      updateData.titleFile = req.files['image'][0].path;
      // Delete old image file
      try {
        await fs.unlink(oldCourse.titleFile);
      } catch (unlinkError) {
        console.error('Error deleting old image:', unlinkError);
      }
    }

    if (req.files?.['video']?.[0]) {
      updateData.videoLink = req.files['video'][0].path;
      // Delete old video file
      try {
        await fs.unlink(oldCourse.videoLink);
      } catch (unlinkError) {
        console.error('Error deleting old video:', unlinkError);
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('playlistId', 'title description image');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    // Clean up newly uploaded files if there's an error
    if (req.files) {
      for (const fileArray of Object.values(req.files)) {
        for (const file of fileArray) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
    }

    res.status(400).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete associated files
    try {
      await fs.unlink(course.titleFile);
      await fs.unlink(course.videoLink);
    } catch (unlinkError) {
      console.error('Error deleting files:', unlinkError);
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};
