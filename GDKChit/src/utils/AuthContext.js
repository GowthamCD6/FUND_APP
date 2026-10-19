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
      const accessToken = await ApiService.getAccessToken();
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const storedRole = await AsyncStorage.getItem('userRole');
      const storedName = await AsyncStorage.getItem('userName');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      const hasSession = (isLoggedIn === 'true' || !!accessToken || !!storedUserId) && (!!storedPhone || !!storedRole);

      if (hasSession) {
        // Restore user state from AsyncStorage immediately
        const existingUser = {
          id: storedUserId ? Number(storedUserId) : undefined,
          phone: storedPhone || '',
          role: storedRole || 'User',
          username: storedName || 'User',
        };
        setUser(existingUser);
        setIsAuthenticated(true);

        PushNotificationService.init();
        try {
          if (accessToken && storedUserId) {
            GlobalNotificationService.init(accessToken, storedUserId, storedRole || 'User');
          }
        } catch (tokErr) {
          console.warn('Error fetching token for GlobalNotificationService:', tokErr);
        }

        // Soft background profile sync - NEVER clear tokens or log out on network/offline error
        ApiService.getProfile().then(response => {
          if (response?.success && response?.data?.user) {
            const u = response.data.user;
            setUser(u);
            if (u.id) AsyncStorage.setItem('userId', String(u.id)).catch(() => {});
            if (u.role) AsyncStorage.setItem('userRole', String(u.role)).catch(() => {});
            if (u.username) AsyncStorage.setItem('userName', String(u.username)).catch(() => {});
          }
        }).catch(err => {
          console.log('Background profile sync skipped (offline or network error):', err?.message);
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Keep session intact if error occurred reading storage
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await ApiService.login(phone, password);
      
      if (response.success) {
        const user = response.data.user;

        // Persist session details to AsyncStorage for permanent login
        await AsyncStorage.setItem('isLoggedIn', 'true');
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
