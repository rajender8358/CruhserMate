const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./src/models/User');

const clearUsers = async () => {
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
    const countBefore = await User.countDocuments();
    console.log(`📊 Found ${countBefore} users in database`);

    if (countBefore === 0) {
      console.log('ℹ️ No users found to delete');
      return;
    }

    // Show users before deletion (for safety)
    const users = await User.find({}, 'username email role');
    console.log('👥 Users to be deleted:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
    });

    // Confirm deletion
    console.log('\n⚠️ WARNING: This will delete ALL users from the database!');
    console.log('This action cannot be undone.');

    // Delete all users
    const result = await User.deleteMany({});

    console.log(`🗑️ Deleted ${result.deletedCount} users successfully`);

    // Verify deletion
    const countAfter = await User.countDocuments();
    console.log(`📊 Remaining users: ${countAfter}`);

    if (countAfter === 0) {
      console.log('✅ All users have been successfully deleted');
      console.log(
        '⚠️ Note: You will need to create new users to access the app',
      );
    } else {
      console.log('⚠️ Some users may still remain');
    }
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
clearUsers();
