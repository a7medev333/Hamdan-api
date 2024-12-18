const express = require('express');
const router = express.Router();
const playlistContentController = require('../controllers/playlistContentController');
const upload = require('../middleware/upload');
const logger = require('../middleware/logger');

// Apply logger to all routes
router.use(logger);

// Playlist content routes
router.post('/playlist-contents', upload.single('image'), playlistContentController.createPlaylistContent);
router.get('/playlist-contents', playlistContentController.listPlaylistContents);
router.get('/playlist-contents/:id', playlistContentController.getPlaylistContent);
router.put('/playlist-contents/:id', upload.single('image'), playlistContentController.updatePlaylistContent);
router.delete('/playlist-contents/:id', playlistContentController.deletePlaylistContent);

module.exports = router;
