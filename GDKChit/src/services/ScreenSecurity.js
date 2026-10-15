import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { ScreenSecurity } = NativeModules;

/**
 * Enable FLAG_SECURE on the current window.
 * Blocks screenshots, screen recordings, and hides preview in recent app switcher.
 */
export const enableSecureScreen = () => {
  if (Platform.OS === 'android' && ScreenSecurity?.enableSecure) {
    try {
      ScreenSecurity.enableSecure();
    } catch (e) {
      console.warn('[ScreenSecurity] Failed to enable secure flag:', e);
    }
  }
};

/**
 * Disable FLAG_SECURE on the current window.
 */
export const disableSecureScreen = () => {
  if (Platform.OS === 'android' && ScreenSecurity?.disableSecure) {
    try {
      ScreenSecurity.disableSecure();
    } catch (e) {
      console.warn('[ScreenSecurity] Failed to disable secure flag:', e);
    }
  }
};

/**
 * React hook to automatically protect sensitive screens.
 * Enables FLAG_SECURE when the screen mounts, and clears it when unmounted.
 */
export const useSecureScreen = () => {
  useEffect(() => {
    enableSecureScreen();
    return () => {
      disableSecureScreen();
    };
  }, []);
};

export default {
  enableSecureScreen,
  disableSecureScreen,
  useSecureScreen,
};
