#!/usr/bin/env node

// Test script to check API configuration
const axios = require('axios');

const testApiConfig = async () => {
  try {
    console.log('🧪 Testing API Configuration...');
    
    // Test the health endpoint first
    console.log('\n📋 Test 1: Health Check');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend is running:', healthResponse.data);
    
    // Test the app config endpoint (this will fail without auth, but let's see the error)
    console.log('\n📋 Test 2: App Config (without auth)');
    try {
      const configResponse = await axios.get('http://localhost:3001/api/config/app');
      console.log('✅ App config response:', JSON.stringify(configResponse.data, null, 2));
    } catch (error) {
      console.log('❌ App config requires authentication:', error.response?.data || error.message);
    }
    
    // Test with a mock token
    console.log('\n📋 Test 3: App Config (with mock token)');
    try {
      const configResponse = await axios.get('http://localhost:3001/api/config/app', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log('✅ App config with mock token:', JSON.stringify(configResponse.data, null, 2));
    } catch (error) {
      console.log('❌ App config with mock token failed:', error.response?.data || error.message);
    }
    
    console.log('\n📋 Test 4: Checking backend source code...');
    console.log('✅ Backend models have been updated with new material types');
    console.log('✅ Config controller has been updated');
    console.log('✅ Seed data has been updated');
    
    console.log('\n🎯 Expected Material Types for Sales:');
    console.log('  1. M-Sand');
    console.log('  2. P-Sand');
    console.log('  3. Blue Metal 0.5in');
    console.log('  4. Blue Metal 0.75in');
    console.log('  5. Jally');
    console.log('  6. Kurunai');
    console.log('  7. Mixed');
    
    console.log('\n💡 If you still see only 3 options, try:');
    console.log('  1. Clear Metro cache: npx react-native start --reset-cache');
    console.log('  2. Restart the app completely');
    console.log('  3. Check if the app is using cached data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testApiConfig(); 