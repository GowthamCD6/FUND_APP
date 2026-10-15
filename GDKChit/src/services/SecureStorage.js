import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_NAME = 'com.gdkchit.auth';
const USERNAME_KEY = 'auth_session';

class SecureStorage {
  /**
   * Save access and refresh tokens securely in Android Keystore / iOS Keychain.
   * Cleans up unencrypted legacy AsyncStorage copies if present.
   */
  static async saveTokens(accessToken, refreshToken = null) {
    try {
      // Get existing tokens in case only accessToken is being updated
      let currentRefreshToken = refreshToken;
      if (!currentRefreshToken) {
        const existing = await this.getTokens();
        currentRefreshToken = existing.refreshToken;
      }

      const payload = JSON.stringify({
        accessToken,
        refreshToken: currentRefreshToken,
      });

      await Keychain.setGenericPassword(USERNAME_KEY, payload, {
        service: SERVICE_NAME,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });

      // Cleanup plain text storage to ensure tokens are never left in AsyncStorage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');

      return true;
    } catch (error) {
      console.error('[SecureStorage] Error saving tokens to Keychain:', error);
      // Fallback only if native Keystore encounters hardware failure
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      return false;
    }
  }

  /**
   * Retrieve access and refresh tokens from Keychain.
   * Automatically migrates legacy AsyncStorage tokens to Keychain if found.
   */
  static async getTokens() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });

      if (credentials && credentials.password) {
        try {
          const parsed = JSON.parse(credentials.password);
          return {
            accessToken: parsed.accessToken || null,
            refreshToken: parsed.refreshToken || null,
          };
        } catch (jsonErr) {
          // If single token was stored as raw string in previous versions
          return {
            accessToken: credentials.password,
            refreshToken: null,
          };
        }
      }

      // Migration: Check legacy AsyncStorage if Keychain was empty
      const legacyAccessToken = await AsyncStorage.getItem('accessToken');
      const legacyRefreshToken = await AsyncStorage.getItem('refreshToken');

      if (legacyAccessToken) {
        console.log('[SecureStorage] Migrating legacy tokens from AsyncStorage to Keychain...');
        await this.saveTokens(legacyAccessToken, legacyRefreshToken);
        return {
          accessToken: legacyAccessToken,
          refreshToken: legacyRefreshToken,
        };
      }

      return { accessToken: null, refreshToken: null };
    } catch (error) {
      console.error('[SecureStorage] Error getting tokens from Keychain:', error);
      const fallbackAccess = await AsyncStorage.getItem('accessToken');
      const fallbackRefresh = await AsyncStorage.getItem('refreshToken');
      return { accessToken: fallbackAccess, refreshToken: fallbackRefresh };
    }
  }

  static async getAccessToken() {
    const tokens = await this.getTokens();
    return tokens.accessToken;
  }

  static async getRefreshToken() {
    const tokens = await this.getTokens();
    return tokens.refreshToken;
  }

  /**
   * Clear all tokens from Keychain and AsyncStorage
   */
  static async clearTokens() {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_NAME });
    } catch (error) {
      console.error('[SecureStorage] Error resetting Keychain:', error);
    }

    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    } catch (e) {
      // Ignore
    }
  }
}

export default SecureStorage;
