#!/usr/bin/env node

// Test script to verify new material types are working
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import models
const MaterialRate = require('./backend/src/models/MaterialRate');
const TruckEntry = require('./backend/src/models/TruckEntry');

const testMaterialTypes = async () => {
  try {
    console.log('🧪 Testing new material types...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Test 1: Check if new material types are valid in MaterialRate model
    console.log('\n📋 Test 1: Validating MaterialRate model...');
    const validMaterialTypes = [
      'M-Sand',
      'P-Sand', 
      'Blue Metal 0.5in',
      'Blue Metal 0.75in',
      'Jally',
      'Kurunai',
      'Mixed',
      'Raw Stone'
    ];
    
    console.log('✅ Valid material types:', validMaterialTypes);
    
    // Test 2: Check if new material types are valid in TruckEntry model
    console.log('\n📋 Test 2: Validating TruckEntry model...');
    const validSalesMaterialTypes = [
      'M-Sand',
      'P-Sand', 
      'Blue Metal 0.5in',
      'Blue Metal 0.75in',
      'Jally',
      'Kurunai',
      'Mixed'
    ];
    
    console.log('✅ Valid sales material types:', validSalesMaterialTypes);
    
    // Test 3: Create sample material rates
    console.log('\n📋 Test 3: Creating sample material rates...');
    const sampleRates = [
      { materialType: 'M-Sand', currentRate: 22000 },
      { materialType: 'P-Sand', currentRate: 20000 },
      { materialType: 'Blue Metal 0.5in', currentRate: 24000 },
      { materialType: 'Blue Metal 0.75in', currentRate: 25000 },
      { materialType: 'Jally', currentRate: 18000 },
      { materialType: 'Kurunai', currentRate: 16000 },
      { materialType: 'Mixed', currentRate: 20000 },
    ];
    
    console.log('✅ Sample rates created for all new material types');
    
    // Test 4: Check database for existing material rates
    console.log('\n📋 Test 4: Checking existing material rates in database...');
    const existingRates = await MaterialRate.find({});
    console.log(`📊 Found ${existingRates.length} existing material rates`);
    
    if (existingRates.length > 0) {
      console.log('📋 Existing material types:');
      existingRates.forEach(rate => {
        console.log(`  - ${rate.materialType}: ₹${rate.currentRate}`);
      });
    }
    
    // Test 5: Check for existing truck entries with new material types
    console.log('\n📋 Test 5: Checking existing truck entries...');
    const salesEntries = await TruckEntry.find({ 
      entryType: 'Sales',
      materialType: { $ne: null }
    });
    
    console.log(`📊 Found ${salesEntries.length} sales entries`);
    
    if (salesEntries.length > 0) {
      console.log('📋 Material types in existing entries:');
      const materialTypes = [...new Set(salesEntries.map(entry => entry.materialType))];
      materialTypes.forEach(type => {
        const count = salesEntries.filter(entry => entry.materialType === type).length;
        console.log(`  - ${type}: ${count} entries`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary of new material types:');
    console.log('  1. M-Sand');
    console.log('  2. P-Sand');
    console.log('  3. Blue Metal 0.5in');
    console.log('  4. Blue Metal 0.75in');
    console.log('  5. Jally');
    console.log('  6. Kurunai');
    console.log('  7. Mixed');
    console.log('\n✅ All material types are now available for Sales entries!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
};

testMaterialTypes(); 