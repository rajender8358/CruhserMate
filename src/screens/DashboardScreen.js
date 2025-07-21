import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const DashboardScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalRawStone: 0,
    trucksIn: 0,
    trucksOut: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  // Filter options
  const filterOptions = [
    { label: 'Today', value: 'Today' },
    { label: 'This Week', value: 'This Week' },
    { label: 'Custom Range', value: 'Custom Range' },
  ];

  // Sample data - in real app, this would come from database
  const sampleData = {
    Today: {
      totalSales: 45000,
      totalRawStone: 15000,
      trucksIn: 8,
      trucksOut: 6,
      totalExpenses: 5000,
    },
    'This Week': {
      totalSales: 280000,
      totalRawStone: 95000,
      trucksIn: 42,
      trucksOut: 38,
      totalExpenses: 25000,
    },
    'Custom Range': {
      totalSales: 150000,
      totalRawStone: 50000,
      trucksIn: 20,
      trucksOut: 18,
      totalExpenses: 12000,
    },
  };

  useEffect(() => {
    // Check user role
    checkUserRole();

    // Load data based on selected filter
    const data = sampleData[selectedFilter];
    const netIncome = data.totalSales - data.totalRawStone - data.totalExpenses;

    setDashboardData({
      ...data,
      netIncome,
    });
  }, [selectedFilter]);

  const checkUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'user');

        // Redirect non-owners back to Track screen
        if (user.role !== 'owner') {
          Alert.alert(
            'Access Denied',
            'This dashboard is only available for owners.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Track'),
              },
            ],
          );
          return; // Exit early to prevent further execution
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const formatCurrency = amount => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Sample data for quick export
  const getSampleReportData = () => [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      entryType: 'Sales',
      materialType: 'M-Sand',
      truckNumber: 'KA01AB1234',
      units: dashboardData.trucksOut || 6,
      rate: 1500,
      total: (dashboardData.trucksOut || 6) * 1500,
    },
    {
      id: '2',
      date: new Date().toISOString().split('T')[0],
      entryType: 'Raw Stone',
      materialType: 'N/A',
      truckNumber: 'MH12CD5678',
      units: dashboardData.trucksIn || 8,
      rate: 800,
      total: (dashboardData.trucksIn || 8) * 800,
    },
  ];

  const handleQuickExport = async format => {
    const reportData = getSampleReportData();
    const filters = {
      materialFilter: 'All',
      entryTypeFilter: 'All',
    };

    if (format === 'PDF') {
      await exportToPDF(reportData, selectedFilter, filters);
    } else if (format === 'CSV') {
      await exportToCSV(reportData, selectedFilter, filters);
    }
  };

  const renderMetricCard = (
    title,
    value,
    icon,
    color = theme.COLORS.primary,
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>
        {typeof value === 'number' && title.includes('₹')
          ? formatCurrency(value)
          : value}
      </Text>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Date Filter</Text>
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                selectedFilter === option.value && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setSelectedFilter(option.value);
                setShowFilterModal(false);
                if (option.value === 'Custom Range') {
                  Alert.alert(
                    'Custom Range',
                    'Custom date picker will be implemented here',
                  );
                }
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === option.value &&
                    styles.filterOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Dashboard Overview</Text>
            <Text style={styles.userRole}>
              {userRole === 'owner' ? 'Owner Dashboard' : 'User Dashboard'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>📅 Date Filter:</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          {renderMetricCard(
            'Total Sales ₹',
            dashboardData.totalSales,
            '📊',
            '#27AE60',
          )}

          {renderMetricCard(
            'Raw Stone Cost ₹',
            dashboardData.totalRawStone,
            '📉',
            '#E74C3C',
          )}

          {renderMetricCard(
            'Total Expenses ₹',
            dashboardData.totalExpenses,
            '💸',
            '#F39C12',
          )}

          {renderMetricCard(
            'Net Income ₹',
            dashboardData.netIncome,
            '💰',
            dashboardData.netIncome >= 0 ? '#27AE60' : '#E74C3C',
          )}
        </View>

        {/* Truck Operations */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Truck Operations</Text>

          <View style={styles.truckMetricsRow}>
            {renderMetricCard(
              'Trucks In',
              dashboardData.trucksIn,
              '🚛',
              '#3498DB',
            )}

            {renderMetricCard(
              'Trucks Out',
              dashboardData.trucksOut,
              '🚚',
              '#9B59B6',
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>View Reports</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TruckEntry')}
          >
            <Text style={styles.actionIcon}>🚛</Text>
            <Text style={styles.actionText}>New Truck Entry</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickExport('CSV')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Download CSV</Text>
            <Text style={styles.actionArrow}>↓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickExport('PDF')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Download PDF</Text>
            <Text style={styles.actionArrow}>↓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderFilterModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  backButton: {
    backgroundColor: theme.COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: {
    color: theme.COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text,
    marginRight: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.COLORS.text,
    flex: 1,
  },
  filterArrow: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
    marginLeft: 8,
  },
  metricsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  truckMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: theme.COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: theme.COLORS.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: theme.COLORS.text,
  },
  filterOptionTextSelected: {
    color: theme.COLORS.white,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    fontWeight: '500',
  },
});

export default DashboardScreen;
