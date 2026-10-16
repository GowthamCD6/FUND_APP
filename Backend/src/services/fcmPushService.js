const db = require('../config/db');
const realtimeBroadcastService = require('./realtimeBroadcastService');
let admin = null;

try {
  admin = require('firebase-admin');
  // Initialize firebase-admin if service account credentials or env config is supplied
  if (admin && Array.isArray(admin.apps) && !admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 [FCM Push] firebase-admin initialized with Service Account (HTTP v1 API)');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('🔥 [FCM Push] firebase-admin initialized with Application Default Credentials (HTTP v1 API)');
    } else {
      console.log('ℹ️ [FCM Push] Running in Simulation/Safe mode (Set FIREBASE_SERVICE_ACCOUNT_KEY in .env for live v1 dispatch)');
    }
  }
} catch (e) {
  console.warn('⚠️ [FCM Push] firebase-admin could not be loaded, using fallback dispatcher:', e.message);
  admin = null;
}

/**
 * FCM Push Notification Service for GDKChit (Firebase HTTP v1 + Multicast Batching)
 * 
 * Supports:
 * 1. Live Auction Started Alerts (Short 120s TTL, collapse_key, High Priority, channel: gdk_auctions_v2)
 * 2. Auction Result & Dividend Accrual Alerts (24h TTL, channel: gdk_auctions_v2)
 * 3. Payment Due Date Reminders (channel: gdk_payments_v2)
 * 4. Admin Broadcast Announcements (channel: gdk_announcements_v2)
 * 5. Automatic stale token pruning (removes UNREGISTERED or INVALID_ARGUMENT tokens)
 * 6. Multi-token device management per user, token deletion at logout, and purge on user block.
 */
class FCMPushService {
  constructor() {
    this.admin = admin;
    this.ensureTablesExist();
  }

