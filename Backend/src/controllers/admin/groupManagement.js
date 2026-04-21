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
            // Auto activation logic based on start date
            if (group.status === 'not-started' || group.status === 'not started') {
                if (group.start_date) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const stDate = new Date(group.start_date);
                    if (stDate <= today) {
                        group.status = 'OnGoing';
                        // Asynchronously update DB
                        db.promise().query("UPDATE `groups` SET status = 'OnGoing' WHERE id = ?", [group.id]).catch(console.error);
                    }
                }
            }

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
                // Format to standard YYYY-MM-DD so Date inputs and new Date() constructors don't fail
                const useDate = group.start_date || group.created_at;
                if (useDate) {
                  const date = new Date(useDate);
                  const dd = String(date.getDate()).padStart(2, '0');
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const yyyy = date.getFullYear();
                  group.createdDate = `${yyyy}-${mm}-${dd}`;
                  group.startDate = `${yyyy}-${mm}-${dd}`;
                } else {
                  group.createdDate = '';
                  group.startDate = '';
                }
                
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

exports.updateGroup = async (req, res) => {
    const { groupId, groupName, totalAmount, numberOfUsers, createdDate } = req.body;

    if (!groupId) {
        return res.status(400).json({ success: false, message: 'groupId is required' });
    }

    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    const parsedStartDate = createdDate
        ? (createdDate.includes('-')
            ? new Date(createdDate)
            : new Date(createdDate.split('/').reverse().join('-')))
        : null;

    try {
        const sql = `
            UPDATE \`groups\`
            SET group_name = ?,
                group_amount = ?,
                total_members = ?,
                start_date = ?
            WHERE id = ?
        `;

        const params = [
            groupName || null,
            totalAmount !== undefined ? Number(totalAmount) : null,
            numberOfUsers !== undefined ? Number(numberOfUsers) : null,
            parsedStartDate,
            groupIdNum,
        ];

        const [result] = await db.promise().query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        return res.status(200).json({ success: true, message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error updating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to update group' });
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

        // Update the current_members count in the groups table
        await db.promise().query(
            `UPDATE \`groups\` SET current_members = current_members + ? WHERE id = ?`,
            [normalizedIds.length, groupIdNum]
        );

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
        const [result] = await db.promise().query(sql, [groupIdNum, ids]);
        
        if (result.affectedRows > 0) {
            // Update the current_members count in the groups table
            await db.promise().query(
                `UPDATE \`groups\` SET current_members = current_members - ? WHERE id = ?`,
                [result.affectedRows, groupIdNum]
            );
        }

        return res.status(200).json({ success: true, message: 'Members removed successfully' });
    } catch (error) {
        console.error('Error removing group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove group members' });
    }
};

exports.activateGroup = async (req, res) => {
    const { groupId } = req.body;
    
    if (!groupId) {
        return res.status(400).json({ success: false, message: 'groupId is required' });
    }

    try {
        const sql = `UPDATE \`groups\` SET status = 'OnGoing' WHERE id = ?`;
        const [result] = await db.promise().query(sql, [groupId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        return res.status(200).json({ success: true, message: 'Group activated successfully' });
    } catch (error) {
        console.error('Error activating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to activate group' });
    }
};

exports.deleteGroup = async (req, res) => {
    const { groupId } = req.body;
    
    if (!groupId) {
        return res.status(400).json({ success: false, message: 'groupId is required' });
    }

    try {
        // First delete members mappings to satisfy foreign key constraints if any
        await db.promise().query('DELETE FROM user_grouping WHERE group_id = ?', [groupId]);
        
        const sql = `DELETE FROM \`groups\` WHERE id = ?`;
        const [result] = await db.promise().query(sql, [groupId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        return res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete group' });
    }
};