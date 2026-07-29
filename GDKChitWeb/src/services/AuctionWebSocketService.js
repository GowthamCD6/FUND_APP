import { API_URL } from '../api/apiClient.js';

/**
 * AuctionWebSocketService for Web Admin
 * Mirrors the mobile app's AuctionWebSocketService to connect
 * to the same backend WebSocket at /api/auction
 */
class AuctionWebSocketService {
  constructor() {
    this.ws = null;
    // Convert http(s) URL to ws(s) URL
    this.url = API_URL.replace(/^http/, 'ws').replace(/\/api$/, '') + '/api/auction';
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this._token = null;
    this._userId = null;
    this._userType = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token, userId, userType = 'admin') {
    this._token = token;
    this._userId = userId;
    this._userType = userType;

    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        const wsUrl = `${this.url}?token=${token}&userId=${userId}&userType=${userType}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ [Web] WebSocket connected for auction');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 [Web] WebSocket message:', message.type, message.data);
            this.emitEvent(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [Web] WebSocket error:', error);
          this.emitEvent('error', { message: 'WebSocket connection error' });
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 [Web] WebSocket disconnected:', event.code, event.reason);
          this.emitEvent('disconnected', {});
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect with stored credentials
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this._token) {
      this.reconnectAttempts++;
      console.log(`🔄 [Web] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      setTimeout(() => {
        this.connect(this._token, this._userId, this._userType).catch(console.error);
      }, this.reconnectDelay);
    }
  }

  /**
   * Send setup_auction event — notifies mobile users with an alert
   */
  setupAuction(groupId, type, participantIds = []) {
    this.send('setup_auction', {
      groupId,
      type, // 'betting' or 'random'
      participantIds,
    });
  }

  /**
   * Start a live betting auction with timer
   */
  startAuction(groupId, initialAmount, duration = 300, participantIds = []) {
    this.send('start_auction', {
      groupId,
      initialAmount,
      duration,
      participantIds,
      startTime: Date.now(),
    });
  }

  /**
   * Place a bid (admin can place on behalf of users if needed)
   */
  placeBid(groupId, amount, userId, userName) {
    this.send('place_bid', {
      groupId,
      amount,
      userId,
      userName,
      timestamp: Date.now(),
    });
  }

  /**
   * Pause the active auction
   */
  pauseAuction(groupId) {
    this.send('pause_auction', { groupId });
  }

  /**
   * Resume a paused auction
   */
  resumeAuction(groupId) {
    this.send('resume_auction', { groupId });
  }

  /**
   * End the auction (finds winner automatically)
   */
  endAuction(groupId) {
    this.send('end_auction', { groupId });
  }

  /**
   * Reset the auction completely
   */
  resetAuction(groupId) {
    this.send('reset_auction', { groupId });
  }

  /**
   * Roll dice — broadcasts to all connected users for synchronized animation
   */
  rollDice(groupId, duration, finalValue, winner) {
    this.send('roll_dice', {
      groupId,
      duration,
      finalValue,
      winner,
    });
  }

  /**
   * Send a message over WebSocket
   */
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[Web] WebSocket not connected. Message not sent:', type);
    }
  }

  /**
   * Register an event listener
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an event to all registered listeners
   */
  emitEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnects
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const auctionWebSocketService = new AuctionWebSocketService();
export default auctionWebSocketService;
