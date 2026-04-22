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

exports.saveGroupMonthlyDetails = async (req, res) => {
    const {
        groupId,
        month,
        year,
        currentMonthAmount,
        elathThalupadi,
        commission,
        notes,
    } = req.body;

    const groupIdNum = Number(groupId);
    const monthNum = Number(month);
    const yearNum = Number(year);

    if (!Number.isInteger(groupIdNum) || !Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({ success: false, message: 'groupId, month, and year are required' });
    }

    if (monthNum < 0 || monthNum > 11) {
        return res.status(400).json({ success: false, message: 'month must be between 0 and 11' });
    }

    if (yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ success: false, message: 'year must be between 2000 and 2100' });
    }

    if ((Number(currentMonthAmount) || 0) <= 0) {
        return res.status(400).json({ success: false, message: 'currentMonthAmount must be greater than 0' });
    }

    try {
        const [[groupRow]] = await db.promise().query(
            'SELECT id FROM `groups` WHERE id = ? LIMIT 1',
            [groupIdNum],
        );

        if (!groupRow) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        await db.promise().query(
            `
            INSERT INTO group_monthly_details
            (group_id, month, year, monthly_amount, discount_amount, commission_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                monthly_amount = VALUES(monthly_amount),
                discount_amount = VALUES(discount_amount),
                commission_amount = VALUES(commission_amount),
                notes = VALUES(notes),
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                groupIdNum,
                monthNum,
                yearNum,
                Number(currentMonthAmount) || 0,
                Number(elathThalupadi) || 0,
                Number(commission) || 0,
                notes ? String(notes) : null,
            ],
        );

        return res.status(200).json({
            success: true,
            data: {
                groupId: groupIdNum,
                month: monthNum,
                year: yearNum,
                currentMonthAmount: Number(currentMonthAmount) || 0,
                elathThalupadi: Number(elathThalupadi) || 0,
                commission: Number(commission) || 0,
            },
        });
    } catch (error) {
        console.error('Error saving group monthly details:', error);
        return res.status(500).json({ success: false, message: 'Failed to save payment details' });
    }
};

exports.saveAuctionWinner = async (req, res) => {
    const {
        groupId,
        month,
        year,
        chitWinnerName,
        chitWinnerMemberId,
        amountTaken,
        datePicked,
        winnerUserId,
    } = req.body;

    const groupIdNum = Number(groupId);
    const monthNum = Number(month);
    const yearNum = Number(year);

    if (!Number.isInteger(groupIdNum) || !Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({ success: false, message: 'groupId, month, and year are required' });
    }

    if (!chitWinnerName || !amountTaken || !datePicked) {
        return res.status(400).json({ success: false, message: 'Winner name, amount taken, and auction date are required' });
    }

    if (monthNum < 0 || monthNum > 11) {
        return res.status(400).json({ success: false, message: 'month must be between 0 and 11' });
    }

    if (yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ success: false, message: 'year must be between 2000 and 2100' });
    }

    const amountTakenNum = Number(amountTaken) || 0;
    if (amountTakenNum <= 0) {
        return res.status(400).json({ success: false, message: 'amountTaken must be greater than 0' });
    }

    const auctionDate = new Date(datePicked);
    if (Number.isNaN(auctionDate.getTime())) {
        return res.status(400).json({ success: false, message: 'datePicked is invalid' });
    }

    try {
        const [[groupRow]] = await db.promise().query(
            'SELECT id FROM `groups` WHERE id = ? LIMIT 1',
            [groupIdNum],
        );

        if (!groupRow) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        await db.promise().query(
            `
            INSERT INTO group_auction_winners
            (group_id, month, year, winner_user_id, winner_name, winner_member_phone, amount_taken, auction_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                winner_user_id = VALUES(winner_user_id),
                winner_name = VALUES(winner_name),
                winner_member_phone = VALUES(winner_member_phone),
                amount_taken = VALUES(amount_taken),
                auction_date = VALUES(auction_date),
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                groupIdNum,
                monthNum,
                yearNum,
                winnerUserId ? Number(winnerUserId) : null,
                String(chitWinnerName),
                chitWinnerMemberId ? String(chitWinnerMemberId) : null,
                amountTakenNum,
                auctionDate,
            ],
        );

        return res.status(200).json({
            success: true,
            data: {
                groupId: groupIdNum,
                month: monthNum,
                year: yearNum,
                chitWinnerName: String(chitWinnerName),
                chitWinnerMemberId: chitWinnerMemberId ? String(chitWinnerMemberId) : null,
                amountTaken: amountTakenNum,
                datePicked,
            },
        });
    } catch (error) {
        console.error('Error saving auction winner:', error);
        return res.status(500).json({ success: false, message: 'Failed to save auction winner' });
    }
};

exports.getGroupMonthSnapshot = async (req, res) => {
    const groupIdNum = Number(req.query.groupId);
    const monthNum = Number(req.query.month);
    const yearNum = Number(req.query.year);

    if (!Number.isInteger(groupIdNum) || !Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({ success: false, message: 'groupId, month, and year are required' });
    }

    if (monthNum < 0 || monthNum > 11) {
        return res.status(400).json({ success: false, message: 'month must be between 0 and 11' });
    }

    if (yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ success: false, message: 'year must be between 2000 and 2100' });
    }

    try {
        const [[payment]] = await db.promise().query(
            `
            SELECT monthly_amount, discount_amount, commission_amount, notes
            FROM group_monthly_details
            WHERE group_id = ? AND month = ? AND year = ?
            LIMIT 1
            `,
            [groupIdNum, monthNum, yearNum],
        );

        const [[winner]] = await db.promise().query(
            `
            SELECT winner_name, winner_member_phone, amount_taken, auction_date
            FROM group_auction_winners
            WHERE group_id = ? AND month = ? AND year = ?
            LIMIT 1
            `,
            [groupIdNum, monthNum, yearNum],
        );

        return res.status(200).json({
            success: true,
            data: {
                groupId: groupIdNum,
                month: monthNum,
                year: yearNum,
                payment: payment
                    ? {
                        currentMonthAmount: Number(payment.monthly_amount) || 0,
                        elathThalupadi: Number(payment.discount_amount) || 0,
                        commission: Number(payment.commission_amount) || 0,
                        notes: payment.notes || null,
                    }
                    : null,
                winner: winner
                    ? {
                        chitWinnerName: winner.winner_name,
                        chitWinnerMemberId: winner.winner_member_phone,
                        amountTaken: Number(winner.amount_taken) || 0,
                        datePicked: winner.auction_date,
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error('Error fetching month snapshot:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch month snapshot' });
    }
};