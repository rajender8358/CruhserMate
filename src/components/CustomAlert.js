import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import theme from '../assets/theme';

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          icon: '✅',
        };
      case 'error':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          icon: '❌',
        };
      case 'warning':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          icon: '⚠️',
        };
      default:
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          icon: 'ℹ️',
        };
    }
  };

  const alertStyle = getAlertStyle();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.alertContainer,
            {
              backgroundColor: alertStyle.backgroundColor,
              borderColor: alertStyle.borderColor,
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{alertStyle.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: width - 40,
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButton: {
    backgroundColor: theme.COLORS.primary,
  },
  cancelButton: {
    backgroundColor: theme.COLORS.lightGray,
  },
  confirmButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: theme.COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;
