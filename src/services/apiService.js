// API Configuration
import { Platform } from 'react-native';

// Production URL - Deployed on Vercel
const PRODUCTION_URL = 'https://crushermate-backend.vercel.app/api';

// Development URLs
const DEV_URL = __DEV__ ? 'http://192.168.29.242:3000/api' : PRODUCTION_URL;

// For physical device testing in development, use your computer's IP address
// Replace 192.168.29.242 with your actual computer's IP address
const DEV_PHYSICAL_URL = 'http://192.168.29.242:3000/api';

// Use production URL for release builds, development URL for debug builds
let API_BASE_URL = __DEV__ ? DEV_URL : PRODUCTION_URL;

console.log('🌐 API Service - Using URL:', API_BASE_URL);
console.log('🔧 Development mode:', __DEV__);

export { API_BASE_URL };

import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.initialized = false;
  }

  // Initialize token from AsyncStorage
  async initialize() {
    if (this.initialized) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(
        '🔍 Initializing API service, token found:',
        token ? 'Yes' : 'No',
      );
      if (token) {
        this.token = token;
        console.log(
          '🔑 Token loaded from storage:',
          token.substring(0, 20) + '...',
        );
      } else {
        console.log('⚠️ No token found in storage');
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to load token from storage:', error);
    }
  }

  // Set authentication token and save to storage
  async setToken(token) {
    this.token = token;
    try {
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        console.log('🔑 Token saved to storage');
      } else {
        await AsyncStorage.removeItem('userToken');
        console.log('🔑 Token removed from storage');
      }
    } catch (error) {
      console.error('❌ Failed to save token to storage:', error);
    }
  }

  // Clear authentication token
  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem('userToken');
      console.log('🔑 Token cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear token from storage:', error);
    }
  }

  // Debug method to check token status
  async debugTokenStatus() {
    const storedToken = await AsyncStorage.getItem('userToken');
    console.log('🔍 Debug Token Status:');
    console.log('  - Stored token:', storedToken ? 'Yes' : 'No');
    console.log('  - Memory token:', this.token ? 'Yes' : 'No');
    console.log('  - Initialized:', this.initialized);
    if (storedToken) {
      console.log('  - Token preview:', storedToken.substring(0, 20) + '...');
    }
    return {
      stored: !!storedToken,
      memory: !!this.token,
      initialized: this.initialized,
    };
  }

  // Helper method to make API requests
  async request(endpoint, options = {}) {
    // Ensure token is loaded
    await this.initialize();

    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders = {};

    // Only set Content-Type for JSON requests, not for multipart form data
    if (
      !options.headers ||
      !options.headers['Content-Type'] ||
      !options.headers['Content-Type'].includes('multipart/form-data')
    ) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
      console.log(
        '🔑 Using token for request:',
        this.token.substring(0, 20) + '...',
      );
    } else {
      console.log('⚠️ No token available for request');
      console.log('🔍 Current token state:', this.token);
    }

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Note: AbortSignal.timeout() is not available in React Native
      // We'll handle timeouts differently
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      console.log('📤 Request Headers:', requestOptions.headers);
      if (requestOptions.body) {
        console.log('📤 Request Body:', requestOptions.body);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout after 30 seconds'));
        }, 30000); // 30 seconds timeout
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, requestOptions),
        timeoutPromise,
      ]);

      console.log(`📥 Response Status: ${response.status}`);

      const data = await response.json();
      console.log('📥 Response Data:', data);

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        url: url,
        method: options.method || 'GET',
      });
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await fetch(
        `${this.baseURL.replace('/api', '')}/health`,
      );
      const data = await response.json();
      console.log('🔍 Connection test result:', data);
      return data;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Save token after successful login
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify-token');
  }

  // Configuration APIs
  async getAppConfig() {
    return this.request('/config/app');
  }

  async getCurrentRates(units = 1) {
    return this.request(`/config/rates?units=${units}`);
  }

  async calculateTotal(units, ratePerUnit, materialType = null) {
    return this.request('/config/calculate', {
      method: 'POST',
      body: JSON.stringify({ units, ratePerUnit, materialType }),
    });
  }

  async validateTruckEntry(entryData) {
    console.log(
      '🔍 API Service - validateTruckEntry data:',
      JSON.stringify(entryData, null, 2),
    );
    return this.request('/config/validate', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  // Truck Entry APIs
  async createTruckEntry(entryData, imageFile = null) {
    if (imageFile) {
      // Handle multipart form data for image upload
      const formData = new FormData();

      // Add entry data
      if (entryData && typeof entryData === 'object') {
        Object.keys(entryData).forEach(key => {
          if (entryData[key] !== undefined && entryData[key] !== null) {
            formData.append(key, entryData[key]);
          }
        });
      }

      // Add image file
      formData.append('truckImage', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'truck-image.jpg',
      });

      return this.request('/truck-entries', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Regular JSON request without image
      console.log(
        '🔍 API Service - createTruckEntry data:',
        JSON.stringify(entryData || {}, null, 2),
      );
      return this.request('/truck-entries', {
        method: 'POST',
        body: JSON.stringify(entryData || {}),
      });
    }
  }

  async getTruckEntries(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/truck-entries?${queryParams}`);
  }

  async getTruckEntry(id) {
    return this.request(`/truck-entries/${id}`);
  }

  async updateTruckEntry(id, entryData, imageFile = null) {
    if (imageFile) {
      // Handle multipart form data for image upload
      const formData = new FormData();

      // Add entry data
      if (entryData && typeof entryData === 'object') {
        Object.keys(entryData).forEach(key => {
          if (entryData[key] !== undefined && entryData[key] !== null) {
            formData.append(key, entryData[key]);
          }
        });
      }

      // Add image file
      formData.append('truckImage', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'truck-image.jpg',
      });

      return this.request(`/truck-entries/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Regular JSON request without image
      return this.request(`/truck-entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(entryData || {}),
      });
    }
  }

  async deleteTruckEntry(id) {
    return this.request(`/truck-entries/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getTruckEntriesSummary(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/truck-entries/summary?${queryParams}`);
  }

  async getDashboardSummary(
    period = 'month',
    userId = null,
    startDate = null,
    endDate = null,
  ) {
    const params = new URLSearchParams({ period });
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/dashboard/summary?${params}`);
  }

  async getFinancialMetrics(period = 'month', userId = null) {
    const params = new URLSearchParams({ period });
    if (userId) params.append('userId', userId);
    return this.request(`/dashboard/financial?${params}`);
  }

  async getOrganizations() {
    return this.request('/organizations');
  }

  // Report APIs
  async getReportData(filters) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/reports/data?${queryParams}`);
  }

  async generateDownloadableReport(exportOptions) {
    return this.request('/reports/download', {
      method: 'POST',
      body: JSON.stringify(exportOptions),
    });
  }

  async getReportTemplates() {
    return this.request('/reports/templates');
  }

  async exportData(exportOptions) {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_BASE_URL}/reports/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(exportOptions),
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (response.ok) {
      return response.json();
    }
    const errorData = await response.json();
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }

  // Material Rate APIs
  async getMaterialRates() {
    return this.request('/material-rates');
  }

  async updateMaterialRate(rateData) {
    return this.request('/material-rates', {
      method: 'POST',
      body: JSON.stringify(rateData),
    });
  }

  async getMaterialRateHistory(materialType, limit = 10) {
    return this.request(
      `/material-rates/history?materialType=${materialType}&limit=${limit}`,
    );
  }

  // OCR APIs
  async extractTruckNumberFromImage(imageFile) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: 'image/jpeg',
      name: 'truck-image.jpg',
    });

    return this.request('/ocr/extract-truck-number', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async ocrHealth() {
    return this.request('/ocr/health');
  }

  // User Profile APIs
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;

// Utility functions
export const formatCurrency = (amount, locale = 'en-IN', currency = 'INR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number, locale = 'en-IN') => {
  return new Intl.NumberFormat(locale).format(number);
};

export const calculateTotalAmount = (units, ratePerUnit) => {
  return Math.round(units * ratePerUnit * 100) / 100;
};
