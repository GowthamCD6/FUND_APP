import { AppState, Platform } from 'react-native';
import PushNotificationService from './PushNotificationService';
import ApiService from './ApiService';

class GlobalNotificationService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.userRole = null;
    this.token = null;
    this.activeChatRoomId = null;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.appStateSubscription = null;
    this.shownNotificationIds = new Set();
    this.lastPollTimestamp = Date.now();
  }

  /**
   * Initialize Global Notification Service when user logs in or app boots
   */
  async init(token, userId, userRole = 'User') {
    if (!token || !userId) return;

    this.token = token;
    this.userId = Number(userId);
    this.userRole = userRole;

    // Ensure native notification permissions are granted
    await PushNotificationService.init();

    // Connect persistent WebSocket
    this.connect();

    // Listen to AppState (foreground/background transitions)
    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          console.log('📱 App resumed to active — checking global notification socket');
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
          }
          this.checkMissedNotifications();
        }
      });
    }

    // Initial missed notifications check
    this.checkMissedNotifications();
  }

  /**
   * Track which chat screen the user is currently viewing
   */
  setActiveChatRoomId(roomId) {
    this.activeChatRoomId = roomId ? String(roomId) : null;
  }

  getActiveChatRoomId() {
    return this.activeChatRoomId;
  }

  /**
   * Connect to chat / notification WebSocket
   */
  connect() {
    if (this.isConnecting || !this.token || !this.userId) return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      let wsBase = ApiService.baseURL ? ApiService.baseURL.replace(/^http/, 'ws') : 'wss://api.fund.gowthamcd.in/api';
      wsBase = wsBase.replace(/\/api\/admin\/?$/, '').replace(/\/api\/?$/, '');
      const wsUrl = `${wsBase}/api/chat?token=${this.token}&userId=${this.userId}&userType=${this.userRole || 'User'}`;

      console.log('🔔 [GlobalNotificationService] Connecting to global notification socket...');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('✅ [GlobalNotificationService] Connected to global notification socket');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingPayload(payload);
        } catch (e) {
          console.warn('⚠️ [GlobalNotificationService] Parse error on WS payload:', e?.message);
        }
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.log('⚠️ [GlobalNotificationService] WS error:', err?.message || 'Socket error');
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        console.log('🔌 [GlobalNotificationService] Socket disconnected, scheduling reconnect...');
        this.scheduleReconnect();
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming WebSocket events from backend
   */
  handleIncomingPayload(payload) {
    if (!payload || !payload.type) return;

    const { type, data } = payload;

    switch (type) {
      case 'new_message_notification':
      case 'new_message': {
        if (!data) return;
        const msgRoomId = String(data.roomId || data.room_id || '');
        const senderId = Number(data.senderId || data.sender_id || 0);

        // Do not notify if message is sent by the current user
        if (senderId === this.userId) return;

        // Do not notify if user is currently looking at this specific chat room
        if (this.activeChatRoomId && this.activeChatRoomId === msgRoomId) {
          return;
        }

        const senderName = data.sender_name || data.senderName || 'New Message';
        const text = (data.message || data.text || 'Sent an attachment').trim();

        // Trigger real Android notification banner with sound and vibration
        PushNotificationService.showLocalNotification({
          title: `💬 ${senderName}`,
          message: text,
          channelId: 'gdk_announcements_v2',
          data: {
            screen: 'Chat',
            roomId: msgRoomId,
            senderId: String(senderId),
            senderName,
            type: 'CHAT_MESSAGE',
            timestamp: String(Date.now()),
          },
        });
        break;
      }

      case 'broadcast_announcement': {
        if (!data) return;
        const title = data.title || 'Announcement';
        const message = data.message || '';

        PushNotificationService.showLocalNotification({
          title: `📢 ${title}`,
          message,
          channelId: 'gdk_announcements_v2',
          data: {
            screen: 'AdminNotification',
            type: 'ANNOUNCEMENT',
            timestamp: String(Date.now()),
          },
        });
        break;
      }

      case 'auction_created_alert':
      case 'auction_started': {
        if (!data) return;
        PushNotificationService.notifyAuctionStarted(
          data.groupId,
          data.groupName || 'Chit Group',
          data.initialAmount || 0
        );
        break;
      }

      default:
        break;
    }
  }

  /**
   * Check for any recent notifications from the server API that were missed
   */
  async checkMissedNotifications() {
    try {
      const isAuth = await ApiService.isAuthenticated();
      if (!isAuth) return;

      const res = await ApiService.makeRequest('/user/notifications');
      if (!res.ok) return;

      const json = await res.json();
      const list = json?.data?.notifications || json?.notifications || [];

      if (!Array.isArray(list)) return;

      const now = Date.now();
      // Look for notifications created in the last 2 minutes that haven't been shown
      list.forEach((item) => {
        const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;
        const diffSeconds = (now - itemTime) / 1000;

        if (item.id && !this.shownNotificationIds.has(item.id) && diffSeconds < 120 && diffSeconds >= 0) {
          this.shownNotificationIds.add(item.id);

          PushNotificationService.showLocalNotification({
            title: item.title || 'Notification',
            message: item.message || '',
            channelId: 'gdk_announcements_v2',
            data: {
              screen: item.screen || 'AdminNotification',
              type: item.type || 'GENERAL',
              timestamp: String(Date.now()),
            },
          });
        }
      });
    } catch (e) {
      // Background check error ignored
    }
  }

  /**
   * Heartbeat keep-alive every 25 seconds
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  /**
   * Purge on user logout
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.userId = null;
    this.token = null;
    this.activeChatRoomId = null;
  }
}

export default new GlobalNotificationService();
