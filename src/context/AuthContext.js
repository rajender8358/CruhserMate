import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import {
  getStoredUser,
  getStoredToken,
  clearCorruptedData,
} from '../utils/storageUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // console.log('🔍 Checking auth status...');
      const parsedUser = await getStoredUser();
      const token = await getStoredToken();

      console.log('📱 Parsed user:', parsedUser);
      console.log('🔑 Token exists:', !!token);

      if (parsedUser && token) {
        await apiService.setToken(token); // Set token for future requests
        setUser(parsedUser);
        setIsAuthenticated(true);
        // console.log('✅ Auth successful');
      } else {
        // console.log('❌ No valid auth data, logging out');
        await logout(); // Clean up if data is missing
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      await logout(); // Clear state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', token);
      await apiService.setToken(token); // Update token in ApiService instance
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Handle error silently
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await apiService.clearToken(); // Clear token in ApiService instance
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Handle error silently
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
