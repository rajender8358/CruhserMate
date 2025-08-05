// API Configuration
import { Platform } from 'react-native';

// Production URL - Deployed on Vercel
const PRODUCTION_URL = 'https://crushermate-backend.vercel.app/api';

// Use production URL for all environments
let API_BASE_URL = PRODUCTION_URL;

import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        this.token = token;
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize API service:', error);
    }
  }

  async setToken(token) {
    this.token = token;
    try {
      if (token) {
        await AsyncStorage.setItem('userToken', token);
      } else {
        await AsyncStorage.removeItem('userToken');
      }
    } catch (error) {
      console.error('❌ Failed to save token to storage:', error);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      // Handle error silently
    }
  }

  // Debug method to check token status
  async debugTokenStatus() {
    const storedToken = await AsyncStorage.getItem('userToken');
    return {
      stored: !!storedToken,
      memory: !!this.token,
      initialized: this.initialized,
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = {};

    // Only set Content-Type for JSON requests, not for multipart form data
    if (
      !options.headers ||
      !options.headers['Content-Type'] ||
      options.headers['Content-Type'] === 'application/json'
    ) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
    }

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (options.body) {
      requestOptions.body = options.body;
    }

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 30000); // 30 seconds timeout
      });

      const response = await Promise.race([
        fetch(url, requestOptions),
        timeoutPromise,
      ]);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
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
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth APIs
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // App Configuration APIs
  async getAppConfig() {
    return this.request('/config/app');
  }

  async getMaterialRates() {
    return this.request('/config/material-rates');
  }

  async updateMaterialRates(rates) {
    return this.request('/config/material-rates', {
      method: 'PUT',
      body: JSON.stringify(rates),
    });
  }

  // Truck Entry APIs
  async createTruckEntry(entryData, imageUri = null) {
    if (imageUri) {
      // Handle image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'truck-image.jpg',
      });

      // Add other entry data
      Object.keys(entryData).forEach(key => {
        formData.append(key, entryData[key]);
      });

      return this.request('/truck-entries', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return this.request('/truck-entries', {
        method: 'POST',
        body: JSON.stringify(entryData || {}),
      });
    }
  }

  async getTruckEntries(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams
      ? `/truck-entries?${queryParams}`
      : '/truck-entries';
    return this.request(endpoint);
  }

  async updateTruckEntry(id, entryData) {
    return this.request(`/truck-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteTruckEntry(id) {
    return this.request(`/truck-entries/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboardSummary(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams
      ? `/dashboard/summary?${queryParams}`
      : '/dashboard/summary';
    return this.request(endpoint);
  }

  // Report APIs
  async generateReport(exportOptions) {
    const response = await fetch(`${this.baseURL}/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(exportOptions),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const responseData = await response.json();

    return {
      success: true,
      data: {
        downloadUrl: responseData.downloadUrl,
        token: responseData.token,
      },
    };
  }

  async downloadReport(token) {
    const response = await fetch(`${this.baseURL}/reports/download/${token}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed! status: ${response.status}`);
    }

    return response.blob();
  }

  // Expenses APIs
  async createOtherExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async getOtherExpenses(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/expenses?${queryParams}` : '/expenses';
    return this.request(endpoint);
  }

  async updateOtherExpense(id, expenseData) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteOtherExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getOtherExpensesSummary(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams
      ? `/expenses/summary?${queryParams}`
      : '/expenses/summary';
    return this.request(endpoint);
  }
}

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
