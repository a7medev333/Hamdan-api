    const CourseWatch = require('../models/courseWatch');
const Course = require('../models/course');
const Student = require('../models/student');

// Start or resume watching a course
exports.startWatch = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id; // Using req.student from auth middleware

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find or create watch record
    let courseWatch = await CourseWatch.findOne({
      student: studentId,
      course: courseId
    });

    if (!courseWatch) {
      courseWatch = new CourseWatch({
        student: studentId,
        course: courseId,
        watchedAt: new Date(),
        watchDuration: 0,
        lastPosition: 0,
        completed: false
      });
    } else {
      courseWatch.watchedAt = new Date(); // Update last watched time
    }

    await courseWatch.save();

    res.json({
      success: true,
      message: 'Course watch session started',
      data: courseWatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error starting course watch',
      error: error.message
    });
  }
};

// Update watch progress
exports.updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { currentPosition, duration } = req.body;
    const studentId = req.student._id;

    if (typeof currentPosition !== 'number' || typeof duration !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Current position and duration must be numbers'
      });
    }

    let courseWatch = await CourseWatch.findOne({
      student: studentId,
      course: courseId
    });

    if (!courseWatch) {
      return res.status(404).json({
        success: false,
        message: 'Watch session not found'
      });
    }

    // Calculate the time watched in this session
    const previousPosition = courseWatch.lastPosition;
    const watchedDuration = Math.max(0, currentPosition - previousPosition);
    
    // Update course watch record
    courseWatch.lastPosition = currentPosition;
    courseWatch.watchDuration += watchedDuration;
    courseWatch.completed = currentPosition >= duration * 0.9; // Mark as completed if watched 90% of the course
    
    await courseWatch.save();

    // Update student's total watching hours
    if (watchedDuration > 0) {
      const watchedHours = watchedDuration / 3600; // Convert seconds to hours
      await Student.findByIdAndUpdate(
        studentId,
        { $inc: { totalWatchingHours: watchedHours } }
      );
    }

    res.json({
      success: true,
      message: 'Watch progress updated successfully',
      data: {
        lastPosition: courseWatch.lastPosition,
        watchDuration: courseWatch.watchDuration,
        completed: courseWatch.completed
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating watch progress',
      error: error.message
    });
  }
};

// Get course progress
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id;

    const courseWatch = await CourseWatch.findOne({
      student: studentId,
      course: courseId
    });

    if (!courseWatch) {
      return res.json({
        success: true,
        message: 'No watch record found',
        data: {
          lastPosition: 0,
          watchDuration: 0,
          completed: false
        }
      });
    }

    res.json({
      success: true,
      message: 'Course progress retrieved successfully',
      data: {
        lastPosition: courseWatch.lastPosition,
        watchDuration: courseWatch.watchDuration,
        completed: courseWatch.completed
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving course progress',
      error: error.message
    });
  }
};

// Get watch history for a student
exports.getWatchHistory = async (req, res) => {
  try {
    const studentId = req.student._id;

    const student = await Student.findById(studentId).select('totalWatchingHours');
    const watchHistory = await CourseWatch.find({ student: studentId })
      .populate('course', 'title description titleFile')
      .sort('-watchedAt');

    res.json({
      success: true,
      message: 'Watch history retrieved successfully',
      data: {
        totalWatchingHours: student.totalWatchingHours,
        history: watchHistory
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error retrieving watch history',
      error: error.message
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Get count of students currently watching (active in last 24 hours)
    const activeWatchingCount = await CourseWatch.countDocuments({
      watchedAt: { $gte: twentyFourHoursAgo }
    });

    // Get total number of students
    const totalStudents = await Student.countDocuments();

    // Calculate students not watching
    const notWatchingCount = totalStudents - activeWatchingCount;
    
    // Calculate percentage of students not watching
    const notWatchingPercentage = totalStudents > 0 
      ? ((notWatchingCount / totalStudents) * 100).toFixed(2)
      : 0;

    // Get top watched courses
    const topWatchedCourses = await CourseWatch.aggregate([
      {
        $group: {
          _id: '$course',
          totalWatches: { $sum: 1 },
          totalDuration: { $sum: '$watchDuration' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $unwind: '$courseDetails'
      },
      {
        $project: {
          courseName: '$courseDetails.name',
          totalWatches: 1,
          totalDuration: 1
        }
      },
      {
        $sort: { totalWatches: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get students with most watch time
    const topStudents = await Student.find()
      .sort({ totalWatchingHours: -1 })
      .limit(5)
      .select('name email totalWatchingHours');

    // Get high viewership students (students who watched >80% of their enrolled courses)
    const highViewershipStudents = await CourseWatch.aggregate([
      {
        $group: {
          _id: '$student',
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          },
          totalCourses: { $sum: 1 }
        }
      },
      {
        $match: {
          totalCourses: { $gt: 0 }
        }
      },
      {
        $project: {
          student: '$_id',
          completionRate: {
            $multiply: [
              { $divide: ['$completedCourses', '$totalCourses'] },
              100
            ]
          },
          completedCourses: 1,
          totalCourses: 1
        }
      },
      {
        $match: {
          completionRate: { $gte: 80 }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $unwind: '$studentDetails'
      },
      {
        $project: {
          _id: 0,
          name: '$studentDetails.name',
          email: '$studentDetails.email',
          completionRate: 1,
          completedCourses: 1,
          totalCourses: 1
        }
      }
    ]);

    const highViewershipCount = highViewershipStudents.length;

    res.json({
      success: true,
      data: {
        activeWatchingCount,
        notWatchingCount,
        notWatchingPercentage,
        totalStudents,
        topWatchedCourses,
        topStudents,
        highViewership: {
          count: highViewershipCount,
          students: highViewershipStudents
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Get last watched course
exports.getLastWatchedCourse = async (req, res) => {
  try {
    const studentId = req.student._id;
    const { playlistId } = req.params;

    // Build the query
    const query = { student: studentId };

    // If playlistId is provided, filter courses by playlist
    let lastWatchedCourse;
    if (playlistId) {
      lastWatchedCourse = await CourseWatch.findOne(query)
        .sort({ watchedAt: -1 })
        .populate({
          path: 'course',
          match: { playlistId },
          select: 'title description name titleFile videoLink duration playlistId isLocked fields socialMedia'
        })
        .lean();

      // If no course found with the current playlist, return null
      if (!lastWatchedCourse || !lastWatchedCourse.course) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No courses watched in this playlist'
        });
      }
    } else {
      // If no playlistId, get the last watched course from any playlist
      lastWatchedCourse = await CourseWatch.findOne(query)
        .sort({ watchedAt: -1 })
        .populate('course')
        .lean();

      if (!lastWatchedCourse) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No courses watched yet'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        course: lastWatchedCourse.course,
        watchDuration: lastWatchedCourse.watchDuration,
        watchedAt: lastWatchedCourse.watchedAt,
        progress: lastWatchedCourse.progress,
        lastPosition: lastWatchedCourse.lastPosition,
        completed: lastWatchedCourse.completed
      }
    });
  } catch (error) {
    console.error('Error getting last watched course:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting last watched course',
      error: error.message
    });
  }
};
