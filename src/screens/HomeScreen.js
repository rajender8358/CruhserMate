import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../assets/theme';
import Routes from '../navigations/Routes';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CrusherMate</Text>
        <Text style={styles.headerSubtitle}>Track your truck operations</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate(Routes.TRACK)}
        >
          <Text style={styles.buttonIcon}>📋</Text>
          <Text style={styles.buttonText}>Today's Track</Text>
          <Text style={styles.buttonSubtext}>
            View and manage today's entries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate(Routes.TRUCK_ENTRY)}
        >
          <Text style={styles.buttonIcon}>🚛</Text>
          <Text style={styles.buttonText}>Add Entry</Text>
          <Text style={styles.buttonSubtext}>Record new truck operation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={() => navigation.navigate(Routes.DASHBOARD)}
        >
          <Text style={styles.buttonIcon}>📊</Text>
          <Text style={[styles.buttonText, styles.tertiaryText]}>
            Dashboard
          </Text>
          <Text style={[styles.buttonSubtext, styles.tertiaryText]}>
            View analytics and insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={() => navigation.navigate(Routes.REPORTS)}
        >
          <Text style={styles.buttonIcon}>📈</Text>
          <Text style={[styles.buttonText, styles.tertiaryText]}>Reports</Text>
          <Text style={[styles.buttonSubtext, styles.tertiaryText]}>
            Generate detailed reports
          </Text>
        </TouchableOpacity>
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
});

export default HomeScreen;
