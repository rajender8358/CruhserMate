import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../navigations/Routes';

const { width } = Dimensions.get('window');

const TrackScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [todayEntries, setTodayEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Load data if authenticated
      loadUserData();
      loadTodayEntries();
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
    }
  };

  // Focus effect to reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTodayEntries();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'user');
        setUserDetails({
          name: user.username || 'User',
          email: user.email,
          role: user.role === 'user' ? 'User' : 'Owner',
          company: 'CrusherMate Operations',
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadTodayEntries = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Token is automatically loaded by apiService

      // Get today's date for filtering
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      console.log('📅 Loading entries for:', todayString);

      // Get truck entries from API
      const response = await apiService.getTruckEntries({
        startDate: todayString,
        endDate: todayString,
        limit: 50,
      });

      if (response.success) {
        setTodayEntries(response.data.entries || []);
        console.log('✅ Loaded entries:', response.data.entries?.length || 0);
      } else {
        setErrorMessage('Failed to load entries. Please try again.');
        setTodayEntries([]);
      }
    } catch (error) {
      console.error('❌ Error loading entries:', error);

      let errorMsg = 'Failed to load entries. Please check your connection.';
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMsg = 'Network error. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timed out. Please try again.';
        } else {
          errorMsg = error.message;
        }
      }

      setErrorMessage(errorMsg);
      setTodayEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTodayEntries();
  };

  const handleEditEntry = entry => {
    // Navigate to TruckEntry screen with pre-filled data for editing
    navigation.navigate(APP_ROUTES.TRUCK_ENTRY, {
      editMode: true,
      entryData: entry,
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to access the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear stored authentication data
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.removeItem('userData');

              // Clear token from API service
              await apiService.clearToken();

              // Use AuthContext to handle logout
              await logout();

              console.log('🔓 User logged out successfully');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.', [
                { text: 'OK' },
              ]);
            }
          },
        },
      ],
    );
  };

  const handleDeleteEntry = entryId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting entry:', entryId);

              const response = await apiService.deleteTruckEntry(entryId);

              if (response.success) {
                // Remove from local state
                setTodayEntries(prev =>
                  prev.filter(entry => entry._id !== entryId),
                );
                Alert.alert(
                  'Entry Deleted',
                  'The entry has been deleted successfully.',
                  [{ text: 'OK' }],
                );

                console.log('✅ Entry deleted successfully');
              } else {
                setErrorMessage(response.message || 'Failed to delete entry');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);

              let errorMsg = 'Failed to delete entry. Please try again.';
              if (error.message) {
                if (error.message.includes('Network')) {
                  errorMsg = 'Network error. Please check your connection.';
                } else if (error.message.includes('timeout')) {
                  errorMsg = 'Request timed out. Please try again.';
                } else {
                  errorMsg = error.message;
                }
              }

              setErrorMessage(errorMsg);
            }
          },
        },
      ],
    );
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalAmount = () => {
    return todayEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  };

  const getSalesCount = () => {
    return todayEntries.filter(entry => entry.entryType === 'Sales').length;
  };

  const getRawStoneCount = () => {
    return todayEntries.filter(entry => entry.entryType === 'Raw Stone').length;
  };

  const renderEntryCard = (entry, index) => {
    const isLastCard = index === todayEntries.length - 1;

    return (
      <View
        key={entry._id}
        style={[styles.entryCard, isLastCard && styles.lastCard]}
      >
        {/* Header with truck number and time */}
        <View style={styles.entryHeader}>
          <View style={styles.truckInfo}>
            <Text style={styles.truckNumber}>{entry.truckNumber}</Text>
            <Text style={styles.entryTime}>{entry.entryTime}</Text>
          </View>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditEntry(entry)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEntry(entry._id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entry details */}
        <View style={styles.entryDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <View
              style={[
                styles.entryTypeBadge,
                entry.entryType === 'Sales'
                  ? styles.salesBadge
                  : styles.rawStoneBadge,
              ]}
            >
              <Text
                style={[
                  styles.entryTypeText,
                  entry.entryType === 'Sales'
                    ? styles.salesText
                    : styles.rawStoneText,
                ]}
              >
                {entry.entryType}
              </Text>
            </View>
          </View>

          {entry.materialType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Material:</Text>
              <Text style={styles.detailValue}>{entry.materialType}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Units:</Text>
            <Text style={styles.detailValue}>{entry.units} tons</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(entry.ratePerUnit)}/ton
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(entry.totalAmount)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Today's Summary</Text>
      <View style={styles.summaryContent}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{todayEntries.length}</Text>
            <Text style={styles.summaryLabel}>Total Entries</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{getSalesCount()}</Text>
            <Text style={styles.summaryLabel}>Sales</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{getRawStoneCount()}</Text>
            <Text style={styles.summaryLabel}>Raw Stone</Text>
          </View>
        </View>
        <View style={styles.totalAmountContainer}>
          <Text style={styles.totalAmountLabel}>Total Amount</Text>
          <Text style={styles.totalAmountValue}>
            {formatCurrency(getTotalAmount())}
          </Text>
        </View>
      </View>

      {/* Owner Dashboard Button */}
      {userRole === 'owner' && (
        <View style={styles.ownerButtonsContainer}>
          <TouchableOpacity
            style={styles.ownerButton}
            onPress={() => navigation.navigate(APP_ROUTES.DASHBOARD)}
          >
            <Text style={styles.ownerButtonIcon}>📊</Text>
            <Text style={styles.ownerButtonText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      {/* User Details Card */}
      <View style={styles.userDetailsCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {userDetails?.name?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userDetails?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{userDetails?.email || ''}</Text>
          <Text style={styles.userRole}>
            {userDetails?.role || 'User'} •{' '}
            {userDetails?.company || 'CrusherMate'}
          </Text>
        </View>
      </View>

      {/* No Entries Message */}
      <View style={styles.noEntriesSection}>
        <Text style={styles.emptyStateIcon}>📝</Text>
        <Text style={styles.emptyStateTitle}>No entries today</Text>
        <Text style={styles.emptyStateText}>
          You haven't made any truck entries today.{'\n'}
          Tap "Add Entry" to get started.
        </Text>
      </View>

      {/* Add Entry Button */}
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate(APP_ROUTES.TRUCK_ENTRY)}
      >
        <Text style={styles.emptyStateButtonIcon}>+</Text>
        <Text style={styles.emptyStateButtonText}>Add Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Add Entry Button and Logout */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Today's Track</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerLogoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.headerLogoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {errorMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {todayEntries.length > 0 ? (
          <>
            {renderSummary()}
            <View style={styles.entriesContainer}>
              <Text style={styles.entriesTitle}>Today's Entries</Text>
              {todayEntries.map((entry, index) =>
                renderEntryCard(entry, index),
              )}
            </View>
          </>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading today's entries...</Text>
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Add Entry Button - Fixed at bottom */}
      {todayEntries.length > 0 && (
        <View style={styles.addEntryContainer}>
          <TouchableOpacity
            style={styles.addEntryButton}
            onPress={() => navigation.navigate(APP_ROUTES.TRUCK_ENTRY)}
          >
            <Text style={styles.addEntryButtonIcon}>+</Text>
            <Text style={styles.addEntryButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: theme.COLORS.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.white,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    color: theme.COLORS.white,
    opacity: 0.9,
  },

  headerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLogoutButtonIcon: {
    fontSize: 14,
    color: theme.COLORS.white,
    marginRight: 4,
  },
  headerLogoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.secondary,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonIcon: {
    fontSize: 24,
    color: theme.COLORS.white,
    marginRight: 8,
    fontWeight: 'bold',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120, // Extra padding to ensure content is not hidden behind Add Entry button
  },
  summaryContainer: {
    backgroundColor: theme.COLORS.lightGray,
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.primary,
    marginBottom: 16,
  },
  summaryContent: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.COLORS.gray,
  },
  totalAmountContainer: {
    backgroundColor: theme.COLORS.white,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 16,
    color: theme.COLORS.gray,
    marginBottom: 4,
  },
  totalAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  ownerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  ownerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary, // Blue theme color
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ownerButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  ownerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  entriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  entriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.COLORS.primary,
    marginBottom: 16,
  },
  entryCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.secondary,
  },
  lastCard: {
    marginBottom: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckInfo: {
    flex: 1,
  },
  truckNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  entryTime: {
    fontSize: 14,
    color: theme.COLORS.gray,
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: theme.COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: theme.COLORS.text,
    fontWeight: '500',
  },
  entryTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  salesBadge: {
    backgroundColor: '#E8F5E8',
  },
  rawStoneBadge: {
    backgroundColor: '#FFF4E6',
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  salesText: {
    color: '#2E7D32',
  },
  rawStoneText: {
    color: '#F57C00',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.lightGray,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  userDetailsCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.COLORS.gray,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: theme.COLORS.secondary,
    fontWeight: '500',
  },
  noEntriesSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateButtonIcon: {
    fontSize: 24,
    color: theme.COLORS.white,
    marginRight: 8,
    fontWeight: 'bold',
  },
  emptyStateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: theme.COLORS.gray,
  },
  successContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  addEntryContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addEntryButtonIcon: {
    fontSize: 20,
    color: theme.COLORS.white,
    marginRight: 8,
    fontWeight: 'bold',
  },
  addEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.COLORS.white,
  },
});

export default TrackScreen;
