import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { AUTH_ROUTES } from '../navigations/Routes';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobileNumber = mobile => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validatePassword = password => {
    // At least 8 characters, contains letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const clearError = () => {
    setErrorMessage('');
  };

  const handleRegister = async () => {
    // Clear previous error
    clearError();

    // Validate empty fields
    if (!username.trim()) {
      setErrorMessage('Please enter a username');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage('Please enter your mobile number');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter a password');
      return;
    }

    // Validate field lengths and formats
    if (username.length < 3) {
      setErrorMessage('Username must be at least 3 characters long');
      return;
    }
    if (username.length > 30) {
      setErrorMessage('Username must be less than 30 characters');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!validateMobileNumber(mobileNumber)) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!validatePassword(password)) {
      setErrorMessage(
        'Password must be 8+ characters with letters and numbers',
      );
      return;
    }

    setLoading(true);

    // Test connection first
    try {
      console.log('🔍 Testing connection to backend...');
      await apiService.testConnection();
      console.log('✅ Backend connection successful');
    } catch (connectionError) {
      console.error('❌ Backend connection failed:', connectionError);
      setErrorMessage(
        'Cannot connect to server. Please check if the backend is running.',
      );
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting registration with:', {
        username,
        mobileNumber,
      });

      // Use the actual email provided by user
      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password: password,
        role: 'user',
      };

      const response = await apiService.register(userData);

      if (response.success) {
        console.log('✅ Registration successful:', response.data.username);
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully. You can now login.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace(AUTH_ROUTES.LOGIN),
            },
          ],
        );
      } else {
        // Handle validation errors from backend
        if (response.errors && response.errors.length > 0) {
          setErrorMessage(response.errors.join(', '));
        } else {
          setErrorMessage(response.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);

      let errorMessage =
        'Unable to connect to server. Please check your internet connection.';

      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage =
            'Username already exists. Please choose a different username.';
        } else if (
          error.message.includes('Network') ||
          error.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (
          error.message.includes('timeout') ||
          error.message.includes('AbortSignal') ||
          error.message.includes('The user aborted a request') ||
          error.message.includes('Request timeout after 30 seconds')
        ) {
          errorMessage =
            'Request timed out. Please check your connection and try again.';
        } else if (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED')
        ) {
          errorMessage =
            'Cannot connect to server. Please check if the backend is running.';
        } else {
          errorMessage = error.message;
        }
      }

      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    // Navigate back to login screen
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/crusherLogo.jpeg')}
            style={styles.logo}
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Please register to login.</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor={theme.COLORS.placeholder}
                value={username}
                onChangeText={text => {
                  setUsername(text);
                  clearError();
                }}
                autoCapitalize="none"
                maxLength={30}
                autoComplete="username"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor={theme.COLORS.placeholder}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  clearError();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={50}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Mobile Number Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number"
                placeholderTextColor={theme.COLORS.placeholder}
                value={mobileNumber}
                onChangeText={text => {
                  setMobileNumber(text);
                  clearError();
                }}
                keyboardType="phone-pad"
                maxLength={15}
                autoComplete="tel"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={theme.COLORS.placeholder}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  clearError();
                }}
                secureTextEntry={!isPasswordVisible}
                maxLength={50}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Image
                  source={
                    isPasswordVisible
                      ? require('../assets/images/eye.png')
                      : require('../assets/images/hidden.png')
                  }
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.passwordHintContainer}>
            <Text style={styles.passwordHint}>
              Password must be 8+ characters with letters and numbers
            </Text>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.COLORS.white} size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have account? </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    color: theme.COLORS.darkGray,
    width: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.COLORS.text,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: theme.COLORS.darkGray,
  },
  passwordHintContainer: {
    marginTop: -10,
    marginBottom: 10,
  },
  passwordHint: {
    fontSize: 12,
    color: theme.COLORS.darkGray,
    fontStyle: 'italic',
  },
  registerButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  registerButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButtonDisabled: {
    backgroundColor: theme.COLORS.lightGray,
    opacity: 0.7,
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  signInLink: {
    fontSize: 16,
    color: theme.COLORS.primary,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
