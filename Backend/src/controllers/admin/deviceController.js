const db = require('../../config/db');

/**
 * GET /api/admin/devices/bindings
 * Retrieve subscriber device binding status, hardware footprint, and overview statistics.
 */
exports.getDeviceBindings = async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT id, name, phone, role, is_active,
             bound_device_id, device_name, device_platform, device_model,
             device_bound_at, device_last_login, device_status, created_at
      FROM users
      WHERE deleted_at IS NULL
    `;
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (name LIKE ? OR phone LIKE ? OR device_name LIKE ? OR bound_device_id LIKE ?)`;
      params.push(q, q, q, q);
    }

    if (status && status !== 'ALL') {
      sql += ` AND device_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY device_bound_at DESC, id DESC`;

    const [users] = await db.promise().query(sql, params);

    // Compute metrics
    const [counts] = await db.promise().query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN device_status = 'BOUND' AND bound_device_id IS NOT NULL THEN 1 ELSE 0 END) as boundCount,
        SUM(CASE WHEN device_status = 'UNBOUND' OR bound_device_id IS NULL THEN 1 ELSE 0 END) as unboundCount,
        SUM(CASE WHEN device_status = 'REVOKED' THEN 1 ELSE 0 END) as revokedCount
      FROM users
      WHERE deleted_at IS NULL AND role = 'User'
    `);

    const stats = counts[0] || {
      totalUsers: 0,
      boundCount: 0,
      unboundCount: 0,
      revokedCount: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        users,
        stats: {
          totalUsers: Number(stats.totalUsers) || 0,
          boundCount: Number(stats.boundCount) || 0,
          unboundCount: Number(stats.unboundCount) || 0,
          revokedCount: Number(stats.revokedCount) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching device bindings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve device bindings',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/devices/revoke
 * Revokes a subscriber's current device binding, logging them out of their previous hardware
 * and granting immediate clearance to log into their new device.
 */
exports.revokeDeviceBinding = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // 1. Fetch user to check current device
    const [users] = await db.promise().query(
      `SELECT id, name, phone, bound_device_id, device_name, device_platform FROM users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    const user = users[0];
    const prevDeviceId = user.bound_device_id;
    const prevDeviceName = user.device_name || user.device_platform || 'Previous Device';

    // 2. Log revocation to audit trail
    await db.promise().query(
      `INSERT INTO device_revocation_logs (user_id, revoked_device_id, revoked_device_name, revoked_by, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, prevDeviceId, prevDeviceName, adminId || null, reason || 'Admin revoked device session for new device login']
    );

    // 3. Clear all active sessions / refresh tokens
    await db.promise().query(`DELETE FROM refresh_tokens WHERE user_id = ?`, [userId]);

    // 4. Reset user device binding status in DB
    await db.promise().query(
      `UPDATE users 
       SET bound_device_id = NULL,
           device_status = 'REVOKED',
           updated_by = ?
       WHERE id = ?`,
      [adminId || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: `Device access revoked for ${user.name}. Subscriber is now cleared to log in from their new device.`,
      data: {
        userId,
        revokedDeviceName: prevDeviceName
      }
    });
  } catch (error) {
    console.error('Error revoking device:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke device session',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/devices/logs
 * Retrieve recent device session revocation audit logs.
 */
exports.getDeviceRevocationLogs = async (req, res) => {
  try {
    const sql = `
      SELECT drl.id, drl.user_id, drl.revoked_device_id, drl.revoked_device_name,
             drl.reason, drl.revoked_at,
             u.name as subscriber_name, u.phone as subscriber_phone,
             admin.name as admin_name
      FROM device_revocation_logs drl
      JOIN users u ON drl.user_id = u.id
      LEFT JOIN users admin ON drl.revoked_by = admin.id
      ORDER BY drl.revoked_at DESC
      LIMIT 100
    `;
    const [logs] = await db.promise().query(sql);

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching revocation logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch device revocation logs',
      error: error.message
    });
  }
};
