/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import TruckEntryScreen from './src/screens/TruckEntryScreen';
import TrackScreen from './src/screens/TrackScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import HomeScreen from './src/screens/HomeScreen';
import Routes from './src/navigations/Routes';
import apiService from './src/services/apiService';

const Stack = createStackNavigator();

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={Routes.LOGIN}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name={Routes.LOGIN} component={LoginScreen} />
        <Stack.Screen name={Routes.REGISTER} component={RegisterScreen} />
        <Stack.Screen name={Routes.TRUCK_ENTRY} component={TruckEntryScreen} />
        <Stack.Screen name={Routes.TRACK} component={TrackScreen} />
        <Stack.Screen name={Routes.DASHBOARD} component={DashboardScreen} />
        <Stack.Screen name={Routes.REPORTS} component={ReportsScreen} />
        <Stack.Screen name={Routes.HOME} component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
