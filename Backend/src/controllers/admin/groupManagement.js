const db = require('../../config/db');


exports.createGroup = async (req, res) => {
    const { groupName, totalMembers, groupAmount, duration, startDate } = req.body;
    console.log(groupName, totalMembers, groupAmount, duration, startDate);
    
    try {
        const start = startDate
            ? new Date(startDate.split('/').reverse().join('-')) // DD/MM/YYYY -> YYYY-MM-DD
            : null;

        const generateGroupId = () => {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const groupId = `GRP${timestamp}${random}`;
            return groupId;
        };
        const groupId = generateGroupId();

        const end_date = start && duration
            ? new Date(start.getFullYear(), start.getMonth() + Number(duration), start.getDate())
            : null;

        const sql = `
      INSERT INTO groups (group_code, group_name, total_members, group_amount, duration, start_date, end_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`;
        const params = [
            groupId,
            groupName,
            totalMembers ? Number(totalMembers) : null,
            groupAmount ? Number(groupAmount) : null,
            duration ? Number(duration) : null,
            start,
            end_date,
        ];

        const { rows } = await db.query(sql, params);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error creating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};