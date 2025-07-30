const mongoose = require('mongoose');
require('dotenv').config();

// Import the MaterialRate model
const MaterialRate = require('./src/models/MaterialRate');

const fixMaterialRatesIndex = async () => {
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

    // Clear all material rates
    console.log('🧹 Clearing all material rates...');
    const deleteResult = await MaterialRate.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} material rates`);

    // Drop the problematic index
    console.log('🔧 Dropping problematic index...');
    try {
      await MaterialRate.collection.dropIndex('materialType_1');
      console.log('✅ Dropped materialType_1 index');
    } catch (indexError) {
      console.log('ℹ️ Index materialType_1 does not exist or already dropped');
    }

    // Ensure the correct index exists
    console.log('🔧 Ensuring correct index exists...');
    await MaterialRate.collection.createIndex(
      { organization: 1, materialType: 1 },
      { unique: true, name: 'organization_materialType_unique' },
    );
    console.log('✅ Created organization_materialType_unique index');

    console.log('✅ Material rates index fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing material rates index:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
fixMaterialRatesIndex();
