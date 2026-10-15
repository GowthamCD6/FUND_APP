import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/ApiService';

const AuthLoader = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const phone = await AsyncStorage.getItem('userPhone');
        const role = await AsyncStorage.getItem('userRole');
        const accessToken = await ApiService.getAccessToken();
        const refreshToken = await ApiService.getRefreshToken();

        if (!phone || !role || !accessToken || !refreshToken) {
          await ApiService.clearTokens();
          await AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'userLoginMethod']);
          return navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }

        // Verify session in the background so that user transition is instant
        ApiService.getProfile().then(profile => {
          if (!profile.success) {
            ApiService.clearTokens();
            AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'userLoginMethod']);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        }).catch(error => {
          console.error('Background session validation failed:', error);
          const errorMessage = error?.message || '';
          if (!errorMessage.includes('Network') && !errorMessage.toLowerCase().includes('blocked')) {
            ApiService.clearTokens();
            AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'userLoginMethod']);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        });

        if (String(role || '').toLowerCase() === 'admin') {
          navigation.navigate('AdminTabs');
        } else {
          navigation.navigate('TabRouter');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#2842C4" />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default AuthLoader;
