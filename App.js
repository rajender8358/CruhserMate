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
import { resetAppData } from './src/utils/storageUtils';

const App = () => {
  useEffect(() => {
    // Initialize API service on app startup
    const initializeApp = async () => {
      try {
        // TEMPORARY: Force clear storage to fix JSON parsing issues
        await resetAppData();

        await apiService.initialize();
      } catch (error) {
        // Handle initialization error silently
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
