import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import theme from '../assets/theme';
import apiService from '../services/apiService';
import { AUTH_ROUTES } from '../navigations/Routes';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await apiService.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrganization(orgs[0]._id);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch organizations.');
      }
    };
    fetchOrganizations();
  }, []);

  const validatePassword = password => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const clearError = () => {
    setErrorMessage('');
  };

  const handleRegister = async () => {
    clearError();

    if (!username.trim() || username.length > 15) {
      setErrorMessage('Username must be 1-15 characters long.');
      return;
    }
    if (!password.trim() || !validatePassword(password)) {
      setErrorMessage(
        'Password must be 8+ characters with letters and numbers',
      );
      return;
    }
    if (!selectedOrganization) {
      setErrorMessage('Please select an organization');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username: username.trim(),
        password: password,
        organizationId: selectedOrganization,
      };

      const response = await apiService.register(userData);

      if (response.success) {
        Alert.alert(
          'Registration Successful!',
          'Your account has been created. You can now login.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace(AUTH_ROUTES.LOGIN),
            },
          ],
        );
      } else {
        setErrorMessage(response.message || 'Registration failed');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/crusherLogo.jpeg')}
            style={styles.logo}
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create your account.</Text>
        </View>

        <View style={styles.inputSection}>
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
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏢</Text>
              <Picker
                selectedValue={selectedOrganization}
                style={styles.picker}
                onValueChange={itemValue => setSelectedOrganization(itemValue)}
                itemStyle={styles.pickerItem}
              >
                {organizations.map(org => (
                  <Picker.Item label={org.name} value={org._id} key={org._id} />
                ))}
              </Picker>
            </View>
          </View>

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

          <View style={styles.passwordHintContainer}>
            <Text style={styles.passwordHint}>
              Password must be 8+ characters with letters and numbers
            </Text>
          </View>
        </View>

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

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
          >
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
  picker: {
    flex: 1,
    height: '100%',
    color: theme.COLORS.text,
  },
  pickerItem: {
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
    paddingLeft: 5,
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
  },
  registerButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
