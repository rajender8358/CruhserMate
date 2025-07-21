import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Routes from './Routes';

// Import your app screens here
import HomeScreen from '../screens/HomeScreen';
import TruckEntryScreen from '../screens/TruckEntryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.HOME} component={HomeScreen} />
      <Stack.Screen name={Routes.TRUCK_ENTRY} component={TruckEntryScreen} />
      {/* Add other app screens here */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
