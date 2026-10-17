import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorage from './SecureStorage';
import { API_URL } from '../utils/env';
import { Alert, Platform } from 'react-native';
import { reset as resetNavigation } from '../utils/navigation';

class ApiService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  get baseURL() {
    return API_URL;
  }

  // Set tokens in memory
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Get access token from storage (AsyncStorage first, SecureStorage fallback)
  async getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      if (!this.accessToken) {
        this.accessToken = await SecureStorage.getAccessToken().catch(() => null);
        if (this.accessToken) {
          await AsyncStorage.setItem('accessToken', this.accessToken).catch(() => {});
        }
      }
    }
    return this.accessToken;
  }

  // Alias for getAccessToken
  async getToken() {
    return await this.getAccessToken();
  }

  // Get refresh token from storage (AsyncStorage first, SecureStorage fallback)
  async getRefreshToken() {
    if (!this.refreshToken) {
      this.refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!this.refreshToken) {
        this.refreshToken = await SecureStorage.getRefreshToken().catch(() => null);
        if (this.refreshToken) {
          await AsyncStorage.setItem('refreshToken', this.refreshToken).catch(() => {});
        }
      }
    }
    return this.refreshToken;
  }

  // Save tokens to AsyncStorage and hardware-backed storage
  async saveTokens(accessToken, refreshToken) {
    if (accessToken) {
      await AsyncStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
    await SecureStorage.saveTokens(accessToken, refreshToken).catch(() => {});
    this.setTokens(accessToken, refreshToken);
  }

  // Clear tokens from AsyncStorage and hardware-backed storage
  async clearTokens() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await SecureStorage.clearTokens().catch(() => {});
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        await this.saveTokens(data.data.accessToken, refreshToken);
        return data.data.accessToken;
      } else {
        throw new Error(data.message || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      throw error;
    }
  }

  // Make authenticated request
  async makeRequest(url, options = {}) {
    let accessToken = await this.getAccessToken();

    const makeCall = async (token) => {
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      console.log(`${this.baseURL}${url}`);
      
      return fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });
    };

    try {
      let response = await makeCall(accessToken);

      // If token expired, try to refresh and retry
      if (response.status === 401 || response.status === 403) {
        if (response.status === 403) {
          try {
            const clone = response.clone();
            const text = await clone.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              data = null;
            }
            if (data && data.message && data.message.toLowerCase().includes('blocked')) {
              await this.clearTokens();
              await AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'accessToken', 'refreshToken', 'userLoginMethod']);
              
              Alert.alert(
                'Account Blocked',
                data.message || 'Your account has been blocked by an administrator. Please contact the admin.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      resetNavigation({
                        index: 0,
                        routes: [{ name: 'Welcome' }],
                      });
                    }
                  }
                ],
                { cancelable: false }
              );
              
              throw new Error(data.message || 'Your account has been blocked by an administrator. Please contact the admin.');
            }
          } catch (e) {
            if (e.message && e.message.toLowerCase().includes('blocked')) {
              throw e;
            }
            console.error('Error checking blocked status on 403:', e);
          }
        }

        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          await this.clearTokens();
          throw new Error('Session invalid: no refresh token available. Please login again.');
        }

        try {
          accessToken = await this.refreshAccessToken();
          response = await makeCall(accessToken);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          console.error('Refresh failed while requesting', url, refreshError);
          if (refreshError.message && refreshError.message.toLowerCase().includes('blocked')) {
            await AsyncStorage.multiRemove(['userPhone', 'userName', 'userRole', 'accessToken', 'refreshToken', 'userLoginMethod']);
            
            Alert.alert(
              'Account Blocked',
              refreshError.message || 'Your account has been blocked by an administrator. Please contact the admin.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    resetNavigation({
                      index: 0,
                      routes: [{ name: 'Welcome' }],
                    });
                  }
                }
              ],
              { cancelable: false }
            );
          }
          throw new Error(refreshError.message || 'Authentication failed');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Authentication methods
  // async register(userData) {
  //   try {
  //     const response = await fetch(`${this.baseURL}/api/auth/register`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(userData),
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       await this.saveTokens(data.data.accessToken, data.data.refreshToken);
  //       return data;
  //     } else {
  //       throw new Error(data.message || 'Registration failed');
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('@gdk_mobile_device_id');
      if (!deviceId) {
        deviceId = `${Platform.OS}_` + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
        await AsyncStorage.setItem('@gdk_mobile_device_id', deviceId);
      }
      return deviceId;
    } catch (e) {
      return `${Platform.OS}_fallback_${Date.now()}`;
    }
  }

  async login(phone, password) {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      const devicePlatform = Platform.OS === 'ios' ? 'iOS' : 'Android';
      const deviceName = `${Platform.OS === 'ios' ? 'Apple iPhone' : 'Android Phone'}`;

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone, 
          password,
          deviceId,
          deviceName,
          devicePlatform,
          deviceModel: Platform.OS
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 150)}`);
      }

      if (data.success) {
        await this.saveTokens(data.data.accessToken, data.data.refreshToken);
        return data;
      } else {
        const error = new Error(data.message || 'Login failed');
        error.code = data.code;
        error.data = data.data;
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (refreshToken) {
        const response = await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        return await response.json();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async getProfile() {
    try {
      const response = await this.makeRequest('/auth/profile');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getNomineeDetails() {
    try {
      const response = await this.makeRequest('/auth/nominee');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateNomineeDetails(nomineeData) {
    try {
      const response = await this.makeRequest('/auth/nominee', {
        method: 'PATCH',
        body: JSON.stringify(nomineeData),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // User preferences methods
  async getUserPreferences() {
    try {
      const response = await this.makeRequest('/user/preferences');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateUserPreferences(preferences) {
    try {
      const response = await this.makeRequest('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // App Rating methods
  async submitAppRating(ratingData) {
    try {
      const response = await this.makeRequest('/user/rate-app', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getUserRating() {
    try {
      const response = await this.makeRequest('/user/my-rating');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async saveMyLocation(locationData) {
    try {
      const response = await this.makeRequest('/user/save-location', {
        method: 'POST',
        body: JSON.stringify(locationData),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getMyLocation() {
    try {
      const response = await this.makeRequest('/user/location');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getNotifications() {
    try {
      const response = await this.makeRequest('/user/notifications');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async markNotificationRead(id, all = false) {
    try {
      const response = await this.makeRequest('/user/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async clearNotifications(id = null, all = false) {
    try {
      const response = await this.makeRequest('/user/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!accessToken && !!refreshToken;
  }

  // Portfolio methods
  async getPortfolio() {
    try {
      const response = await this.makeRequest('/user/portfolio');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getGroupMonthlyInfo(groupId) {
    try {
      const response = await this.makeRequest(`/user/portfolio/${groupId}/months`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // OTP Request methods
  async getOTPRequests() {
    try {
      const response = await this.makeRequest('/user/otp-requests');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async markOTPViewed(requestId) {
    try {
      const response = await this.makeRequest(`/user/otp-requests/${requestId}/viewed`, {
        method: 'POST',
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Push Notification FCM registration
  async registerFCMToken(fcmToken, platform = 'android') {
    try {
      const response = await this.makeRequest('/user/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ fcmToken, platform }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return { success: false, message: error.message };
    }
  }

  // Push Notification FCM deletion at logout
  async deleteFCMToken(fcmToken) {
    try {
      const response = await this.makeRequest('/user/fcm-token/delete', {
        method: 'POST',
        body: JSON.stringify({ fcmToken }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to delete FCM token on server:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new ApiService();