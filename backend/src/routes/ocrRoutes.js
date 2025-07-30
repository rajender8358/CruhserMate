const express = require('express');
const router = express.Router();
const {
  extractTruckNumber,
  ocrHealth,
} = require('../controllers/ocrController');
const { authenticateToken } = require('../middleware/auth');

// OCR routes
router.post('/extract-truck-number', authenticateToken, extractTruckNumber);
router.get('/health', authenticateToken, ocrHealth);

module.exports = router;
