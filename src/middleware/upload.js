const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = file.fieldname === 'video' ? 'uploads/videos' : 'uploads/images';
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}!`), false);
  }
};

// Create multer instance
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Wrapper function to handle multer errors
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      uploadMiddleware.single(fieldName)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
          });
        }
        next();
      });
    };
  },
  fields: (fields) => {
    return (req, res, next) => {
      uploadMiddleware.fields(fields)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
          });
        }
        next();
      });
    };
  }
};

module.exports = upload;
