const TruckEntry = require('../models/TruckEntry');
const User = require('../models/User');
const MaterialRate = require('../models/MaterialRate');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { generatePdf, generateCsv } = require('../utils/exportGenerator');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const downloadTokens = new Map();

// @desc    Get report data with filters
// @route   GET /api/reports/data
// @access  Private
const getReportData = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    entryType,
    materialType,
    truckNumber,
    userId,
    groupBy = 'date', // date, truck, material, user
    sortBy = 'entryDate',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = req.query;

  // Build base filter
  const filter = { status: 'active' };

  // Role-based filtering
  if (req.user.role !== 'owner') {
    filter.userId = req.user.id;
  } else if (userId) {
    filter.userId = userId;
  }

  // Apply filters
  if (entryType) filter.entryType = entryType;
  if (materialType) filter.materialType = materialType;
  if (truckNumber) filter.truckNumber = truckNumber.toUpperCase();

  // Date range (required for reports)
  if (!startDate || !endDate) {
    throw new AppError(
      'Start date and end date are required for reports',
      400,
      'VALIDATION_ERROR',
    );
  }

  filter.entryDate = {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  };

  // Get detailed entries
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj = {};
  sortObj[sortBy] = sortDirection;

  const [entries, total] = await Promise.all([
    TruckEntry.find(filter)
      .populate('userId', 'username email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    TruckEntry.countDocuments(filter),
  ]);

  // Get summary for the filtered data
  const summary = await TruckEntry.getSummaryByDateRange(
    new Date(startDate),
    new Date(endDate),
    req.user.role !== 'owner'
      ? { userId: req.user.id }
      : userId
      ? { userId }
      : {},
  );

  // Get grouped data based on groupBy parameter
  let groupedData = [];

  if (groupBy === 'date') {
    groupedData = await TruckEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$entryDate' } },
          totalAmount: { $sum: '$totalAmount' },
          salesAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Sales'] }, '$totalAmount', 0],
            },
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Raw Stone'] }, '$totalAmount', 0],
            },
          },
          totalUnits: { $sum: '$units' },
          entryCount: { $sum: 1 },
        },
      },
      { $sort: { _id: sortDirection } },
    ]);
  } else if (groupBy === 'truck') {
    groupedData = await TruckEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$truckNumber',
          totalAmount: { $sum: '$totalAmount' },
          salesAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Sales'] }, '$totalAmount', 0],
            },
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Raw Stone'] }, '$totalAmount', 0],
            },
          },
          totalUnits: { $sum: '$units' },
          entryCount: { $sum: 1 },
          lastEntry: { $max: '$entryDate' },
        },
      },
      { $sort: { totalAmount: sortDirection } },
    ]);
  } else if (groupBy === 'material') {
    groupedData = await TruckEntry.aggregate([
      {
        $match: {
          ...filter,
          entryType: 'Sales',
          materialType: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$materialType',
          totalAmount: { $sum: '$totalAmount' },
          totalUnits: { $sum: '$units' },
          entryCount: { $sum: 1 },
          avgRate: { $avg: '$ratePerUnit' },
          minRate: { $min: '$ratePerUnit' },
          maxRate: { $max: '$ratePerUnit' },
        },
      },
      { $sort: { totalAmount: sortDirection } },
    ]);
  } else if (groupBy === 'user' && req.user.role === 'owner') {
    groupedData = await TruckEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          totalAmount: { $sum: '$totalAmount' },
          salesAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Sales'] }, '$totalAmount', 0],
            },
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$entryType', 'Raw Stone'] }, '$totalAmount', 0],
            },
          },
          totalUnits: { $sum: '$units' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          totalAmount: 1,
          salesAmount: 1,
          expenseAmount: 1,
          totalUnits: 1,
          entryCount: 1,
          netAmount: { $subtract: ['$salesAmount', '$expenseAmount'] },
        },
      },
      { $sort: { totalAmount: sortDirection } },
    ]);
  }

  // Calculate pagination
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      entries,
      summary,
      groupedData,
      filters: {
        startDate,
        endDate,
        entryType,
        materialType,
        truckNumber,
        userId,
        groupBy,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEntries: total,
        entriesPerPage: parseInt(limit),
      },
    },
  });
});

