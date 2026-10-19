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
        const userId = await AsyncStorage.getItem('userId');
        const accessToken = await ApiService.getAccessToken();
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        // Check if user has active session stored in AsyncStorage
        const hasSession = (isLoggedIn === 'true' || !!accessToken || !!userId) && (!!phone || !!role);

        if (!hasSession) {
          return navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }

        // Soft background session refresh/validation - NEVER auto-logout on network error or offline
        ApiService.getProfile().then(profile => {
          if (profile?.success && profile?.data?.user) {
            const u = profile.data.user;
            if (u.role) AsyncStorage.setItem('userRole', String(u.role)).catch(() => {});
            if (u.username) AsyncStorage.setItem('userName', String(u.username)).catch(() => {});
            if (u.id) AsyncStorage.setItem('userId', String(u.id)).catch(() => {});
          }
        }).catch(error => {
          console.log('Background session check skipped (offline or server):', error?.message);
        });

        const isPlatformAdmin = String(role || '').toLowerCase() === 'admin';
        navigation.reset({
          index: 0,
          routes: [{ name: isPlatformAdmin ? 'AdminTabs' : 'TabRouter' }],
        });
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    };

    checkLogin();
  }, [navigation]);

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
