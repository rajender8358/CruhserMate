const mongoose = require('mongoose');
require('dotenv').config();

// Import the Organization model
const Organization = require('./src/models/Organization');

const clearOrganizations = async () => {
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
    const countBefore = await Organization.countDocuments();
    console.log(`📊 Found ${countBefore} organizations in database`);

    if (countBefore === 0) {
      console.log('ℹ️ No organizations found to delete');
      return;
    }

    // Show organizations before deletion (for safety)
    const organizations = await Organization.find(
      {},
      'name email phone address',
    );
    console.log('🏢 Organizations to be deleted:');
    organizations.forEach(org => {
      console.log(`  - ${org.name} (${org.email})`);
    });

    // Delete all organizations
    const result = await Organization.deleteMany({});

    console.log(`🗑️ Deleted ${result.deletedCount} organizations successfully`);

    // Verify deletion
    const countAfter = await Organization.countDocuments();
    console.log(`📊 Remaining organizations: ${countAfter}`);

    if (countAfter === 0) {
      console.log('✅ All organizations have been successfully deleted');
    } else {
      console.log('⚠️ Some organizations may still remain');
    }
  } catch (error) {
    console.error('❌ Error clearing organizations:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
clearOrganizations();
