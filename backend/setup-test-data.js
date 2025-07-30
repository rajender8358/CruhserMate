const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');
const MaterialRate = require('./src/models/MaterialRate');

const setupTestData = async () => {
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

    // Clear existing data first
    console.log('🧹 Clearing existing data...');
    await Organization.deleteMany({});
    await User.deleteMany({});
    await MaterialRate.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Users first
    console.log('👥 Creating users...');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create owner users first (without organization)
    const sureshOwner = await User.create({
      username: 'suresh_owner',
      email: 'suresh.owner@crusher.com',
      password: hashedPassword,
      role: 'owner',
      firstName: 'Suresh',
      lastName: 'Kumar',
      phone: '+91-9876543210',
      isActive: true,
    });

    const rajOwner = await User.create({
      username: 'raj_owner',
      email: 'raj.owner@crusher.com',
      password: hashedPassword,
      role: 'owner',
      firstName: 'Raj',
      lastName: 'Sharma',
      phone: '+91-9876543211',
      isActive: true,
    });

    console.log('✅ Owner users created successfully');

    // Create Organizations with owners
    console.log('🏢 Creating organizations...');

    const sureshOrg = await Organization.create({
      name: "Suresh's Crusher",
      owner: sureshOwner._id,
      members: [sureshOwner._id],
    });

    const rajOrg = await Organization.create({
      name: "Raj's Crusher",
      owner: rajOwner._id,
      members: [rajOwner._id],
    });

    console.log('✅ Organizations created successfully');

    // Create additional users for each organization
    const sureshUser = await User.create({
      username: 'suresh_user',
      email: 'suresh.user@crusher.com',
      password: hashedPassword,
      role: 'user',
      organization: sureshOrg._id,
      firstName: 'Ramesh',
      lastName: 'Singh',
      phone: '+91-9876543212',
      isActive: true,
    });

    const rajUser = await User.create({
      username: 'raj_user',
      email: 'raj.user@crusher.com',
      password: hashedPassword,
      role: 'user',
      organization: rajOrg._id,
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+91-9876543213',
      isActive: true,
    });

    // Update organizations to include all members
    await Organization.findByIdAndUpdate(sureshOrg._id, {
      $push: { members: sureshUser._id },
    });

    await Organization.findByIdAndUpdate(rajOrg._id, {
      $push: { members: rajUser._id },
    });

    console.log('✅ Users created successfully');

    // Create Material Rates for Suresh's Crusher
    console.log("💰 Creating material rates for Suresh's Crusher...");

    const sureshRates = [];
    sureshRates.push(
      await MaterialRate.updateRate(
        sureshOrg._id,
        'M-Sand',
        1200,
        sureshOwner._id,
      ),
    );
    sureshRates.push(
      await MaterialRate.updateRate(
        sureshOrg._id,
        'P-Sand',
        1100,
        sureshOwner._id,
      ),
    );
    sureshRates.push(
      await MaterialRate.updateRate(
        sureshOrg._id,
        'Blue Metal',
        1400,
        sureshOwner._id,
      ),
    );
    sureshRates.push(
      await MaterialRate.updateRate(
        sureshOrg._id,
        'Raw Stone',
        800,
        sureshOwner._id,
      ),
    );

    // Create Material Rates for Raj's Crusher (different rates)
    console.log("💰 Creating material rates for Raj's Crusher...");

    const rajRates = [];
    rajRates.push(
      await MaterialRate.updateRate(rajOrg._id, 'M-Sand', 1350, rajOwner._id),
    );
    rajRates.push(
      await MaterialRate.updateRate(rajOrg._id, 'P-Sand', 1250, rajOwner._id),
    );
    rajRates.push(
      await MaterialRate.updateRate(
        rajOrg._id,
        'Blue Metal',
        1550,
        rajOwner._id,
      ),
    );
    rajRates.push(
      await MaterialRate.updateRate(rajOrg._id, 'Raw Stone', 950, rajOwner._id),
    );

    console.log('✅ Material rates created successfully');

    // Display summary
    console.log('\n📊 SETUP SUMMARY:');
    console.log('==================');

    console.log('\n🏢 Organizations:');
    console.log(`  - ${sureshOrg.name} (${sureshOrg.email})`);
    console.log(`  - ${rajOrg.name} (${rajOrg.email})`);

    console.log('\n👥 Users:');
    console.log("Suresh's Crusher:");
    console.log(`  - Owner: ${sureshOwner.username} (${sureshOwner.email})`);
    console.log(`  - User: ${sureshUser.username} (${sureshUser.email})`);
    console.log("Raj's Crusher:");
    console.log(`  - Owner: ${rajOwner.username} (${rajOwner.email})`);
    console.log(`  - User: ${rajUser.username} (${rajUser.email})`);

    console.log('\n💰 Material Rates:');
    console.log("Suresh's Crusher:");
    sureshRates.forEach(rate => {
      console.log(`  - ${rate.materialType}: ₹${rate.currentRate}`);
    });
    console.log("Raj's Crusher:");
    rajRates.forEach(rate => {
      console.log(`  - ${rate.materialType}: ₹${rate.currentRate}`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('All users have password: password123');
    console.log('\nRecommended test accounts:');
    console.log("  - suresh_owner / password123 (Owner - Suresh's Crusher)");
    console.log("  - raj_owner / password123 (Owner - Raj's Crusher)");
    console.log("  - suresh_user / password123 (User - Suresh's Crusher)");
    console.log("  - raj_user / password123 (User - Raj's Crusher)");

    console.log('\n✅ Test data setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
setupTestData();
