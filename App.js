/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigations/MainNavigator';
import apiService from './src/services/apiService';
import { AuthProvider } from './src/context/AuthContext';

const App = () => {
  useEffect(() => {
    // Initialize API service on app startup
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing CrusherMate app...');
        await apiService.initialize();
        console.log('✅ API service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize API service:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