// @desc    Generate export data
// @route   POST /api/reports/export
// @access  Private
const generateExportData = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.body;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const filter = {
      status: 'active',
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
    if (req.user.role !== 'owner') {
      filter.userId = req.user.id;
    }

    const entries = await TruckEntry.find(filter)
      .populate('userId', 'username email')
      .sort({ entryDate: -1 });

    const summary = await TruckEntry.getSummaryByDateRange(
      new Date(startDate),
      new Date(endDate),
      filter,
    );

    const exportData = {
      reportInfo: {
        title: `CrusherMate Report (${format.toUpperCase()})`,
        generatedBy: req.user.username,
        dateRange: { startDate, endDate },
      },
      summary,
      entries: entries.map(entry => ({
        date: entry.entryDate.toISOString().split('T')[0],
        time: entry.entryTime,
        truckNumber: entry.truckNumber,
        entryType: entry.entryType,
        materialType: entry.materialType || 'N/A',
        units: entry.units,
        ratePerUnit: entry.ratePerUnit,
        totalAmount: entry.totalAmount,
      })),
    };

    let fileId;
    if (format === 'pdf') {
      fileId = await generatePdf(exportData);
    } else {
      fileId = await generateCsv(exportData);
    }

    const token = uuidv4();
    downloadTokens.set(token, fileId);

    // Token expires in 1 minute
    setTimeout(() => {
      downloadTokens.delete(token);
    }, 60000);

    res.json({
      success: true,
      message: `Export data generated successfully in ${format.toUpperCase()} format`,
      data: { token, fileId },
    });
  } catch (error) {
    console.error('--- EXPORT ERROR ---', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data.',
      error: error.message,
    });
  }
});

const downloadExportedFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { token } = req.query;
  const expectedFileId = downloadTokens.get(token);

  if (!expectedFileId || expectedFileId !== fileId) {
    throw new AppError('Invalid or expired download link', 403, 'FORBIDDEN');
  }

  // Invalidate the token
  downloadTokens.delete(token);

  const filePath = path.join(TEMP_DIR, fileId);

  if (await fs.pathExists(filePath)) {
    res.download(filePath, err => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      fs.remove(filePath);
    });
  } else {
    throw new AppError('File not found', 404, 'NOT_FOUND');
  }
});

// @desc    Get report templates
// @route   GET /api/reports/templates
// @access  Private
const getReportTemplates = asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'daily-summary',
      name: 'Daily Summary Report',
      description: 'Daily breakdown of all truck entries',
      defaultFilters: {
        groupBy: 'date',
        period: 'month',
      },
    },
    {
      id: 'material-analysis',
      name: 'Material Analysis Report',
      description: 'Analysis of sales by material type',
      defaultFilters: {
        entryType: 'Sales',
        groupBy: 'material',
      },
    },
    {
      id: 'truck-performance',
      name: 'Truck Performance Report',
      description: 'Performance analysis by truck number',
      defaultFilters: {
        groupBy: 'truck',
      },
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Complete financial overview',
      defaultFilters: {
        includeCharts: true,
      },
    },
  ];

  // Add user performance template for owners
  if (req.user.role === 'owner') {
    templates.push({
      id: 'user-performance',
      name: 'User Performance Report',
      description: 'Performance analysis by user',
      defaultFilters: {
        groupBy: 'user',
      },
    });
  }

  res.json({
    success: true,
    data: {
      templates,
    },
  });
});

