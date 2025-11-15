import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rnBiometrics = new ReactNativeBiometrics();

class BiometricService {
  constructor() {
    this.isLocked = false;
    this.isSecurityEnabled = false;
    this.listeners = [];
    this.appStateSubscription = null;
    this.init();
  }

  async init() {
    try {
      // Check if security is enabled
      const enabled = await AsyncStorage.getItem('securityEnabled');
      this.isSecurityEnabled = enabled === 'true';
      
      if (this.isSecurityEnabled) {
        this.setupAppStateListener();
      }
    } catch (error) {
      console.error('BiometricService init error:', error);
    }
  }

  setupAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && this.isSecurityEnabled) {
        this.lockApp();
      }
    });
  }

  async checkBiometricAvailability() {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error) {
      console.error('Biometric check error:', error);
      return { available: false, biometryType: null };
    }
  }

  async authenticate(reason = 'Authenticate to unlock app') {
    try {
      const { available, biometryType } = await this.checkBiometricAvailability();
      
      if (available) {
        // Try biometric first with device credentials as fallback
        const { success, error } = await rnBiometrics.simplePrompt({
          promptMessage: reason,
          fallbackPromptMessage: 'Use device PIN, pattern or password',
          cancelButtonText: 'Cancel'
        });

        if (success) {
          this.unlockApp();
          return { success: true };
        } else {
          // If biometric fails, try device credentials
          return this.authenticateWithDeviceCredentials(reason);
        }
      } else {
        // No biometric available, use device credentials directly
        return this.authenticateWithDeviceCredentials(reason);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Fallback to device credentials
      return this.authenticateWithDeviceCredentials(reason);
    }
  }

  async authenticateWithDeviceCredentials(reason = 'Authenticate to unlock app') {
    try {
      // First try using Keychain for device authentication
      try {
        // Set up a dummy credential to trigger device authentication
        await Keychain.setInternetCredentials(
          'app_security_check',
          'user',
          'dummy',
          {
            authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          }
        );
        
        // Now try to get it - this will trigger device authentication
        const result = await Keychain.getInternetCredentials('app_security_check', {
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          showModal: true,
          kLocalizedFallbackTitle: 'Use Device PIN/Pattern/Password',
        });
        
        if (result && result.username) {
          this.unlockApp();
          // Clean up the dummy credential
          await Keychain.resetInternetCredentials('app_security_check');
          return { success: true };
        }
      } catch (keychainError) {
        console.log('Keychain authentication failed, trying biometric fallback:', keychainError);
        
        // Clean up any partial credential
        try {
          await Keychain.resetInternetCredentials('app_security_check');
        } catch (e) {}
        
        // If Keychain fails, try the biometric library's device authentication
        try {
          const { success, error } = await rnBiometrics.createKeys({
            promptMessage: reason,
            cancelButtonText: 'Cancel'
          });

          if (success) {
            this.unlockApp();
            // Clean up the keys after successful authentication
            try {
              await rnBiometrics.deleteKeys();
            } catch (e) {
              // Ignore cleanup errors
            }
            return { success: true };
          } else {
            return { success: false, error: error || 'Device authentication failed' };
          }
        } catch (biometricError) {
          console.error('Biometric device auth error:', biometricError);
          // Final fallback to PIN
          return this.authenticateWithPIN();
        }
      }
    } catch (error) {
      console.error('Device credentials authentication error:', error);
      // Final fallback to custom PIN
      return this.authenticateWithPIN();
    }
  }

  authenticateWithPIN() {
    return new Promise((resolve) => {
      Alert.prompt(
        'Enter Security PIN',
        'Please enter your 4-digit PIN to unlock the app',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'User cancelled' })
          },
          {
            text: 'OK',
            onPress: (pin) => {
              if (pin === '1234') { // Default PIN
                this.unlockApp();
                resolve({ success: true });
              } else {
                Alert.alert('Error', 'Incorrect PIN. Please try again.');
                resolve({ success: false, error: 'Incorrect PIN' });
              }
            }
          }
        ],
        'secure-text',
        '',
        'numeric'
      );
    });
  }

  async enableSecurity() {
    try {
      await AsyncStorage.setItem('securityEnabled', 'true');
      this.isSecurityEnabled = true;
      this.setupAppStateListener();
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      console.error('Enable security error:', error);
      return { success: false, error: error.message };
    }
  }

  async disableSecurity() {
    try {
      await AsyncStorage.setItem('securityEnabled', 'false');
      this.isSecurityEnabled = false;
      this.isLocked = false;
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      console.error('Disable security error:', error);
      return { success: false, error: error.message };
    }
  }

  lockApp() {
    if (this.isSecurityEnabled) {
      this.isLocked = true;
      this.notifyListeners();
    }
  }

  unlockApp() {
    this.isLocked = false;
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        isLocked: this.isLocked,
        isSecurityEnabled: this.isSecurityEnabled
      });
    });
  }

  getState() {
    return {
      isLocked: this.isLocked,
      isSecurityEnabled: this.isSecurityEnabled
    };
  }
}

export default new BiometricService();