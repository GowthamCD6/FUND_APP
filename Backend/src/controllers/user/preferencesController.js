const db = require('../../config/db');

// Get User Preferences (Language & Security Lock Setting)
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const [rows] = await db.promise().query(
            'SELECT language, security_enabled FROM user_preferences WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            // Insert default row if none exists
            await db.promise().query(
                'INSERT IGNORE INTO user_preferences (user_id, language, security_enabled) VALUES (?, ?, ?)',
                [userId, 'en', 0]
            );

            return res.json({
                success: true,
                data: {
                    language: 'en',
                    securityEnabled: false,
                }
            });
        }

        const pref = rows[0];
        return res.json({
            success: true,
            data: {
                language: pref.language || 'en',
                securityEnabled: Boolean(pref.security_enabled),
            }
        });

    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
    }
};

// Update User Preferences (Language & Security Lock Setting)
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { language, securityEnabled } = req.body;

        let langVal = language !== undefined && language !== null ? String(language) : null;
        let secVal = securityEnabled !== undefined && securityEnabled !== null ? (securityEnabled ? 1 : 0) : null;

        // Upsert into user_preferences
        const sql = `
            INSERT INTO user_preferences (user_id, language, security_enabled)
            VALUES (?, COALESCE(?, 'en'), COALESCE(?, 0))
            ON DUPLICATE KEY UPDATE
                language = COALESCE(VALUES(language), language),
                security_enabled = COALESCE(VALUES(security_enabled), security_enabled)
        `;

        await db.promise().query(sql, [userId, langVal, secVal]);

        // Return updated preferences
        const [updatedRows] = await db.promise().query(
            'SELECT language, security_enabled FROM user_preferences WHERE user_id = ? LIMIT 1',
            [userId]
        );

        const updated = updatedRows[0] || {};

        return res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                language: updated.language || 'en',
                securityEnabled: Boolean(updated.security_enabled),
            }
        });

    } catch (error) {
        console.error('Error updating user preferences:', error);
        return res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
};
