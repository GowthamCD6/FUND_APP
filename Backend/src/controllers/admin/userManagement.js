const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('../../utils/decryptAES');

exports.addUser = async (req, res) => {
    const { name, phoneNumber, yearOfBirth, role } = req.body;
    const phone = phoneNumber || null;
    const yob = yearOfBirth || null;

    try {
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }
        if (!yob) {
            return res.status(400).json({ success: false, message: 'Year of birth is required' });
        }

        const [userRows] = await db.promise().query('SELECT id FROM users WHERE phone = ?', [phone]);
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
                'INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
                [name || null, phone, finalHashedPassword, role || 'User']
            );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to add user' });
        }

        return res.status(200).json({ success: true, message: 'User added to group' });
    } catch (error) {
        console.error('Error adding user to group:', error);
        return res.status(500).json({ success: false, message: 'Failed to add user to group' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        console.log("Fetching all users");
        
        const results = await db.promise().query('SELECT id, name, nick_name, phone, mail, role, created_at FROM users');
        const users = results[0].map(user => ({
            id: user.id,
            name: user.name,
            nickname: user.nick_name,
            phone: user.phone,
            email: user.mail,
            type: user.role,
            joinedDate: user.created_at,
            dateOfBirth: '00-00-0000'
        }));
        if (!users || users.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }
        console.log(users);
        
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // Perform deletion
        const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        // Handle foreign key constraint error gracefully if they are assigned to a group
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'Cannot delete user because they are part of a group' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};