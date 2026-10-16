const db = require('../../config/db');

let isTableInitialized = false;

const ensureNotificationTable = async () => {
  if (isTableInitialized) return;
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        notification_key VARCHAR(191) NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        payload JSON NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_cleared BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_notif_key (user_id, notification_key),
        INDEX idx_user_cleared (user_id, is_cleared),
        INDEX idx_user_read (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn('⚠️ [notificationsController] Error creating user_notifications table:', err?.message);
  }
};

const normalizeGroupStatus = (status) => {
  return String(status || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .trim();
};

exports.getNotifications = async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
    await ensureNotificationTable();

    // 1. Fetch user groups for payment dues
    const [rows] = await db.promise().query(
      `
      SELECT 
        g.id,
        g.group_name,
        g.start_date,
        g.duration,
        g.status
      FROM user_grouping ug
      INNER JOIN \`groups\` g ON ug.group_id = g.id
      INNER JOIN users u ON ug.user_id = u.id
      WHERE ug.user_id = ? AND g.deleted_at IS NULL AND u.deleted_at IS NULL
      `,
      [userId]
    );

    const generatedNotifications = [];
    const activeStatusSet = new Set(['ongoing', 'active', 'on going', 'not started', 'not-started']);

    for (const group of rows) {
      const statusKey = normalizeGroupStatus(group.status);
      if (!activeStatusSet.has(statusKey)) continue;
      if (!group.start_date) continue;

      const st = new Date(group.start_date);
      if (isNaN(st.getTime())) continue;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let elapsedMonths = (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth());
      if (now.getDate() >= st.getDate()) {
        elapsedMonths += 1;
      }

      const maxDuration = Number(group.duration) || 1;
      if (elapsedMonths < 0 || elapsedMonths > maxDuration) continue;

      const dueDate = new Date(st.getFullYear(), st.getMonth() + elapsedMonths, st.getDate());
      dueDate.setHours(0, 0, 0, 0);

      const paymentMonth = dueDate.getMonth();
      const paymentYear = dueDate.getFullYear();
      
      const periodStr = `${paymentYear}-${String(paymentMonth + 1).padStart(2, '0')}-01`;

      const [paymentRows] = await db.promise().query(
        `SELECT status, due_date FROM monthly_collections WHERE group_id = ? AND user_id = ? AND collection_period = ? AND deleted_at IS NULL LIMIT 1`,
        [group.id, userId, periodStr]
      );

      const payment = paymentRows[0];
      const isPaid = payment && String(payment.status || '').toLowerCase() === 'paid';
      const effectiveDueDate = payment && payment.due_date ? new Date(payment.due_date) : dueDate;
      effectiveDueDate.setHours(0, 0, 0, 0);

      const timeDiff = effectiveDueDate.getTime() - now.getTime();
      const daysAway = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (!isPaid) {
        if (daysAway < 0) {
          generatedNotifications.push({
            notification_key: `notif-${group.id}-${paymentYear}-${paymentMonth}-overdue`,
            type: 'danger',
            title: 'Payment Overdue',
            message: `Your payment for "${group.group_name}" was due on ${effectiveDueDate.toLocaleDateString()} and is now overdue. Please pay immediately.`,
            payload: { groupId: group.id, groupName: group.group_name },
            created_at: new Date().toISOString(),
          });
        } else if (daysAway === 0) {
          generatedNotifications.push({
            notification_key: `notif-${group.id}-${paymentYear}-${paymentMonth}-0`,
            type: 'danger',
            title: 'Payment Due Today!',
            message: `Your payment for "${group.group_name}" is due today (${effectiveDueDate.toLocaleDateString()}). Please complete it now.`,
            payload: { groupId: group.id, groupName: group.group_name },
            created_at: new Date().toISOString(),
          });
        } else if (daysAway <= 3) {
          generatedNotifications.push({
            notification_key: `notif-${group.id}-${paymentYear}-${paymentMonth}-3`,
            type: 'warning',
            title: 'Upcoming Payment Reminder',
            message: `Your payment for "${group.group_name}" is due on ${effectiveDueDate.toLocaleDateString()}. Please make the payment within the next ${daysAway} day${daysAway === 1 ? '' : 's'}.`,
            payload: { groupId: group.id, groupName: group.group_name },
            created_at: new Date().toISOString(),
          });
        } else {
          generatedNotifications.push({
            notification_key: `notif-${group.id}-${paymentYear}-${paymentMonth}-pending`,
            type: 'warning',
            title: 'Pending Payment Reminder',
            message: `Your payment for "${group.group_name}" is pending and due on ${effectiveDueDate.toLocaleDateString()}. Please pay before the due date.`,
            payload: { groupId: group.id, groupName: group.group_name },
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Fetch OTP Request Notifications
    const [otpRows] = await db.promise().query(
      `SELECT id, group_id, group_name, status, expires_at, created_at
       FROM otp_requests
       WHERE user_id = ? AND status IN ('pending', 'viewed') AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    for (const otp of otpRows) {
      generatedNotifications.push({
        notification_key: `otp-request-${otp.id}`,
        type: 'otp_request',
        title: 'OTP Verification Request',
        message: `Admin is requesting OTP verification for "${otp.group_name}". Tap to view your OTP code.`,
        payload: { otpRequestId: otp.id, groupId: otp.group_id, groupName: otp.group_name },
        created_at: otp.created_at,
      });
    }

    // 3. Fetch Broadcast & Push Notifications
    const [pushLogRows] = await db.promise().query(
      `SELECT id, type, title, message, payload, created_at
       FROM push_notifications_log
       WHERE (user_id = ? OR user_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    ).catch(() => [[]]);

    for (const pLog of pushLogRows) {
      generatedNotifications.push({
        notification_key: `push-log-${pLog.id}`,
        type: String(pLog.type || '').toLowerCase() === 'danger' ? 'danger' : 'info',
        title: pLog.title,
        message: pLog.message,
        payload: typeof pLog.payload === 'string' ? JSON.parse(pLog.payload || '{}') : (pLog.payload || {}),
        created_at: pLog.created_at,
      });
    }

    // 4. Upsert generated notifications into user_notifications table in MySQL
    // Note: is_read and is_cleared are preserved on duplicate key update!
    for (const notif of generatedNotifications) {
      await db.promise().query(
        `INSERT INTO user_notifications (user_id, notification_key, type, title, message, payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           type = VALUES(type),
           title = VALUES(title),
           message = VALUES(message),
           payload = VALUES(payload)`,
        [
          userId,
          notif.notification_key,
          notif.type,
          notif.title,
          notif.message,
          JSON.stringify(notif.payload || {}),
          notif.created_at || new Date(),
        ]
      ).catch((e) => console.warn('Error upserting user notification:', e?.message));
    }

    // 5. Query active notifications from database where is_cleared is FALSE
    const [dbNotifications] = await db.promise().query(
      `SELECT 
         id,
         notification_key,
         type,
         title,
         message,
         payload,
         is_read,
         created_at AS date
       FROM user_notifications
       WHERE user_id = ? AND is_cleared = 0
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    const formatted = dbNotifications.map((row) => {
      let extra = {};
      if (row.payload) {
        try {
          extra = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        } catch (_) {}
      }

      return {
        id: String(row.id),
        notification_key: row.notification_key,
        type: row.type,
        title: row.title,
        message: row.message,
        is_read: Boolean(row.is_read),
        date: row.date,
        ...extra,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * Mark a single notification or all notifications as read in the DB
 */
exports.markAsRead = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { id, all } = req.body;

  try {
    await ensureNotificationTable();

    if (all) {
      await db.promise().query(
        `UPDATE user_notifications SET is_read = 1 WHERE user_id = ?`,
        [userId]
      );
      return res.json({ success: true, message: 'All notifications marked as read in DB' });
    }

    if (id) {
      await db.promise().query(
        `UPDATE user_notifications 
         SET is_read = 1 
         WHERE user_id = ? AND (id = ? OR notification_key = ?)`,
        [userId, id, id]
      );
      return res.json({ success: true, message: 'Notification marked as read in DB' });
    }

    return res.status(400).json({ success: false, message: 'Missing notification id or all parameter' });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
};

/**
 * Clear a single notification or all notifications in the DB (soft delete by setting is_cleared = 1)
 */
exports.clearNotifications = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { id, all } = req.body || {};

  try {
    await ensureNotificationTable();

    if (all) {
      await db.promise().query(
        `UPDATE user_notifications SET is_cleared = 1 WHERE user_id = ?`,
        [userId]
      );
      return res.json({ success: true, message: 'All notifications cleared in DB' });
    }

    if (id) {
      await db.promise().query(
        `UPDATE user_notifications 
         SET is_cleared = 1 
         WHERE user_id = ? AND (id = ? OR notification_key = ?)`,
        [userId, id, id]
      );
      return res.json({ success: true, message: 'Notification cleared in DB' });
    }

    return res.status(400).json({ success: false, message: 'Missing notification id or all parameter' });
  } catch (error) {
    console.error('Error in clearNotifications:', error);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
};

exports.saveFCMToken = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { fcmToken, platform } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: 'FCM token is required' });
  }

  try {
    // Ensure table exists
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        fcm_token VARCHAR(255) NOT NULL,
        platform VARCHAR(20) DEFAULT 'android',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_fcm (user_id, fcm_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.promise().query(
      `INSERT INTO user_fcm_tokens (user_id, fcm_token, platform) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE platform = VALUES(platform), updated_at = CURRENT_TIMESTAMP`,
      [userId, fcmToken, platform || 'android']
    );

    return res.json({ success: true, message: 'FCM token registered successfully' });
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
};

exports.deleteFCMToken = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: 'FCM token is required' });
  }

  try {
    const [result] = await db.promise().query(
      'DELETE FROM user_fcm_tokens WHERE user_id = ? AND fcm_token = ?',
      [userId, fcmToken]
    );
    return res.json({ success: true, message: 'FCM token deleted successfully', deleted: result.affectedRows > 0 });
  } catch (err) {
    console.error('Error deleting FCM token:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete FCM token' });
  }
};
