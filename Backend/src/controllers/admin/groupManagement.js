const db = require('../../config/db')
const bcrypt = require('bcryptjs');
const { groupEncryptAES, groupDecryptAES, passwordEncryptAES } = require('../../utils/decryptAES');

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


        const plainGroupCode = String(groupId);
        const finalGroupCode = groupEncryptAES(plainGroupCode);


        const sql = `
            INSERT INTO \`groups\`
            (group_code, group_name, total_members, group_amount, duration, start_date, end_date)
            VALUES (?,?,?,?,?,?,?)
        `;
        const params = [
            finalGroupCode,
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

exports.getGroups = async (req, res) => {
    try {
        const [rows] = await db
            .promise()
            .query('SELECT * FROM `groups` ORDER BY created_at DESC');

        if (!rows || rows.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Safely decrypt; skip rows that are not AES (e.g., old bcrypt data)
        rows.forEach(group => {
            try {
                group.id = group.id;
                group.name = group.group_name;
                group.status = group.status;
                group.totalMembers = group.total_members;
                group.groupAmount = group.group_amount;
                group.duration = group.duration;
                group.currentMembers = group.current_members;
                group.startDate = group.start_date;
                group.endDate = group.end_date;
                group.createdDate = group.created_at;
                group.groupCode = groupDecryptAES(group.group_code);
            } catch {
                // leave as-is if not AES-encrypted
            }
        });
        // console.log(rows);
        
        
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching groups:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
};

exports.addGroupMembers = async (req, res) => {
    const { groupId, members } = req.body;
    // Normalize members input: accept either an array of IDs (e.g. [3,4]) or
    // an array of objects with `id` (e.g. [{id:3}, {id:4}])
    if (!Array.isArray(members)) {
        return res.status(400).json({ success: false, message: 'members must be an array' });
    }

    // Convert numbers or string ids and objects to numeric ids
    const normalizedIds = members
        .map(m => (m && typeof m === 'object' ? m.id : m))
        .map(id => (id !== undefined && id !== null ? Number(id) : NaN))
        .filter(id => !Number.isNaN(id));

    if (normalizedIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid member ids provided' });
    }
    if (normalizedIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid member ids provided' });
    }

    // Validate groupId is numeric (DB group_id expects numeric id)
    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    console.log('Adding members to group', groupIdNum, 'ids:', normalizedIds);

    try {
        const insertValues = normalizedIds.map(id => [groupIdNum, id]);
        const sql = `
            INSERT INTO user_grouping (group_id, user_id)
            VALUES ?
        `;
        await db.promise().query(sql, [insertValues]);
        return res.status(201).json({ success: true, message: 'Members added successfully' });
    } catch (error) {
        console.error('Error adding group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to add group members' });
    }
};

// Fetch members of a group
exports.getGroupMembers = async (req, res) => {
    const groupId = req.query.groupId;
    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    try {
        const sql = `
            SELECT ug.id AS mappingId, ug.user_id AS userId, u.name, u.nick_name, u.phone
            FROM user_grouping ug
            LEFT JOIN users u ON u.id = ug.user_id
            WHERE ug.group_id = ?
        `;
        const [rows] = await db.promise().query(sql, [groupIdNum]);
        const data = rows.map(r => ({
            mappingId: r.mappingId,
            userId: r.userId,
            name: r.name,
            nickname: r.nickname,
            phone: r.phone,
        }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch group members' });
    }
};

// Remove members from a group (accepts array of user ids)
exports.removeGroupMembers = async (req, res) => {
    const { groupId, members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ success: false, message: 'members must be a non-empty array' });
    }
    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    const ids = members.map(m => (m && typeof m === 'object' ? m.id : m)).map(id => Number(id)).filter(id => !Number.isNaN(id));
    if (ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid member ids provided' });
    }

    try {
        const sql = `DELETE FROM user_grouping WHERE group_id = ? AND user_id IN (?);`;
        await db.promise().query(sql, [groupIdNum, ids]);
        return res.status(200).json({ success: true, message: 'Members removed successfully' });
    } catch (error) {
        console.error('Error removing group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove group members' });
    }
};