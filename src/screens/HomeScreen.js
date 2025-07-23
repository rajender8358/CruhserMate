import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import { APP_ROUTES } from '../navigations/Routes';

const HomeScreen = ({ navigation }) => {
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'user');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CrusherMate</Text>
        <Text style={styles.headerSubtitle}>Track your truck operations</Text>
        {userRole === 'owner' && (
          <Text style={styles.ownerBadge}>👑 Owner Dashboard</Text>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate(APP_ROUTES.TRACK)}
        >
          <Text style={styles.buttonIcon}>📋</Text>
          <Text style={styles.buttonText}>Today's Track</Text>
          <Text style={styles.buttonSubtext}>
            View and manage today's entries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate(APP_ROUTES.TRUCK_ENTRY)}
        >
          <Text style={styles.buttonIcon}>🚛</Text>
          <Text style={styles.buttonText}>Add Entry</Text>
          <Text style={styles.buttonSubtext}>Record new truck operation</Text>
        </TouchableOpacity>

        {/* Owner-only features */}
        {userRole === 'owner' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.ownerButton]}
            onPress={() => navigation.navigate(APP_ROUTES.DASHBOARD)}
          >
            <Text style={styles.buttonIcon}>📊</Text>
            <Text style={styles.buttonText}>Owner Dashboard</Text>
            <Text style={styles.buttonSubtext}>
              Analytics and business insights
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.COLORS.gray,
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: theme.COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: theme.COLORS.secondary,
  },
  tertiaryButton: {
    backgroundColor: theme.COLORS.lightGray,
  },
  ownerButton: {
    backgroundColor: '#8B5CF6', // Purple color for owner features
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.white,
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: theme.COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  tertiaryText: {
    color: theme.COLORS.primary,
    opacity: 1,
  },
  ownerBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
