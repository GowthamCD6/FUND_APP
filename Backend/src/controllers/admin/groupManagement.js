const db = require('../../config/db')
const bcrypt = require('bcryptjs');

exports.createGroup = async (req, res) => {
    const { groupName, totalMembers, groupAmount, duration, startDate } = req.body;

    try {
        const start = startDate
            ? new Date(startDate.split('/').reverse().join('-'))
            : null;

        const generateGroupId = () => {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `GRP${timestamp}${random}`;
        };
        const groupId = generateGroupId();

        const end_date = start && duration
            ? new Date(start.getFullYear(), start.getMonth() + Number(duration), start.getDate())
            : null;

        const sql = `
            INSERT INTO \`groups\`
            (group_code, group_name, total_members, group_amount, duration, start_date, end_date)
            VALUES (?,?,?,?,?,?,?)
        `;
        const params = [
            groupId,
            groupName,
            Number(totalMembers) || null,
            Number(groupAmount) || null,
            Number(duration) || null,
            start,
            end_date,
        ];

        const [result] = await db.promise().query(sql, params);
        const groupData = {
            id: result.insertId,
            group_code: groupId,
            group_name: groupName
        };
        return res.status(201).json({ success: true, data: groupData });
    } catch (error) {
        console.error('Error creating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};

exports.addUser = async (req, res) => {
    const { name, phoneNumber, yearOfBirth, role } = req.body;
    const nick_name = name || null;
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
    const finalHashedPassword = await bcrypt.hash(plainPassword, 12);

        const [result] = await db
            .promise()
            .query(
                'INSERT INTO users (nick_name, phone, password, role) VALUES (?, ?, ?, ?)',
                [nick_name, phone, finalHashedPassword, role || null]
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

