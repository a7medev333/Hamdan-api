const express = require('express');
const router = express.Router();
const playlistContentController = require('../controllers/playlistContentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const logger = require('../middleware/logger');

// Apply logger to all routes
router.use(logger);

// Public routes
router.get('/playlists', playlistContentController.listPlaylistContents);
router.get('/playlists/:id', playlistContentController.getPlaylistContent);

// Protected routes
router.use(auth);

// Playlist management
router.post('/playlists', upload.single('image'), playlistContentController.createPlaylistContent);
router.put('/playlists/:id', upload.single('image'), playlistContentController.updatePlaylistContent);
router.delete('/playlists/:id', playlistContentController.deletePlaylistContent);

// Get playlist courses
router.get('/playlists/:playlistId/courses', playlistContentController.getPlaylistCourses);

// Cart management
router.post('/playlists/:playlistId/cart', playlistContentController.addToCart);
router.delete('/playlists/:playlistId/cart', playlistContentController.removeFromCart);
router.get('/cart', playlistContentController.getCart);

module.exports = router;
