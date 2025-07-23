// Test script to verify backend connection
const API_BASE_URL = 'https://crushermate-backend.vercel.app/api';

async function testBackendConnection() {
  try {
    console.log('🔍 Testing backend connection...');
    console.log('🌐 API URL:', API_BASE_URL);

    // Test health endpoint
    const healthResponse = await fetch(
      `${API_BASE_URL.replace('/api', '')}/health`,
    );
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test config endpoint
    const configResponse = await fetch(`${API_BASE_URL}/config/app`);
    const configData = await configResponse.json();
    console.log('✅ Config check:', configData);

    console.log('🎉 Backend connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}

// Run the test
testBackendConnection();
