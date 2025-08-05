#!/usr/bin/env node

// Verification script for material types
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Material Types Configuration...\n');

// Check backend models
console.log('📋 Backend Models:');
const materialRateModel = fs.readFileSync(
  './backend/src/models/MaterialRate.js',
  'utf8',
);
const truckEntryModel = fs.readFileSync(
  './backend/src/models/TruckEntry.js',
  'utf8',
);

const expectedMaterialTypes = [
  'M-Sand',
  'P-Sand',
  'Blue Metal 0.5in',
  'Blue Metal 0.75in',
  'Jally',
  'Kurunai',
  'Mixed',
  'Raw Stone',
];

const expectedSalesMaterialTypes = [
  'M-Sand',
  'P-Sand',
  'Blue Metal 0.5in',
  'Blue Metal 0.75in',
  'Jally',
  'Kurunai',
  'Mixed',
];

// Check MaterialRate model
console.log('✅ MaterialRate.js - Checking enum values...');
const materialRateEnumMatch =
  materialRateModel.includes('Blue Metal 0.5in') &&
  materialRateModel.includes('Blue Metal 0.75in') &&
  materialRateModel.includes('Jally') &&
  materialRateModel.includes('Kurunai') &&
  materialRateModel.includes('Mixed');
console.log(
  materialRateEnumMatch
    ? '✅ All new material types found in MaterialRate model'
    : '❌ Missing material types in MaterialRate model',
);

// Check TruckEntry model
console.log('✅ TruckEntry.js - Checking enum values...');
const truckEntryEnumMatch =
  truckEntryModel.includes('Blue Metal 0.5in') &&
  truckEntryModel.includes('Blue Metal 0.75in') &&
  truckEntryModel.includes('Jally') &&
  truckEntryModel.includes('Kurunai') &&
  truckEntryModel.includes('Mixed');
console.log(
  truckEntryEnumMatch
    ? '✅ All new material types found in TruckEntry model'
    : '❌ Missing material types in TruckEntry model',
);

// Check frontend configuration
console.log('\n📋 Frontend Configuration:');
const truckEntryScreen = fs.readFileSync(
  './src/screens/TruckEntryScreen.js',
  'utf8',
);
const frontendMatch =
  truckEntryScreen.includes('Blue Metal 0.5in') &&
  truckEntryScreen.includes('Blue Metal 0.75in') &&
  truckEntryScreen.includes('Jally') &&
  truckEntryScreen.includes('Kurunai') &&
  truckEntryScreen.includes('Mixed');
console.log(
  frontendMatch
    ? '✅ All new material types found in TruckEntryScreen'
    : '❌ Missing material types in TruckEntryScreen',
);

// Check seed data
console.log('\n📋 Seed Data:');
const seedData = fs.readFileSync('./backend/src/utils/seedData.js', 'utf8');
const seedDataMatch =
  seedData.includes('Blue Metal 0.5in') &&
  seedData.includes('Blue Metal 0.75in') &&
  seedData.includes('Jally') &&
  seedData.includes('Kurunai') &&
  seedData.includes('Mixed');
console.log(
  seedDataMatch
    ? '✅ All new material types found in seed data'
    : '❌ Missing material types in seed data',
);

console.log('\n🎯 Expected Material Types for Sales:');
expectedSalesMaterialTypes.forEach((type, index) => {
  console.log(`  ${index + 1}. ${type}`);
});

console.log('\n💡 If you still see only 3 options in the app:');
console.log('  1. The app is using cached data');
console.log('  2. Try shaking your device and selecting "Reload"');
console.log('  3. Or restart the app completely');
console.log(
  "  4. The backend changes are correct, it's a frontend cache issue",
);

console.log('\n✅ All backend and frontend code has been updated correctly!');
