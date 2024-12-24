const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

const upload = require('../middleware/upload');
const logger = require('../middleware/logger');
const auth = require('../middleware/auth');

// Apply logger to all routes
router.use(logger);

// Public routes
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);
router.get('/playlist/:playlistId/courses', courseController.getCoursesByPlaylist);

// Protected routes (require authentication)
router.use(auth);

// Admin only routes
router.get('/courses-available', courseController.getAvailableCourses);
router.post('/courses-toggle-lock/:id', courseController.toggleCourseLock);

// Course management routes
router.post('/courses',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), 
  courseController.createCourse
);

router.put('/courses/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), 
  courseController.updateCourse
);

router.delete('/courses/:id', courseController.deleteCourse);

module.exports = router;
