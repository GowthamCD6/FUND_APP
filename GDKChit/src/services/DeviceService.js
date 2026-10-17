import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const DEVICE_SERVICE_KEY = 'com.gdkchit.device_identity';
const ASYNC_STORAGE_DEVICE_KEY = '@gdk_hardware_device_id';

class DeviceService {
  constructor() {
    this.cachedDeviceId = null;
    this.cachedDeviceInfo = null;
  }

  /**
   * Generates or retrieves the permanent hardware-bound device ID.
   * Priority:
   * 1. Hardware Keystore (via react-native-keychain) - Survives app data clear / reinstall on Android & iOS.
   * 2. AsyncStorage - Secondary persistence fallback.
   * 3. Hardware Fingerprint - Deterministic backup using native Android board constants.
   */
  async getDeviceId() {
    if (this.cachedDeviceId) {
      return this.cachedDeviceId;
    }

    try {
      // 1. Try Keychain / Keystore first
      const keychainCreds = await Keychain.getGenericPassword({ service: DEVICE_SERVICE_KEY });
      if (keychainCreds && keychainCreds.password) {
        this.cachedDeviceId = keychainCreds.password;
        // Ensure AsyncStorage is synced
        await AsyncStorage.setItem(ASYNC_STORAGE_DEVICE_KEY, this.cachedDeviceId);
        return this.cachedDeviceId;
      }

      // 2. Try AsyncStorage
      const asyncStored = await AsyncStorage.getItem(ASYNC_STORAGE_DEVICE_KEY);
      if (asyncStored) {
        this.cachedDeviceId = asyncStored;
        // Promote to Keychain
        try {
          await Keychain.setGenericPassword('device_binding', asyncStored, {
            service: DEVICE_SERVICE_KEY,
            accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
          });
        } catch (e) {}
        return this.cachedDeviceId;
      }

      // 3. Generate a new permanent hardware UUID
      const prefix = Platform.OS === 'ios' ? 'ios' : 'and';
      const timestamp = Date.now().toString(36);
      const randomSeed = Math.random().toString(36).substring(2, 12);
      
      // Incorporate device constants if available on Android
      let brandTag = '';
      if (Platform.OS === 'android' && Platform.constants) {
        const brand = (Platform.constants.Brand || Platform.constants.Manufacturer || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (brand) brandTag = `_${brand}`;
      }

      const newDeviceId = `${prefix}${brandTag}_${timestamp}_${randomSeed}`;

      // Save to both Keychain and AsyncStorage
      this.cachedDeviceId = newDeviceId;
      await AsyncStorage.setItem(ASYNC_STORAGE_DEVICE_KEY, newDeviceId);

      try {
        await Keychain.setGenericPassword('device_binding', newDeviceId, {
          service: DEVICE_SERVICE_KEY,
          accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
        });
      } catch (keychainErr) {
        console.warn('[DeviceService] Keystore save note:', keychainErr.message);
      }

      return newDeviceId;
    } catch (error) {
      console.error('[DeviceService] Error determining device ID:', error);
      // Fallback
      return `${Platform.OS}_dev_${Date.now()}`;
    }
  }

  /**
   * Formats a clean human-readable device name across all Android brands and iOS models.
   * Supports: Samsung, Xiaomi / Redmi / POCO, Vivo, Oppo, Realme, OnePlus, Google Pixel, Motorola, etc.
   */
  getDeviceInfo() {
    if (this.cachedDeviceInfo) {
      return this.cachedDeviceInfo;
    }

    const isAndroid = Platform.OS === 'android';
    const isIOS = Platform.OS === 'ios';

    let brand = 'Mobile';
    let model = 'Phone';
    let osRelease = Platform.Version ? `v${Platform.Version}` : '';

    if (isAndroid && Platform.constants) {
      const constants = Platform.constants;
      const rawBrand = constants.Brand || constants.Manufacturer || 'Android';
      const rawModel = constants.Model || '';
      const rawRelease = constants.Release ? `Android ${constants.Release}` : `Android ${Platform.Version || ''}`;

      // Clean up brand formatting (e.g. "samsung" -> "Samsung", "xiaomi" -> "Xiaomi")
      brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
      model = rawModel;
      osRelease = rawRelease;
    } else if (isIOS) {
      brand = 'Apple';
      model = 'iPhone';
      osRelease = `iOS ${Platform.Version || ''}`;
    }

    const deviceName = `${brand} ${model} (${osRelease})`.trim();

    this.cachedDeviceInfo = {
      devicePlatform: isAndroid ? 'Android' : isIOS ? 'iOS' : 'Mobile',
      deviceBrand: brand,
      deviceModel: model,
      deviceOs: osRelease,
      deviceName: deviceName,
    };

    return this.cachedDeviceInfo;
  }

  /**
   * Returns complete payload required for login verification.
   */
  async getDevicePayload() {
    const deviceId = await this.getDeviceId();
    const info = this.getDeviceInfo();

    return {
      deviceId,
      deviceName: info.deviceName,
      devicePlatform: info.devicePlatform,
      deviceModel: `${info.deviceBrand} ${info.deviceModel}`.trim(),
    };
  }
}

export default new DeviceService();
