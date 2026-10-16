const WebSocket = require('ws');

/**
 * Real-time WebSocket Broadcaster for GDKChit
 * Bridges HTTP API controllers, WebSocket events, and FCM push dispatches
 * to guarantee real-time delivery to mobile devices.
 */
class RealtimeBroadcastService {
  constructor() {
    this.chatClients = new Map(); // clientId -> { ws, userId, userType, rooms: Set }
    this.auctionClients = new Map(); // clientId -> { ws, userId, userType }
  }

  registerChatClient(clientId, clientData) {
    this.chatClients.set(clientId, clientData);
  }

  removeChatClient(clientId) {
    this.chatClients.delete(clientId);
  }

  getChatClient(clientId) {
    return this.chatClients.get(clientId);
  }

  getAllChatClients() {
    return this.chatClients;
  }

  registerAuctionClient(clientId, clientData) {
    this.auctionClients.set(clientId, clientData);
  }

  removeAuctionClient(clientId) {
    this.auctionClients.delete(clientId);
  }

  /**
   * Broadcast a chat message to connected clients
   */
  broadcastChatMessage(msgData, recipientUserIds = [], senderId = null) {
    const targetRoomId = msgData.roomId;
    const sourceRoomId = msgData.sourceRoomId;
    const sId = senderId ? Number(senderId) : Number(msgData.senderId);

    const recipientSet = new Set(recipientUserIds.map(id => Number(id)));

    this.chatClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        const cUserId = Number(client.userId);
        const isSender = cUserId === sId;
        const isAdmin = String(client.userType).toLowerCase() === 'admin';
        const isRecipient = recipientSet.size === 0 || recipientSet.has(cUserId);

        const isLookingAtRoom =
          client.rooms.has(targetRoomId) ||
          client.rooms.has(String(targetRoomId)) ||
          client.rooms.has(Number(targetRoomId)) ||
          (sourceRoomId && (client.rooms.has(sourceRoomId) || client.rooms.has(String(sourceRoomId))));

        if (isLookingAtRoom) {
          client.ws.send(JSON.stringify({
            type: 'new_message',
            data: msgData
          }));
        } else if (!isSender && (isRecipient || isAdmin)) {
          // Send notification event so phone system tray pops a notification banner
          client.ws.send(JSON.stringify({
            type: 'new_message_notification',
            data: msgData
          }));
        }
      }
    });
  }

  /**
   * Broadcast announcement to all connected clients or group members
   */
  broadcastAnnouncement({ title, message, targetGroupId = null, payload = {} }) {
    const announcementPayload = {
      type: 'broadcast_announcement',
      data: {
        title,
        message,
        targetGroupId,
        timestamp: Date.now(),
        ...payload
      }
    };

    const serialized = JSON.stringify(announcementPayload);

    // Send across all connected chat clients
    this.chatClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(serialized);
      }
    });

    // Also send across auction clients
    this.auctionClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(serialized);
      }
    });
  }

  /**
   * Broadcast live auction alerts to connected clients
   */
  broadcastAuctionAlert(alertData, participantIds = []) {
    const serialized = JSON.stringify({
      type: 'auction_created_alert',
      data: alertData
    });

    const participantSet = new Set(participantIds.map(id => Number(id)));

    this.auctionClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        const cUserId = Number(client.userId);
        if (participantSet.size === 0 || participantSet.has(cUserId)) {
          client.ws.send(serialized);
        }
      }
    });

    this.chatClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        const cUserId = Number(client.userId);
        if (participantSet.size === 0 || participantSet.has(cUserId)) {
          client.ws.send(serialized);
        }
      }
    });
  }
}

module.exports = new RealtimeBroadcastService();
