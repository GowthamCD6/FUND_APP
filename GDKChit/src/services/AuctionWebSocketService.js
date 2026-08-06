import { API_URL } from '../utils/env';

class AuctionWebSocketService {
  constructor() {
    this.ws = null;
    this.url = API_URL.replace('http', 'ws') + '/auction';
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.pingInterval = null;
    this.isManuallyClosed = false;
  }

  // Connect to WebSocket
  connect(token, userId, userType = 'admin') {
    if (!token || !userId) return Promise.reject(new Error('Missing token or userId'));

    // Clean up existing socket before creating a new one
    this.cleanupSocket();
    this.isManuallyClosed = false;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.url}?token=${token}&userId=${userId}&userType=${userType}`;
        this.ws = new WebSocket(wsUrl);
        let resolved = false;

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for auction');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') return; // Ignore pong response
            console.log('📨 WebSocket message received:', message.type, message);
            this.emitEvent(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error?.message || error);
          this.emitEvent('error', { message: 'WebSocket connection error' });
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected');
          this.stopHeartbeat();
          this.emitEvent('disconnected', {});

          // Don't auto-reconnect if auth failed (1008) or manually closed
          if (!this.isManuallyClosed && event?.code !== 1008) {
            this.attemptReconnect(token, userId, userType);
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

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  cleanupSocket() {
    this.stopHeartbeat();
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

  // Attempt to reconnect
  attemptReconnect(token, userId, userType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts}...`);
      setTimeout(() => {
        if (!this.isManuallyClosed) {
          this.connect(token, userId, userType).catch(console.error);
        }
      }, this.reconnectDelay);
    }
  }

  // Start auction
  startAuction(groupId, initialAmount, duration = 300, participantIds = []) {
    this.send('start_auction', {
      groupId,
      initialAmount,
      duration,
      participantIds,
      startTime: Date.now(),
    });
  }

  // Place bid
  placeBid(groupId, amount, userId, userName) {
    this.send('place_bid', {
      groupId,
      amount,
      userId,
      userName,
      timestamp: Date.now(),
    });
  }

  // Pause auction
  pauseAuction(groupId) {
    this.send('pause_auction', { groupId });
  }

  // Resume auction
  resumeAuction(groupId) {
    this.send('resume_auction', { groupId });
  }

  // End auction
  endAuction(groupId) {
    this.send('end_auction', { groupId });
  }

  // Reset auction
  resetAuction(groupId) {
    this.send('reset_auction', { groupId });
  }

  // Setup auction
  setupAuction(groupId, type, participantIds = []) {
    this.send('setup_auction', {
      groupId,
      type,
      participantIds,
    });
  }

  // Roll dice
  rollDice(groupId, duration, finalValue, winner, initialAmount = 0) {
    this.send('roll_dice', {
      groupId,
      duration,
      finalValue,
      winner,
      initialAmount,
    });
  }

  // Join auction (User approves)
  joinAuction(groupId, userId) {
    this.send('user_joined_auction', {
      groupId,
      userId,
    });
  }

  // Send message
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected. Message not sent:', type);
    }
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  // Emit event
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

  // Disconnect
  disconnect() {
    this.isManuallyClosed = true;
    this.cleanupSocket();
    this.listeners = {};
  }

  // Check connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new AuctionWebSocketService();