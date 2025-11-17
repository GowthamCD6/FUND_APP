import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rnBiometrics = new ReactNativeBiometrics();

class BiometricService {
  constructor() {
    this.isLocked = false;
    this.isSecurityEnabled = false;
    this.isAuthenticated = false; // Track if user has authenticated in this session
    this.lastActiveTime = null; // Track when user was last active
    this.backgroundTime = null; // Track when app went to background
    this.listeners = [];
    this.appStateSubscription = null;
    this.lockTimeoutMinutes = 5; // 5 minutes timeout
    this.isInitialized = false;
    
    console.log('BiometricService: Constructor called');
  }

  async init() {
    if (this.isInitialized) {
      console.log('BiometricService: Already initialized');
      return;
    }

    try {
      console.log('BiometricService: Starting initialization...');
      
      // Check if security is enabled
      const enabled = await AsyncStorage.getItem('securityEnabled');
      this.isSecurityEnabled = enabled === 'true';
      console.log('BiometricService: Security enabled from storage:', this.isSecurityEnabled);
      
      // Session data is memory-only - always start unauthenticated
      this.isAuthenticated = false;
      console.log('BiometricService: Starting fresh session - not authenticated');
      
      // Session data is memory-only - no last active time on startup
      this.lastActiveTime = null;
      console.log('BiometricService: Starting fresh session - no last active time');
      
      // Determine if app should be locked
      this.determineInitialLockState();
      
      if (this.isSecurityEnabled) {
        this.setupAppStateListener();
      }
      
      this.isInitialized = true;
      console.log('BiometricService: Initialization complete');
      
      // Notify listeners about the initial state
      this.notifyListeners();
    } catch (error) {
      console.error('BiometricService: Init error:', error);
      this.isInitialized = true; // Still mark as initialized to prevent infinite loops
    }
  }

  determineInitialLockState() {
    if (!this.isSecurityEnabled) {
      console.log('BiometricService: Security disabled, not locking');
      this.isLocked = false;
      return;
    }

    // If never authenticated in this session, lock the app
    if (!this.isAuthenticated) {
      console.log('BiometricService: Never authenticated, locking app');
      this.isLocked = true;
      return;
    }

    // If was authenticated, check if enough time has passed since last active
    if (this.lastActiveTime) {
      const now = new Date();
      const timeDiff = now - this.lastActiveTime;
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log('BiometricService: Time since last active:', minutesDiff, 'minutes');
      
      if (minutesDiff > this.lockTimeoutMinutes) {
        console.log('BiometricService: Timeout exceeded, locking app');
        this.isLocked = true;
        this.isAuthenticated = false;
      } else {
        console.log('BiometricService: Within timeout, not locking');
        this.isLocked = false;
        this.updateLastActiveTime();
      }
    } else {
      // No last active time recorded, lock the app
      console.log('BiometricService: No last active time, locking app');
      this.isLocked = true;
      this.isAuthenticated = false;
    }
  }

  setupAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    console.log('BiometricService: Setting up app state listener');
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('BiometricService: App state changed to:', nextAppState);
      
      if (nextAppState === 'background') {
        this.handleAppGoingToBackground();
      } else if (nextAppState === 'active') {
        this.handleAppComingToForeground();
      }
    });
  }

  handleAppGoingToBackground() {
    if (!this.isSecurityEnabled || !this.isAuthenticated) return;
    
    console.log('BiometricService: App going to background');
    this.backgroundTime = new Date();
    this.updateLastActiveTime();
    
    // Session data is memory-only - no persistent storage
  }

  handleAppComingToForeground() {
    if (!this.isSecurityEnabled) return;
    
    console.log('BiometricService: App coming to foreground');
    
    // Only check timeout if user was previously authenticated and went to background
    if (this.isAuthenticated && this.backgroundTime) {
      const now = new Date();
      const timeDiff = now - this.backgroundTime;
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log('BiometricService: Background time:', minutesDiff, 'minutes');
      
      if (minutesDiff > this.lockTimeoutMinutes) {
        console.log('BiometricService: Timeout exceeded, locking app');
        this.lockApp();
        this.isAuthenticated = false; // Reset authentication
      } else {
        console.log('BiometricService: Within timeout, staying unlocked');
        this.updateLastActiveTime();
      }
    }
    
    this.backgroundTime = null;
  }

  updateLastActiveTime() {
    this.lastActiveTime = new Date();
    // Session data is memory-only - no persistent storage
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
      console.log('BiometricService: Starting authentication...');
      
      if (!this.isSecurityEnabled) {
        console.log('BiometricService: Security not enabled, skipping authentication');
        return { success: true };
      }

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
          this.isAuthenticated = true; // Mark as authenticated for this session
          this.updateLastActiveTime();
          // Session data is memory-only - no persistent storage
          console.log('BiometricService: Biometric authentication successful');
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
          this.isAuthenticated = true; // Mark as authenticated for this session
          this.updateLastActiveTime();
          // Session data is memory-only - no persistent storage
          // Clean up the dummy credential
          await Keychain.resetInternetCredentials('app_security_check');
          console.log('BiometricService: Keychain authentication successful');
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
            this.isAuthenticated = true; // Mark as authenticated for this session
            this.updateLastActiveTime();
            // Session data is memory-only - no persistent storage
            // Clean up the keys after successful authentication
            try {
              await rnBiometrics.deleteKeys();
            } catch (e) {
              // Ignore cleanup errors
            }
            console.log('BiometricService: Biometric device authentication successful');
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
            onPress: async (pin) => {
              if (pin === '1234') { // Default PIN
                this.unlockApp();
                this.isAuthenticated = true; // Mark as authenticated for this session
                this.updateLastActiveTime();
                // Session data is memory-only - no persistent storage
                console.log('BiometricService: PIN authentication successful');
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
      this.isLocked = true; // Lock immediately when security is enabled
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
      // Session data is memory-only - no need to clear from storage
      
      this.isSecurityEnabled = false;
      this.isLocked = false;
      this.isAuthenticated = false;
      this.lastActiveTime = null;
      this.backgroundTime = null;
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      console.log('BiometricService: Security disabled and session data cleared');
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

  async unlockApp() {
    console.log('BiometricService: Unlocking app');
    this.isLocked = false;
    await this.startSession();
    this.notifyListeners();
  }

  async startSession() {
    // Initialize session - keep authentication state in memory only
    this.updateLastActiveTime();
    console.log('BiometricService: Session started');
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