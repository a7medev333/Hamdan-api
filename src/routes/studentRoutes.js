const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const logger = require('../middleware/logger');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/students');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadMulter = multer({ storage: storage });

// Apply logger to all routes
router.use(logger);

// Public routes
router.post('/add-student', upload.single('image'), studentController.register);
router.post('/login', studentController.login);
router.get('/students', studentController.listStudents);

// Protected routes
router.use(auth);

// Student management
router.get('/profile', studentController.getProfile);
router.put('/profile', upload.single('image'), studentController.updateProfile);
router.put('/students/:id', studentController.updateStudent);
router.post('/students/:id/block', studentController.blockStudent);
router.post('/students/:id/unblock', studentController.unblockStudent);
router.delete('/students/:id', studentController.deleteStudent);
router.delete('/delete-account', studentController.deleteAccount);

// Playlist management
router.post('/students/:studentId/playlists/:playlistId', studentController.addToPlaylist);
router.post('/students/playlists/:playlistId/bulk', studentController.addMultipleToPlaylist);

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
