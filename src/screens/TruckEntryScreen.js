import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Modal,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { APP_ROUTES } from '../navigations/Routes';

const { width } = Dimensions.get('window');

const TruckEntryScreen = ({ navigation, route }) => {
  const { editMode = false, entryData = null } = route.params || {};

  const [truckImage, setTruckImage] = useState(
    editMode && entryData?.truckImage ? { uri: entryData.truckImage } : null,
  );
  const [truckNumber, setTruckNumber] = useState(
    editMode ? entryData?.truckNumber || '' : '',
  );
  const [entryType, setEntryType] = useState(
    editMode ? entryData?.entryType || '' : '',
  );
  const [materialType, setMaterialType] = useState(
    editMode ? entryData?.materialType || '' : '',
  );
  const [units, setUnits] = useState(
    editMode ? entryData?.units?.toString() || '' : '',
  );
  const [ratePerUnit, setRatePerUnit] = useState(
    editMode ? entryData?.ratePerUnit?.toString() || '' : '',
  );
  const [totalAmount, setTotalAmount] = useState(
    editMode ? entryData?.totalAmount?.toString() || '' : '',
  );
  const [showEntryTypeModal, setShowEntryTypeModal] = useState(false);
  const [showMaterialTypeModal, setShowMaterialTypeModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({
    camera: false,
    storage: false,
    writeStorage: false,
  });

  // API integration states
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [userRole, setUserRole] = useState('user');

  // Get dynamic data from app config
  const allMaterialTypes = appConfig?.materialTypes || [
    { value: 'M-Sand', label: 'M-Sand' },
    { value: 'P-Sand', label: 'P-Sand' },
    { value: 'Blue Metal', label: 'Blue Metal' },
    { value: 'Raw Stone', label: 'Raw Stone' },
  ];

  // Filter material types based on entry type
  const materialTypes =
    entryType === 'Sales'
      ? allMaterialTypes.filter(type => type.value !== 'Raw Stone')
      : allMaterialTypes.filter(type => type.value === 'Raw Stone');
  const entryTypes = appConfig?.entryTypes || [
    { value: 'Sales', label: 'Sales' },
    { value: 'Raw Stone', label: 'Raw Stone' },
  ];

  // Fallback material rates if API doesn't return them
  const fallbackMaterialRates = {
    'M-Sand': { currentRate: 22000 },
    'P-Sand': { currentRate: 20000 },
    'Blue Metal': { currentRate: 24000 },
    'Raw Stone': { currentRate: 18000 },
  };

  const materialRates = appConfig?.materialRates || fallbackMaterialRates;

  useEffect(() => {
    checkAllPermissions();
    loadAppConfiguration();
  }, []);

  const loadAppConfiguration = async () => {
    try {
      const response = await apiService.getAppConfig();
      if (response.success) {
        setAppConfig(response.data);
      } else {
        setErrorMessage('Failed to load app settings. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Failed to load app settings. Please try again.');
    }
  };

  useEffect(() => {
    // This effect handles logic specifically for the Entry Type selection.
    if (entryType === 'Raw Stone') {
      // If Raw Stone is selected, set its price immediately and clear material type.
      if (materialRates['Raw Stone']) {
        const rate = materialRates['Raw Stone'].currentRate;
        setRatePerUnit(rate.toString());
      }
      setMaterialType('');
    } else if (entryType === 'Sales') {
      // If Sales is selected, clear the rate until a material is chosen.
      setRatePerUnit('');
    }
  }, [entryType, materialRates]);

  useEffect(() => {
    // This effect handles logic specifically for the Material Type selection in Sales.
    if (entryType === 'Sales' && materialType) {
      if (materialRates[materialType]) {
        const rate = materialRates[materialType].currentRate;
        setRatePerUnit(rate.toString());
      }
    }
  }, [materialType, entryType, materialRates]);

  // Calculate total amount when units or rate changes using backend API
  useEffect(() => {
    const calculateTotal = async () => {
      if (units && ratePerUnit) {
        const unitsNum = parseFloat(units);
        const rateNum = parseFloat(ratePerUnit);

        if (
          !isNaN(unitsNum) &&
          !isNaN(rateNum) &&
          unitsNum > 0 &&
          rateNum > 0
        ) {
          try {
            const response = await apiService.calculateTotal(
              unitsNum,
              rateNum,
              materialType,
            );

            if (response.success) {
              setTotalAmount(response.data.calculation.totalAmount.toString());
            } else {
              // Fallback to local calculation
              const total = unitsNum * rateNum;
              setTotalAmount(total.toString());
            }
          } catch (error) {
            // Fallback to local calculation
            const total = unitsNum * rateNum;
            setTotalAmount(total.toString());
          }
        } else {
        }
      } else {
        setTotalAmount('');
      }
    };

    // Debounce calculation to avoid too many API calls
    const timeoutId = setTimeout(calculateTotal, 300);
    return () => clearTimeout(timeoutId);
  }, [units, ratePerUnit, materialType]);

  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const checkAllPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];

        if (Platform.Version < 33) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }

        const results = await PermissionsAndroid.requestMultiple(permissions, {
          title: 'CrusherMate Permissions',
          message:
            'CrusherMate needs camera and storage access to capture and manage truck images for entry records.',
        });

        setPermissionsGranted({
          camera:
            results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
            PermissionsAndroid.RESULTS.GRANTED,
          storage:
            results[
              Platform.Version >= 33
                ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
            ] === PermissionsAndroid.RESULTS.GRANTED,
          writeStorage:
            Platform.Version >= 33 ||
            results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED,
        });
      } catch (err) {
        console.warn('Permission check error:', err);
      }
    } else {
      // iOS - permissions are handled automatically by react-native-image-picker
      setPermissionsGranted({
        camera: true,
        storage: true,
        writeStorage: true,
      });
    }
  };

  const extractTruckNumber = imageUri => {
    // This is a placeholder for OCR functionality
    // In a real app, you would use OCR libraries like react-native-text-detector
    // For now, we'll generate a sample truck number
    const sampleNumbers = [
      'KA01AB1234',
      'MH12CD5678',
      'TN09EF9012',
      'DL03GH3456',
    ];
    const randomNumber =
      sampleNumbers[Math.floor(Math.random() * sampleNumbers.length)];
    setTruckNumber(randomNumber);
  };

  const showImagePicker = () => {
    setShowImagePickerModal(true);
  };

  const openCamera = async () => {
    setShowImagePickerModal(false);

    if (!permissionsGranted.camera || !permissionsGranted.writeStorage) {
      Alert.alert(
        'Permissions Required',
        'Camera and storage permissions are required to capture truck images. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppSettings },
        ],
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        return;
      }
      if (response.error) {
        Alert.alert(
          'Camera Error',
          'Failed to capture image. Please try again.',
        );
        return;
      }
      if (response.assets && response.assets[0]) {
        setTruckImage(response.assets[0]);
        extractTruckNumber(response.assets[0].uri);
        Alert.alert('Success', 'Truck image captured successfully!');
      }
    });
  };

  const openGallery = async () => {
    setShowImagePickerModal(false);

    if (!permissionsGranted.storage) {
      Alert.alert(
        'Storage Permission Required',
        'Storage permission is required to select images from gallery. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppSettings },
        ],
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }
      if (response.error) {
        Alert.alert(
          'Gallery Error',
          'Failed to select image. Please try again.',
        );
        return;
      }
      if (response.assets && response.assets[0]) {
        setTruckImage(response.assets[0]);
        extractTruckNumber(response.assets[0].uri);
        Alert.alert('Success', 'Truck image selected successfully!');
      }
    });
  };

  const validateForm = () => {
    // Image is now optional - removed validation requirement
    if (!truckNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter the truck number.');
      return false;
    }

    // Validate truck number format: More flexible validation
    const truckNumberPattern =
      /^[A-Z]{2}[\s\-]?[0-9]{2}[\s\-]?[A-Z]{1,2}[\s\-]?[0-9]{4}$/;
    if (!truckNumberPattern.test(truckNumber.toUpperCase())) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid truck number format (e.g., KA01AB1234, KA-01-AB-1234)',
      );
      return false;
    }

    if (!entryType) {
      Alert.alert('Validation Error', 'Please select an entry type.');
      return false;
    }
    if (entryType === 'Sales' && !materialType) {
      Alert.alert(
        'Validation Error',
        'Please select a material type for sales.',
      );
      return false;
    }

    // Validate units
    if (!units || units.trim() === '') {
      Alert.alert('Validation Error', 'Please enter units/quantity.');
      return false;
    }
    const unitsValue = parseFloat(units);
    if (isNaN(unitsValue) || unitsValue <= 0) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid units value (greater than 0).',
      );
      return false;
    }

    // Validate rate per unit
    if (!ratePerUnit || ratePerUnit.trim() === '') {
      Alert.alert('Validation Error', 'Please enter rate per unit.');
      return false;
    }
    const rateValue = parseFloat(ratePerUnit);
    if (isNaN(rateValue) || rateValue <= 0) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid rate per unit (greater than 0).',
      );
      return false;
    }

    return true;
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    clearMessages();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Test API connection first
      try {
        await apiService.testConnection();
      } catch (connectionError) {
        setErrorMessage(
          'Cannot connect to server. Please check your internet connection.',
        );
        return;
      }

      // Get current time for entry
      const now = new Date();
      const entryTime = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }); // HH:MM format

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const entryData = {
        truckNumber: truckNumber.toUpperCase(),
        entryType,
        materialType: entryType === 'Sales' ? materialType : null,
        units: parseFloat(units),
        ratePerUnit: parseFloat(ratePerUnit),
        entryDate: todayString, // Set to today's date
        // entryTime: removed, backend will set
      };

      // Debug token loading
      const savedToken = await AsyncStorage.getItem('userToken');
      if (savedToken) {
      }

      // Debug API service token status
      await apiService.debugTokenStatus();

      // Token is automatically loaded by apiService

      // First validate with backend
      const validationResponse = await apiService.validateTruckEntry(entryData);

      if (!validationResponse.success || !validationResponse.data.isValid) {
        setValidationErrors(validationResponse.data.errors || []);
        setErrorMessage('Please fix the validation errors and try again.');
        return;
      }

      // Show warnings if any
      if (
        validationResponse.data.warnings &&
        validationResponse.data.warnings.length > 0
      ) {
      }

      let response;
      if (editMode) {
        // Update existing entry
        response = await apiService.updateTruckEntry(
          entryData.id,
          entryData,
          null, // No image for now
        );
      } else {
        // Create new entry
        response = await apiService.createTruckEntry(entryData, null); // No image for now
      }

      if (response.success) {
        const truckEntry = response.data?.truckEntry || response.data;
        const formattedAmount =
          truckEntry?.formattedAmount ||
          formatCurrency(truckEntry?.totalAmount || 0);
        const successMsg = editMode
          ? `Entry updated successfully! Total: ${formattedAmount}`
          : `Entry created successfully! Total: ${formattedAmount}`;

        setSuccessMessage(successMsg);

        // Navigate back after short delay
        setTimeout(() => {
          if (editMode) {
            navigation.goBack();
          } else {
            // Reset form and navigate to Track for new entries
            resetForm();
            navigation.navigate(APP_ROUTES.TRACK);
          }
        }, 2000);
      } else {
        setErrorMessage(
          response.message || 'Failed to save entry. Please try again.',
        );
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Network error. Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTruckImage(null);
    setTruckNumber('');
    setEntryType('');
    setMaterialType('');
    setUnits('');
    setRatePerUnit('');
    setTotalAmount('');
    clearMessages();
  };

  const renderDropdownModal = (visible, setVisible, items, onSelect, title) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.dropdownModalOverlay}>
        <View style={styles.dropdownModalContent}>
          {/* Header */}
          <View style={styles.dropdownModalHeader}>
            <Text style={styles.dropdownModalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.dropdownModalCloseButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.dropdownModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.dropdownOptionsContainer}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.dropdownOption,
                  index === items.length - 1 && styles.dropdownOptionLast,
                ]}
                onPress={() => {
                  onSelect(item.value);
                  setVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownOptionContent}>
                  <Text style={styles.dropdownOptionText}>{item.label}</Text>
                  <View style={styles.dropdownOptionIcon}>
                    <Text style={styles.dropdownOptionArrow}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.dropdownCancelButton}
            onPress={() => setVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerContent}>
          <Text style={styles.imagePickerTitle}>Capture Truck Image</Text>
          <Text style={styles.imagePickerSubtitle}>
            Choose how to add truck image for entry record
          </Text>

          <View style={styles.imagePickerOptions}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={openCamera}
            >
              <View style={styles.imagePickerIconContainer}>
                <Text style={styles.imagePickerIcon}>📷</Text>
              </View>
              <Text style={styles.imagePickerOptionTitle}>Take Photo</Text>
              <Text style={styles.imagePickerOptionDesc}>
                Capture truck image with camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={openGallery}
            >
              <View style={styles.imagePickerIconContainer}>
                <Text style={styles.imagePickerIcon}>🖼️</Text>
              </View>
              <Text style={styles.imagePickerOptionTitle}>
                Choose from Gallery
              </Text>
              <Text style={styles.imagePickerOptionDesc}>
                Select existing image from gallery
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.imagePickerCancelButton}
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
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
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {editMode ? 'Edit Entry' : 'Truck Entry'}
              </Text>
              <Text style={styles.subtitle}>
                {editMode ? 'Update truck details' : 'Record truck details'}
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

        {/* Truck Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truck Photo (Optional)</Text>
          <TouchableOpacity
            style={styles.imageUpload}
            onPress={showImagePicker}
          >
            {truckImage ? (
              <Image
                source={{ uri: truckImage.uri }}
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}></Text>
                <Text style={styles.imagePlaceholderText}>
                  Tap to capture truck image (optional)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Truck Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truck Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., KA01AB1234"
              placeholderTextColor={theme.COLORS.placeholder}
              value={truckNumber}
              onChangeText={setTruckNumber}
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>
          <Text style={styles.helperText}>
            Format: 2 letters + 2 numbers + 1-2 letters + 4 numbers
          </Text>
        </View>

        {/* Entry Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Type</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowEntryTypeModal(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !entryType && styles.placeholderText,
              ]}
            >
              {entryType || 'Select entry type...'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Material Type (only show for Sales) */}
        {entryType === 'Sales' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material Type</Text>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMaterialTypeModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !materialType && styles.placeholderText,
                ]}
              >
                {materialType || 'Select material type...'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Units/Tons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units / Tons</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter units or tons"
              placeholderTextColor={theme.COLORS.placeholder}
              value={units}
              onChangeText={text => {
                setUnits(text);
              }}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        {/* Rate per Unit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Rate per Unit {entryType === 'Sales' ? '(Auto-filled)' : ''}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                entryType === 'Sales' && materialType && styles.autoFilledInput,
              ]}
              placeholder={
                entryType === 'Sales'
                  ? 'Select material type first'
                  : 'Enter rate per unit'
              }
              placeholderTextColor={theme.COLORS.placeholder}
              value={ratePerUnit}
              onChangeText={text => {
                setRatePerUnit(text);
              }}
              keyboardType="numeric"
              maxLength={10}
              editable={entryType !== 'Sales' || !materialType}
            />
          </View>
          {entryType === 'Sales' && materialType && (
            <Text style={styles.autoFillNote}>
              Rate auto-filled based on current market price for {materialType}
            </Text>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Amount</Text>
          <View style={[styles.inputWrapper, styles.disabledInput]}>
            <Text style={[styles.textInput, styles.totalAmountText]}>
              {totalAmount && !isNaN(parseFloat(totalAmount))
                ? `₹${parseFloat(totalAmount).toLocaleString('en-IN')}`
                : 'Enter units and rate to calculate'}
            </Text>
          </View>
          {totalAmount && (
            <Text style={styles.calculationNote}>
              {units || 0} units × ₹
              {ratePerUnit && !isNaN(parseFloat(ratePerUnit))
                ? parseFloat(ratePerUnit).toLocaleString('en-IN')
                : '0'}{' '}
              = ₹
              {totalAmount && !isNaN(parseFloat(totalAmount))
                ? parseFloat(totalAmount).toLocaleString('en-IN')
                : '0'}
            </Text>
          )}
        </View>

        {/* Success Message */}
        {successMessage ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✅ {successMessage}</Text>
          </View>
        ) : null}

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Validation Errors */}
        {validationErrors && validationErrors.length > 0 ? (
          <View style={styles.validationContainer}>
            <Text style={styles.validationTitle}>
              ⚠️ Please fix these issues:
            </Text>
            {validationErrors.map((error, index) => (
              <Text key={index} style={styles.validationText}>
                • {error}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.COLORS.white} size="small" />
              <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                {editMode ? 'Updating...' : 'Submitting...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {editMode ? 'Update Entry' : 'Submit'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Owner Navigation Buttons - Only show for owners */}
        {userRole === 'owner' && (
          <View style={styles.ownerSection}>
            <Text style={styles.ownerSectionTitle}>Owner Dashboard</Text>

            <View style={styles.ownerButtonsRow}>
              <TouchableOpacity
                style={styles.ownerButton}
                onPress={() => navigation.navigate(APP_ROUTES.DASHBOARD)}
              >
                <Text style={styles.ownerButtonIcon}>📊</Text>
                <Text style={styles.ownerButtonText}>Dashboard</Text>
              </TouchableOpacity>

              {/* Reports feature coming soon */}
              {/* <TouchableOpacity
                style={styles.ownerButton}
                onPress={() => navigation.navigate('Reports')}
              >
                <Text style={styles.ownerButtonIcon}>📈</Text>
                <Text style={styles.ownerButtonText}>Reports</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        )}
      </View>

      {/* Dropdown Modals */}
      {renderDropdownModal(
        showEntryTypeModal,
        setShowEntryTypeModal,
        entryTypes,
        setEntryType,
        'Select Entry Type',
      )}
      {renderDropdownModal(
        showMaterialTypeModal,
        setShowMaterialTypeModal,
        materialTypes,
        value => {
          setMaterialType(value);
        },
        'Select Material Type',
      )}

      {/* Image Picker Modal */}
      {renderImagePickerModal()}
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
    marginBottom: 30,
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

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledText: {
    color: theme.COLORS.placeholder,
  },
  imageUpload: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.COLORS.inputBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.COLORS.text,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.COLORS.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.COLORS.placeholder,
  },
  dropdownArrow: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
  },
  disabledInput: {
    backgroundColor: theme.COLORS.gray,
    opacity: 0.6,
  },
  dateTimeText: {
    fontSize: 16,
    color: theme.COLORS.text,
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Image Picker Modal Styles
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  imagePickerContent: {
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  imagePickerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  imagePickerSubtitle: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  imagePickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  imagePickerOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 8,
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imagePickerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerIcon: {
    fontSize: 28,
  },
  imagePickerOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  imagePickerOptionDesc: {
    fontSize: 13,
    color: theme.COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 18,
  },
  imagePickerCancelButton: {
    backgroundColor: theme.COLORS.inputBorder,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    fontWeight: '600',
  },
  // Owner Section Styles
  ownerSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.lightGray,
  },
  ownerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  ownerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  ownerButton: {
    flex: 1,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownerButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  ownerButtonText: {
    color: theme.COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // New styles for dropdown modal
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.lightGray,
    backgroundColor: theme.COLORS.lightGray,
  },
  dropdownModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.text,
  },
  dropdownModalCloseButton: {
    padding: 8,
  },
  dropdownModalCloseText: {
    fontSize: 24,
    color: theme.COLORS.darkGray,
  },
  dropdownOptionsContainer: {
    maxHeight: '70%', // Allow options to scroll
    paddingBottom: 16,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.lightGray,
    backgroundColor: theme.COLORS.white,
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.COLORS.text,
  },
  dropdownOptionIcon: {
    width: 24,
    alignItems: 'center',
  },
  dropdownOptionArrow: {
    fontSize: 18,
    color: theme.COLORS.darkGray,
  },
  dropdownCancelButton: {
    backgroundColor: theme.COLORS.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.gray,
  },
  dropdownCancelText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
    fontWeight: '500',
  },
  // Auto-filled input styles
  autoFilledInput: {
    backgroundColor: theme.COLORS.lightGray,
    color: theme.COLORS.primary,
    fontWeight: '600',
  },
  autoFillNote: {
    fontSize: 12,
    color: theme.COLORS.secondary,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    textAlign: 'center',
  },
  calculationNote: {
    fontSize: 12,
    color: theme.COLORS.gray,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  validationContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  validationTitle: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  validationText: {
    color: '#E65100',
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 2,
  },
  submitButtonDisabled: {
    backgroundColor: theme.COLORS.lightGray,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TruckEntryScreen;
