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
import { getStoredUser } from '../utils/storageUtils';
import { formatCurrency, formatISTTime12h } from '../utils/formatting';

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
      const user = await getStoredUser();
      if (user && typeof user === 'object') {
        setUserRole(user.role || 'user');
        setUserDetails({
          name: user.username || 'User',
          role: user.role === 'user' ? 'User' : 'Owner',
          company: user.organizationName || 'CrusherMate Operations',
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Set default values on error
      setUserRole('user');
      setUserDetails({
        name: 'User',
        role: 'User',
        company: 'Unknown Organization',
      });
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

      // Get truck entries and other expenses from API
      const [truckResponse, otherExpensesResponse] = await Promise.all([
        apiService.getTruckEntries({
          startDate: todayString,
          endDate: todayString,
          limit: 50,
        }),
        apiService.getOtherExpenses({
          startDate: todayString,
          endDate: todayString,
          limit: 50,
        }),
      ]);

      let allEntries = [];

      // Process truck entries
      if (truckResponse.success) {
        const truckEntries = truckResponse.data || [];
        console.log('truckEntries', truckEntries);
        const validTruckEntries = Array.isArray(truckEntries)
          ? truckEntries.filter(entry => entry && typeof entry === 'object')
          : [];
        allEntries = [...validTruckEntries];
      } else {
        // Handle truck entries error silently
      }

      // Process other expenses
      if (otherExpensesResponse.success) {
        const otherExpenses = otherExpensesResponse.data || [];
        console.log('otherExpenses', otherExpenses);
        const validOtherExpenses = Array.isArray(otherExpenses)
          ? otherExpenses.filter(
              expense => expense && typeof expense === 'object',
            )
          : [];

        // Transform other expenses to match entry format for display
        const transformedExpenses = validOtherExpenses.map(expense => ({
          ...expense,
          entryType: 'Expense',
          materialType: 'Expense',
          amount: expense.totalAmount ?? expense.amount,
          expensesName: expense.expensesName,
          others: expense.others,
          date: expense.date,
          _id: expense._id,
        }));

        allEntries = [...allEntries, ...transformedExpenses];
      } else {
        // Handle other expenses error silently
      }

      // Sort all entries by date (newest first)
      allEntries.sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      );

      setTodayEntries(allEntries);
    } catch (error) {
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

  const handleEditOtherExpense = entry => {
    navigation.navigate(APP_ROUTES.OTHER_EXPENSE, {
      editMode: true,
      entryData: entry,
    });
  };

  const handleDeleteEntry = entryId => {
    if (!entryId) {
      Alert.alert('Error', 'Invalid entry ID');
      return;
    }

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
              const response = await apiService.deleteTruckEntry(entryId);

              if (response.success) {
                // Remove from local state
                setTodayEntries(prev =>
                  prev.filter(entry => entry?._id !== entryId),
                );
                Alert.alert(
                  'Entry Deleted',
                  'The entry has been deleted successfully.',
                  [{ text: 'OK' }],
                );
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

  const handleDeleteOtherExpense = entryId => {
    if (!entryId) {
      Alert.alert('Error', 'Invalid entry ID');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this expense? This action cannot be undone.',
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
              const response = await apiService.deleteOtherExpense(entryId);

              if (response.success) {
                // Remove from local state
                setTodayEntries(prev =>
                  prev.filter(entry => entry?._id !== entryId),
                );
                Alert.alert(
                  'Expense Deleted',
                  'The expense has been deleted successfully.',
                  [{ text: 'OK' }],
                );
              } else {
                setErrorMessage(response.message || 'Failed to delete expense');
              }
            } catch (error) {
              console.error('❌ Delete other expense error:', error);

              let errorMsg = 'Failed to delete expense. Please try again.';
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
              await AsyncStorage.removeItem('user');

              // Clear token from API service
              await apiService.clearToken();

              // Use AuthContext to handle logout
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.', [
                { text: 'OK' },
              ]);
            }
          },
        },
      ],
    );
  };

  const getTotalAmount = () => {
    if (!Array.isArray(todayEntries)) return 0;
    return todayEntries.reduce((sum, entry) => {
      if (!entry || typeof entry !== 'object') return sum;
      const amount = Number(entry?.totalAmount) || 0;
      return sum + amount;
    }, 0);
  };

  const getSalesCount = () => {
    if (!Array.isArray(todayEntries)) return 0;
    return todayEntries.filter(
      entry =>
        entry && typeof entry === 'object' && entry?.entryType === 'Sales',
    ).length;
  };

  const isRawStoneType = type => type === 'Raw Stone' || type === 'RawStone';

  const getRawStoneCount = () => {
    if (!Array.isArray(todayEntries)) return 0;
    return todayEntries.filter(
      entry =>
        entry && typeof entry === 'object' && isRawStoneType(entry?.entryType),
    ).length;
  };

  const getOtherExpensesCount = () => {
    if (!Array.isArray(todayEntries)) return 0;
    return todayEntries.filter(
      entry =>
        entry && typeof entry === 'object' && entry?.entryType === 'Expense',
    ).length;
  };

  const renderEntryCard = (entry, index) => {
    // Defensive check - if entry is undefined or null, don't render
    if (!entry || typeof entry !== 'object') {
      console.warn('Skipping invalid entry:', entry);
      return null;
    }

    const isLastCard = index === todayEntries.length - 1;
    const isOtherExpense = entry.entryType === 'Expense';

    const formatTime = (timeString, dateString) =>
      formatISTTime12h(timeString, dateString);

    // Render Other Expense card
    if (isOtherExpense) {
      return (
        <View
          key={entry._id}
          style={[styles.entryCard, isLastCard && styles.lastCard]}
        >
          {/* Header with expense name and time */}
          <View style={styles.entryHeader}>
            <View style={styles.truckInfo}>
              <Text style={styles.truckNumber}>
                {entry?.expensesName || 'Unknown Expense'}
              </Text>
              <Text style={styles.entryTime}>
                {entry?.date ? formatTime(entry.entryTime, entry.date) : ''}
              </Text>
            </View>
            <View style={styles.entryActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditOtherExpense(entry)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteOtherExpense(entry?._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Other Expense details */}
          <View style={styles.entryDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <View style={[styles.entryTypeBadge, styles.otherExpenseBadge]}>
                <Text style={[styles.entryTypeText, styles.otherExpenseText]}>
                  Expense
                </Text>
              </View>
            </View>

            {entry?.others && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{entry.others}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount:</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(entry?.amount)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Render regular truck entry card
    return (
      <View
        key={entry._id}
        style={[styles.entryCard, isLastCard && styles.lastCard]}
      >
        {/* Header with truck number and time */}
        <View style={styles.entryHeader}>
          <View style={styles.truckInfo}>
            <Text style={styles.truckNumber}>
              {entry?.truckNumber || 'Unknown'}
            </Text>
            {entry?.truckName && (
              <Text style={styles.truckName}>{entry.truckName}</Text>
            )}
            <Text style={styles.entryTime}>
              {formatTime(entry?.entryTime, entry?.entryDate)}
            </Text>
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
              onPress={() => handleDeleteEntry(entry?._id)}
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
                entry?.entryType === 'Sales'
                  ? styles.salesBadge
                  : styles.rawStoneBadge,
              ]}
            >
              <Text
                style={[
                  styles.entryTypeText,
                  entry?.entryType === 'Sales'
                    ? styles.salesText
                    : styles.rawStoneText,
                ]}
              >
                {entry?.entryType || 'Unknown'}
              </Text>
            </View>
          </View>

          {entry?.materialType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Material:</Text>
              <Text style={styles.detailValue}>{entry.materialType}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Units:</Text>
            <Text style={styles.detailValue}>{entry?.units || 0} tons</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(entry?.ratePerUnit)}/ton
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(entry?.totalAmount)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    const salesCount = getSalesCount();
    const rawStoneCount = getRawStoneCount();
    const otherExpensesCount = getOtherExpensesCount();
    const totalEntries = todayEntries.length;

    // Calculate totals for each type
    const salesTotal = todayEntries
      .filter(entry => entry?.entryType === 'Sales')
      .reduce((sum, entry) => sum + (Number(entry?.totalAmount) || 0), 0);

    const rawStoneTotal = todayEntries
      .filter(entry => isRawStoneType(entry?.entryType))
      .reduce((sum, entry) => sum + (Number(entry?.totalAmount) || 0), 0);

    const otherExpensesTotal = todayEntries
      .filter(entry => entry?.entryType === 'Expense')
      .reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0);

    // Calculate Net Worth (Sales - Raw Stone - Other Expenses)
    const netWorth = salesTotal - rawStoneTotal - otherExpensesTotal;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>

        {/* Entry Counts Row */}
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalEntries}</Text>
              <Text style={styles.summaryLabel}>Total Entries</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.salesValue]}>
                {salesCount}
              </Text>
              <Text style={styles.summaryLabel}>Sales</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.rawStoneValue]}>
                {rawStoneCount}
              </Text>
              <Text style={styles.summaryLabel}>Raw Stone</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.otherExpenseValue]}>
                {otherExpensesCount}
              </Text>
              <Text style={styles.summaryLabel}>Expenses</Text>
            </View>
          </View>

          {/* Financial Summary */}
          <View style={styles.financialSummary}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Sales Revenue:</Text>
              <Text style={[styles.financialValue, styles.salesValue]}>
                {formatCurrency(salesTotal)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Raw Stone Cost:</Text>
              <Text style={[styles.financialValue, styles.rawStoneValue]}>
                {formatCurrency(rawStoneTotal)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Expenses:</Text>
              <Text style={[styles.financialValue, styles.otherExpenseValue]}>
                {formatCurrency(otherExpensesTotal)}
              </Text>
            </View>
            <View style={[styles.financialRow, styles.netWorthRow]}>
              <Text style={styles.netWorthLabel}>Net Worth:</Text>
              <Text
                style={[
                  styles.financialValue,
                  styles.netWorthValue,
                  netWorth >= 0
                    ? styles.positiveNetWorth
                    : styles.negativeNetWorth,
                ]}
              >
                {formatCurrency(netWorth)}
              </Text>
            </View>
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
  };

  const renderEmptyState = () => {
    // Defensive check for userDetails
    const safeUserDetails = userDetails || {};

    return (
      <View style={styles.emptyStateContainer}>
        {/* User Details Card */}
        <View style={styles.userDetailsCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {safeUserDetails.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {safeUserDetails.name || 'User'}
            </Text>
            <Text style={styles.userRole}>
              {safeUserDetails.role || 'User'} •{' '}
              {safeUserDetails.company || 'CrusherMate'}
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
        <View style={styles.emptyStateButtonRow}>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate(APP_ROUTES.TRUCK_ENTRY)}
          >
            <Text style={styles.emptyStateButtonIcon}>+</Text>
            <Text style={styles.emptyStateButtonText}>Add Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.emptyStateButton,
              { backgroundColor: theme.COLORS.secondary },
            ]}
            onPress={() => navigation.navigate(APP_ROUTES.OTHER_EXPENSE)}
          >
            {/* <Text style={styles.emptyStateButtonIcon}>💰</Text> */}
            <Text style={styles.emptyStateButtonText}>Expenses</Text>
          </TouchableOpacity>
        </View>

        {/* Owner Dashboard Button - Show for owners even in empty state */}
        {userRole === 'owner' && (
          <TouchableOpacity
            style={[
              styles.emptyStateButton,
              { backgroundColor: theme.COLORS.secondary, marginTop: 12 },
            ]}
            onPress={() => navigation.navigate(APP_ROUTES.DASHBOARD)}
          >
            <Text style={styles.emptyStateButtonIcon}>📊</Text>
            <Text style={styles.emptyStateButtonText}>Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
          <View style={styles.headerRight}>
            {/* Dashboard Button for Owners */}

            <TouchableOpacity
              style={styles.headerLogoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.headerLogoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.errorText}>{errorMessage}</Text>
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
        {Array.isArray(todayEntries) && todayEntries.length > 0 ? (
          <>
            {renderSummary()}
            <View style={styles.entriesContainer}>
              <Text style={styles.entriesTitle}>Today's Entries</Text>
              {todayEntries
                .filter(entry => entry && typeof entry === 'object')
                .map((entry, index) => renderEntryCard(entry, index))}
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
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.addEntryButton}
              onPress={() => navigation.navigate(APP_ROUTES.TRUCK_ENTRY)}
            >
              <Text style={styles.addEntryButtonIcon}>+</Text>
              <Text style={styles.addEntryButtonText}>Add Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.otherExpensesButton}
              onPress={() => navigation.navigate(APP_ROUTES.OTHER_EXPENSE)}
            >
              {/* <Text style={styles.otherExpensesButtonIcon}>💰</Text> */}
              <Text style={styles.otherExpensesButtonText}>Expenses</Text>
            </TouchableOpacity>
          </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  truckName: {
    fontSize: 14,
    color: theme.COLORS.gray,
    marginTop: 2,
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
  otherExpenseBadge: {
    backgroundColor: '#E3F2FD',
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.COLORS.text,
  },
  salesText: {
    color: '#2E7D32',
  },
  rawStoneText: {
    color: '#F57C00',
  },
  otherExpenseText: {
    color: '#1976D2',
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
    flex: 1,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  addEntryButton: {
    flex: 1,
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
  otherExpensesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  otherExpensesButtonIcon: {
    fontSize: 20,
    color: theme.COLORS.white,
    marginRight: 8,
    fontWeight: 'bold',
  },
  otherExpensesButtonText: {
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
  emptyStateButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  otherExpenseBadge: {
    backgroundColor: '#E0F2F7', // A light blue for other expenses
  },
  otherExpenseText: {
    color: '#0277BD', // A dark blue for other expenses
  },
  salesValue: {
    color: '#2E7D32', // Green for sales
  },
  rawStoneValue: {
    color: '#F57C00', // Orange for raw stone
  },
  otherExpenseValue: {
    color: '#1976D2', // Blue for other expenses
  },
  financialSummary: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.lightGray,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: theme.COLORS.gray,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  netWorthRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.lightGray,
  },
  netWorthLabel: {
    fontSize: 14,
    color: theme.COLORS.gray,
    fontWeight: '500',
  },
  netWorthValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveNetWorth: {
    color: '#2E7D32', // Green for positive net worth
  },
  negativeNetWorth: {
    color: '#F44336', // Red for negative net worth
  },
});

export default TrackScreen;
