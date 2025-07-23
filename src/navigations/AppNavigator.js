import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { APP_ROUTES } from './Routes';

// Import your app screens here
import TruckEntryScreen from '../screens/TruckEntryScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TrackScreen from '../screens/TrackScreen';
import MaterialRateScreen from '../screens/MaterialRateScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={APP_ROUTES.TRACK}
    >
      <Stack.Screen name={APP_ROUTES.TRACK} component={TrackScreen} />
      <Stack.Screen
        name={APP_ROUTES.TRUCK_ENTRY}
        component={TruckEntryScreen}
      />
      <Stack.Screen name={APP_ROUTES.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen
        name={APP_ROUTES.MATERIAL_RATES}
        component={MaterialRateScreen}
      />
      {/* Add other app screens here */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
