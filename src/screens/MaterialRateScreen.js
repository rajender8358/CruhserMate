import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import Loader from '../components/Loader';

// Separate RateInput component to prevent re-renders
const RateInput = React.forwardRef(
  ({ materialType, label, currentRate, value, onChangeText }, ref) => {
    return (
      <View style={styles.rateInputContainer}>
        <Text style={styles.materialLabel}>{label}</Text>
        <View style={styles.inputRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            ref={ref}
            style={styles.rateInput}
            value={value}
            onChangeText={onChangeText}
            placeholder="Enter rate"
            placeholderTextColor={theme.COLORS.placeholder}
            keyboardType="numeric"
            maxLength={8}
            returnKeyType="done"
            blurOnSubmit={true}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            selectTextOnFocus={true}
            clearButtonMode="while-editing"
          />
        </View>
        {currentRate ? (
          <Text style={styles.currentRateText}>
            Current: ₹{currentRate.toLocaleString('en-IN')}
          </Text>
        ) : (
          <Text style={styles.noCurrentRateText}>No current rate set</Text>
        )}
      </View>
    );
  },
);

const MaterialRateScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({});
  const [currentRates, setCurrentRates] = useState({});
  const [materialEntryTypeMap, setMaterialEntryTypeMap] = useState({});

  useEffect(() => {
    if (user?.role !== 'owner') {
      Alert.alert('Access Denied', 'Only owners can manage material rates.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
    fetchMaterialRates();
  }, [user]);

  const fetchMaterialRates = async () => {
    try {
      setLoading(true);
      // Fetch Sales and RawStone in parallel
      const [salesRes, rawRes] = await Promise.all([
        apiService.getMaterialRates('Sales'),
        apiService.getMaterialRates('RawStone'),
      ]);

      const combined = [
        ...(Array.isArray(salesRes?.data) ? salesRes.data : []),
        ...(Array.isArray(rawRes?.data) ? rawRes.data : []),
      ];

      if (combined.length > 0) {
        const ratesData = {};
        const dynamicRates = {};
        const map = {};

        combined.forEach(item => {
          const materialName = item.materialType;
          const current =
            Number(item.ratePerUnit || item.currentRate || item.rate) || 0;
          ratesData[materialName] = current || undefined;
          dynamicRates[materialName] = current ? String(current) : '';
          map[materialName] = item.entryType;
        });

        setCurrentRates(ratesData);
        setRates(dynamicRates);
        setMaterialEntryTypeMap(map);
      } else {
        setCurrentRates({});
        setRates({});
        setMaterialEntryTypeMap({});
      }
    } catch (error) {
      console.error('❌ Error fetching material rates:', error);

      // Handle authentication errors
      if (error.name === 'AuthError') {
        Alert.alert(
          'Authentication Error',
          'Please log in again to continue.',
          [
            {
              text: 'OK',
              onPress: () => {
                // This will trigger logout in AuthContext
                navigation.navigate('Login');
              },
            },
          ],
        );
        return;
      }

      // Use empty values on error
      setCurrentRates({});
      setRates({});
      setMaterialEntryTypeMap({});
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = useCallback((materialType, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setRates(prev => ({
      ...prev,
      [materialType]: numericValue,
    }));
  }, []);

  const validateRates = useCallback(() => {
    const errors = [];
    Object.entries(rates).forEach(([materialType, rate]) => {
      if (!rate || rate === '') {
        errors.push(`${materialType} rate is required`);
      } else if (parseFloat(rate) < 0) {
        errors.push(`${materialType} rate cannot be negative`);
      }
    });
    return errors;
  }, [rates]);

  const handleSaveRates = async () => {
    const errors = validateRates();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      setSaving(true);
      const promises = Object.entries(rates).map(([materialType, rate]) => {
        const entryType = materialEntryTypeMap[materialType] || 'Sales';
        return apiService.updateMaterialRate({
          entryType,
          materialType,
          ratePerUnit: parseFloat(rate),
        });
      });

      await Promise.all(promises);
      Alert.alert('Success', 'Material rates updated successfully!');
      fetchMaterialRates(); // Refresh the data
    } catch (error) {
      console.error('Error updating rates:', error);

      // Handle authentication errors
      if (error.name === 'AuthError') {
        Alert.alert(
          'Authentication Error',
          'Please log in again to continue.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Login');
              },
            },
          ],
        );
        return;
      }

      Alert.alert('Error', 'Failed to update material rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader variant="fullscreen" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Material Rates</Text>
          <Text style={styles.subtitle}>Set prices for your organization</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Rate Inputs */}
          <View style={styles.ratesContainer}>
            {Object.keys(rates).length > 0 ? (
              Object.keys(rates).map((materialType, index) => (
                <RateInput
                  key={materialType}
                  materialType={materialType}
                  label={materialType}
                  currentRate={currentRates[materialType]}
                  value={rates[materialType]}
                  onChangeText={value => handleRateChange(materialType, value)}
                />
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No material rates found. Please contact your administrator.
                </Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveRates}
            disabled={saving}
          >
            {saving ? (
              <Loader
                size="small"
                color={theme.COLORS.white}
                variant="inline"
              />
            ) : (
              <Text style={styles.saveButtonText}>Save Rates</Text>
            )}
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ Information</Text>
            <Text style={styles.infoText}>
              • Rates are used to auto-fill prices when creating truck entries
              {'\n'}• Changes take effect immediately
              {'\n'}• These rates are saved and loaded based on your
              organization
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background || '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 20,
    marginRight: 16,
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
    lineHeight: 20,
  },
  ratesContainer: {
    marginBottom: 32,
  },
  rateInputContainer: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.inputBorder,
  },
  materialLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text,
    marginRight: 8,
  },
  rateInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 8,
  },
  currentRateText: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  noCurrentRateText: {
    fontSize: 12,
    color: theme.COLORS.placeholder,
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.lightGray,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.COLORS.darkGray,
    lineHeight: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    textAlign: 'center',
  },
});

export default MaterialRateScreen;
