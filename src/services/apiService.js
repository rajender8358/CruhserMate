// API Configuration
import { Platform } from 'react-native';

const PRODUCTION_URL = 'http://18.215.242.150:3000/api/';
const API_BASE_URL = PRODUCTION_URL;

import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.initialized = false;
  }

  getAbsoluteBaseURL() {
    const base = this.baseURL || '';
    if (typeof base === 'string' && base.startsWith('http')) {
      return base;
    }
    // Fallback to production if base is missing or relative
    return PRODUCTION_URL;
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
    // Ensure token is loaded from storage before first request
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (e) {
        // proceed; initialize handles its own errors
      }
    }
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = {
      'User-Agent': 'CrusherMate/1.0 (React Native)',
    };

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

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('🔍 JSON Parse Error:', jsonError);
        // Try to get the raw text to see what we're getting
        const rawText = await response.text();
        console.error(
          '🔍 Raw response (first 500 chars):',
          rawText.substring(0, 500),
        );
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          const authError = new Error(data.message || 'Authentication failed');
          authError.name = 'AuthError';
          authError.status = response.status;
          throw authError;
        }
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      // Re-throw auth errors as-is
      if (error.name === 'AuthError') {
        throw error;
      }
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

  // Organization APIs
  async getOrganizations() {
    const res = await this.request('/organizations');
    return {
      ...res,
      data: res?.data?.organizations ?? res?.data ?? [],
    };
  }

  // App Configuration APIs
  async getAppConfig() {
    const res = await this.request('/config/app');
    return {
      ...res,
      data: res?.data?.config ?? res?.data ?? {},
    };
  }

  async getMaterialRates(entryType) {
    const endpoint = entryType
      ? `/material-rates?entryType=${encodeURIComponent(entryType)}`
      : '/material-rates';
    const res = await this.request(endpoint);
    // Backend returns an array under data; normalize it
    return {
      ...res,
      data: res?.data ?? [],
    };
  }

  async updateMaterialRates(rates) {
    // Fallback bulk update: send as POST (align with spec's POST semantics)
    return this.request('/material-rates', {
      method: 'POST',
      body: JSON.stringify(rates),
    });
  }

  async updateMaterialRate(rateData) {
    // Normalize payload for backend compatibility
    // Backend expects: { materialType, rate }
    // Accepts client: { entryType, materialType, ratePerUnit | rate | currentRate }
    const payload = {
      materialType: rateData.materialType,
      rate:
        rateData.rate != null
          ? rateData.rate
          : rateData.ratePerUnit != null
          ? rateData.ratePerUnit
          : rateData.currentRate,
    };
    return this.request('/material-rates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Truck Entry APIs
  async createTruckEntry(entryData, imageUri = null) {
    if (imageUri) {
      // Handle image upload
      const formData = new FormData();
      formData.append('truckImage', {
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
    const res = await this.request(endpoint);
    return {
      ...res,
      data: res?.data?.truckEntries ?? res?.data ?? [],
      pagination: res?.data?.pagination,
    };
  }

  async updateTruckEntry(id, entryData, imageUri = null) {
    if (imageUri) {
      const formData = new FormData();
      formData.append('truckImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'truck-image.jpg',
      });
      Object.keys(entryData).forEach(key => {
        formData.append(key, entryData[key]);
      });
      return this.request(`/truck-entries/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Map client fields to backend expected fields for update API
    const payload = {
      vehicleNumber: entryData.truckNumber || entryData.vehicleNumber,
      truckNumber: entryData.truckNumber || entryData.truckNo, // compatibility
      materialType: entryData.materialType,
      entryType:
        (entryData.entryType || '') === 'Raw Stone'
          ? 'RawStone'
          : entryData.entryType,
      // Send both legacy and new field names to ensure server updates correctly
      quantity:
        entryData.units != null ? Number(entryData.units) : entryData.quantity,
      units:
        entryData.units != null ? Number(entryData.units) : entryData.units,
      rate:
        entryData.ratePerUnit != null
          ? Number(entryData.ratePerUnit)
          : entryData.rate,
      ratePerUnit:
        entryData.ratePerUnit != null
          ? Number(entryData.ratePerUnit)
          : entryData.ratePerUnit,
      customerName: entryData.truckName || entryData.customerName,
      remarks: entryData.notes || entryData.remarks,
    };
    return this.request(`/truck-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTruckEntry(id) {
    return this.request(`/truck-entries/${id}`, {
      method: 'DELETE',
    });
  }

  async calculateTotal(entryData) {
    // This is a client-side calculation, but we can add a server endpoint if needed
    const { units, ratePerUnit } = entryData;
    return {
      success: true,
      data: {
        total: Math.round(units * ratePerUnit * 100) / 100,
      },
    };
  }

  async validateTruckEntry(entryData) {
    // This is a client-side validation, but we can add a server endpoint if needed
    const errors = [];

    if (!entryData.truckNumber?.trim()) {
      errors.push('Truck number is required');
    }
    if (!entryData.truckName?.trim()) {
      errors.push('Truck name is required');
    }
    if (!entryData.entryType?.trim()) {
      errors.push('Entry type is required');
    }
    if (entryData.entryType === 'Sales' && !entryData.materialType?.trim()) {
      errors.push('Material type is required for Sales entries');
    }
    if (!entryData.units || entryData.units <= 0) {
      errors.push('Valid units are required');
    }
    if (!entryData.ratePerUnit || entryData.ratePerUnit <= 0) {
      errors.push('Valid rate per unit is required');
    }

    return {
      success: errors.length === 0,
      data: {
        isValid: errors.length === 0,
        errors: errors,
        warnings: [],
      },
    };
  }

  // Dashboard APIs (timezone-aware)
  async getDashboardSummary(filters = {}) {
    const tz =
      filters.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const params = new URLSearchParams();
    if (tz) params.set('timezone', tz);

    // Prefer explicit custom date range
    if (filters.startDate && filters.endDate) {
      params.set('filterType', 'custom');
      params.set('startDate', filters.startDate);
      params.set('endDate', filters.endDate);
    } else if (filters.filterType) {
      // Pass through provided filterType (e.g., today, last_week)
      params.set('filterType', filters.filterType);
    } else if (
      filters.period &&
      ['today', 'last_week'].includes(filters.period)
    ) {
      // Map known period values to filterType if provided
      params.set('filterType', filters.period);
    } else {
      // Default to today if nothing specified
      params.set('filterType', 'today');
    }

    const endpoint = `/dashboard/?${params.toString()}`;
    const res = await this.request(endpoint);
    return {
      ...res,
      data: res?.data ?? {},
    };
  }

  // Deprecated report APIs removed (handled via business-reports URLs)

  getBusinessReportUrl(
    format,
    { startDate, endDate, organizationId, includeDetails = true, type },
  ) {
    const safeFormat =
      format && String(format).toLowerCase() === 'csv' ? 'csv' : 'pdf';
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (organizationId) params.set('organizationId', organizationId);
    if (includeDetails != null)
      params.set('includeDetails', includeDetails ? 'true' : 'false');
    // CSV requires a type parameter; default to 'all'
    if (safeFormat === 'csv') params.set('type', type || 'all');
    // Use platform-aware base URL (iOS uses localhost, Android uses 10.0.2.2)
    const absoluteBase = this.getAbsoluteBaseURL();
    return `${absoluteBase.replace(
      /\/$/,
      '',
    )}/business-reports/${safeFormat}?${params.toString()}`;
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
    const res = await this.request(endpoint);
    return {
      ...res,
      data: (res?.data?.expenses ?? res?.data ?? []).map(e => {
        const anyId = e?._id || e?.id || e?.expenseId || e?.expenseID;
        const normalizedId =
          typeof anyId === 'object'
            ? anyId?.$oid || anyId?.id || String(anyId)
            : anyId;
        return {
          ...e,
          _id: normalizedId,
          id: normalizedId,
        };
      }),
      pagination: res?.data?.pagination,
    };
  }

  async updateOtherExpense(id, expenseData) {
    const payload = {
      description: expenseData.description || expenseData.others,
      amount:
        expenseData.amount != null ? Number(expenseData.amount) : undefined,
      category: expenseData.category || expenseData.expensesName,
      date: expenseData.date || new Date().toISOString(),
    };
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
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
