import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearCorruptedData = async () => {
  try {
    // Clear all storage data to reset corrupted state
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

export const safeJsonParse = (data, fallback = null) => {
  if (!data) return fallback;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

export const getStoredUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    return safeJsonParse(userData, null);
  } catch (error) {
    console.error('Failed to get stored user:', error);
    return null;
  }
};

export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}; 