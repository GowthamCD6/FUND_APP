const db = require('../config/db');
const https = require('https');

/**
 * FCM Push Notification Service for GDKChit
 * 
 * Supports:
 * 1. Live Auction Started Alerts (Wakes up killed/backgrounded app for live bidding)
 * 2. Auction Result & Dividend Accrual Alerts (Winner name, discount, member dividend)
 * 3. Payment Due Date & Overdue Reminders (Due today, 3 days prior, overdue alerts)
 * 4. Admin Broadcast Announcements (General updates, holiday closures, rate adjustments)
 */
class FCMPushService {
  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || null;
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
   * 1. Send Alert: Live Auction Started
   * Dispatched immediately when admin starts auction. Wakes up devices so members never miss bidding.
   */
  async sendAuctionStartAlert(groupId, initialAmount) {
    try {
      // Find group name
      const [groupRows] = await db.promise().query(
        'SELECT group_name FROM `groups` WHERE id = ? LIMIT 1',
        [groupId]
      );
      const groupName = groupRows[0]?.group_name || `Group #${groupId}`;

      // Find all subscribers enrolled in this group
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

      const payload = {
        notification: {
          title,
          body: message,
          sound: 'default',
        },
        data: {
          type: 'AUCTION_STARTED',
          groupId: String(groupId),
          groupName,
          initialAmount: String(initialAmount),
          channelId: 'gdk_auctions',
          screen: 'AuctionScreen',
          click_action: 'OPEN_AUCTION',
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'gdk_auctions',
            sound: 'default',
            priority: 'high',
            visibility: 'public',
          }
        }
      };

      console.log(`📢 [FCM Push] Broadcasting Auction Started alert for "${groupName}" to ${userIds.length} subscribers...`);
      return await this.sendToUsers(userIds, payload, 'AUCTION_STARTED');
    } catch (err) {
      console.error('Error in sendAuctionStartAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 2. Send Alert: Auction Concluded with Winner, Discount & Member Dividend
   */
  async sendAuctionResultAlert(groupId, winner, summary) {
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

      const winnerName = winner?.userName || 'A member';
      const winningBid = winner ? Number(winner.amount) : 0;
      const dividendPerMember = summary?.dividendPerMember || 0;
      const nextInstallment = summary?.nextInstallmentAmount || 0;

      const title = `🏁 Auction Concluded: ${groupName}`;
      const message = `${winnerName} won at ₹${winningBid.toLocaleString('en-IN')}. Your dividend credit is ₹${dividendPerMember.toLocaleString('en-IN')}. Next installment: ₹${nextInstallment.toLocaleString('en-IN')}.`;

      const payload = {
        notification: {
          title,
          body: message,
          sound: 'default',
        },
        data: {
          type: 'AUCTION_RESULT',
          groupId: String(groupId),
          groupName,
          winnerName,
          winningBid: String(winningBid),
          dividendPerMember: String(dividendPerMember),
          nextInstallment: String(nextInstallment),
          channelId: 'gdk_auctions',
          screen: 'AuctionScreen',
        },
      };

      console.log(`📢 [FCM Push] Sending Auction Result alert for "${groupName}" to ${userIds.length} subscribers...`);
      return await this.sendToUsers(userIds, payload, 'AUCTION_RESULT');
    } catch (err) {
      console.error('Error in sendAuctionResultAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 3. Send Alert: Payment Due Date / Overdue Notice
   */
  async sendPaymentDueAlert(userId, groupName, amount, dueDateStr, daysLeft) {
    try {
      let title = `⏰ Upcoming Installment: ${groupName}`;
      let message = `Your monthly installment of ₹${Number(amount).toLocaleString('en-IN')} for ${groupName} is due on ${dueDateStr}.`;

      if (daysLeft === 0) {
        title = `🚨 Payment Due Today: ${groupName}`;
        message = `Your installment of ₹${Number(amount).toLocaleString('en-IN')} for ${groupName} is due TODAY! Tap to pay securely and avoid penalty.`;
      } else if (daysLeft < 0) {
        title = `⚠️ Payment Overdue: ${groupName}`;
        message = `Your installment of ₹${Number(amount).toLocaleString('en-IN')} for ${groupName} was due on ${dueDateStr} and is OVERDUE. Please remit immediately.`;
      }

      const payload = {
        notification: {
          title,
          body: message,
          sound: 'default',
        },
        data: {
          type: 'PAYMENT_DUE',
          groupName,
          amount: String(amount),
          dueDate: dueDateStr,
          daysLeft: String(daysLeft),
          channelId: 'gdk_payments',
          screen: 'DueCalendar',
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'gdk_payments',
          }
        }
      };

      return await this.sendToUsers([userId], payload, 'PAYMENT_DUE');
    } catch (err) {
      console.error('Error in sendPaymentDueAlert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Run automated daily scan of pending/overdue monthly collections and fire push alerts
   */
  async sendDailyPaymentDueAlerts() {
    try {
      console.log('🔍 [FCM Push] Scanning for pending and upcoming payment due deadlines...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pendingRows] = await db.promise().query(`
        SELECT 
          mc.user_id,
          mc.group_id,
          mc.amount,
          mc.due_date,
          mc.status,
          g.group_name
        FROM monthly_collections mc
        INNER JOIN \`groups\` g ON mc.group_id = g.id
        WHERE mc.status IN ('pending', 'overdue')
          AND mc.deleted_at IS NULL
          AND mc.due_date IS NOT NULL
      `);

      let sentCount = 0;
      for (const row of pendingRows) {
        const dueDate = new Date(row.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));

        // Notify if: overdue (daysLeft < 0), due today (daysLeft === 0), or due in 3 days (daysLeft <= 3 && daysLeft > 0)
        if (daysLeft <= 3) {
          const dueDateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          await this.sendPaymentDueAlert(row.user_id, row.group_name, row.amount, dueDateStr, daysLeft);
          sentCount++;
        }
      }

      console.log(`✅ [FCM Push] Sent ${sentCount} payment due reminders.`);
      return { success: true, count: sentCount };
    } catch (err) {
      console.error('Error in sendDailyPaymentDueAlerts:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. Send Alert: Admin Broadcast Announcement
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
        const [rows] = await db.promise().query(
          'SELECT DISTINCT id as user_id FROM users WHERE deleted_at IS NULL'
        );
        userIds = rows.map(r => r.user_id);
      }

      if (userIds.length === 0) return { success: true, count: 0 };

      const payload = {
        notification: {
          title: `📢 ${title}`,
          body: message,
          sound: 'default',
        },
        data: {
          type: 'ANNOUNCEMENT',
          channelId: 'gdk_announcements',
          screen: 'Home',
        },
      };

      console.log(`📢 [FCM Push] Broadcasting Announcement "${title}" to ${userIds.length} subscribers...`);
      return await this.sendToUsers(userIds, payload, 'ANNOUNCEMENT');
    } catch (err) {
      console.error('Error in sendBroadcastAnnouncement:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Deliver push payload to list of user IDs by querying their active FCM tokens
   */
  async sendToUsers(userIds, payload, notificationType = 'GENERAL') {
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
            payload.notification?.title || 'Notification',
            payload.notification?.body || '',
            JSON.stringify(payload.data || {})
          ]
        ).catch(e => console.error('Error logging notification to DB:', e?.message));
      }

      const tokens = tokenRows.map(r => r.fcm_token).filter(Boolean);
      if (tokens.length === 0) {
        console.log(`ℹ️ [FCM Push] No active device tokens found for users [${userIds.join(', ')}]. Notification stored in DB.`);
        return { success: true, delivered: 0, reason: 'no_tokens' };
      }

      return await this.sendToTokens(tokens, payload);
    } catch (err) {
      console.error('Error querying FCM tokens for users:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Low-level FCM HTTP request dispatcher
   */
  async sendToTokens(tokens, payload) {
    if (!this.serverKey) {
      console.log(`🔔 [FCM Push Simulation] (Set FCM_SERVER_KEY in .env for live Firebase dispatch):`);
      console.log(`   Tokens: ${tokens.length}`);
      console.log(`   Title: ${payload.notification?.title}`);
      console.log(`   Body: ${payload.notification?.body}`);
      return { success: true, delivered: tokens.length, simulated: true };
    }

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        registration_ids: tokens,
        notification: payload.notification,
        data: payload.data,
        priority: 'high',
      });

      const options = {
        hostname: 'fcm.googleapis.com',
        port: 443,
        path: '/fcm/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.serverKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            console.log(`✅ [FCM Push Response]: Success: ${parsed.success || 0}, Failure: ${parsed.failure || 0}`);
            resolve({ success: true, response: parsed });
          } catch (e) {
            resolve({ success: false, raw: responseBody });
          }
        });
      });

      req.on('error', (e) => {
        console.error('❌ [FCM Push] Network error dispatching to Firebase:', e.message);
        resolve({ success: false, error: e.message });
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = new FCMPushService();
