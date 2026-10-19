import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../utils/env';

class AuctionWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.pingInterval = null;
    this.isManuallyClosed = false;
    this.isAuthenticated = false;
    this.activeCredentials = null;
    this.connectionState = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

    this.setupNetworkAndAppStateListeners();
  }

  get url() {
    return API_URL.replace(/^http/, 'ws').replace(/\/+$/, '') + '/auction';
  }

  setupNetworkAndAppStateListeners() {
    // 1. Listen for network changes: auto-reconnect as soon as internet returns
    NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && !this.isConnected() && this.activeCredentials && !this.isManuallyClosed) {
        console.log('🌐 Network restored, reconnecting auction WebSocket immediately...');
        this.reconnectAttempts = 0;
        this.attemptReconnect();
      }
    });

    // 2. Listen for app resume: reconnect when user re-opens the app
    AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && !this.isConnected() && this.activeCredentials && !this.isManuallyClosed) {
        console.log('📱 App resumed to active, verifying auction WebSocket connection...');
        this.attemptReconnect();
      }
    });
  }

  setConnectionState(newState, extra = {}) {
    this.connectionState = newState;
    this.emitEvent('connection_state_change', { state: newState, ...extra });
  }

  // Connect to WebSocket without leaking JWT in URL query string
  connect(token, userId, userType = 'user') {
    if (!token || !userId) return Promise.reject(new Error('Missing token or userId'));

    this.activeCredentials = { token, userId, userType };
    this.isManuallyClosed = false;
    this.cleanupSocket();

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting', {
          attempt: this.reconnectAttempts,
        });

        // Pass auth in query parameters for production proxy/server compatibility
        const wsUrl = `${this.url}?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}&userType=${encodeURIComponent(userType)}`;
        this.ws = new WebSocket(wsUrl);
        let resolved = false;

        this.ws.onopen = () => {
          console.log('✅ [AuctionWS] WebSocket opened for auction');
          
          // Send first-frame auth for servers expecting message-based auth
          try {
            this.ws.send(JSON.stringify({
              type: 'auth',
              data: {
                token,
                userId: String(userId),
                userType: String(userType).toLowerCase(),
              }
            }));
          } catch (_) {}

          this.reconnectAttempts = 0;
          this.isAuthenticated = true;
          this.setConnectionState('connected');
          this.startHeartbeat();
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') return;

            // Handle server authentication confirmation
            if (message.type === 'connected') {
              this.isAuthenticated = true;
              this.setConnectionState('connected');
              if (!resolved) {
                resolved = true;
                resolve();
              }
            }

            this.emitEvent(message.type, message.data);
          } catch (error) {
            console.error('[AuctionWS] Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          const errMsg = error?.message || (typeof error === 'string' ? error : 'WebSocket connection error');
          console.warn('⚠️ [AuctionWS] WebSocket warning/error:', errMsg);
          this.emitEvent('error', { message: errMsg });
          if (!resolved) {
            resolved = true;
            reject(new Error(errMsg));
          }
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 [AuctionWS] WebSocket closed (code: ${event?.code || 1000}, reason: ${event?.reason || ''})`);
          this.stopHeartbeat();
          this.isAuthenticated = false;
          this.setConnectionState('disconnected', { code: event?.code });
          this.emitEvent('disconnected', { code: event?.code });

          // Auto-reconnect unless manually closed or fatal auth error (1008)
          if (!this.isManuallyClosed && event?.code !== 1008) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      }
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    // Exponential backoff capped at 8 seconds: 1.5s, 2.25s, 3.37s, 5s, 8s, 8s...
    const delay = Math.min(1500 * Math.pow(1.5, Math.min(this.reconnectAttempts - 1, 5)), 8000);

    console.log(`🔄 [AuctionWS] Reconnecting attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms...`);
    this.setConnectionState('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  attemptReconnect() {
    if (this.isManuallyClosed || !this.activeCredentials) return;
    const { token, userId, userType } = this.activeCredentials;
    this.connect(token, userId, userType).catch(err => {
      console.warn('[AuctionWS] Reconnect failed, will retry:', err?.message || 'Connection failed');
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000); // 15-second ping interval
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  cleanupSocket() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  disconnect() {
    this.isManuallyClosed = true;
    this.activeCredentials = null;
    this.cleanupSocket();
    this.setConnectionState('disconnected');
  }

  // Send message
  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[AuctionWS] Cannot send message, WebSocket is not open');
    }
  }

  // Place bid with client-generated idempotency key
  placeBid(groupId, amount, idempotencyKey = null) {
    const key = idempotencyKey || `${this.activeCredentials?.userId || 'u'}-${groupId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.send('place_bid', {
      groupId,
      amount: Number(amount),
      idempotencyKey: key,
    });
  }

  // Start auction
  startAuction(groupId, initialAmount, duration = 300, participantIds = []) {
    this.send('start_auction', {
      groupId,
      initialAmount,
      duration,
      participantIds,
    });
  }

  pauseAuction(groupId) {
    this.send('pause_auction', { groupId });
  }

  resumeAuction(groupId) {
    this.send('resume_auction', { groupId });
  }

  endAuction(groupId) {
    this.send('end_auction', { groupId });
  }

  resetAuction(groupId) {
    this.send('reset_auction', { groupId });
  }

  joinAuction(groupId, userId) {
    this.send('join_auction', { groupId, userId });
    this.send('user_joined_auction', { groupId, userId });
  }

  userJoinedAuction(groupId, userId) {
    this.send('user_joined_auction', { groupId, userId });
  }

  setAutoBid(groupId, floorAmount, enabled = true) {
    this.send('set_auto_bid', {
      groupId,
      floorAmount: Number(floorAmount),
      enabled: Boolean(enabled),
    });
  }

  checkEligibility(groupId) {
    this.send('check_eligibility', { groupId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unbind function
    return () => {
      this.listeners[event] = this.listeners[event]?.filter(cb => cb !== callback) || [];
    };
  }

  emitEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AuctionWS] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  getConnectionState() {
    return this.connectionState;
  }
}

export default new AuctionWebSocketService();