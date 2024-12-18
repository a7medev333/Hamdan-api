const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

const upload = require('../middleware/upload');
const logger = require('../middleware/logger');

// Apply logger to all routes
router.use(logger);

// Course routes
router.post('/courses', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), 
  courseController.createCourse
);

router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);

router.put('/courses/:id', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), 
  courseController.updateCourse
);

router.delete('/courses/:id', courseController.deleteCourse);

module.exports = router;
