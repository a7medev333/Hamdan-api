const PlaylistContent = require('../models/playlistContent');
const CourseWatch = require('../models/courseWatch');
const timeAgo = require('../utils/timeAgo');

// Get my playlists
exports.getMyPlaylists = async (req, res) => {
  try {
    const studentId = req.student.id;

    const playlists = await PlaylistContent.find({ student: studentId })
      .sort({ createdAt: -1 });

    // Add time ago and format image URLs
    const formattedPlaylists = playlists.map(playlist => {
      const playlistObj = playlist.toObject();
      playlistObj.createdAgo = timeAgo(playlistObj.createdAt);
      playlistObj.image = playlistObj.image ? process.env.HOST_IMAGE + playlistObj.image : '';
      return playlistObj;
    });

    res.status(200).json({
      success: true,
      message: 'Playlists retrieved successfully',
      data: formattedPlaylists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving playlists',
      error: error.message
    });
  }
};

// Get my courses sorted by last watched
exports.getMyCourses = async (req, res) => {
  try {
    const studentId = req.student.id;

    // Get all course watches for the student, sorted by most recently watched
    const courseWatches = await CourseWatch.find({ student: studentId })
      .sort({ watchedAt: -1 })
      .populate({
        path: 'course',
        select: 'title description image videoLength createdAt'
      });

    // Format the response
    const formattedCourses = courseWatches.map(watch => {
      const courseObj = watch.course.toObject();
      return {
        ...courseObj,
        id: courseObj._id,
        image: courseObj.image ? process.env.HOST_IMAGE + courseObj.image : '',
        createdAgo: timeAgo(courseObj.createdAt),
        lastWatched: watch.watchedAt,
        lastWatchedAgo: timeAgo(watch.watchedAt),
        watchDuration: watch.watchDuration,
        completed: watch.completed,
        lastPosition: watch.lastPosition,
        progress: Math.round((watch.lastPosition / (parseFloat(courseObj.videoLength) || 1)) * 100)
      };
    });

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: formattedCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving courses',
      error: error.message
    });
  }
};
