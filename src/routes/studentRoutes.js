const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const logger = require('../middleware/logger');

// Apply logger to all routes
router.use(logger);

// Public routes
router.post('/add-student', upload.single('image'), studentController.register);
router.post('/login', studentController.login);
router.get('/students', studentController.listStudents);

// Protected routes
router.get('/profile', auth, studentController.getProfile);
router.put('/profile', auth, upload.single('image'), studentController.updateProfile);

// Student management routes
router.post('/students/:id/block', studentController.blockStudent);
router.post('/students/:id/unblock', studentController.unblockStudent);
router.delete('/students/:id', studentController.deleteStudent);

// Test route
router.post("/test", (req, res) => {
    console.log('Test route body:', req.body);
    res.json({
        success: true,
        data: req.body,
        contentType: req.headers['content-type']
    });
});

module.exports = router;
