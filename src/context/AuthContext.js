import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

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
      const storedUser = await AsyncStorage.getItem('user');
      console.log('🔍 AuthContext - Stored user data:', storedUser);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
          await apiService.setToken(token); // Set token for future requests
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log(
            '✅ User authenticated from storage:',
            parsedUser.username,
            'Role:',
            parsedUser.role,
          );
        } else {
          console.log('❌ No token found, logging out');
          await logout(); // Clean up if token is missing
        }
      } else {
        console.log('❌ No stored user data found');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
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
      console.log('🔍 AuthContext - Login called with userData:', userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', token);
      await apiService.setToken(token); // Update token in ApiService instance
      setUser(userData);
      setIsAuthenticated(true);
      console.log(
        '✅ Login successful, auth state updated for:',
        userData.username,
        'Role:',
        userData.role,
      );
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await apiService.clearToken(); // Clear token in ApiService instance
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout successful, auth state cleared');
    } catch (error) {
      console.error('❌ Error during logout:', error);
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
