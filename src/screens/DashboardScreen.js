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
  Clipboard,
  Share,
  Platform,
} from 'react-native';
// import RNFS from 'react-native-fs'; // Temporarily disabled due to linking issues
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { formatCurrency } from '../utils/formatting';
import { exportToPDF } from '../utils/exportUtils';
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
  });
  const [selectedDay, setSelectedDay] = useState('all');
  const [dayData, setDayData] = useState({
    startDate: null,
    endDate: null,
    startDateObj: null,
    endDateObj: null,
  });
  const [allEntries, setAllEntries] = useState([]);
  const [displayedEntries, setDisplayedEntries] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(10);
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

  const handleExport = async type => {
    try {
      setExporting(true);

      // Get the current period data
      const period = selectedDay === 'all' ? 'week' : selectedDay;
      const { startDate, endDate } = getDayDates(selectedDay);

      const organizationId =
        user?.organizationId || user?.organization?._id || user?.organization;

      if (!organizationId) {
        throw new Error(
          'Organization ID not found. Please log out and log in again.',
        );
      }

      const response = await apiService.generateDownloadableReport({
        startDate,
        endDate,
        format: type,
        organizationId,
        reportType: 'dashboard',
      });

      // console.log('🔍 Full response from API:', response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate report');
      }

      // console.log('🔍 Response data:', response.data);
      const { blob, downloadUrl, fileName, entriesCount, summary } =
        response.data;

      if (!blob && !downloadUrl) {
        console.error('🔍 Response data:', response.data);
        throw new Error('Download data not received from server');
      }

      try {
        if (downloadUrl) {
          // Open the download URL in Chrome browser
          try {
            await Linking.openURL(downloadUrl);
            Alert.alert(
              `${type.toUpperCase()} Report Generated`,
              `Your ${type.toUpperCase()} report is opening in Chrome for download.\n\n` +
                `The PDF will contain all your data for the selected period.`,
              [{ text: 'OK' }],
            );
          } catch (linkError) {
            console.error('Failed to open download link:', linkError);
            Alert.alert(
              'Download Link Generated',
              `Your ${type.toUpperCase()} report has been generated.\n\n` +
                `Please copy this link and open it in Chrome:\n\n${downloadUrl}`,
              [
                {
                  text: 'Copy Link',
                  onPress: () => Clipboard.setString(downloadUrl),
                },
                { text: 'OK' },
              ],
            );
          }
          // Check if it's a blob URL (starts with blob:)
          if (downloadUrl.startsWith('blob:')) {
            // For blob URLs, we can't open them directly in browser
            // Instead, show a success message
            Alert.alert(
              `${type.toUpperCase()} Report Generated`,
              `Your ${type.toUpperCase()} report has been generated successfully!\n\n` +
                `The file has been downloaded to your device.`,
              [{ text: 'OK' }],
            );
          } else {
            // For web URLs, try to open in browser
            await Linking.openURL(downloadUrl);
            Alert.alert(
              `${type.toUpperCase()} Report Generated`,
              `Your ${type.toUpperCase()} report has been generated with ${
                entriesCount || 0
              } entries.\n\n` +
                `Total Sales: ₹${(summary?.totalSales || 0).toLocaleString(
                  'en-IN',
                )}\n` +
                `Raw Stone Cost: ₹${(
                  summary?.totalRawStone || 0
                ).toLocaleString('en-IN')}\n` +
                `Net Profit: ₹${(summary?.netProfit || 0).toLocaleString(
                  'en-IN',
                )}\n\n` +
                `The report has been opened in your browser. You can download it from there.`,
              [{ text: 'OK' }],
            );
          }
        }
      } catch (linkError) {
        console.error('Failed to open download link:', linkError);
        Alert.alert(
          'Download Link Generated',
          `Your ${type.toUpperCase()} report has been generated.\n\n` +
            `Please copy this link and open it in your browser:\n\n${downloadUrl}`,
          [
            {
              text: 'Copy Link',
              onPress: () => Clipboard.setString(downloadUrl),
            },
            { text: 'OK' },
          ],
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        `Failed to generate ${type.toUpperCase()} report: ${error.message}`,
        [{ text: 'OK' }],
      );
    } finally {
      setExporting(false);
    }
  };

  // Update displayed entries when allEntries changes
  useEffect(() => {
    setDisplayedEntries(allEntries.slice(0, displayLimit));
  }, [allEntries, displayLimit]);

  useFocusEffect(
    useCallback(() => {
      if (!checkUserRole()) {
        return;
      }
      fetchDashboardData();
      // recent entries now come from the new dashboard API response
    }, [checkUserRole]),
  );

  // Refresh dashboard data whenever the selected day or user changes
  useEffect(() => {
    if (!checkUserRole()) return;
    fetchDashboardData();
  }, [selectedDay, user]);

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
    // Defensive check for undefined dayType
    if (!dayType) {
      console.warn('getDayDates: dayType is undefined, using "all"');
      dayType = 'all';
    }

    const weekDates = getCurrentWeekDates();
    const today = new Date();
    const currentDay = today.getDay();

    if (dayType === 'all') {
      return weekDates;
    }

    // Calculate the date for the selected day
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

    // Defensive check for invalid dayType
    if (dayIndex === -1) {
      console.warn(`getDayDates: Invalid dayType "${dayType}", using "all"`);
      return weekDates;
    }

    // Calculate the date for the selected day of the current week
    const selectedDate = new Date(today);
    const daysDiff = dayIndex - currentDay;
    selectedDate.setDate(today.getDate() + daysDiff);

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

      // Defensive check for selectedDay
      const currentSelectedDay = selectedDay || 'all';
      const dayDates = getDayDates(currentSelectedDay);

      if (!dayDates) {
        Alert.alert('Error', 'Cannot view future dates');
        return;
      }

      const response = await apiService.getDashboardSummary({
        filterType: 'custom',
        startDate: dayDates.startDate,
        endDate: dayDates.endDate,
      });

      if (response.success) {
        console.log('🔍 Dashboard data:', response.data);
        const apiData = response.data || {};

        const toNum = v => (typeof v === 'number' ? v : Number(v || 0));

        const sales = apiData.totalSales || apiData.sales || {};
        const rawStone = apiData.rawStone || {};
        const expenses = apiData.expenses || {};

        const sumBy = (arr, key) =>
          (Array.isArray(arr) ? arr : []).reduce(
            (sum, item) => sum + toNum(item?.[key] || 0),
            0,
          );

        const totals = {
          sales: toNum(
            sales.totalAmount ?? sumBy(sales.entries, 'totalAmount'),
          ),
          raw: toNum(
            rawStone.totalAmount ?? sumBy(rawStone.entries, 'totalAmount'),
          ),
          other: toNum(
            expenses.totalAmount ?? sumBy(expenses.entries, 'amount'),
          ),
        };

        const counts = {
          sales: toNum(sales.count ?? (sales.entries || []).length),
          raw: toNum(rawStone.count ?? (rawStone.entries || []).length),
          other: toNum(expenses.count ?? (expenses.entries || []).length),
        };

        const normalizedSummary = {
          totalEntries: counts.sales + counts.raw + counts.other,
          salesEntries: counts.sales,
          rawStoneEntries: counts.raw,
          totalSales: totals.sales,
          totalRawStone: totals.raw,
          totalOtherExpenses: totals.other,
          netProfit: toNum(
            apiData.netWorth ?? totals.sales - totals.raw - totals.other,
          ),
        };

        // Build combined entries list for the selected period from sections
        const salesEntries = (sales.entries || []).map(e => ({
          ...e,
          entryType: 'Sales',
          createdAt: e.createdAt || e.entryDate,
          totalAmount: toNum(e.totalAmount),
        }));
        const rawEntries = (rawStone.entries || []).map(e => ({
          ...e,
          entryType: 'Raw Stone',
          createdAt: e.createdAt || e.entryDate,
          totalAmount: toNum(e.totalAmount),
        }));
        const expenseEntries = (expenses.entries || []).map(e => ({
          ...e,
          entryType: 'Expense',
          amount: toNum(e.amount),
          date: e.date || e.createdAt,
        }));

        const combined = [
          ...salesEntries,
          ...rawEntries,
          ...expenseEntries,
        ].sort(
          (a, b) =>
            new Date(b.date || b.entryDate || b.createdAt) -
            new Date(a.date || a.entryDate || a.createdAt),
        );

        setDashboardData({
          summary: normalizedSummary,
          topMaterials: [],
          recentEntries: combined,
        });
        setAllEntries(combined);
        setDisplayLimit(10);
        setDisplayedEntries(combined.slice(0, 10));
        setDayData(dayDates);
      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to fetch dashboard data',
        );
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Error', 'Network error while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = () => {
    const newLimit = displayLimit + 10;
    setDisplayLimit(newLimit);
    setDisplayedEntries(allEntries.slice(0, newLimit));
  };

  const fetchEntriesForDay = async (page = 1) => {
    try {
      if (!user) return;

      // Defensive check for selectedDay
      const currentSelectedDay = selectedDay || 'all';
      const dayDates = getDayDates(currentSelectedDay);

      if (!dayDates) return;

      // Fetch both truck entries and other expenses
      const [truckResponse, otherExpensesResponse] = await Promise.all([
        apiService.getTruckEntries({
          startDate: dayDates.startDate,
          endDate: dayDates.endDate,
          page,
          limit: 10,
        }),
        apiService.getOtherExpenses({
          startDate: dayDates.startDate,
          endDate: dayDates.endDate,
          page,
          limit: 10,
        }),
      ]);

      let allEntries = [];

      // Process truck entries
      if (truckResponse.success) {
        const truckEntries = truckResponse.data || [];
        allEntries = [...truckEntries];
      }

      // Process other expenses
      if (otherExpensesResponse.success) {
        const otherExpenses = otherExpensesResponse.data || [];

        // Transform other expenses to match entry format for display
        const transformedExpenses = otherExpenses.map(expense => ({
          ...expense,
          entryType: 'Expense',
          materialType: 'Expense',
          amount: expense.amount,
          expensesName: expense.expensesName,
          others: expense.others,
          date: expense.date,
          _id: expense._id,
        }));

        allEntries = [...allEntries, ...transformedExpenses];
      }

      // Sort all entries by date (newest first)
      allEntries.sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      );

      setAllEntries(prev =>
        page === 1 ? allEntries : [...prev, ...allEntries],
      );

      // Update displayed entries based on current limit
      const newAllEntries = page === 1 ? allEntries : [...prev, ...allEntries];
      setDisplayedEntries(newAllEntries.slice(0, displayLimit));
      setPagination(
        truckResponse.pagination || {
          hasNextPage: false,
          currentPage: page,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error('Fetch entries error:', error);
      Alert.alert('Error', 'Network error while fetching entries');
    }
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    color = theme.COLORS.primary,
    fullWidth = false,
  }) => (
    <View
      style={[
        styles.metricCard,
        { borderLeftColor: color, width: fullWidth ? '100%' : '48%' },
      ]}
    >
      <Text style={[styles.metricTitle, fullWidth && styles.centeredText]}>
        {title}
      </Text>
      <Text style={[styles.metricValue, fullWidth && styles.centeredText]}>
        {value}
      </Text>
      <Text style={[styles.metricSubtitle, fullWidth && styles.centeredText]}>
        {subtitle}
      </Text>
    </View>
  );

  const RecentEntryCard = ({ entry }) => {
    const formatTime = timeString => {
      if (!timeString) return '';
      const [hour, minute] = timeString.split(':');
      const hourNum = parseInt(hour, 10);
      if (isNaN(hourNum)) return '';

      // Convert 24-hour format to 12-hour format
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      return `${formattedHour}:${minute || '00'} ${ampm}`;
    };

    const isOtherExpense = entry.entryType === 'Expense';

    // Render Other Expense card
    if (isOtherExpense) {
      return (
        <View style={styles.recentEntryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryType}>Expense</Text>
            <Text style={styles.entryDate}>
              {new Date(entry.date || entry.createdAt).toLocaleDateString()} at{' '}
              {entry.date
                ? new Date(entry.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : formatTime(entry.entryTime)}
            </Text>
          </View>
          <Text style={styles.entryDetails}>
            {entry.expensesName || 'Unknown Expense'}
            {entry.others && ` - ${entry.others}`}
          </Text>
          <Text style={styles.entryPrice}>{formatCurrency(entry.amount)}</Text>
        </View>
      );
    }

    // Render regular truck entry card
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
          {entry.truckNumber} {entry.truckName && `- ${entry.truckName}`} -{' '}
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
            <Text style={styles.headerTitle}>Dashboard</Text>
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
          {dayData?.startDate && (
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

          {/* Net Worth - Prominent Full Width Card */}
          <View style={styles.netWorthContainer}>
            <View style={[styles.metricCard, styles.netWorthCard]}>
              <View style={styles.netWorthHeader}>
                <Text style={styles.netWorthTitle}>Net Worth</Text>
                <View
                  style={[
                    styles.netWorthBadge,
                    (dashboardData.summary?.netProfit ?? 0) >= 0
                      ? styles.profitBadge
                      : styles.lossBadge,
                  ]}
                >
                  <Text style={styles.netWorthBadgeText}>
                    {(dashboardData.summary?.netProfit ?? 0) >= 0
                      ? 'Profit'
                      : 'Loss'}
                  </Text>
                </View>
              </View>
              <Text style={styles.netWorthValue}>
                {formatCurrency(dashboardData.summary?.netProfit ?? 0)}
              </Text>
              <Text style={styles.netWorthSubtitle}>
                {selectedDay === 'all'
                  ? 'This Week'
                  : (selectedDay || 'all').charAt(0).toUpperCase() +
                    (selectedDay || 'all').slice(1)}
              </Text>
            </View>
          </View>

          {/* Four Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricCardSmall]}>
                <Text style={styles.metricTitle}>Total Entries</Text>
                <Text style={styles.metricValue}>
                  {dashboardData.summary?.totalEntries ?? 0}
                </Text>
                <Text style={styles.metricSubtitle}>
                  {selectedDay === 'all'
                    ? 'This Week'
                    : (selectedDay || 'all').charAt(0).toUpperCase() +
                      (selectedDay || 'all').slice(1)}
                </Text>
              </View>

              <View style={[styles.metricCard, styles.metricCardSmall]}>
                <Text style={styles.metricTitle}>Total Sales</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(dashboardData.summary?.totalSales ?? 0)}
                </Text>
                <Text style={styles.metricSubtitle}>
                  {selectedDay === 'all'
                    ? 'This Week'
                    : (selectedDay || 'all').charAt(0).toUpperCase() +
                      (selectedDay || 'all').slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricCardSmall]}>
                <Text style={styles.metricTitle}>Raw Stone</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(dashboardData.summary?.totalRawStone ?? 0)}
                </Text>
                <Text style={styles.metricSubtitle}>
                  {selectedDay === 'all'
                    ? 'This Week'
                    : (selectedDay || 'all').charAt(0).toUpperCase() +
                      (selectedDay || 'all').slice(1)}
                </Text>
              </View>

              <View style={[styles.metricCard, styles.metricCardSmall]}>
                <Text style={styles.metricTitle}>Expenses</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(
                    dashboardData.summary?.totalOtherExpenses ?? 0,
                  )}
                </Text>
                <Text style={styles.metricSubtitle}>
                  {selectedDay === 'all'
                    ? 'This Week'
                    : (selectedDay || 'all').charAt(0).toUpperCase() +
                      (selectedDay || 'all').slice(1)}
                </Text>
              </View>
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

        {/* Recent Entries Section */}
        <View style={styles.recentEntriesSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {displayedEntries.length > 0 ? (
            <>
              {displayedEntries.map((entry, index) => (
                <RecentEntryCard key={entry._id || index} entry={entry} />
              ))}
              {displayedEntries.length < allEntries.length && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={handleSeeMore}
                >
                  <Text style={styles.seeMoreButtonText}>
                    See More ({allEntries.length - displayedEntries.length}{' '}
                    more)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent entries</Text>
            </View>
          )}
        </View>
        <View style={styles.downloadSection}>
          <TouchableOpacity
            style={[styles.downloadButton, styles.pdfButton]}
            onPress={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.downloadButtonText}>Download PDF</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.downloadButton, styles.csvButton]}
            onPress={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.downloadButtonText}>Download CSV</Text>
            )}
          </TouchableOpacity>
        </View>
        {/* Owner-only Material Rates Button */}
        {user?.role === 'owner' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.COLORS.primary }, // Green color for rates
              ]}
              onPress={() => navigation.navigate(APP_ROUTES.MATERIAL_RATES)}
            >
              <Text style={styles.actionButtonText}>Material Rates</Text>
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
    flexDirection: 'column',
    width: '100%',
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
    fontSize: 14,
    fontWeight: '600',
    color: theme.COLORS.primary,
    marginBottom: 8,
  },
  entryTypeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 4,
  },
  entryTypeSubtitle: {
    fontSize: 11,
    color: theme.COLORS.gray,
    marginTop: 2,
  },
  netWorthContainer: {
    width: '100%',
    marginBottom: 15,
  },
  netWorthCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  netWorthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text,
  },
  netWorthValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 10,
  },
  netWorthSubtitle: {
    fontSize: 14,
    color: theme.COLORS.gray,
    textAlign: 'center',
  },
  netWorthBadge: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  profitBadge: {
    backgroundColor: '#34C759',
  },
  lossBadge: {
    backgroundColor: '#FF3B30',
  },
  netWorthBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
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
    marginTop: 10,
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
  netWorthFullWidth: {
    width: '100%',
    marginTop: 15,
  },
  centeredText: {
    textAlign: 'center',
  },
  metricCardSmall: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  recentEntriesSection: {
    marginTop: 25,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  seeMoreButton: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  seeMoreButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 15,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButton: {
    backgroundColor: theme.COLORS.primary,
  },
  csvButton: {
    backgroundColor: '#059669', // Green color for CSV
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