// @desc    Generate downloadable report file
// @route   POST /api/reports/download
// @access  Private
const generateDownloadableReport = asyncHandler(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      format = 'pdf',
      reportType = 'dashboard',
    } = req.body;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const filter = {
      status: 'active',
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
    if (req.user.role !== 'owner') {
      filter.userId = req.user.id;
    }

    const entries = await TruckEntry.find(filter)
      .populate('userId', 'username email')
      .sort({ entryDate: -1 });

    const summary = await TruckEntry.getSummaryByDateRange(
      new Date(startDate),
      new Date(endDate),
      filter,
    );

    // Format data for export
    const reportData = entries.map(entry => ({
      date: entry.entryDate.toISOString().split('T')[0],
      time: entry.entryTime,
      entryType: entry.entryType,
      truckNumber: entry.truckNumber,
      materialType: entry.materialType || 'N/A',
      units: entry.units,
      rate: entry.ratePerUnit,
      total: entry.totalAmount,
    }));

    const filters = {
      period: reportType,
      startDate,
      endDate,
      materialFilter: 'All Materials',
      entryTypeFilter: 'All Types',
    };

    // Generate file content
    let fileContent, fileName, mimeType;

    if (format === 'csv') {
      const { generateCSVContent } = require('../utils/exportGenerator');
      fileContent = generateCSVContent(reportData, reportType, filters);
      fileName = `CrusherMate_${reportType}_Report_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      mimeType = 'text/csv';
    } else {
      const { generateHTMLContent } = require('../utils/exportGenerator');
      fileContent = generateHTMLContent(reportData, reportType, filters);
      fileName = `CrusherMate_${reportType}_Report_${
        new Date().toISOString().split('T')[0]
      }.html`;
      mimeType = 'text/html';
    }

    // Create temporary file
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, '../../temp');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, fileContent);

    // Generate a simple download token (timestamp + random string)
    const downloadToken =
      Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Store the token temporarily (in production, use Redis or similar)
    if (!global.downloadTokens) global.downloadTokens = new Map();
    global.downloadTokens.set(downloadToken, {
      filePath,
      fileName,
      createdAt: Date.now(),
      userId: req.user.id,
    });

    // Generate download URL with token
    const downloadUrl = `${req.protocol}://${req.get(
      'host',
    )}/api/reports/file/${encodeURIComponent(fileName)}?token=${downloadToken}`;

    res.json({
      success: true,
      message: `${format.toUpperCase()} report generated successfully`,
      data: {
        downloadUrl,
        fileName,
        fileSize: fileContent.length,
        entriesCount: entries.length,
        summary: {
          totalSales: summary.totalSales || 0,
          totalRawStone: summary.totalRawStone || 0,
          netProfit: (summary.totalSales || 0) - (summary.totalRawStone || 0),
        },
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    throw new AppError('Failed to generate report', 500);
  }
});

// @desc    Serve downloadable file
// @route   GET /api/reports/file/:filename
// @access  Public (for downloads with token)
const serveDownloadableFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    const { token } = req.query;
    const decodedFilename = decodeURIComponent(filename);

    if (!token) {
      throw new AppError('Download token is required', 401);
    }

    // Check if token is valid
    if (!global.downloadTokens || !global.downloadTokens.has(token)) {
      throw new AppError('Invalid or expired download token', 401);
    }

    const tokenData = global.downloadTokens.get(token);
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../temp', decodedFilename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }

    const ext = path.extname(decodedFilename).toLowerCase();
    let mimeType = 'application/octet-stream';

    if (ext === '.csv') {
      mimeType = 'text/csv';
    } else if (ext === '.html') {
      mimeType = 'text/html';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${decodedFilename}"`,
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up token and file after serving
    fileStream.on('end', () => {
      // Remove token
      global.downloadTokens.delete(token);

      // Delete file after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }, 60000); // Delete after 1 minute
    });
  } catch (error) {
    console.error('File serving error:', error);
    throw new AppError('Failed to serve file', 500);
  }
});

module.exports = {
  getReportData,
  generateExportData,
  getReportTemplates,
  downloadExportedFile,
  generateDownloadableReport,
  serveDownloadableFile,
};
