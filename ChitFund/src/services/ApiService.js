import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/env';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Set tokens
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Get access token from storage
  async getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  // Get refresh token from storage
  async getRefreshToken() {
    if (!this.refreshToken) {
      this.refreshToken = await AsyncStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  // Save tokens to storage
  async saveTokens(accessToken, refreshToken) {
    await AsyncStorage.setItem('accessToken', accessToken);
    // console.log(refreshToken);
    
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
    this.setTokens(accessToken, refreshToken);
  }

  // Clear tokens
  async clearTokens() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
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
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });
    };

    try {
      let response = await makeCall(accessToken);

      // If token expired, try to refresh and retry
      if (response.status === 401 || response.status === 403) {
        try {
          accessToken = await this.refreshAccessToken();
          response = await makeCall(accessToken);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          throw new Error('Authentication failed');
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
  // }

  async login(phone, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success) {
        await this.saveTokens(data.data.accessToken, data.data.refreshToken);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
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
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // User preferences methods
  async getUserPreferences() {
    try {
      const response = await this.makeRequest('/user/preferences');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateUserPreferences(preferences) {
    try {
      const response = await this.makeRequest('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }
}

export default new ApiService();
