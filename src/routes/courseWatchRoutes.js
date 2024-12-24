const express = require('express');
const router = express.Router();
const courseWatchController = require('../controllers/courseWatchController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware
const logger = require('../middleware/logger');

// Apply middleware
router.use(auth);
router.use(logger);

// Course watch routes
router.post('/courses/:courseId/watch', courseWatchController.startWatch);
router.put('/courses/:courseId/watch', courseWatchController.updateProgress);
router.get('/courses/:courseId/progress', courseWatchController.getCourseProgress);
router.get('/watch-history', courseWatchController.getWatchHistory);
router.get('/dashboard-stats', courseWatchController.getDashboardStats);
router.get('/last-watched/:playlistId?', courseWatchController.getLastWatchedCourse);

module.exports = router;
