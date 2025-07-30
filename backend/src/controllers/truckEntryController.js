const TruckEntry = require('../models/TruckEntry');
const MaterialRate = require('../models/MaterialRate');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { body, validationResult, query } = require('express-validator');
const { deleteImage, extractPublicId } = require('../middleware/uploadImage');
const mongoose = require('mongoose');

// Validation rules
const createTruckEntryValidation = [
  body('truckNumber')
    .notEmpty()
    .withMessage('Truck number is required')
    .custom(value => {
      // Convert to uppercase and remove spaces
      const truckNumber = value.toString().toUpperCase().replace(/\s/g, '');

      // More flexible validation - allow any alphanumeric format
      // Minimum 5 characters, maximum 15 characters
      if (truckNumber.length < 5 || truckNumber.length > 15) {
        throw new Error('Truck number must be between 5 and 15 characters');
      }

      // Allow letters and numbers only
      const pattern = /^[A-Z0-9]+$/;
      if (!pattern.test(truckNumber)) {
        throw new Error('Truck number can only contain letters and numbers');
      }

      return true;
    }),
  body('truckName')
    .notEmpty()
    .withMessage('Truck name is required')
    .isLength({ max: 20 })
    .withMessage('Truck name cannot exceed 20 characters')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Truck name can only contain alphabets and spaces'),
  body('entryType')
    .isIn(['Sales', 'Raw Stone'])
    .withMessage('Entry type must be either Sales or Raw Stone'),
  body('units').custom(value => {
    // Handle both string and number values from multipart form data
    const unitsValue = parseFloat(value);
    if (isNaN(unitsValue) || unitsValue < 0.1 || unitsValue > 100) {
      throw new Error('Units must be between 0.1 and 100');
    }
    return true;
  }),
  body('ratePerUnit').custom(value => {
    // Handle both string and number values from multipart form data
    const rateValue = parseFloat(value);
    if (isNaN(rateValue) || rateValue < 1) {
      throw new Error('Rate per unit must be greater than 0');
    }
    return true;
  }),
  body('materialType')
    .optional()
    .isIn(['M-Sand', 'P-Sand', 'Blue Metal'])
    .withMessage('Material type must be M-Sand, P-Sand, or Blue Metal'),
];

const updateTruckEntryValidation = [
  body('truckNumber')
    .optional()
    .custom(value => {
      if (!value) return true; // Optional field
      // Convert to uppercase and remove spaces
      const truckNumber = value.toString().toUpperCase().replace(/\s/g, '');

      // More flexible validation - allow any alphanumeric format
      // Minimum 5 characters, maximum 15 characters
      if (truckNumber.length < 5 || truckNumber.length > 15) {
        throw new Error('Truck number must be between 5 and 15 characters');
      }

      // Allow letters and numbers only
      const pattern = /^[A-Z0-9]+$/;
      if (!pattern.test(truckNumber)) {
        throw new Error('Truck number can only contain letters and numbers');
      }

      return true;
    }),
  body('truckName')
    .optional()
    .notEmpty()
    .withMessage('Truck name is required')
    .isLength({ max: 20 })
    .withMessage('Truck name cannot exceed 20 characters')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Truck name can only contain alphabets and spaces'),
  body('entryType')
    .optional()
    .isIn(['Sales', 'Raw Stone'])
    .withMessage('Entry type must be either Sales or Raw Stone'),
  body('units')
    .optional()
    .custom(value => {
      if (!value) return true; // Optional field
      // Handle both string and number values from multipart form data
      const unitsValue = parseFloat(value);
      if (isNaN(unitsValue) || unitsValue < 0.1 || unitsValue > 100) {
        throw new Error('Units must be between 0.1 and 100');
      }
      return true;
    }),
  body('ratePerUnit')
    .optional()
    .custom(value => {
      if (!value) return true; // Optional field
      // Handle both string and number values from multipart form data
      const rateValue = parseFloat(value);
      if (isNaN(rateValue) || rateValue < 1) {
        throw new Error('Rate per unit must be greater than 0');
      }
      return true;
    }),
  body('materialType')
    .optional()
    .isIn(['M-Sand', 'P-Sand', 'Blue Metal'])
    .withMessage('Material type must be M-Sand, P-Sand, or Blue Metal'),
];

