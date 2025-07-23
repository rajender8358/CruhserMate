import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { MAIN_ROUTES } from './Routes';
import theme from '../assets/theme';
import { useAuth } from '../context/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name={MAIN_ROUTES.APP} component={AppNavigator} />
      ) : (
        <Stack.Screen name={MAIN_ROUTES.AUTH} component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
