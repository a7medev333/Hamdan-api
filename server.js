const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./src/config/db');
const studentRoutes = require('./src/routes/studentRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const playlistContentRoutes = require('./src/routes/playlistContentRoutes');
const courseWatchRoutes = require('./src/routes/courseWatchRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', studentRoutes);
app.use('/api', courseRoutes);
app.use('/api', playlistContentRoutes);
app.use("/api", courseWatchRoutes);
app.use("/api", settingsRoutes);
app.use("/api", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