// @desc    Create new truck entry
// @route   POST /api/truck-entries
// @access  Private
const createTruckEntry = asyncHandler(async (req, res) => {
  const { organizationId, id: userId } = req.user;
  const {
    truckNumber,
    truckName,
    entryType,
    materialType,
    units,
    ratePerUnit,
    entryDate,
    entryTime,
    notes,
  } = req.body;

  console.log('🕐 Debug - Backend received entryTime:', entryTime);
  console.log(
    '📥 Debug - Backend received request body:',
    JSON.stringify(req.body, null, 2),
  );
  console.log('🚛 Debug - Truck number received:', truckNumber);
  console.log('🚛 Debug - Truck name received:', truckName);
  console.log('📝 Debug - Entry type received:', entryType);
  console.log('📦 Debug - Material type received:', materialType);
  console.log('⚖️ Debug - Units received:', units);
  console.log('💰 Debug - Rate per unit received:', ratePerUnit);

  let truckImage = null;
  if (req.file) {
    truckImage = req.file.path; // Path from multer upload
  }

  // Basic validation
  if (!truckNumber || !truckName || !entryType || !units || !ratePerUnit) {
    console.log('❌ Validation failed - Missing required fields');
    console.log('  - truckNumber:', !!truckNumber);
    console.log('  - truckName:', !!truckName);
    console.log('  - entryType:', !!entryType);
    console.log('  - units:', !!units);
    console.log('  - ratePerUnit:', !!ratePerUnit);
    throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  // Auto-generate entry time in IST if not provided
  let finalEntryTime = entryTime;
  if (!entryTime) {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    );
    finalEntryTime = istTime.toTimeString().slice(0, 5); // HH:MM format in IST
    console.log('🕐 Debug - Auto-generated entry time:', finalEntryTime);
  }

  const newEntry = await TruckEntry.create({
    organization: organizationId,
    userId,
    truckNumber: truckNumber.toString().toUpperCase().replace(/\s/g, ''), // Always uppercase
    truckName,
    entryType,
    materialType,
    units,
    ratePerUnit,
    entryDate,
    entryTime: finalEntryTime, // Use auto-generated time
    truckImage,
    notes,
  });

  console.log('✅ Debug - Created entry with entryTime:', newEntry.entryTime);

  res.status(201).json({
    success: true,
    message: 'Truck entry created successfully',
    data: {
      truckEntry: newEntry,
    },
  });
});

