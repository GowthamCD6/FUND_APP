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
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!phone || !role || !accessToken || !refreshToken) {
          await AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'accessToken', 'refreshToken', 'userLoginMethod']);
          return navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }

        try {
          const profile = await ApiService.getProfile();
          if (!profile.success) {
            throw new Error('Invalid session');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          // Only clear tokens on actual session errors, not network errors
          // This allows the app to continue even if the backend is temporarily unavailable
          const errorMessage = error?.message || '';
          if (errorMessage.includes('Network')) {
            // Network error - allow user to continue, they can retry or login again
            console.warn('Network error during session validation - continuing without validation');
          } else if (errorMessage.toLowerCase().includes('blocked')) {
            // Suppress navigation here, as ApiService handles showing the alert and resetting navigation
            return;
          } else {
            // Session error - clear tokens and return to login
            await AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'accessToken', 'refreshToken', 'userLoginMethod']);
            return navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        }

        if (role === 'Admin') {
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
