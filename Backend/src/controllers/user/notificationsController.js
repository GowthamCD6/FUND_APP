const db = require('../../config/db');

const normalizeGroupStatus = (status) => {
  return String(status || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .trim();
};

exports.getNotifications = async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
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

    const notifications = [];
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
          notifications.push({
            id: `notif-${group.id}-${paymentYear}-${paymentMonth}-overdue`,
            type: 'danger',
            title: 'Payment Overdue',
            message: `Your payment for "${group.group_name}" was due on ${effectiveDueDate.toLocaleDateString()} and is now overdue. Please pay immediately.`,
            date: new Date().toISOString(),
          });
        } else if (daysAway === 0) {
          notifications.push({
            id: `notif-${group.id}-${paymentYear}-${paymentMonth}-0`,
            type: 'danger',
            title: 'Payment Due Today!',
            message: `Your payment for "${group.group_name}" is due today (${effectiveDueDate.toLocaleDateString()}). Please complete it now.`,
            date: new Date().toISOString(),
          });
        } else if (daysAway <= 3) {
          notifications.push({
            id: `notif-${group.id}-${paymentYear}-${paymentMonth}-3`,
            type: 'warning',
            title: 'Upcoming Payment Reminder',
            message: `Your payment for "${group.group_name}" is due on ${effectiveDueDate.toLocaleDateString()}. Please make the payment within the next ${daysAway} day${daysAway === 1 ? '' : 's'}.`,
            date: new Date().toISOString(),
          });
        } else {
          notifications.push({
            id: `notif-${group.id}-${paymentYear}-${paymentMonth}-pending`,
            type: 'warning',
            title: 'Pending Payment Reminder',
            message: `Your payment for "${group.group_name}" is pending and due on ${effectiveDueDate.toLocaleDateString()}. Please pay before the due date.`,
            date: new Date().toISOString(),
          });
        }
      }
    }

    // ── OTP Request Notifications ──
    const [otpRows] = await db.promise().query(
      `SELECT id, group_id, group_name, status, expires_at, created_at
       FROM otp_requests
       WHERE user_id = ? AND status IN ('pending', 'viewed') AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    for (const otp of otpRows) {
      notifications.unshift({
        id: `otp-request-${otp.id}`,
        type: 'otp_request',
        title: 'OTP Verification Request',
        message: `Admin is requesting OTP verification for "${otp.group_name}". Tap to view your OTP code.`,
        date: otp.created_at,
        otpRequestId: otp.id,
        groupId: otp.group_id,
        groupName: otp.group_name,
      });
    }

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
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

