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
  ActivityIndicator,
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
  const [rates, setRates] = useState({
    'M-Sand': '',
    'P-Sand': '',
    'Blue Metal 0.5in': '',
    'Blue Metal 0.75in': '',
    Jally: '',
    Kurunai: '',
    Mixed: '',
    'Raw Stone': '',
  });
  const [currentRates, setCurrentRates] = useState({});

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
      const response = await apiService.getMaterialRates();

      if (response.success && response.data && response.data.length > 0) {
        const ratesData = {};
        response.data.forEach(rate => {
          ratesData[rate.materialType] = rate.currentRate || rate.rate;
        });
        setCurrentRates(ratesData);

        // Initialize form with current rates
        setRates({
          'M-Sand': ratesData['M-Sand']?.toString() || '22000',
          'P-Sand': ratesData['P-Sand']?.toString() || '20000',
          'Blue Metal 0.5in':
            ratesData['Blue Metal 0.5in']?.toString() || '24000',
          'Blue Metal 0.75in':
            ratesData['Blue Metal 0.75in']?.toString() || '25000',
          Jally: ratesData['Jally']?.toString() || '18000',
          Kurunai: ratesData['Kurunai']?.toString() || '16000',
          Mixed: ratesData['Mixed']?.toString() || '20000',
          'Raw Stone': ratesData['Raw Stone']?.toString() || '18000',
        });
      } else {
        // If no rates found, use default values and show empty current rates

        setCurrentRates({});
        setRates({
          'M-Sand': '22000',
          'P-Sand': '20000',
          'Blue Metal 0.5in': '24000',
          'Blue Metal 0.75in': '25000',
          Jally: '18000',
          Kurunai: '16000',
          Mixed: '20000',
          'Raw Stone': '18000',
        });
      }
    } catch (error) {
      console.error('❌ Error fetching material rates:', error);
      // Use default values on error
      setCurrentRates({});
      setRates({
        'M-Sand': '22000',
        'P-Sand': '20000',
        'Blue Metal 0.5in': '24000',
        'Blue Metal 0.75in': '25000',
        Jally: '18000',
        Kurunai: '16000',
        Mixed: '20000',
        'Raw Stone': '18000',
      });
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
      } else if (parseFloat(rate) <= 0) {
        errors.push(`${materialType} rate must be greater than 0`);
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
      const promises = Object.entries(rates).map(([materialType, rate]) =>
        apiService.updateMaterialRate({
          materialType,
          rate: parseFloat(rate),
        }),
      );

      await Promise.all(promises);
      Alert.alert('Success', 'Material rates updated successfully!');
      fetchMaterialRates(); // Refresh the data
    } catch (error) {
      console.error('Error updating rates:', error);
      Alert.alert('Error', 'Failed to update material rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <Text style={styles.loadingText}>Loading material rates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Material Rates</Text>
          <Text style={styles.subtitle}>Set prices for materials</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material Rates</Text>
            <Text style={styles.sectionDescription}>
              Set the current market rates for each material type. These rates
              will be used to auto-fill prices when creating truck entries. You
              can edit the rates below and save them.
            </Text>
          </View>

          {/* Rate Inputs */}
          <View style={styles.ratesContainer}>
            <RateInput
              materialType="M-Sand"
              label="M-Sand"
              currentRate={currentRates['M-Sand']}
              value={rates['M-Sand']}
              onChangeText={value => handleRateChange('M-Sand', value)}
            />
            <RateInput
              materialType="P-Sand"
              label="P-Sand"
              currentRate={currentRates['P-Sand']}
              value={rates['P-Sand']}
              onChangeText={value => handleRateChange('P-Sand', value)}
            />
            <RateInput
              materialType="Blue Metal 0.5in"
              label="Blue Metal 0.5in"
              currentRate={currentRates['Blue Metal 0.5in']}
              value={rates['Blue Metal 0.5in']}
              onChangeText={value =>
                handleRateChange('Blue Metal 0.5in', value)
              }
            />
            <RateInput
              materialType="Blue Metal 0.75in"
              label="Blue Metal 0.75in"
              currentRate={currentRates['Blue Metal 0.75in']}
              value={rates['Blue Metal 0.75in']}
              onChangeText={value =>
                handleRateChange('Blue Metal 0.75in', value)
              }
            />
            <RateInput
              materialType="Jally"
              label="Jally"
              currentRate={currentRates['Jally']}
              value={rates['Jally']}
              onChangeText={value => handleRateChange('Jally', value)}
            />
            <RateInput
              materialType="Kurunai"
              label="Kurunai"
              currentRate={currentRates['Kurunai']}
              value={rates['Kurunai']}
              onChangeText={value => handleRateChange('Kurunai', value)}
            />
            <RateInput
              materialType="Mixed"
              label="Mixed"
              currentRate={currentRates['Mixed']}
              value={rates['Mixed']}
              onChangeText={value => handleRateChange('Mixed', value)}
            />
            <RateInput
              materialType="Raw Stone"
              label="Raw Stone"
              currentRate={currentRates['Raw Stone']}
              value={rates['Raw Stone']}
              onChangeText={value => handleRateChange('Raw Stone', value)}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveRates}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Rates</Text>
            )}
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ Information</Text>
            <Text style={styles.infoText}>
              • Rates are used to auto-fill prices when creating truck entries
              {'\n'}• Changes take effect immediately{'\n'}• All users in your
              organization will see these rates{'\n'}• Rates are stored per
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
});

export default MaterialRateScreen;
