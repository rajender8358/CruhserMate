import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import theme from '../assets/theme';
import Routes from '../navigations/Routes';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      // Navigate to Login screen after splash
      navigation.replace(Routes.LOGIN);
    }, 2000); // 2 seconds
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/crusherLogo.jpeg')}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.white,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
