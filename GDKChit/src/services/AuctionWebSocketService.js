import { API_URL } from '../utils/env';

class AuctionWebSocketService {
  constructor() {
    this.ws = null;
    this.url = API_URL.replace('http', 'ws') + '/auction';
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  // Connect to WebSocket
  connect(token, userId, userType = 'admin') {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?token=${token}&userId=${userId}&userType=${userType}`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for auction');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message.type, message);
            this.emitEvent(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emitEvent('error', { message: 'WebSocket connection error' });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.emitEvent('disconnected', {});
          this.attemptReconnect(token, userId, userType);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Attempt to reconnect
  attemptReconnect(token, userId, userType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts}...`);
      setTimeout(() => {
        this.connect(token, userId, userType).catch(console.error);
      }, this.reconnectDelay);
    }
  }

  // Start auction
  startAuction(groupId, initialAmount, duration = 300) {
    this.send('start_auction', {
      groupId,
      initialAmount,
      duration,
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
  }

  // Check connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new AuctionWebSocketService();