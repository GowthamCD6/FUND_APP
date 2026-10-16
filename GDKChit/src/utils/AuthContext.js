import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import PushNotificationService from '../services/PushNotificationService';
import GlobalNotificationService from '../services/GlobalNotificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await ApiService.isAuthenticated();
      if (isAuth) {
        // Try to get user profile
        const response = await ApiService.getProfile();
        if (response.success) {
          const user = response.data.user;
          setUser(user);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('userId', user.id ? String(user.id) : '');
          if (user.role) {
            await AsyncStorage.setItem('userRole', String(user.role));
          }
          PushNotificationService.init();
          try {
            const token = await ApiService.getAccessToken();
            if (token && user.id) {
              GlobalNotificationService.init(token, user.id, user.role || 'User');
            }
          } catch (tokErr) {
            console.warn('Error fetching token for GlobalNotificationService:', tokErr);
          }
        } else {
          // Token might be invalid, clear it
          await ApiService.clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        await ApiService.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't fail completely on network errors - allow app to continue
      // User can still navigate and retry
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await ApiService.login(phone, password);
      
      if (response.success) {
        const user = response.data.user;

        // Save user details to AsyncStorage
        await AsyncStorage.setItem('userName', user.username ? String(user.username) : '');
        await AsyncStorage.setItem('userPhone', user.phone ? String(user.phone) : '');
        await AsyncStorage.setItem('userRole', user.role ? String(user.role) : 'User');
        await AsyncStorage.setItem('userId', user.id ? String(user.id) : '');
        await AsyncStorage.setItem('userLoginMethod', 'jwt');

        setUser(user);
        setIsAuthenticated(true);
        PushNotificationService.init();
        try {
          const token = await ApiService.getAccessToken();
          if (token && user.id) {
            GlobalNotificationService.init(token, user.id, user.role || 'User');
          }
        } catch (tokErr) {
          console.warn('Error fetching token for GlobalNotificationService on login:', tokErr);
        }

        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthContext login error:', error.message);
      throw error;
    }
  };

  // const register = async (userData) => {
  //   try {
  //     const response = await ApiService.register(userData);
  //     if (response.success) {
  //       setUser(response.data.user);
  //       setIsAuthenticated(true);

  //       // Save user details to AsyncStorage (for backward compatibility)
  //       await AsyncStorage.setItem('userFullName', response.data.user.fullName);
  //       await AsyncStorage.setItem('userName', response.data.user.username);
  //       await AsyncStorage.setItem('userEmail', response.data.user.email);
  //       await AsyncStorage.setItem('userState', response.data.user.state || '');
  //       await AsyncStorage.setItem('userLoginMethod', 'jwt');

  //       return response;
  //     } else {
  //       throw new Error(response.message);
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  const logout = async () => {
    try {
      // 1. Disconnect real-time notification socket
      GlobalNotificationService.disconnect();

      // 2. Delete device push token on server so shared devices stop receiving alerts
      await PushNotificationService.deleteTokenOnLogout().catch(e => console.warn('Push token delete on logout:', e));

      const response = await ApiService.logout();

      if (!response.success) {
        console.error('Logout failed on server:', response.message);
        return ({ success: false, message: 'Logout failed' });
      } else {

        await AsyncStorage.clear();

        setUser(null);
        setIsAuthenticated(false);

        return ({ success: true, message: 'Logout successful' });
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return ({ success: false, message: 'Logout error' });
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    // register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
