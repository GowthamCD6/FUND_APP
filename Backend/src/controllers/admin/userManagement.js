const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('../../utils/decryptAES');
const { logAuditEvent } = require('../../utils/auditLogger');

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
                u.id, u.name, u.nick_name, u.phone, u.mail, u.role, u.created_at,
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
            contributedGroups: user.contributed_groups || 'None'
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