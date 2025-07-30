const mongoose = require('mongoose');
require('dotenv').config();

// Import the MaterialRate model
const MaterialRate = require('./src/models/MaterialRate');

const clearMaterialRates = async () => {
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
    const countBefore = await MaterialRate.countDocuments();
    console.log(`📊 Found ${countBefore} material rates in database`);

    if (countBefore === 0) {
      console.log('ℹ️ No material rates found to delete');
      return;
    }

    // Show material rates before deletion (for safety)
    const materialRates = await MaterialRate.find(
      {},
      'materialType ratePerUnit effectiveDate',
    );
    console.log('💰 Material Rates to be deleted:');
    materialRates.forEach(rate => {
      console.log(
        `  - ${rate.materialType}: ₹${rate.ratePerUnit} (${rate.effectiveDate})`,
      );
    });

    // Delete all material rates
    const result = await MaterialRate.deleteMany({});

    console.log(
      `🗑️ Deleted ${result.deletedCount} material rates successfully`,
    );

    // Verify deletion
    const countAfter = await MaterialRate.countDocuments();
    console.log(`📊 Remaining material rates: ${countAfter}`);

    if (countAfter === 0) {
      console.log('✅ All material rates have been successfully deleted');
    } else {
      console.log('⚠️ Some material rates may still remain');
    }
  } catch (error) {
    console.error('❌ Error clearing material rates:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
clearMaterialRates();
