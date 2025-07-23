import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/apiService';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { formatCurrency } from '../utils/formatting';
import { APP_ROUTES } from '../navigations/Routes';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    topMaterials: [],
    recentEntries: [],
    todayEntries: 0,
  });
  const [selectedDay, setSelectedDay] = useState('all');
  const [dayData, setDayData] = useState({});
  const [allEntries, setAllEntries] = useState([]);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    currentPage: 1,
    totalPages: 1,
  });

  const checkUserRole = useCallback(() => {
    if (user && user.role !== 'owner') {
      Alert.alert(
        'Access Denied',
        'This dashboard is only available for owners.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      return false;
    }
    return true;
  }, [user, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!checkUserRole()) {
        return;
      }
      fetchDashboardData();
      fetchEntriesForDay(1); // Fetch first page of entries
    }, [selectedDay, user]), // Rerun on day or user change
  );

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Current week (Sunday to Saturday)
    const daysFromSunday = currentDay;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysFromSunday);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateObj: startDate,
      endDateObj: endDate,
    };
  };

  const getDayDates = dayType => {
    const weekDates = getCurrentWeekDates();
    const today = new Date();
    const currentDay = today.getDay();

    if (dayType === 'all') {
      return weekDates;
    }

    // Calculate the date for the selected day
    const daysFromSunday = currentDay;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromSunday);

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayIndex = dayNames.indexOf(dayType);

    const selectedDate = new Date(weekStart);
    selectedDate.setDate(weekStart.getDate() + dayIndex);

    // Only allow past days and today
    if (selectedDate > today) {
      return null; // Future day not allowed
    }

    return {
      startDate: selectedDate.toISOString().split('T')[0],
      endDate: selectedDate.toISOString().split('T')[0],
      startDateObj: selectedDate,
      endDateObj: selectedDate,
    };
  };

  const fetchDashboardData = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const dayDates = getDayDates(selectedDay);

      if (!dayDates) {
        Alert.alert('Error', 'Cannot view future dates');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/dashboard/summary?startDate=${dayDates.startDate}&endDate=${dayDates.endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiService.token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
        setDayData(dayDates);
      } else {
        const errorData = await response.json();
        Alert.alert(
          'Error',
          errorData.message || 'Failed to fetch dashboard data',
        );
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Error', 'Network error while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntriesForDay = async (page = 1) => {
    try {
      if (!user) return;
      const dayDates = getDayDates(selectedDay);

      if (!dayDates) return;

      const response = await fetch(
        `${API_BASE_URL}/truck-entries?startDate=${dayDates.startDate}&endDate=${dayDates.endDate}&page=${page}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiService.token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAllEntries(prev =>
          page === 1 ? data.data.entries : [...prev, ...data.data.entries],
        );
        setPagination(
          data.data.pagination || {
            hasNextPage: false,
            currentPage: page,
            totalPages: 1,
          },
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('Fetch entries error:', error);
      Alert.alert('Error', 'Network error while fetching entries');
    }
  };

  const handleExport = async format => {
    setExporting(true);
    try {
      const dayDates = getDayDates(selectedDay);
      if (!dayDates) {
        Alert.alert('Error', 'Cannot export future dates');
        return;
      }

      // 1. Request the file from the backend
      const exportOptions = {
        startDate: dayDates.startDate,
        endDate: dayDates.endDate,
        format,
      };

      const response = await apiService.exportData(exportOptions);

      if (response.success) {
        const { token, fileId } = response.data;
        const downloadUrl = `${API_BASE_URL}/reports/download/${fileId}?token=${token}`;

        try {
          await Linking.openURL(downloadUrl);
        } catch (err) {
          Alert.alert(
            'Error',
            'Failed to open download link. Please ensure you have a web browser installed and enabled.',
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    color = theme.COLORS.primary,
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const RecentEntryCard = ({ entry }) => {
    const formatTime = timeString => {
      if (!timeString) return '';
      const [hour, minute] = timeString.split(':');
      const hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      return `${formattedHour}:${minute} ${ampm}`;
    };

    return (
      <View style={styles.recentEntryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryType}>{entry.entryType}</Text>
          <Text style={styles.entryDate}>
            {new Date(entry.createdAt).toLocaleDateString()} at{' '}
            {formatTime(entry.entryTime)}
          </Text>
        </View>
        <Text style={styles.entryDetails}>
          {entry.materialType || 'N/A'} - {entry.units} units
        </Text>
        <Text style={styles.entryPrice}>
          {formatCurrency(entry.totalAmount)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              {user?.organization?.name ?? 'Owner'} Dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Day Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>Current Week Filter</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => setSelectedDay('all')}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedDay === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedDay('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedDay === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All Week
              </Text>
            </TouchableOpacity>
            {[
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
            ].map((day, index) => {
              const today = new Date();
              const currentDayIndex = today.getDay();
              const isFutureDay = index > currentDayIndex;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.filterButton,
                    selectedDay === day && styles.filterButtonActive,
                    isFutureDay && styles.filterButtonDisabled,
                  ]}
                  onPress={() => !isFutureDay && setSelectedDay(day)}
                  disabled={isFutureDay}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedDay === day && styles.filterButtonTextActive,
                    ]}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {dayData.startDate && (
            <Text style={styles.weekRange}>
              {selectedDay === 'all'
                ? `${new Date(
                    dayData.startDate,
                  ).toLocaleDateString()} - ${new Date(
                    dayData.endDate,
                  ).toLocaleDateString()}`
                : new Date(dayData.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
            </Text>
          )}
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Entries"
              value={dashboardData.summary?.totalEntries ?? 0}
              subtitle={
                selectedDay === 'all'
                  ? 'This Week'
                  : selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)
              }
              color={theme.COLORS.primary}
            />
            <MetricCard
              title="Today's Entries"
              value={dashboardData.todayEntries ?? 0}
              subtitle="Today"
              color={theme.COLORS.secondary}
            />
            <MetricCard
              title="Total Sales"
              value={formatCurrency(dashboardData.summary?.totalSales ?? 0)}
              subtitle={
                selectedDay === 'all'
                  ? 'This Week'
                  : selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)
              }
              color="#FF9500"
            />
          </View>
        </View>

        {/* Entry Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Types</Text>
          <View style={styles.entryTypesContainer}>
            <View style={styles.entryTypeCard}>
              <Text style={styles.entryTypeTitle}>Sales</Text>
              <Text style={styles.entryTypeCount}>
                {formatCurrency(dashboardData.summary?.totalSales ?? 0)}
              </Text>
            </View>
            <View style={styles.entryTypeCard}>
              <Text style={styles.entryTypeTitle}>Raw Stone</Text>
              <Text style={styles.entryTypeCount}>
                {formatCurrency(dashboardData.summary?.totalRawStone ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Materials Section */}
        {dashboardData.topMaterials?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Materials</Text>
            {dashboardData.topMaterials.map((material, index) => (
              <View key={index} style={styles.materialCard}>
                <Text style={styles.materialName}>{material.name}</Text>
                <Text style={styles.materialCount}>
                  {material.count} entries
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* All Entries Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Entries for{' '}
            {selectedDay === 'all'
              ? 'the Week'
              : selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
          </Text>
          {allEntries.length > 0 ? (
            allEntries.map((entry, index) => (
              <RecentEntryCard key={index} entry={entry} />
            ))
          ) : (
            <Text style={styles.noEntriesText}>
              No entries found for this day.
            </Text>
          )}

          {pagination?.hasNextPage && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() =>
                fetchEntriesForDay((pagination?.currentPage || 1) + 1)
              }
            >
              <Text style={styles.seeMoreButtonText}>See More</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Download Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.COLORS.primary },
            ]}
            onPress={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>📄 Download PDF</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.COLORS.primary },
            ]}
            onPress={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>📊 Download CSV</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Owner-only Material Rates Button */}
        {user?.role === 'owner' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: '#059669' }, // Green color for rates
              ]}
              onPress={() => navigation.navigate(APP_ROUTES.MATERIAL_RATES)}
            >
              <Text style={styles.actionButtonText}>💰 Material Rates</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background || '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 20,
  },
  backButtonIcon: {
    fontSize: 18,
    color: theme.COLORS.primary,
    marginRight: 6,
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: 14,
    color: theme.COLORS.primary,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.COLORS.primary,
  },
  filterButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  weekRange: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  metricsSection: {
    marginTop: 20,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  entryTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  entryTypeCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    flexShrink: 1,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  materialCount: {
    fontSize: 14,
    color: '#666',
  },
  recentEntryCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  entryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  noEntriesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  seeMoreButton: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  seeMoreButtonText: {
    color: theme.COLORS.primary,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 30,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default DashboardScreen;
