const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const auth = require('../middleware/auth');

// Protected routes - require authentication
router.use(auth);

// Get my playlists
router.get('/my-playlists', playlistController.getMyPlaylists);

// Get my courses sorted by last watched
router.get('/my-courses', playlistController.getMyCourses);

module.exports = router;
