const ocrService = require('../utils/ocrService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'ocr-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @desc    Extract truck number from image using OCR
// @route   POST /api/ocr/extract-truck-number
// @access  Private
const extractTruckNumber = asyncHandler(async (req, res) => {
  // Handle file upload
  upload.single('image')(req, res, async err => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: 'UPLOAD_ERROR',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
        error: 'NO_FILE',
      });
    }

    try {
      console.log(
        `🔍 Processing image for truck number extraction: ${req.file.path}`,
      );

      // Extract truck number using OCR
      const truckNumber = await ocrService.extractTruckNumber(req.file.path);

      // Clean up temporary file
      fs.unlink(req.file.path, unlinkErr => {
        if (unlinkErr) {
          console.error('⚠️ Failed to delete temporary file:', unlinkErr);
        }
      });

      if (truckNumber) {
        res.json({
          success: true,
          message: 'Truck number extracted successfully',
          data: {
            truckNumber: truckNumber,
            confidence: 'high', // You can add confidence scoring later
          },
        });
      } else {
        res.json({
          success: true,
          message: 'No truck number found in image',
          data: {
            truckNumber: null,
            confidence: 'none',
          },
        });
      }
    } catch (error) {
      // Clean up temporary file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, unlinkErr => {
          if (unlinkErr) {
            console.error('⚠️ Failed to delete temporary file:', unlinkErr);
          }
        });
      }

      console.error('❌ OCR processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process image',
        error: 'OCR_ERROR',
      });
    }
  });
});

// @desc    Health check for OCR service
// @route   GET /api/ocr/health
// @access  Private
const ocrHealth = asyncHandler(async (req, res) => {
  try {
    // Initialize OCR service to check if it's working
    await ocrService.initialize();

    res.json({
      success: true,
      message: 'OCR service is healthy',
      data: {
        status: 'healthy',
        initialized: ocrService.isInitialized,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'OCR service is not available',
      error: error.message,
    });
  }
});

module.exports = {
  extractTruckNumber,
  ocrHealth,
};
