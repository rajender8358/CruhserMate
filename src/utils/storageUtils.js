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

export const debugStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const data = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      data[key] = value;
    }
    
    console.log('Storage contents:', data);
    return data;
  } catch (error) {
    console.error('Failed to debug storage:', error);
    return null;
  }
};

// Force clear all storage and reset app state
export const forceClearAllStorage = async () => {
  try {
    console.log('🧹 Clearing all AsyncStorage data...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear AsyncStorage:', error);
    return false;
  }
};

// Add this to your app startup to force clear storage
export const resetAppData = async () => {
  try {
    console.log('🔄 Resetting app data...');
    await forceClearAllStorage();
    console.log('✅ App data reset complete');
    return true;
  } catch (error) {
    console.error('❌ Failed to reset app data:', error);
    return false;
  }
};
