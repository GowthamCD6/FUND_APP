const db = require('../../config/db')
const { decryptAES } = require('../../utils/decryptAES');
const crypto = require('crypto');

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
    const { nick_name, phone, yob, role } = req.body;
    try {
        const checkUserSql = 'SELECT * FROM users WHERE phone = ?';
        const [userRows] = await db.promise().query(checkUserSql, [phone]);
        if (userRows.length === 0) {
            const hashed_password = yob ? yob.toString() : null;
            if (!hashed_password) {
                return res.status(400).json({ success: false, message: 'Year of birth is required to set password' });
            }
            // Encrypt the password using AES before storing
            const encryptedPassword = decryptAES(hashed_password);
            const hash = crypto.createHash('sha256');
            hash.update(encryptedPassword);
            const finalHashedPassword = hash.digest('hex');

            const insertMemberSql = 'INSERT INTO users (nick_name, phone, hashed_password, role) VALUES (?, ?, ?, ?)';
            const [result] = await db.promise().query(insertMemberSql, [nick_name, phone, finalHashedPassword, role]);

            if(result.affectedRows === 0){
                return res.status(500).json({ success: false, message: 'Failed to add user' });
            }
            return res.status(200).json({ success: true, message: 'User added to group' });

        }
        return res.status(404).json({ success: false, message: 'User already exists' });
    } catch (error) {
        console.error('Error adding user to group:', error);
        return res.status(500).json({ success: false, message: 'Failed to add user to group' });
    }
};

