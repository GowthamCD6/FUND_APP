import { Platform, Alert, PermissionsAndroid, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import { navigate } from '../utils/navigation';

const { GdkNotification } = NativeModules;

class PushNotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.eventSubscription = null;
  }

  /**
   * Initialize Push Notification service, request Android 13+ permission,
   * register device token with backend, and handle cold/warm notification deep-linking.
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // 1. Request notification permission on Android 13+
      await this.requestPermission();

      // 2. Fetch or generate unique device push token
      let token = await AsyncStorage.getItem('device_fcm_token');
      if (!token) {
        token = this.generateDeviceToken();
        await AsyncStorage.setItem('device_fcm_token', token);
      }
      this.fcmToken = token;

      // 3. Sync token with backend server
      await this.syncTokenWithBackend(token);

      // 4. Setup native event listener for notifications clicked while app is backgrounded
      this.setupNotificationClickListener();

      // 5. Check if app was launched from a killed state by tapping a notification
      await this.checkInitialNotification();

      this.isInitialized = true;
      console.log('🔔 [PushNotificationService] Fully initialized with token:', token);
    } catch (error) {
      console.warn('⚠️ [PushNotificationService] Init error:', error?.message);
    }
  }

  /**
   * Request POST_NOTIFICATIONS permission for Android 13 (API 33)+
   */
  async requestPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Enable GDKChit Auction & Payment Alerts',
            message: 'Get instant notifications when live auctions begin and monthly installment reminders.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('⚠️ [PushNotificationService] Permission request failed:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Generate persistent pseudorandom device push token identifier
   */
  generateDeviceToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = 'fcm_' + Platform.OS + '_';
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Handle onTokenRefresh when Firebase SDK rotates the client token
   */
  async onTokenRefresh(newToken) {
    if (!newToken || newToken === this.fcmToken) return;
    console.log('🔄 [PushNotificationService] FCM token refreshed:', newToken);
    const oldToken = this.fcmToken;
    this.fcmToken = newToken;
    await AsyncStorage.setItem('device_fcm_token', newToken);

    // Remove old token and register new one on server
    if (oldToken) {
      await ApiService.deleteFCMToken(oldToken).catch(() => {});
    }
    await this.syncTokenWithBackend(newToken);
  }

  /**
   * Delete token on server and remove locally at user logout
   * Prevents shared phones from receiving the previous user's sensitive alerts
   */
  async deleteTokenOnLogout() {
    try {
      if (this.fcmToken) {
        console.log('🚪 [PushNotificationService] Deleting FCM token on logout...');
        await ApiService.deleteFCMToken(this.fcmToken);
      }
      await AsyncStorage.removeItem('device_fcm_token');
      this.fcmToken = null;
      this.isInitialized = false;
      console.log('✅ [PushNotificationService] FCM token purged successfully on logout');
    } catch (err) {
      console.warn('⚠️ [PushNotificationService] Error deleting token on logout:', err?.message);
    }
  }

  /**
   * Sync active device push token with backend database
   */
  async syncTokenWithBackend(token) {
    try {
      const isAuth = await ApiService.isAuthenticated();
      if (!isAuth) {
        return;
      }

      const res = await ApiService.registerFCMToken(token, Platform.OS);
      if (res && res.success) {
        console.log('✅ [PushNotificationService] Push token registered on backend server');
      }
    } catch (err) {
      console.warn('⚠️ [PushNotificationService] Failed to sync push token with backend:', err?.message);
    }
  }

  /**
   * Listen for background notification click events from native Android
   */
  setupNotificationClickListener() {
    try {
      if (this.eventSubscription && typeof this.eventSubscription.remove === 'function') {
        this.eventSubscription.remove();
        this.eventSubscription = null;
      }
    } catch (_) {}

    this.eventSubscription = DeviceEventEmitter.addListener('onNotificationOpened', (data) => {
      console.log('📲 [PushNotificationService] Notification opened from background:', data);
      this.routeNotificationAction(data);
    });
  }

  /**
   * Check if the app was launched from a killed state by a notification click
   */
  async checkInitialNotification() {
    try {
      if (!GdkNotification?.getInitialNotification) return;

      const initialData = await GdkNotification.getInitialNotification();
      if (initialData) {
        console.log('🚀 [PushNotificationService] Launched from killed state via notification:', initialData);
        setTimeout(() => {
          this.routeNotificationAction(initialData);
        }, 1200);
      }
    } catch (error) {
      console.warn('⚠️ [PushNotificationService] checkInitialNotification error:', error);
    }
  }

  /**
   * Direct deep-link routing with auction state verification
   * If an auction start alert was delayed or the auction has already finished,
   * automatically redirects to the Post-Auction Summary screen instead of an empty bidding room.
   */
  async routeNotificationAction(data) {
    if (!data) return;

    const screen = data.screen;
    const type = data.type;
    const groupId = data.groupId;

    console.log(`🧭 [PushNotificationService] Deep linking -> Screen: ${screen}, Type: ${type}, GroupId: ${groupId}`);

    try {
      if (screen === 'AuctionScreen' && groupId) {
        // Validate auction status before opening bidding room
        try {
          const res = await ApiService.getPortfolio();
          if (res?.success && Array.isArray(res?.data)) {
            const groupInfo = res.data.find(g => String(g.id) === String(groupId));
            const isAuctionActive = groupInfo?.auction_status === 'active' || groupInfo?.status === 'bidding';
            
            if (groupInfo && !isAuctionActive && groupInfo.auction_status === 'completed') {
              console.log('🏁 [PushNotificationService] Auction already ended. Routing to Post-Auction Summary.');
              navigate('PrizedSuretyTracker', { groupId: String(groupId), highlightResult: true });
              return;
            }
          }
        } catch (checkErr) {
          console.warn('Could not check auction state, opening auction screen directly:', checkErr?.message);
        }

        navigate('AuctionScreen', { groupId: String(groupId) });
      } else if (screen === 'DueCalendar') {
        navigate('DueCalendar');
      } else if (screen === 'PrizedSuretyTracker') {
        navigate('PrizedSuretyTracker', { groupId: String(groupId) });
      } else if (screen === 'AdminNotification') {
        navigate('AdminNotification');
      } else if (screen === 'Chat' || type === 'CHAT_MESSAGE') {
        try {
          const role = await AsyncStorage.getItem('userRole');
          const tabRoot = String(role || '').toLowerCase() === 'admin' ? 'AdminTabs' : 'UserTabs';
          navigate(tabRoot, { screen: 'Chat' });
        } catch (_) {
          navigate('Chat');
        }
      } else if (screen) {
        navigate(screen, data);
      }
    } catch (err) {
      console.warn('⚠️ [PushNotificationService] Navigation routing error:', err);
    }
  }

  /**
   * Check if battery optimization is currently ignored by Android
   */
  async isBatteryOptimizationIgnored() {
    if (Platform.OS === 'android' && GdkNotification?.isIgnoringBatteryOptimizations) {
      try {
        return await GdkNotification.isIgnoringBatteryOptimizations();
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  /**
   * Prompt user to disable battery optimization
   */
  async requestDisableBatteryOptimization() {
    if (Platform.OS === 'android' && GdkNotification?.requestIgnoreBatteryOptimizations) {
      try {
        return await GdkNotification.requestIgnoreBatteryOptimizations();
      } catch (e) {
        console.warn('Failed to open battery optimization settings:', e);
      }
    }
    return false;
  }

  /**
   * Launch manufacturer autostart manager (Xiaomi, Oppo, Vivo, Samsung, Realme)
   */
  async openOEMAutostartSettings() {
    if (Platform.OS === 'android' && GdkNotification?.openOEMAutostartSettings) {
      try {
        return await GdkNotification.openOEMAutostartSettings();
      } catch (e) {
        console.warn('Failed to open OEM autostart settings:', e);
      }
    }
    return null;
  }

  /**
   * Get device manufacturer details
   */
  async getDeviceManufacturer() {
    if (Platform.OS === 'android' && GdkNotification?.getDeviceManufacturer) {
      try {
        return await GdkNotification.getDeviceManufacturer();
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Display a high-importance native heads-up notification with sound and vibration
   */
  async showLocalNotification({ title, message, channelId = 'gdk_announcements_v2', data = {} }) {
    if (Platform.OS === 'android' && GdkNotification?.displayNotification) {
      try {
        await GdkNotification.displayNotification(title, message, channelId, data);
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    } else {
      Alert.alert(title, message, [{ text: 'View', onPress: () => this.routeNotificationAction(data) }, { text: 'Dismiss' }]);
    }
  }

  /**
   * Quick-trigger: Live Auction Started (Short TTL heads-up alert)
   */
  async notifyAuctionStarted(groupId, groupName, chitAmount) {
    await this.showLocalNotification({
      title: `⚡ Live Auction Started: ${groupName || 'Chit Group'}`,
      message: `The live auction is NOW OPEN for ₹${Number(chitAmount || 0).toLocaleString('en-IN')}. Tap to bid now!`,
      channelId: 'gdk_auctions_v2',
      data: {
        screen: 'AuctionScreen',
        groupId: String(groupId),
        type: 'auction_start',
        timestamp: String(Date.now()),
      },
    });
  }

  /**
   * Quick-trigger: Auction Concluded / Result
   */
  async notifyAuctionResult(groupName, winnerName, winningBid, dividendAmount) {
    await this.showLocalNotification({
      title: `🏆 Auction Concluded: ${groupName}`,
      message: `Winner: ${winnerName} at ₹${Number(winningBid || 0).toLocaleString('en-IN')}. Your dividend earned: ₹${Number(dividendAmount || 0).toLocaleString('en-IN')}.`,
      channelId: 'gdk_auctions_v2',
      data: {
        screen: 'PrizedSuretyTracker',
        type: 'auction_result',
        timestamp: String(Date.now()),
      },
    });
  }

  /**
   * Quick-trigger: Payment Due Reminder
   */
  async notifyPaymentDue(groupName, amount, dueDate, daysLeft = 0) {
    const isOverdue = daysLeft < 0;
    const title = isOverdue
      ? `⚠️ OVERDUE: Installment for ${groupName}`
      : `📅 Payment Due Soon: ${groupName}`;

    const message = isOverdue
      ? `Your installment of ₹${Number(amount).toLocaleString('en-IN')} is overdue by ${Math.abs(daysLeft)} days. Pay now to avoid penalty.`
      : `Installment of ₹${Number(amount).toLocaleString('en-IN')} is due on ${dueDate}. Tap to view calendar.`;

    await this.showLocalNotification({
      title,
      message,
      channelId: 'gdk_payments_v2',
      data: {
        screen: 'DueCalendar',
        type: 'payment_due',
        timestamp: String(Date.now()),
      },
    });
  }
}

export default new PushNotificationService();
