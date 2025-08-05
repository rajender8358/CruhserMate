import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { APP_ROUTES } from '../navigations/Routes';

const OtherExpenseScreen = ({ navigation, route }) => {
  const { editMode = false, expenseData = null } = route.params || {};

  const [expensesName, setExpensesName] = useState(
    editMode ? expenseData?.expensesName || '' : '',
  );
  const [amount, setAmount] = useState(
    editMode ? expenseData?.amount?.toString() || '' : '',
  );
  const [others, setOthers] = useState(
    editMode ? expenseData?.others || '' : '',
  );

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Clear messages when component mounts
    clearMessages();

    // Check authentication status
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');

      if (!token || !userData) {
        setErrorMessage('Please log in to continue.');
        // You could navigate to login screen here if needed
        return;
      }
    } catch (error) {
      setErrorMessage('Authentication error. Please log in again.');
    }
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!expensesName.trim()) {
      errors.expensesName = 'Expenses name is required';
    } else if (expensesName.trim().length > 100) {
      errors.expensesName = 'Expenses name cannot exceed 100 characters';
    }

    if (!amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 0) {
        errors.amount = 'Amount must be a valid positive number';
      } else if (amountValue > 10000000) {
        errors.amount = 'Amount cannot exceed 10,000,000';
      }
    }

    if (others.trim().length > 500) {
      errors.others = 'Others field cannot exceed 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      // Check authentication status
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');

      const expenseData = {
        expensesName: expensesName.trim(),
        amount: parseFloat(amount),
        others: others.trim(),
        date: new Date().toISOString(),
      };

      let response;
      if (editMode) {
        response = await apiService.updateOtherExpense(
          expenseData._id,
          expenseData,
        );
      } else {
        response = await apiService.createOtherExpense(expenseData);
      }

      if (response.success) {
        setSuccessMessage(
          editMode
            ? 'Other expense updated successfully!'
            : 'Other expense added successfully!',
        );

        // Reset form after successful submission
        if (!editMode) {
          resetForm();
        }

        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Failed to save other expense');
      }
    } catch (error) {
      console.error('Other expense submission error:', error);

      // Check if it's an authentication error
      if (error.message && error.message.includes('Authentication')) {
        setErrorMessage('Please log in again to continue.');
      } else {
        setErrorMessage('Failed to save other expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setExpensesName('');
    setAmount('');
    setOthers('');
    clearMessages();
  };

  const formatCurrency = value => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleAmountChange = text => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setAmount(cleaned);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{'Expenses'}</Text>
                <Text style={styles.subtitle}>
                  {editMode
                    ? 'Update expense details'
                    : 'Record expense details'}
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

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 ? (
            <View style={styles.validationContainer}>
              <Text style={styles.validationTitle}>
                Please fix the following errors:
              </Text>
              {Object.entries(validationErrors).map(([field, error]) => (
                <Text key={field} style={styles.validationText}>
                  • {error}
                </Text>
              ))}
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Expenses Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expenses Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  validationErrors.expensesName && styles.inputError,
                ]}
                value={expensesName}
                onChangeText={setExpensesName}
                placeholder="e.g. Fuel, Maintenance, Labor"
                placeholderTextColor={theme.COLORS.gray}
                maxLength={100}
              />
              {validationErrors.expensesName && (
                <Text style={styles.errorText}>
                  {validationErrors.expensesName}
                </Text>
              )}
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={[
                  styles.input,
                  validationErrors.amount && styles.inputError,
                ]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={theme.COLORS.gray}
                keyboardType="numeric"
              />
              {amount ? (
                <Text style={styles.amountPreview}>
                  {formatCurrency(amount)}
                </Text>
              ) : null}
              {validationErrors.amount && (
                <Text style={styles.errorText}>{validationErrors.amount}</Text>
              )}
            </View>

            {/* Others */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Others (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  validationErrors.others && styles.inputError,
                ]}
                value={others}
                onChangeText={setOthers}
                placeholder="Additional details about the expense"
                placeholderTextColor={theme.COLORS.gray}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              {validationErrors.others && (
                <Text style={styles.errorText}>{validationErrors.others}</Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.COLORS.white} />
                  <Text style={styles.submitButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {editMode ? 'Update Expense' : 'Save Expense'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.COLORS.text,
    backgroundColor: theme.COLORS.white,
  },
  inputError: {
    borderColor: theme.COLORS.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  amountPreview: {
    fontSize: 14,
    color: theme.COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: theme.COLORS.lightGray,
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
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
    marginHorizontal: 24,
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
    marginHorizontal: 24,
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
});

export default OtherExpenseScreen;
