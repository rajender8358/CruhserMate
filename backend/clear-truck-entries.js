const mongoose = require('mongoose');
require('dotenv').config();

// Import the TruckEntry model
const TruckEntry = require('./src/models/TruckEntry');

const clearTruckEntries = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Get count before deletion
    const countBefore = await TruckEntry.countDocuments();
    console.log(`📊 Found ${countBefore} truck entries in database`);

    if (countBefore === 0) {
      console.log('ℹ️ No truck entries found to delete');
      return;
    }

    // Delete all truck entries
    const result = await TruckEntry.deleteMany({});

    console.log(`🗑️ Deleted ${result.deletedCount} truck entries successfully`);

    // Verify deletion
    const countAfter = await TruckEntry.countDocuments();
    console.log(`📊 Remaining truck entries: ${countAfter}`);

    if (countAfter === 0) {
      console.log('✅ All truck entries have been successfully deleted');
    } else {
      console.log('⚠️ Some entries may still remain');
    }
  } catch (error) {
    console.error('❌ Error clearing truck entries:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
clearTruckEntries();