  async ensureTablesExist() {
    try {
      await db.promise().query(`
        CREATE TABLE IF NOT EXISTS user_fcm_tokens (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          fcm_token VARCHAR(255) NOT NULL,
          platform VARCHAR(20) DEFAULT 'android',
          device_id VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_fcm (user_id, fcm_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await db.promise().query(`
        CREATE TABLE IF NOT EXISTS push_notifications_log (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          payload JSON NULL,
          status VARCHAR(20) DEFAULT 'sent',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (err) {
      console.error('Error creating push notification tables:', err?.message);
    }
  }

  /**
   * Delete token on server when user logs out of a device
   */
  async deleteFCMToken(userId, fcmToken) {
    if (!userId || !fcmToken) return;
    try {
      await db.promise().query(
        'DELETE FROM user_fcm_tokens WHERE user_id = ? AND fcm_token = ?',
        [userId, fcmToken]
      );
      console.log(`🗑️ [FCM Push] Deleted token for user #${userId}`);
    } catch (err) {
      console.error(`Failed to delete FCM token for user #${userId}:`, err?.message);
    }
  }

  /**
   * Purge all tokens when a user is blocked so they immediately stop receiving alerts
   */
  async deleteAllUserTokens(userId) {
    if (!userId) return;
    try {
      const [result] = await db.promise().query(
        'DELETE FROM user_fcm_tokens WHERE user_id = ?',
        [userId]
      );
      console.log(`🚫 [FCM Push] Purged all ${result.affectedRows} tokens for blocked user #${userId}`);
    } catch (err) {
      console.error(`Failed to purge tokens for blocked user #${userId}:`, err?.message);
    }
  }

  /**
   * Prune invalid or unregistered tokens returned by Firebase
   */
  async removeStaleTokens(tokens) {
    if (!tokens || tokens.length === 0) return;
    try {
      await db.promise().query(
        'DELETE FROM user_fcm_tokens WHERE fcm_token IN (?)',
        [tokens]
      );
      console.log(`🧹 [FCM Push] Pruned ${tokens.length} unregistered/stale FCM token(s) from database.`);
    } catch (err) {
      console.error('Failed to prune stale FCM tokens:', err?.message);
    }
  }

  /**
   * 1. Send Alert: Live Auction Started
   * Short TTL (120s) so delayed pushes arriving after the auction ends are discarded by FCM.
   */
  async sendAuctionStartAlert(groupId, initialAmount) {
    try {
      const [groupRows] = await db.promise().query(
        'SELECT group_name FROM `groups` WHERE id = ? LIMIT 1',
        [groupId]
      );
      const groupName = groupRows[0]?.group_name || `Group #${groupId}`;

      const [memberRows] = await db.promise().query(
        `SELECT DISTINCT ug.user_id 
         FROM user_grouping ug 
         WHERE ug.group_id = ?`,
        [groupId]
      );

      const userIds = memberRows.map(r => r.user_id);
      if (userIds.length === 0) return { success: true, count: 0 };

      const title = `🚨 Live Auction Started: ${groupName}`;
      const message = `Live bidding for ${groupName} (₹${Number(initialAmount).toLocaleString('en-IN')}) is starting now! Tap immediately to place your bids.`;

      const notificationOptions = {
        title,
        body: message,
        data: {
          type: 'AUCTION_STARTED',
          groupId: String(groupId),
          groupName,
          initialAmount: String(initialAmount),
          channelId: 'gdk_auctions_v2',
          screen: 'AuctionScreen',
          timestamp: String(Date.now()),
        },
        channelId: 'gdk_auctions_v2',
        ttlSeconds: 120, // 2-minute short TTL: drop if delayed
        collapseKey: `auction_start_${groupId}`,
      };

      console.log(`📢 [FCM Push v1] Broadcasting Auction Started alert for "${groupName}" to ${userIds.length} subscribers...`);
      try {
        realtimeBroadcastService.broadcastAuctionAlert({
          groupId,
          groupName,
          initialAmount,
          title,
          message,
          type: 'AUCTION_STARTED'
        }, userIds);
      } catch (wsErr) {
        console.error('Error broadcasting auction alert to WS clients:', wsErr?.message);
      }
      return await this.sendToUsers(userIds, notificationOptions, 'AUCTION_STARTED');
    } catch (err) {
      console.error('Error in sendAuctionStartAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 2. Send Alert: Auction Result & Member Dividend Summary
   */
  async sendAuctionResultAlert(groupId, winner, summary) {
    try {
      const [groupRows] = await db.promise().query(
        'SELECT group_name, chit_amount, max_members FROM `groups` WHERE id = ? LIMIT 1',
        [groupId]
      );
      const group = groupRows[0] || {};
      const groupName = group.group_name || `Group #${groupId}`;
      const totalMembers = group.max_members || 20;

      const discount = Number(summary?.winningBid || summary?.discount || 0);
      const foremanCommission = discount * 0.05;
      const netDividend = Math.max(0, discount - foremanCommission);
      const dividendPerMember = Math.round(netDividend / totalMembers);
      const winnerName = winner?.username || winner?.name || 'A Member';

      const [memberRows] = await db.promise().query(
        `SELECT DISTINCT ug.user_id 
         FROM user_grouping ug 
         WHERE ug.group_id = ?`,
        [groupId]
      );

      const userIds = memberRows.map(r => r.user_id);
      if (userIds.length === 0) return { success: true, count: 0 };

      const title = `🏆 Auction Concluded: ${groupName}`;
      const message = `${winnerName} won with a bid discount of ₹${discount.toLocaleString('en-IN')}. Your dividend earned: ₹${dividendPerMember.toLocaleString('en-IN')}!`;

      const notificationOptions = {
        title,
        body: message,
        data: {
          type: 'AUCTION_RESULT',
          groupId: String(groupId),
          groupName,
          winnerName,
          discount: String(discount),
          dividend: String(dividendPerMember),
          channelId: 'gdk_auctions_v2',
          screen: 'PrizedSuretyTracker',
          timestamp: String(Date.now()),
        },
        channelId: 'gdk_auctions_v2',
        ttlSeconds: 86400, // 24 hours
        collapseKey: `auction_result_${groupId}`,
      };

      console.log(`📢 [FCM Push v1] Sending Auction Result alert for "${groupName}" to ${userIds.length} subscribers...`);
      return await this.sendToUsers(userIds, notificationOptions, 'AUCTION_RESULT');
    } catch (err) {
      console.error('Error in sendAuctionResultAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 3. Send Alert: Payment Due or Overdue Reminder
   */
  async sendPaymentDueAlert(userId, groupName, amount, dueDateStr, daysLeft) {
    try {
      const isOverdue = daysLeft < 0;
      const title = isOverdue 
        ? `⚠️ OVERDUE: Installment for ${groupName}`
        : `📅 Payment Due: ${groupName}`;

      const message = isOverdue
        ? `Your chit installment of ₹${Number(amount).toLocaleString('en-IN')} is OVERDUE by ${Math.abs(daysLeft)} day(s). Please clear immediately to maintain auction bidding eligibility.`
        : `Your monthly installment of ₹${Number(amount).toLocaleString('en-IN')} is due on ${dueDateStr}. Tap here to view calendar and pay.`;

      const notificationOptions = {
        title,
        body: message,
        data: {
          type: 'PAYMENT_DUE',
          groupName,
          amount: String(amount),
          dueDate: dueDateStr,
          daysLeft: String(daysLeft),
          channelId: 'gdk_payments_v2',
          screen: 'DueCalendar',
          timestamp: String(Date.now()),
        },
        channelId: 'gdk_payments_v2',
        ttlSeconds: 86400,
        collapseKey: `payment_due_${userId}_${groupName}`,
      };

      return await this.sendToUsers([userId], notificationOptions, isOverdue ? 'PAYMENT_OVERDUE' : 'PAYMENT_DUE');
    } catch (err) {
      console.error('Error in sendPaymentDueAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. Automatic Daily Payment Due Scan
   */
  async sendDailyPaymentDueAlerts() {
    try {
      console.log('🔍 [FCM Push v1] Scanning for pending and upcoming payment due deadlines...');
      const [dueRows] = await db.promise().query(`
        SELECT 
          mc.user_id,
          mc.installment_amount as amount,
          mc.due_date,
          DATEDIFF(mc.due_date, CURDATE()) as days_left,
          g.group_name
        FROM monthly_collections mc
        JOIN \`groups\` g ON mc.group_id = g.id
        WHERE mc.status = 'pending'
          AND (
            DATEDIFF(mc.due_date, CURDATE()) IN (3, 1, 0)
            OR (DATEDIFF(mc.due_date, CURDATE()) < 0 AND DATEDIFF(mc.due_date, CURDATE()) >= -7)
          )
      `);

      let sentCount = 0;
      for (const row of dueRows) {
        const dueDateFormatted = new Date(row.due_date).toLocaleDateString('en-IN');
        await this.sendPaymentDueAlert(
          row.user_id,
          row.group_name,
          row.amount,
          dueDateFormatted,
          row.days_left
        );
        sentCount++;
      }

      console.log(`✅ [FCM Push v1] Sent ${sentCount} payment due reminders.`);
      return { success: true, sent: sentCount };
    } catch (err) {
      console.error('Error running daily payment due alerts:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 5. Send Alert: Admin Broadcast Announcement
   */
  async sendBroadcastAnnouncement(title, message, targetGroupId = null) {
    try {
      let userIds = [];
      if (targetGroupId) {
        const [rows] = await db.promise().query(
          'SELECT DISTINCT user_id FROM user_grouping WHERE group_id = ?',
          [targetGroupId]
        );
        userIds = rows.map(r => r.user_id);
      } else {
        const [rows] = await db.promise().query('SELECT DISTINCT id as user_id FROM users WHERE is_active = 1');
        userIds = rows.map(r => r.user_id);
      }

      if (userIds.length === 0) return { success: true, count: 0 };

      const notificationOptions = {
        title: `📢 ${title}`,
        body: message,
        data: {
          type: 'ANNOUNCEMENT',
          channelId: 'gdk_announcements_v2',
          screen: 'AdminNotification',
          timestamp: String(Date.now()),
        },
        channelId: 'gdk_announcements_v2',
        ttlSeconds: 86400 * 2, // 48 hours
        collapseKey: 'broadcast_announcement',
      };

      console.log(`📢 [FCM Push v1] Broadcasting Announcement "${title}" to ${userIds.length} subscribers...`);
      try {
        realtimeBroadcastService.broadcastAnnouncement({
          title,
          message,
          targetGroupId,
          payload: notificationOptions.data
        });
      } catch (wsErr) {
        console.error('Error broadcasting announcement to WS clients:', wsErr?.message);
      }
      return await this.sendToUsers(userIds, notificationOptions, 'ANNOUNCEMENT');
    } catch (err) {
      console.error('Error in sendBroadcastAnnouncement:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 6. Send Alert: Chat Message Notification
   */
  async sendChatMessageAlert({ senderId, senderName, messageText, roomId, recipientUserIds }) {
    try {
      if (!recipientUserIds || recipientUserIds.length === 0) return { success: true, delivered: 0 };

      const filteredRecipientIds = recipientUserIds
        .map(id => Number(id))
        .filter(id => id && id !== Number(senderId));

      if (filteredRecipientIds.length === 0) return { success: true, delivered: 0 };

      // Format preview snippet
      let previewText = (messageText || 'Sent a new message').trim();
      if (previewText.startsWith('[GROUP_INVITE]')) {
        previewText = 'Sent a Chit Group Invitation';
      } else if (previewText.length > 120) {
        previewText = previewText.substring(0, 117) + '...';
      }

      const notificationOptions = {
        title: `💬 ${senderName || 'New Message'}`,
        body: previewText,
        data: {
          type: 'CHAT_MESSAGE',
          channelId: 'gdk_announcements_v2',
          screen: 'Chat',
          roomId: String(roomId || ''),
          senderId: String(senderId || ''),
          senderName: String(senderName || 'User'),
          timestamp: String(Date.now()),
        },
        channelId: 'gdk_announcements_v2',
        ttlSeconds: 86400, // 24 hours
        collapseKey: `chat_room_${roomId || 'msg'}`,
      };

      console.log(`💬 [FCM Push v1] Sending chat alert from "${senderName}" to recipients [${filteredRecipientIds.join(', ')}]...`);
      try {
        realtimeBroadcastService.broadcastChatMessage({
          id: Date.now(),
          roomId,
          senderId: Number(senderId),
          sender_name: senderName || 'User',
          message: previewText,
          created_at: new Date()
        }, filteredRecipientIds, senderId);
      } catch (wsErr) {
        console.error('Error broadcasting chat message alert to WS clients:', wsErr?.message);
      }
      return await this.sendToUsers(filteredRecipientIds, notificationOptions, 'CHAT_MESSAGE');
    } catch (err) {
      console.error('Error in sendChatMessageAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Deliver push payload to list of user IDs by querying their active FCM tokens
   */
  async sendToUsers(userIds, options, notificationType = 'GENERAL') {
    if (!userIds || userIds.length === 0) return { success: true, delivered: 0 };

    try {
      const [tokenRows] = await db.promise().query(
        `SELECT DISTINCT fcm_token, user_id FROM user_fcm_tokens WHERE user_id IN (?)`,
        [userIds]
      );

      // Log notification in database history
      for (const uid of userIds) {
        await db.promise().query(
          `INSERT INTO push_notifications_log (user_id, type, title, message, payload) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            uid,
            notificationType,
            options.title || 'Notification',
            options.body || '',
            JSON.stringify(options.data || {})
          ]
        ).catch(e => console.error('Error logging notification to DB:', e?.message));
      }

      const tokens = tokenRows.map(r => r.fcm_token).filter(Boolean);
      if (tokens.length === 0) {
        console.log(`ℹ️ [FCM Push v1] No active device tokens found for users [${userIds.join(', ')}]. Notification stored in DB.`);
        return { success: true, delivered: 0, reason: 'no_tokens' };
      }

      return await this.sendMulticastBatches(tokens, options);
    } catch (err) {
      console.error('Error querying FCM tokens for users:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send messages in batches of up to 500 tokens using Firebase HTTP v1 API
   * Automatically captures and deletes tokens that return UNREGISTERED or INVALID_ARGUMENT.
   */
  async sendMulticastBatches(tokens, options) {
    const BATCH_SIZE = 500; // Official Firebase Multicast batch limit
    const totalTokens = tokens.length;
    let totalSuccess = 0;
    let totalFailure = 0;
    const staleTokens = [];

    const isLiveFirebaseAdmin = Boolean(this.admin && Array.isArray(this.admin.apps) && this.admin.apps.length > 0);

    for (let i = 0; i < totalTokens; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);

      if (!isLiveFirebaseAdmin) {
        // Safe Simulation Mode for local dev or when Service Account is pending
        console.log(`🔔 [FCM Push v1 Simulation] (Batch ${Math.floor(i / BATCH_SIZE) + 1}, ${batchTokens.length} tokens):`);
        console.log(`   Title: ${options.title}`);
        console.log(`   Body: ${options.body}`);
        console.log(`   TTL: ${options.ttlSeconds}s | CollapseKey: ${options.collapseKey}`);
        totalSuccess += batchTokens.length;
        continue;
      }

      try {
        const messagePayload = {
          tokens: batchTokens,
          notification: {
            title: options.title,
            body: options.body,
          },
          data: options.data || {},
          android: {
            priority: 'high',
            ttl: (options.ttlSeconds || 120) * 1000,
            collapseKey: options.collapseKey,
            notification: {
              channelId: options.channelId || 'gdk_announcements_v2',
              sound: 'default',
              priority: 'high',
              visibility: 'public',
            },
          },
        };

        const batchResponse = await this.admin.messaging().sendEachForMulticast(messagePayload);
        totalSuccess += batchResponse.successCount;
        totalFailure += batchResponse.failureCount;

        // Inspect individual response items to detect dead tokens
        if (batchResponse.failureCount > 0) {
          batchResponse.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errCode = resp.error?.code;
              // Check for invalid or unregistered tokens according to FCM v1 error specifications
              if (
                errCode === 'messaging/registration-token-not-registered' ||
                errCode === 'messaging/invalid-registration-token' ||
                errCode === 'messaging/invalid-argument'
              ) {
                staleTokens.push(batchTokens[idx]);
              }
            }
          });
        }
      } catch (batchErr) {
        console.error('Error dispatching multicast batch to FCM:', batchErr);
        totalFailure += batchTokens.length;
      }
    }

    // Automatically purge stale tokens from database
    if (staleTokens.length > 0) {
      await this.removeStaleTokens(staleTokens);
    }

    console.log(`✅ [FCM Push v1 Multicast Complete]: Success: ${totalSuccess}, Failure: ${totalFailure}, Stale Purged: ${staleTokens.length}`);
    return { success: true, delivered: totalSuccess, failures: totalFailure, pruned: staleTokens.length };
  }
}

module.exports = new FCMPushService();
