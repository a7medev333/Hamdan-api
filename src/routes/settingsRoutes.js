const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const logger = require('../middleware/logger');

// Apply logger to all routes
router.use(logger);

// Public route to get settings
router.get('/settings', settingsController.getSettings);

// Protected routes (require authentication)
router.use(auth);

// Settings management
router.put('/settings', settingsController.updateSettings);

// Welcome messages
router.post('/settings/send-welcome', settingsController.sendWelcomeMessage);
router.post('/settings/send-welcome/playlist/:playlistId', settingsController.sendWelcomeMessageByPlaylist);

// Get student notifications
router.get('/settings/notifications/:studentId', settingsController.getStudentNotifications);

module.exports = router;
