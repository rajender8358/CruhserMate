import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import theme from '../assets/theme';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const ReportsScreen = ({ navigation }) => {
  const [reportType, setReportType] = useState('Daily');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [entryTypeFilter, setEntryTypeFilter] = useState('All');
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showEntryTypeModal, setShowEntryTypeModal] = useState(false);

  // Filter options
  const reportTypes = [
    { label: 'Daily Reports', value: 'Daily' },
    { label: 'Weekly Reports', value: 'Weekly' },
  ];

  const materialTypes = [
    { label: 'All Materials', value: 'All' },
    { label: 'M-Sand', value: 'M-Sand' },
    { label: 'P-Sand', value: 'P-Sand' },
    { label: 'Blue Metal', value: 'Blue Metal' },
  ];

  const entryTypes = [
    { label: 'All Entries', value: 'All' },
    { label: 'Sales Only', value: 'Sales' },
    { label: 'Raw Stone Only', value: 'Raw Stone' },
  ];

  // Sample report data
  const sampleReports = [
    {
      id: '1',
      date: '2024-01-15',
      entryType: 'Sales',
      materialType: 'M-Sand',
      truckNumber: 'KA01AB1234',
      units: 10,
      rate: 1500,
      total: 15000,
    },
    {
      id: '2',
      date: '2024-01-15',
      entryType: 'Raw Stone',
      materialType: 'N/A',
      truckNumber: 'MH12CD5678',
      units: 8,
      rate: 800,
      total: 6400,
    },
    {
      id: '3',
      date: '2024-01-14',
      entryType: 'Sales',
      materialType: 'P-Sand',
      truckNumber: 'TN09EF9012',
      units: 12,
      rate: 1600,
      total: 19200,
    },
    {
      id: '4',
      date: '2024-01-14',
      entryType: 'Sales',
      materialType: 'Blue Metal',
      truckNumber: 'DL03GH3456',
      units: 15,
      rate: 1700,
      total: 25500,
    },
  ];

  const formatCurrency = amount => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleExport = async format => {
    const filters = {
      materialFilter,
      entryTypeFilter,
    };

    if (format === 'PDF') {
      await exportToPDF(filteredReports, reportType, filters);
    } else if (format === 'Excel') {
      await exportToCSV(filteredReports, reportType, filters);
    }
  };

  const renderFilterModal = (
    visible,
    setVisible,
    items,
    selectedValue,
    onSelect,
    title,
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {items.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterOption,
                selectedValue === item.value && styles.filterOptionSelected,
              ]}
              onPress={() => {
                onSelect(item.value);
                setVisible(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedValue === item.value &&
                    styles.filterOptionTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportDate}>{item.date}</Text>
        <Text
          style={[
            styles.entryTypeBadge,
            {
              backgroundColor:
                item.entryType === 'Sales' ? '#27AE60' : '#E74C3C',
            },
          ]}
        >
          {item.entryType}
        </Text>
      </View>

      <View style={styles.reportDetails}>
        <Text style={styles.truckNumber}>🚛 {item.truckNumber}</Text>
        <Text style={styles.materialType}>📦 {item.materialType}</Text>
      </View>

      <View style={styles.reportMetrics}>
        <Text style={styles.units}>Units: {item.units}</Text>
        <Text style={styles.rate}>Rate: {formatCurrency(item.rate)}</Text>
        <Text style={styles.total}>Total: {formatCurrency(item.total)}</Text>
      </View>
    </View>
  );

  const filteredReports = sampleReports.filter(report => {
    if (materialFilter !== 'All' && report.materialType !== materialFilter)
      return false;
    if (entryTypeFilter !== 'All' && report.entryType !== entryTypeFilter)
      return false;
    return true;
  });

  const totalSales = filteredReports
    .filter(r => r.entryType === 'Sales')
    .reduce((sum, r) => sum + r.total, 0);

  const totalRawStone = filteredReports
    .filter(r => r.entryType === 'Raw Stone')
    .reduce((sum, r) => sum + r.total, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Reports & Analytics</Text>
            <Text style={styles.userRole}>Detailed Business Reports</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filters</Text>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowReportTypeModal(true)}
            >
              <Text style={styles.filterLabel}>📅 Report:</Text>
              <Text style={styles.filterValue}>{reportType}</Text>
              <Text style={styles.filterArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowMaterialModal(true)}
            >
              <Text style={styles.filterLabel}>📦 Material:</Text>
              <Text style={styles.filterValue}>{materialFilter}</Text>
              <Text style={styles.filterArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowEntryTypeModal(true)}
            >
              <Text style={styles.filterLabel}>📥 Type:</Text>
              <Text style={styles.filterValue}>{entryTypeFilter}</Text>
              <Text style={styles.filterArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={[styles.summaryValue, { color: '#27AE60' }]}>
                {formatCurrency(totalSales)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Raw Stone Cost</Text>
              <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>
                {formatCurrency(totalRawStone)}
              </Text>
            </View>
          </View>

          <View style={styles.profitCard}>
            <Text style={styles.summaryLabel}>Net Profit</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    totalSales - totalRawStone >= 0 ? '#27AE60' : '#E74C3C',
                },
              ]}
            >
              {formatCurrency(totalSales - totalRawStone)}
            </Text>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Export Options</Text>

          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExport('PDF')}
            >
              <Text style={styles.exportIcon}>📄</Text>
              <Text style={styles.exportText}>Download PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExport('Excel')}
            >
              <Text style={styles.exportIcon}>📊</Text>
              <Text style={styles.exportText}>Download CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>
            {reportType} Reports ({filteredReports.length} entries)
          </Text>

          <FlatList
            data={filteredReports}
            renderItem={renderReportItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No reports found for selected filters
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Filter Modals */}
      {renderFilterModal(
        showReportTypeModal,
        setShowReportTypeModal,
        reportTypes,
        reportType,
        setReportType,
        'Select Report Type',
      )}

      {renderFilterModal(
        showMaterialModal,
        setShowMaterialModal,
        materialTypes,
        materialFilter,
        setMaterialFilter,
        'Select Material Type',
      )}

      {renderFilterModal(
        showEntryTypeModal,
        setShowEntryTypeModal,
        entryTypes,
        entryTypeFilter,
        setEntryTypeFilter,
        'Select Entry Type',
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 16,
  },
  filtersSection: {
    marginBottom: 30,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
    marginRight: 4,
  },
  filterValue: {
    fontSize: 12,
    color: theme.COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  filterArrow: {
    fontSize: 10,
    color: theme.COLORS.darkGray,
  },
  summarySection: {
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  profitCard: {
    backgroundColor: theme.COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportSection: {
    marginBottom: 30,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  exportText: {
    fontSize: 14,
    color: theme.COLORS.white,
    fontWeight: '600',
  },
  reportsSection: {
    marginBottom: 20,
  },
  reportItem: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.lightGray,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
    fontWeight: '500',
  },
  entryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: theme.COLORS.white,
    fontWeight: 'bold',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  truckNumber: {
    fontSize: 14,
    color: theme.COLORS.text,
  },
  materialType: {
    fontSize: 14,
    color: theme.COLORS.text,
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  units: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
  },
  rate: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
  },
  total: {
    fontSize: 12,
    color: theme.COLORS.primary,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    textAlign: 'center',
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

export default ReportsScreen;
