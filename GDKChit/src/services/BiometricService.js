import ReactNativeBiometrics from 'react-native-biometrics';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

// Initialize with allowDeviceCredentials to show PIN option in the same biometric modal
const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

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
      this.notifyListeners(); // Notify listeners even if already initialized
      return;
    }

    try {
      console.log('BiometricService: Starting initialization...');
      
      // Check if security is enabled locally
      const enabled = await AsyncStorage.getItem('securityEnabled');
      let isEnabled = enabled === 'true';

      // Attempt to sync from backend database user_preferences
      try {
        const prefRes = await ApiService.getUserPreferences();
        if (prefRes && prefRes.success && prefRes.data && prefRes.data.securityEnabled !== undefined) {
          isEnabled = Boolean(prefRes.data.securityEnabled);
          await AsyncStorage.setItem('securityEnabled', isEnabled ? 'true' : 'false');
        }
      } catch (backendErr) {
        console.log('BiometricService: Backend preferences offline or unauthenticated, using local setting:', backendErr.message);
      }

      this.isSecurityEnabled = isEnabled;
      console.log('BiometricService: Security enabled resolved to:', this.isSecurityEnabled);
      
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

  async isBiometricAvailable() {
    return this.checkBiometricAvailability();
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
        // Try biometric with device credentials (PIN/pattern) as fallback in same modal
        const { success, error } = await rnBiometrics.simplePrompt({
          promptMessage: reason,
          fallbackPromptMessage: 'Use PIN',
          cancelButtonText: 'Use PIN'
        });

        if (success) {
          this.unlockApp();
          this.isAuthenticated = true; // Mark as authenticated for this session
          this.updateLastActiveTime();
          console.log('BiometricService: Authentication successful');
          return { success: true };
        } else {
          // User cancelled
          return { success: false, error: error || 'Authentication cancelled' };
        }
      } else {
        // No biometric available, try simplePrompt anyway - it will use device credentials
        const { success, error } = await rnBiometrics.simplePrompt({
          promptMessage: reason,
          fallbackPromptMessage: 'Use PIN',
          cancelButtonText: 'Cancel'
        });

        if (success) {
          this.unlockApp();
          this.isAuthenticated = true;
          this.updateLastActiveTime();
          console.log('BiometricService: Device credentials authentication successful');
          return { success: true };
        } else {
          return { success: false, error: error || 'Authentication cancelled' };
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  async authenticateWithDeviceCredentials(reason = 'Unlock GDK Chit Fund with device credentials') {
    return this.authenticate(reason);
  }

  async enableSecurity() {
    try {
      await AsyncStorage.setItem('securityEnabled', 'true');
      this.isSecurityEnabled = true;
      this.isLocked = true; // Lock immediately when security is enabled
      this.setupAppStateListener();
      this.notifyListeners();

      try {
        await ApiService.updateUserPreferences({ securityEnabled: true });
      } catch (backendErr) {
        console.error('BiometricService: Failed to sync enabled security to backend:', backendErr);
      }

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
      this.isAuthenticated = false;
      this.lastActiveTime = null;
      this.backgroundTime = null;
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      console.log('BiometricService: Security disabled and session data cleared');
      this.notifyListeners();

      try {
        await ApiService.updateUserPreferences({ securityEnabled: false });
      } catch (backendErr) {
        console.error('BiometricService: Failed to sync disabled security to backend:', backendErr);
      }

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