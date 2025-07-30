const express = require('express');
const router = express.Router();
const {
  getReportData,
  generateExportData,
  getReportTemplates,
  downloadExportedFile,
  generateDownloadableReport,
} = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Report routes (protected)
router.get('/data', authenticateToken, getReportData);
router.post('/export', authenticateToken, generateExportData);
router.get('/templates', authenticateToken, getReportTemplates);
router.get('/download/:fileId', authenticateToken, downloadExportedFile);

// Download routes
router.post('/download', authenticateToken, generateDownloadableReport);

module.exports = router;
