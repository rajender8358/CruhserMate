import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { AUTH_ROUTES } from '../navigations/Routes';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateUsername = username => {
    // Allow both username format (3-15 characters, alphanumeric and underscore only)
    // and email format (standard email validation)
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return usernameRegex.test(username) || emailRegex.test(username);
  };

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLogin = async () => {
    // Clear previous messages
    clearMessages();

    // Validate empty fields
    if (!username.trim()) {
      setErrorMessage('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    // Validate username/email format
    if (!validateUsername(username)) {
      setErrorMessage(
        'Please enter a valid username (3-15 characters, letters, numbers, underscore only) or email address',
      );
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const response = await apiService.login({ username, password });
      if (response.success) {
        login(response.data.user, response.data.token);
      } else {
        setErrorMessage(response.message || 'Login failed');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Navigate to sign up screen
    navigation.navigate(AUTH_ROUTES.REGISTER);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented soon.',
    );
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
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Please Sign in to continue.</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Image
                source={require('../assets/images/email.png')}
                style={styles.inputIconImage}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor={theme.COLORS.placeholder}
                value={username}
                onChangeText={text => {
                  setUsername(text);
                  clearMessages();
                }}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Image
                source={require('../assets/images/padlock.png')}
                style={styles.inputIconImage}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={theme.COLORS.placeholder}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  clearMessages();
                }}
                secureTextEntry={!isPasswordVisible}
                autoComplete="password"
                maxLength={50}
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

          {/* Forgot Password */}
          {/* <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Loader
                size="small"
                color={theme.COLORS.white}
                variant="inline"
              />
              <Text style={[styles.loginButtonText, { marginLeft: 10 }]}>
                Signing In...
              </Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

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

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
  inputIconImage: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.COLORS.primary,
    fontWeight: '500',
  },
  loginButton: {
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
  loginButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
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
  loginButtonDisabled: {
    backgroundColor: theme.COLORS.lightGray,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontSize: 16,
    color: theme.COLORS.darkGray,
  },
  signUpLink: {
    fontSize: 16,
    color: theme.COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