// @desc    Get all truck entries (with filtering)
// @route   GET /api/truck-entries
// @access  Private
const getAllTruckEntries = asyncHandler(async (req, res) => {
  const { organizationId, id: userId, role } = req.user;
  const {
    page = 1,
    limit = 10,
    sortBy = 'entryDate',
    sortOrder = 'desc',
    ...queryFilters
  } = req.query;

  const filter = {
    organization: new mongoose.Types.ObjectId(organizationId),
    status: 'active',
  };

  // User-specific filtering
  if (role !== 'owner') {
    filter.userId = new mongoose.Types.ObjectId(userId);
  } else if (queryFilters.userId) {
    filter.userId = new mongoose.Types.ObjectId(queryFilters.userId);
  }

  // Other filters from query
  if (queryFilters.truckNumber) {
    filter.truckNumber = { $regex: queryFilters.truckNumber, $options: 'i' };
  }
  if (queryFilters.entryType) {
    filter.entryType = queryFilters.entryType;
  }
  if (queryFilters.materialType) {
    filter.materialType = queryFilters.materialType;
  }
  if (queryFilters.startDate && queryFilters.endDate) {
    filter.entryDate = {
      $gte: new Date(queryFilters.startDate),
      $lte: new Date(queryFilters.endDate),
    };
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { [sortBy]: sortOrder },
    populate: 'userId',
  };

  const result = await TruckEntry.paginate(filter, options);

  res.json({
    success: true,
    data: result.docs,
    pagination: {
      totalDocs: result.totalDocs,
      limit: result.limit,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
});

// @desc    Get a single truck entry by ID
// @route   GET /api/truck-entries/:id
// @access  Private
const getTruckEntry = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { id } = req.params;

  const entry = await TruckEntry.findOne({
    _id: id,
    organization: organizationId,
    status: 'active',
  }).populate('userId', 'username email');

  if (!entry) {
    throw new AppError('Truck entry not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: entry,
  });
});

// @desc    Update a truck entry by ID
// @route   PUT /api/truck-entries/:id
// @access  Private
const updateTruckEntry = asyncHandler(async (req, res) => {
  const { organizationId, id: userId, role } = req.user;
  const { id } = req.params;

  const entry = await TruckEntry.findOne({
    _id: id,
    organization: organizationId,
    status: 'active',
  });

  if (!entry) {
    throw new AppError('Truck entry not found', 404, 'NOT_FOUND');
  }

  // Check ownership
  if (role !== 'owner' && entry.userId.toString() !== userId) {
    throw new AppError(
      'You are not authorized to update this entry',
      403,
      'ACCESS_DENIED',
    );
  }

  // Update fields
  const {
    truckNumber,
    truckName,
    entryType,
    materialType,
    units,
    ratePerUnit,
    entryDate,
    entryTime,
    notes,
  } = req.body;

  if (truckNumber) entry.truckNumber = truckNumber;
  if (truckName) entry.truckName = truckName;
  if (entryType) entry.entryType = entryType;
  if (materialType) entry.materialType = materialType;
  if (units) entry.units = units;
  if (ratePerUnit) entry.ratePerUnit = ratePerUnit;
  if (entryDate) entry.entryDate = entryDate;
  if (entryTime) entry.entryTime = entryTime;
  if (notes) entry.notes = notes;

  if (req.file) {
    entry.truckImage = req.file.path;
  }

  const updatedEntry = await entry.save();

  res.json({
    success: true,
    message: 'Truck entry updated successfully',
    data: {
      truckEntry: updatedEntry,
    },
  });
});

// @desc    Delete a truck entry by ID (soft delete)
// @route   DELETE /api/truck-entries/:id
// @access  Private
const deleteTruckEntry = asyncHandler(async (req, res) => {
  const { organizationId, id: userId, role } = req.user;
  const { id } = req.params;

  const entry = await TruckEntry.findOne({
    _id: id,
    organization: organizationId,
    status: 'active',
  });

  if (!entry) {
    throw new AppError('Truck entry not found', 404, 'NOT_FOUND');
  }

  // Check ownership
  if (role !== 'owner' && entry.userId.toString() !== userId) {
    throw new AppError(
      'You are not authorized to delete this entry',
      403,
      'ACCESS_DENIED',
    );
  }

  await entry.softDelete();

  res.json({
    success: true,
    message: 'Truck entry deleted successfully',
    data: null,
  });
});

// @desc    Get truck entries summary
// @route   GET /api/truck-entries/summary
// @access  Private
const getTruckEntriesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  // Build filter
  const filter = { status: 'active' };

  // Role-based filtering
  if (req.user.role !== 'owner') {
    filter.userId = req.user.id;
  } else if (userId) {
    filter.userId = userId;
  }

  // Date range
  if (startDate || endDate) {
    filter.entryDate = {};
    if (startDate) filter.entryDate.$gte = new Date(startDate);
    if (endDate) filter.entryDate.$lte = new Date(endDate);
  }

  const summary = await TruckEntry.getSummaryByDateRange(
    startDate || new Date(new Date().getFullYear(), 0, 1), // Start of year if not provided
    endDate || new Date(), // Today if not provided
    req.user.role !== 'owner' ? { userId: req.user.id } : {},
  );

  res.json({
    success: true,
    data: {
      summary,
    },
  });
});

module.exports = {
  createTruckEntry,
  getAllTruckEntries,
  getTruckEntry,
  updateTruckEntry,
  deleteTruckEntry,
  getTruckEntriesSummary,
  createTruckEntryValidation,
  updateTruckEntryValidation,
};
