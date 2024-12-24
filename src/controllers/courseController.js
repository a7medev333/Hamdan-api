const Course = require('../models/course');
const fs = require('fs').promises;
const path = require('path');
const { getVideoDurationInSeconds } = require('get-video-duration');
const PlaylistContent = require('../models/playlistContent');
const CourseWatch = require('../models/courseWatch');
const timeAgo = require('../utils/timeAgo');

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

    // Get video duration
    let duration = 0;
    try {
      duration = await getVideoDurationInSeconds(videoLink);
      duration = Math.round(duration); // Round to nearest second
    } catch (error) {
      console.error('Error getting video duration:', error);
      // Continue with duration as 0 if there's an error
    }

    // Format duration for playlist display (HH:MM:SS)
    const formatDuration = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      const pad = (num) => num.toString().padStart(2, '0');
      
      if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
      }
      return `${pad(minutes)}:${pad(remainingSeconds)}`;
    };

    // Create new course
    const course = new Course({
      title,
      description,
      name,
      titleFile,
      videoLink,
      duration,
      playlistId,
      socialMedia: socialMedia || {}
    });

    await course.save();

    // Update playlist videoLength
    const playlist = await PlaylistContent.findById(playlistId);
    if (playlist) {
      playlist.videoLength = formatDuration(duration);
      await playlist.save();
    }

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
    const courses = await Course.find().populate('playlistId', 'title description image')
    
    
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
    const courseId = req.params.id;
    const {
      title,
      description,
      name,
      playlistId,
      socialMedia
    } = req.body;

    let course = await Course.findById(courseId);
    if (!course) {
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

    // Check if new title exists (if title is being changed)
    if (title && title !== course.title) {
      const existingCourse = await Course.findOne({ title });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course title already exists'
        });
      }
    }

    // Handle file updates
    const updates = {
      title,
      description,
      name,
      playlistId: playlistId || course.playlistId,
      socialMedia
    };

    if (req.files) {
      // Update image if provided
      if (req.files['image']) {
        updates.titleFile = req.files['image'][0].path;
        // Delete old image
        if (course.titleFile) {
          await fs.unlink(course.titleFile).catch(console.error);
        }
      }

      // Update video if provided
      if (req.files['video']) {
        updates.videoLink = req.files['video'][0].path;
        
        // Get new video duration
        try {
          updates.duration = Math.round(await getVideoDurationInSeconds(updates.videoLink));
          
          // Update playlist videoLength
          const playlist = await PlaylistContent.findById(updates.playlistId);
          if (playlist) {
            playlist.videoLength = formatDuration(updates.duration);
            await playlist.save();
          }
        } catch (error) {
          console.error('Error getting video duration:', error);
          // Keep existing duration if there's an error
          updates.duration = course.duration;
        }

        // Delete old video
        if (course.videoLink) {
          await fs.unlink(course.videoLink).catch(console.error);
        }
      }
    }

    // Update course
    course = await Course.findByIdAndUpdate(
      courseId,
      { $set: updates },
      { new: true }
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

// Get available courses (unlocked only)
exports.getAvailableCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isLocked: false })
      .populate('playlistId')
      .sort({ createdAt: -1 });
    // const courses = await Course.find({ isLocked: false })
    // .populate('playlistId', 'title description image')
    // .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available courses',
      error: error.message
    });
  }
};

// Toggle course lock status
exports.toggleCourseLock = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isLocked = !course.isLocked;
    await course.save();

    res.json({
      success: true,
      message: `Course ${course.isLocked ? 'locked' : 'unlocked'} successfully`,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling course lock status',
      error: error.message
    });
  }
};

// Get courses by playlist ID
exports.getCoursesByPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const studentId = req.student?._id; // Get student ID if authenticated
    
    // Find all courses for this playlist
    const courses = await Course.find({ playlistId })
      .sort({ createdAt: -1 });

    // Get the playlist details
    const playlist = await PlaylistContent.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Get watched courses for the student if authenticated
    let watchedCourses = [];
    if (studentId) {
      watchedCourses = await CourseWatch.find({
        student: studentId,
        course: { $in: courses.map(c => c._id) }
      }).select('course');
    }

    // Create a Set of watched course IDs for faster lookup
    const watchedCourseIds = new Set(watchedCourses.map(w => w.course.toString()));

    // Format courses with all fields
    const formattedCourses = courses.map(course => {
      const courseObj = course.toObject();
      return {
        id: courseObj._id,
        title: courseObj.title,
        description: courseObj.description,
        name: courseObj.name,
        titleFile: courseObj.titleFile,
        videoLink: courseObj.videoLink,
        duration: courseObj.duration,
        playlistId: courseObj.playlistId,
        isLocked: courseObj.isLocked,
        isWatched: studentId ? watchedCourseIds.has(courseObj._id.toString()) : false,
        socialMedia: {
          whatsapp: courseObj.socialMedia?.whatsapp || null,
          telegram: courseObj.socialMedia?.telegram || null
        },
        createdAt: courseObj.createdAt,
        createdAgo: timeAgo(courseObj.createdAt),
        updatedAt: courseObj.updatedAt,
        updatedAgo: timeAgo(courseObj.updatedAt)
      };
    });

    res.json({
      success: true,
      data: {
        playlist: {
          id: playlist._id,
          title: playlist.title,
          description: playlist.description,
          image: playlist.image ? process.env.HOST_IMAGE + playlist.image : '',
          videoLength: playlist.videoLength,
          createdAt: playlist.createdAt,
          createdAgo: timeAgo(playlist.createdAt)
        },
        courses: formattedCourses,
        totalCourses: formattedCourses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};
