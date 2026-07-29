const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('../../utils/decryptAES');
const { logAuditEvent } = require('../../utils/auditLogger');
const { addUserToGlobalCommunity } = require('../../utils/communityHelper');

exports.addUser = async (req, res) => {
    const { name, phoneNumber, yearOfBirth, role } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;
    const phone = phoneNumber || null;
    const yob = yearOfBirth || null;

    try {
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }
        if (!yob) {
            return res.status(400).json({ success: false, message: 'Year of birth is required' });
        }

        const [userRows] = await db.promise().query('SELECT id FROM users WHERE phone = ? AND deleted_at IS NULL', [phone]);
        if (userRows.length > 0) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        // Hash plaintext password (YOB) using bcrypt
        const plainPassword = String(yob);
        const encryptAES = passwordEncryptAES(plainPassword);
        const finalHashedPassword = await bcrypt.hash(encryptAES, 12);

        const [result] = await db
            .promise()
            .query(
                'INSERT INTO users (name, phone, password, role, created_by) VALUES (?, ?, ?, ?, ?)',
                [name || null, phone, finalHashedPassword, role || 'User', adminId ? Number(adminId) : null]
            );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to add user' });
        }

        const userId = result.insertId;

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'INSERT',
            tableName: 'users',
            recordId: userId,
            newValues: { name, phone, role }
        });

        // Auto-add new user to Global Community chat room
        await addUserToGlobalCommunity(userId, role === 'Admin' ? 'Admin' : 'Member');

        return res.status(200).json({ success: true, message: 'User added to group' });
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ success: false, message: 'Failed to add user' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        console.log("Fetching all users");
        
        const query = `
            SELECT 
                u.id, u.name, u.nick_name, u.phone, u.mail, u.role, u.created_at, u.is_active, u.block_reason,
                (
                    SELECT GROUP_CONCAT(g.group_name SEPARATOR ', ')
                    FROM user_grouping ug
                    JOIN \`groups\` g ON ug.group_id = g.id
                    WHERE ug.user_id = u.id AND g.deleted_at IS NULL
                ) AS contributed_groups
            FROM users u
            WHERE u.deleted_at IS NULL
        `;
        const results = await db.promise().query(query);
        
        const users = results[0].map(user => ({
            id: user.id,
            name: user.name,
            nickname: user.nick_name,
            phone: user.phone,
            email: user.mail,
            type: user.role,
            joinedDate: user.created_at,
            dateOfBirth: '00-00-0000',
            contributedGroups: user.contributed_groups || 'None',
            isActive: user.is_active,
            blockReason: user.block_reason
        }));
        
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // Perform soft delete
        const [result] = await db.promise().query(
            'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL',
            [adminId ? Number(adminId) : null, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found or already deleted' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'DELETE',
            tableName: 'users',
            recordId: Number(userId)
        });
        
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

// Update user password (admin only)
exports.updatePassword = async (req, res) => {
    const { userId, newPassword } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!userId || !newPassword) {
        return res.status(400).json({ success: false, message: 'User ID and new password are required' });
    }

    try {
        // Validate user exists
        const [userRows] = await db.promise().query(
            'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Hash the new password using AES encryption + bcrypt
        const encryptedPassword = passwordEncryptAES(newPassword);
        const hashedPassword = await bcrypt.hash(encryptedPassword, 12);

        // Update password
        const [result] = await db.promise().query(
            'UPDATE users SET password = ?, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL',
            [hashedPassword, adminId ? Number(adminId) : null, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to update password' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'UPDATE',
            tableName: 'users',
            recordId: Number(userId),
            newValues: { password: '***' }
        });

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
};

// Reset user password to default (based on YOB)
exports.resetPassword = async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // Get user's year of birth (stored during creation or from profile)
        const [userRows] = await db.promise().query(
            'SELECT id, year_of_birth FROM users WHERE id = ? AND deleted_at IS NULL',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const yob = userRows[0].year_of_birth;
        if (!yob) {
            return res.status(400).json({ success: false, message: 'User year of birth not found. Cannot reset password.' });
        }

        // Hash the YOB as the default password
        const plainPassword = String(yob);
        const encryptedPassword = passwordEncryptAES(plainPassword);
        const hashedPassword = await bcrypt.hash(encryptedPassword, 12);

        // Update password
        const [result] = await db.promise().query(
            'UPDATE users SET password = ?, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL',
            [hashedPassword, adminId ? Number(adminId) : null, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to reset password' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'UPDATE',
            tableName: 'users',
            recordId: Number(userId),
            newValues: { password: 'RESET_TO_DEFAULT' }
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Password reset to default successfully',
            defaultPassword: yob 
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

// Get user password details
exports.getUserPasswordDetails = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        const query = `
            SELECT u.id, u.name, u.phone, u.role, u.password, u.created_at, u.updated_at, up.date_of_birth
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
            WHERE u.id = ? AND u.deleted_at IS NULL
        `;
        const [userRows] = await db.promise().query(query, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userRows[0];
        
        // Determine password display representation
        let displayPassword = 'Modified (Secure Hashed)';
        if (user.date_of_birth) {
            const yob = new Date(user.date_of_birth).getFullYear();
            const encryptedYOB = passwordEncryptAES(String(yob));
            const isDefault = await bcrypt.compare(encryptedYOB, user.password);
            if (isDefault) {
                displayPassword = String(yob);
            }
        } else {
            // Fallback check: if user has never updated their password, it's likely default
            if (!user.updated_at) {
                displayPassword = 'Default (Not changed)';
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                userId: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                createdAt: user.created_at,
                lastUpdatedAt: user.updated_at,
                currentPassword: displayPassword
            }
        });
    } catch (error) {
        console.error('Error fetching password details:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch password details' });
    }
};

exports.getUserLocations = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.phone,
                ul.latitude, 
                ul.longitude,
                COALESCE(ul.address, CONCAT_WS(', ', NULLIF(up.street_address, ''), NULLIF(up.city, ''), NULLIF(up.state, ''))) AS address
            FROM users u
            LEFT JOIN user_locations ul ON u.id = ul.user_id AND ul.deleted_at IS NULL
            LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
            WHERE u.role = 'User' AND u.deleted_at IS NULL
        `;
        const [rows] = await db.promise().query(query);
        
        const userLocations = rows
            .filter(row => row.address && row.address.trim() !== '')
            .map(row => ({
                id: String(row.id),
                name: row.name,
                phone: row.phone,
                address: row.address,
                latitude: row.latitude ? Number(row.latitude) : null,
                longitude: row.longitude ? Number(row.longitude) : null,
            }));
            
        return res.status(200).json({ success: true, data: userLocations });
    } catch (error) {
        console.error('Error fetching user locations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user locations' });
    }
};

exports.blockUser = async (req, res) => {
    const { userId, reason } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!userId || !reason) {
        return res.status(400).json({ success: false, message: 'User ID and block reason are required' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE users SET is_active = 0, block_reason = ?, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL',
            [reason, adminId ? Number(adminId) : null, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'UPDATE',
            tableName: 'users',
            recordId: Number(userId),
            newValues: { is_active: 0, block_reason: reason }
        });

        return res.status(200).json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        return res.status(500).json({ success: false, message: 'Failed to block user' });
    }
};

exports.unblockUser = async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE users SET is_active = 1, block_reason = NULL, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL',
            [adminId ? Number(adminId) : null, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'UPDATE',
            tableName: 'users',
            recordId: Number(userId),
            newValues: { is_active: 1, block_reason: null }
        });

        return res.status(200).json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return res.status(500).json({ success: false, message: 'Failed to unblock user' });
    }
};