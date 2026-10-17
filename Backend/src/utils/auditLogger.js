const db = require('../config/db');

const logAuditEvent = async (req, { actionType, tableName, recordId, oldValues = null, newValues = null }) => {
    try {
        const userId = req && req.user ? (req.user.userId || req.user.id) : null;
        const ipAddress = req ? (req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress) : null;
        const deviceInfo = req?.headers?.['user-agent'] || null;

        const sql = `
            INSERT INTO audit_logs 
            (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, device_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            userId ? Number(userId) : null,
            actionType,
            tableName,
            recordId ? Number(recordId) : null,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            ipAddress ? String(ipAddress).substring(0, 45) : null,
            deviceInfo ? String(deviceInfo).substring(0, 255) : null
        ];

        await db.promise().query(sql, params);
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
};

module.exports = { logAuditEvent };