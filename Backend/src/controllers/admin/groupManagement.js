const db = require('../../config/db')
const { groupEncryptAES, groupDecryptAES } = require('../../utils/decryptAES');
const { sendSMS } = require('../../services/smsService');
const { logAuditEvent } = require('../../utils/auditLogger');

exports.getAdminNotifications = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT id, group_name, start_date, duration FROM `groups` WHERE (status = 'OnGoing' OR status = 'not-started' OR status = 'not started') AND deleted_at IS NULL"
        );

        const notifications = [];
        const now = new Date();
        now.setHours(0,0,0,0);

        // Current collection period for payment check
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentCollectionPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

        // Fetch all group IDs that already have payment details for this month
        const [existingPayments] = await db.promise().query(
            'SELECT group_id FROM group_monthly_details WHERE collection_period = ? AND deleted_at IS NULL',
            [currentCollectionPeriod]
        );
        const groupsWithPayment = new Set(existingPayments.map(p => p.group_id));
        
        rows.forEach(group => {
            if (group.start_date) {
                const st = new Date(group.start_date);
                
                let elapsedMonths = (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth());
                if (now.getDate() >= st.getDate()) {
                    elapsedMonths += 1;
                }
                
                // If it hasn't even started yet (0 month cycle):
                if (st > now) {
                    const timeDiff = st.getTime() - now.getTime();
                    const daysAway = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    if (daysAway === 3) {
                        notifications.push({
                            id: `admin-notif-${group.group_name}-start-3`,
                            type: 'warning',
                            title: 'New Group Starting Soon',
                            message: `Group "${group.group_name}" is scheduled to start its first cycle in 3 days (${st.toLocaleDateString()}). Prepare initial configurations.`,
                            date: new Date().toISOString()
                        });
                    } else if (daysAway === 0) {
                        notifications.push({
                            id: `admin-notif-${group.group_name}-start-0`,
                            type: 'danger',
                            title: 'New Group Starts Today!',
                            message: `Group "${group.group_name}" officially starts today. Ensure members are added and auction is ready.`,
                            date: new Date().toISOString()
                        });
                    }
                } else {
                    // Ongoing cycles
                    const maxDuration = group.duration || 1;
                    if (elapsedMonths <= maxDuration) {
                        const nextDueDate = new Date(st.getFullYear(), st.getMonth() + elapsedMonths, st.getDate());
                        nextDueDate.setHours(0,0,0,0);
                        
                        const timeDiff = nextDueDate.getTime() - now.getTime();
                        const daysAway = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        
                        if (daysAway === 3) {
                            notifications.push({
                                id: `admin-notif-${group.group_name}-3`,
                                type: 'warning',
                                title: 'Cycle Renewal Incoming',
                                message: `The next cycle for "${group.group_name}" begins in 3 days (${nextDueDate.toLocaleDateString()}). Remind users and prepare next month details.`,
                                date: new Date().toISOString()
                            });
                        } else if (daysAway === 0) {
                            notifications.push({
                                id: `admin-notif-${group.group_name}-0`,
                                type: 'danger',
                                title: 'New Cycle Today!',
                                message: `The next cycle for "${group.group_name}" is today. Ensure group monthly details are filled out for collection!`,
                                date: new Date().toISOString()
                            });
                        }
                    }

                    // Payment details missing warning for ongoing groups
                    // Only warn if the group has already started (st <= now)
                    if (!groupsWithPayment.has(group.id)) {
                        notifications.push({
                            id: `admin-notif-${group.group_name}-payment-missing`,
                            type: 'warning',
                            title: 'Payment Details Missing',
                            message: `Group "${group.group_name}" does not have payment details set for ${new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Please fill in the monthly amount, discount, and commission.`,
                            date: new Date().toISOString()
                        });
                    }
                }
            }
        });

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateGroup = async (req, res) => {
    const { groupId, groupName, totalAmount, numberOfUsers, createdDate } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

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
        // Fetch old values for audit logging
        const [[oldGroup]] = await db.promise().query(
            'SELECT group_name, group_amount, total_members, start_date FROM `groups` WHERE id = ? AND deleted_at IS NULL',
            [groupIdNum]
        );

        const sql = `
            UPDATE \`groups\`
            SET group_name = ?,
                group_amount = ?,
                total_members = ?,
                start_date = ?,
                updated_by = ?,
                version = version + 1
            WHERE id = ? AND deleted_at IS NULL
        `;

        const params = [
            groupName || null,
            totalAmount !== undefined ? Number(totalAmount) : null,
            numberOfUsers !== undefined ? Number(numberOfUsers) : null,
            parsedStartDate,
            adminId ? Number(adminId) : null,
            groupIdNum,
        ];

        const [result] = await db.promise().query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found or already deleted' });
        }

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'UPDATE',
            tableName: 'groups',
            recordId: groupIdNum,
            oldValues: oldGroup || null,
            newValues: { groupName, totalAmount, numberOfUsers, start_date: parsedStartDate }
        });

        return res.status(200).json({ success: true, message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error updating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to update group' });
    }
};

exports.addGroupMembers = async (req, res) => {
    const { groupId, members } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!Array.isArray(members)) {
        return res.status(400).json({ success: false, message: 'members must be an array' });
    }

    const normalizedIds = members
        .map(m => (m && typeof m === 'object' ? m.id : m))
        .map(id => (id !== undefined && id !== null ? Number(id) : NaN))
        .filter(id => !Number.isNaN(id));

    if (normalizedIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid member ids provided' });
    }

    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const insertValues = normalizedIds.map(id => [groupIdNum, id]);
        const sql = `
            INSERT INTO user_grouping (group_id, user_id)
            VALUES ?
        `;
        await connection.query(sql, [insertValues]);

        // Update the current_members count in the groups table
        await connection.query(
            `UPDATE \`groups\` SET current_members = current_members + ?, updated_by = ?, version = version + 1 WHERE id = ?`,
            [normalizedIds.length, adminId ? Number(adminId) : null, groupIdNum]
        );

        // Audit log
        await logAuditEvent(req, {
            actionType: 'ADD_MEMBERS',
            tableName: 'user_grouping',
            recordId: groupIdNum,
            newValues: { membersAdded: normalizedIds }
        });

        await connection.commit();
        return res.status(201).json({ success: true, message: 'Members added successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to add group members' });
    } finally {
        connection.release();
    }
};

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
            WHERE ug.group_id = ? AND u.deleted_at IS NULL
        `;
        const [rows] = await db.promise().query(sql, [groupIdNum]);
        const members = rows.map(r => ({
            id: r.userId.toString(),
            name: r.name || r.nick_name || 'User',
            phone: r.phone || '',
            avatar: (r.name || r.nick_name || 'U').substring(0, 2).toUpperCase(),
            userId: r.userId,
            mappingId: r.mappingId,
        }));
        return res.status(200).json({ success: true, members });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch group members' });
    }
};

exports.removeGroupMembers = async (req, res) => {
    const { groupId, members } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

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

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const sql = `DELETE FROM user_grouping WHERE group_id = ? AND user_id IN (?);`;
        const [result] = await connection.query(sql, [groupIdNum, ids]);
        
        if (result.affectedRows > 0) {
            // Update the current_members count in the groups table
            await connection.query(
                `UPDATE \`groups\` SET current_members = current_members - ?, updated_by = ?, version = version + 1 WHERE id = ?`,
                [result.affectedRows, adminId ? Number(adminId) : null, groupIdNum]
            );
        }

        // Audit log
        await logAuditEvent(req, {
            actionType: 'REMOVE_MEMBERS',
            tableName: 'user_grouping',
            recordId: groupIdNum,
            oldValues: { membersRemoved: ids }
        });

        await connection.commit();
        return res.status(200).json({ success: true, message: 'Members removed successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error removing group members:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove group members' });
    } finally {
        connection.release();
    }
};

exports.activateGroup = async (req, res) => {
    const { groupId } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;
    
    if (!groupId) {
        return res.status(400).json({ success: false, message: 'groupId is required' });
    }

    try {
        const [[group]] = await db.promise().query('SELECT start_date FROM `groups` WHERE id = ? AND deleted_at IS NULL', [groupId]);
        
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        if (group.start_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const stDate = new Date(group.start_date);
            stDate.setHours(0, 0, 0, 0);
            
            const minActivationDate = new Date(stDate);
            minActivationDate.setDate(minActivationDate.getDate() - 1);
            
            if (today < minActivationDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot manually activate this group yet. You can activate it starting from ${minActivationDate.toLocaleDateString()} (1 day before start date).` 
                });
            }
        }

        const sql = `UPDATE \`groups\` SET status = 'OnGoing', updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL`;
        const [result] = await db.promise().query(sql, [adminId ? Number(adminId) : null, groupId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group failed to update' });
        }

        await logAuditEvent(req, {
            actionType: 'ACTIVATE',
            tableName: 'groups',
            recordId: Number(groupId)
        });

        return res.status(200).json({ success: true, message: 'Group activated successfully' });
    } catch (error) {
        console.error('Error activating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to activate group' });
    }
};

exports.deleteGroup = async (req, res) => {
    const { groupId } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;
    
    if (!groupId) {
        return res.status(400).json({ success: false, message: 'groupId is required' });
    }

    try {
        // Soft delete the group
        const sql = `UPDATE \`groups\` SET deleted_at = CURRENT_TIMESTAMP, updated_by = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL`;
        const [result] = await db.promise().query(sql, [adminId ? Number(adminId) : null, groupId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found or already deleted' });
        }

        // Soft delete the settings as well
        await db.promise().query('UPDATE group_settings SET deleted_at = CURRENT_TIMESTAMP, updated_by = ?, version = version + 1 WHERE group_id = ? AND deleted_at IS NULL', [adminId ? Number(adminId) : null, groupId]);

        // Log audit event
        await logAuditEvent(req, {
            actionType: 'DELETE',
            tableName: 'groups',
            recordId: Number(groupId)
        });

        return res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete group' });
    }
};

exports.saveGroupMonthlyDetails = async (req, res) => {
    const { groupId, month, year, currentMonthAmount, elathThalupadi, commission, notes, deadlineDate } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

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

    // Convert month/year into collection_period (first of that month)
    const collectionPeriodStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-01`;
    let paymentDueDate = deadlineDate ? new Date(deadlineDate) : null;
    if (paymentDueDate && Number.isNaN(paymentDueDate.getTime())) {
        paymentDueDate = null;
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [[groupRow]] = await connection.query(
            'SELECT id FROM `groups` WHERE id = ? AND deleted_at IS NULL LIMIT 1',
            [groupIdNum],
        );

        if (!groupRow) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Fetch old values if any
        const [[oldDetail]] = await connection.query(
            'SELECT monthly_amount, discount_amount, commission_amount, customer_notes, payment_due_date FROM group_monthly_details WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL',
            [groupIdNum, collectionPeriodStr]
        );

        await connection.query(
            `
            INSERT INTO group_monthly_details
            (group_id, collection_period, monthly_amount, discount_amount, commission_amount, payment_due_date, customer_notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                monthly_amount = VALUES(monthly_amount),
                discount_amount = VALUES(discount_amount),
                commission_amount = VALUES(commission_amount),
                payment_due_date = VALUES(payment_due_date),
                customer_notes = VALUES(customer_notes),
                updated_by = ?,
                version = version + 1,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                groupIdNum,
                collectionPeriodStr,
                Number(currentMonthAmount) || 0,
                Number(elathThalupadi) || 0,
                Number(commission) || 0,
                paymentDueDate,
                notes ? String(notes) : null,
                adminId ? Number(adminId) : null,
                adminId ? Number(adminId) : null,
            ],
        );

        // Update all pending `monthly_collections` rows for this group/month with the requested net amount and due_date
        const netAmount = (Number(currentMonthAmount) || 0) + (Number(commission) || 0) - (Number(elathThalupadi) || 0);
        await connection.query(
            `
            UPDATE monthly_collections 
            SET amount = ?, due_date = COALESCE(?, due_date), updated_by = ?, version = version + 1
            WHERE group_id = ? AND collection_period = ? AND status = 'pending' AND deleted_at IS NULL
            `,
            [netAmount, paymentDueDate, adminId ? Number(adminId) : null, groupIdNum, collectionPeriodStr]
        );

        // Log audit event
        await logAuditEvent(req, {
            actionType: oldDetail ? 'UPDATE' : 'INSERT',
            tableName: 'group_monthly_details',
            recordId: groupIdNum,
            oldValues: oldDetail || null,
            newValues: {
                collection_period: collectionPeriodStr,
                monthly_amount: Number(currentMonthAmount) || 0,
                discount_amount: Number(elathThalupadi) || 0,
                commission_amount: Number(commission) || 0,
                payment_due_date: paymentDueDate,
                customer_notes: notes ? String(notes) : null
            }
        });

        await connection.commit();

        return res.status(200).json({
            success: true,
            data: {
                groupId: groupIdNum,
                month: monthNum,
                year: yearNum,
                currentMonthAmount: Number(currentMonthAmount) || 0,
                elathThalupadi: Number(elathThalupadi) || 0,
                commission: Number(commission) || 0,
                deadlineDate: deadlineDate || null,
            },
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error saving group monthly details:', error);
        return res.status(500).json({ success: false, message: 'Failed to save payment details' });
    } finally {
        connection.release();
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
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

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

    const collectionPeriodStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-01`;

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [[groupRow]] = await connection.query(
            'SELECT id FROM `groups` WHERE id = ? AND deleted_at IS NULL LIMIT 1',
            [groupIdNum],
        );

        if (!groupRow) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if there is an old auction winner record for audit trail
        const [[oldWinner]] = await connection.query(
            'SELECT winner_user_id, winner_name, winner_member_phone, amount_taken, auction_date FROM group_auction_winners WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL',
            [groupIdNum, collectionPeriodStr]
        );

        // Prevent a member from winning multiple times in the same group (reverse auction rules)
        if (winnerUserId) {
            const [[alreadyWon]] = await connection.query(
                'SELECT collection_period FROM group_auction_winners WHERE group_id = ? AND winner_user_id = ? AND collection_period != ? AND deleted_at IS NULL LIMIT 1',
                [groupIdNum, Number(winnerUserId), collectionPeriodStr]
            );
            if (alreadyWon) {
                connection.release();
                return res.status(400).json({ 
                    success: false, 
                    message: 'This member has already won the auction in another cycle/month for this group' 
                });
            }
        }

        await connection.query(
            `
            INSERT INTO group_auction_winners
            (group_id, collection_period, winner_user_id, winner_name, winner_member_phone, amount_taken, auction_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                winner_user_id = VALUES(winner_user_id),
                winner_name = VALUES(winner_name),
                winner_member_phone = VALUES(winner_member_phone),
                amount_taken = VALUES(amount_taken),
                auction_date = VALUES(auction_date),
                updated_by = ?,
                version = version + 1,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                groupIdNum,
                collectionPeriodStr,
                winnerUserId ? Number(winnerUserId) : null,
                String(chitWinnerName),
                chitWinnerMemberId ? String(chitWinnerMemberId) : null,
                amountTakenNum,
                auctionDate,
                adminId ? Number(adminId) : null,
                adminId ? Number(adminId) : null,
            ],
        );

        // Get group details to update status automatically based on duration and cycle count
        const [[groupDetails]] = await connection.query(
            'SELECT duration FROM `groups` WHERE id = ? LIMIT 1',
            [groupIdNum]
        );
        const groupDuration = groupDetails ? Number(groupDetails.duration) : 20;

        const [[winnerCountRow]] = await connection.query(
            'SELECT COUNT(id) AS totalWinners FROM group_auction_winners WHERE group_id = ? AND deleted_at IS NULL',
            [groupIdNum]
        );
        const totalWinnersCount = Number(winnerCountRow.totalWinners);

        if (totalWinnersCount >= groupDuration) {
            await connection.query(
                'UPDATE `groups` SET status = "Completed" WHERE id = ?',
                [groupIdNum]
            );
        } else {
            await connection.query(
                'UPDATE `groups` SET status = "OnGoing" WHERE id = ?',
                [groupIdNum]
            );
        }

        // Audit log
        await logAuditEvent(req, {
            actionType: oldWinner ? 'UPDATE' : 'INSERT',
            tableName: 'group_auction_winners',
            recordId: groupIdNum,
            oldValues: oldWinner || null,
            newValues: {
                collection_period: collectionPeriodStr,
                winner_user_id: winnerUserId ? Number(winnerUserId) : null,
                winner_name: String(chitWinnerName),
                winner_member_phone: chitWinnerMemberId ? String(chitWinnerMemberId) : null,
                amount_taken: amountTakenNum,
                auction_date: auctionDate
            }
        });

        await connection.commit();

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
        await connection.rollback();
        console.error('Error saving auction winner:', error);
        return res.status(500).json({ success: false, message: 'Failed to save auction winner' });
    } finally {
        connection.release();
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

    const collectionPeriodStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-01`;

    try {
        const [[payment]] = await db.promise().query(
            `
            SELECT monthly_amount, discount_amount, commission_amount, customer_notes, payment_due_date
            FROM group_monthly_details
            WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL
            LIMIT 1
            `,
            [groupIdNum, collectionPeriodStr],
        );

        const [[winner]] = await db.promise().query(
            `
            SELECT winner_name, winner_member_phone, amount_taken, auction_date
            FROM group_auction_winners
            WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL
            LIMIT 1
            `,
            [groupIdNum, collectionPeriodStr],
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
                        deadlineDate: payment.payment_due_date ? new Date(payment.payment_due_date).toISOString().split('T')[0] : null,
                        notes: payment.customer_notes || null,
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

exports.renameGroup = async (req, res) => {
    const { groupId, groupName } = req.body;
    const adminId = req.user ? (req.user.userId || req.user.id) : null;

    if (!groupId || !groupName) {
        return res.status(400).json({ success: false, message: 'groupId and groupName are required' });
    }

    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    try {
        const sql = `
            UPDATE \`groups\`
            SET group_name = ?,
                updated_by = ?,
                version = version + 1
            WHERE id = ? AND deleted_at IS NULL
        `;

        const [result] = await db.promise().query(sql, [groupName, adminId, groupIdNum]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found or already deleted' });
        }

        // Log the rename action
        await db.promise().query(
            `INSERT INTO audit_logs 
             (entity_type, entity_id, action, user_id, old_values, new_values, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'GROUP',
                groupIdNum,
                'RENAME',
                adminId,
                JSON.stringify({ note: 'renamed' }),
                JSON.stringify({ group_name: groupName }),
                req.ip || null,
                req.headers['user-agent'] || null
            ]
        );

        res.json({ success: true, message: 'Group renamed successfully' });
    } catch (error) {
        console.error('Error renaming group:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.notifyAuctionMembers = async (req, res) => {
    const { groupId, winnerName, amountTaken, auctionType } = req.body;

    if (!groupId || !winnerName) {
        return res.status(400).json({ success: false, message: 'groupId and winnerName are required' });
    }

    const groupIdNum = Number(groupId);
    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    try {
        // Fetch group name
        const [[groupRow]] = await db.promise().query(
            'SELECT group_name FROM `groups` WHERE id = ? AND deleted_at IS NULL',
            [groupIdNum]
        );
        const groupName = groupRow ? groupRow.group_name : 'Unknown Group';

        // Fetch all group members with their phone numbers
        const [memberRows] = await db.promise().query(
            `SELECT u.id AS userId, u.name, u.phone 
             FROM user_grouping ug 
             LEFT JOIN users u ON u.id = ug.user_id 
             WHERE ug.group_id = ? AND u.deleted_at IS NULL`,
            [groupIdNum]
        );

        if (!memberRows || memberRows.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No members found to notify',
                notified: 0 
            });
        }

        const formattedAmount = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(Number(amountTaken) || 0);

        const typeLabel = auctionType === 'random' ? 'Lucky Draw' : 'Betting Auction';

        let successCount = 0;
        let failCount = 0;

        // Send SMS to each member
        for (const member of memberRows) {
            if (!member.phone) continue;

            try {
                const isWinner = member.name && member.name.toLowerCase() === winnerName.toLowerCase();

                let message;
                if (isWinner) {
                    message = `Congratulations ${member.name}! You have won the ${typeLabel} for group "${groupName}". Amount: ${formattedAmount}. Contact your admin for details. - GDK Chit Fund`;
                } else {
                    message = `${typeLabel} completed for group "${groupName}". Winner: ${winnerName}. Your next installment details will be updated soon. - GDK Chit Fund`;
                }

                await sendSMS(member.phone, message);
                successCount++;
            } catch (smsError) {
                console.error(`[SMS] Failed to notify ${member.name} (${member.phone}):`, smsError.message);
                failCount++;
            }
        }

        console.log(`[Auction Notify] Group ${groupName}: ${successCount} sent, ${failCount} failed out of ${memberRows.length} members`);

        return res.status(200).json({
            success: true,
            message: `Notifications sent to ${successCount} members`,
            notified: successCount,
            failed: failCount,
            total: memberRows.length,
        });
    } catch (error) {
        console.error('Error notifying auction members:', error);
        return res.status(500).json({ success: false, message: 'Failed to send notifications' });
    }
};

exports.getCompletedAuctions = async (req, res) => {
    const groupId = req.query.groupId;
    const groupIdNum = Number(groupId);

    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    try {
        const sqlAuctions = `
            SELECT id AS auction_id, auction_type, initial_amount, created_at, updated_at
            FROM group_auctions
            WHERE group_id = ? AND status = 'ended'
            ORDER BY updated_at DESC
        `;
        const [auctions] = await db.promise().query(sqlAuctions, [groupIdNum]);

        const sqlWinners = `
            SELECT winner_user_id, winner_name, winner_member_phone, amount_taken, auction_date, collection_period, updated_at
            FROM group_auction_winners
            WHERE group_id = ? AND deleted_at IS NULL
            ORDER BY updated_at DESC
        `;
        const [winners] = await db.promise().query(sqlWinners, [groupIdNum]);

        const completedAuctions = winners.map(winner => {
            const wDate = new Date(winner.updated_at).getTime();
            let matchedAuction = auctions.find(a => {
                const aDate = new Date(a.updated_at).getTime();
                return Math.abs(aDate - wDate) < 1000 * 60 * 60 * 24;
            }) || auctions[0];

            return {
                id: winner.collection_period + '-' + winner.winner_name,
                winner_name: winner.winner_name,
                winner_member_phone: winner.winner_member_phone,
                amount_taken: winner.amount_taken,
                auction_date: winner.auction_date,
                initial_amount: matchedAuction ? matchedAuction.initial_amount : null,
                auction_type: matchedAuction ? matchedAuction.auction_type : null,
                collection_period: winner.collection_period
            };
        });

        res.json({ success: true, data: completedAuctions });
    } catch (error) {
        console.error('Error fetching completed auctions:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getPendingAuctionWinner = async (req, res) => {
    const groupIdNum = Number(req.query.groupId);

    if (Number.isNaN(groupIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }

    try {
        const sqlAuction = `
            SELECT id, auction_type, initial_amount, updated_at
            FROM group_auctions
            WHERE group_id = ? AND status = 'ended'
            ORDER BY updated_at DESC
            LIMIT 1
        `;
        const [auctions] = await db.promise().query(sqlAuction, [groupIdNum]);

        if (auctions.length === 0) {
            return res.json({ success: true, data: null });
        }

        const auction = auctions[0];

        // check if this auction is already saved in group_auction_winners for the same date approx
        const [winners] = await db.promise().query(`
            SELECT id, auction_date FROM group_auction_winners
            WHERE group_id = ?
        `, [groupIdNum]);

        const isAlreadySaved = winners.some(w => {
            const diffTime = Math.abs(new Date(w.auction_date).getTime() - new Date(auction.updated_at).getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays <= 2;
        });

        if (isAlreadySaved) {
            return res.json({ success: true, data: null });
        }

        let winnerData = null;

        if (auction.auction_type === 'betting') {
            const [bids] = await db.promise().query(`
                SELECT u.name, u.phone, gab.bid_amount
                FROM group_auction_bids gab
                JOIN users u ON gab.user_id = u.id
                WHERE gab.auction_id = ?
                ORDER BY gab.bid_amount ASC
                LIMIT 1
            `, [auction.id]);

            if (bids.length > 0) {
                winnerData = {
                    chitWinnerName: bids[0].name,
                    chitWinnerMemberId: bids[0].phone,
                    amountTaken: bids[0].bid_amount,
                    datePicked: auction.updated_at
                };
            }
        } else {
            // For random, assuming winner can be derived or it returns blank for now
            winnerData = {
                chitWinnerName: '',
                chitWinnerMemberId: '',
                amountTaken: auction.initial_amount,
                datePicked: auction.updated_at
            };
        }

        return res.json({ success: true, data: winnerData });
    } catch (error) {
        console.error('Error fetching pending auction winner:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getDashboardOverview = async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const currentPeriodStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const [[groupCounts]] = await db.promise().query(`
            SELECT 
                COUNT(CASE WHEN status IN ('Active', 'OnGoing', 'ongoing', 'active') THEN 1 END) AS active_groups,
                COUNT(CASE WHEN status IN ('Completed', 'completed') THEN 1 END) AS completed_groups
            FROM \`groups\`
            WHERE deleted_at IS NULL
        `);

        const [[memberCountRow]] = await db.promise().query(`
            SELECT COUNT(DISTINCT user_id) AS total_members
            FROM user_grouping ug
            JOIN \`groups\` g ON ug.group_id = g.id
            WHERE g.deleted_at IS NULL AND g.status IN ('Active', 'OnGoing', 'ongoing', 'active')
        `);

        const [[collectionRow]] = await db.promise().query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_collected,
                COALESCE(SUM(amount), 0) AS total_target,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
                COUNT(CASE WHEN status IN ('pending', 'overdue') THEN 1 END) AS pending_count
            FROM monthly_collections
            WHERE collection_period = ? AND deleted_at IS NULL
        `, [currentPeriodStr]);

        const [[overdueRow]] = await db.promise().query(`
            SELECT 
                COALESCE(SUM(amount), 0) AS overdue_amount,
                COUNT(DISTINCT user_id) AS overdue_count
            FROM monthly_collections
            WHERE (status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE))
              AND deleted_at IS NULL
        `);

        const [unfilledPaymentGroups] = await db.promise().query(`
            SELECT g.id, g.group_name
            FROM \`groups\` g
            LEFT JOIN group_monthly_details gmd ON g.id = gmd.group_id 
                AND gmd.collection_period = ? AND gmd.deleted_at IS NULL
            WHERE g.deleted_at IS NULL 
              AND g.status IN ('Active', 'OnGoing', 'ongoing', 'active')
              AND gmd.id IS NULL
        `, [currentPeriodStr]);

        const [pendingAuctionWinnerGroups] = await db.promise().query(`
            SELECT g.id, g.group_name
            FROM \`groups\` g
            LEFT JOIN group_auction_winners gaw ON g.id = gaw.group_id 
                AND gaw.collection_period = ? AND gaw.deleted_at IS NULL
            WHERE g.deleted_at IS NULL 
              AND g.status IN ('Active', 'OnGoing', 'ongoing', 'active')
              AND gaw.id IS NULL
        `, [currentPeriodStr]);

        const [pendingMemberPayments] = await db.promise().query(`
            SELECT 
                mc.id,
                mc.group_id,
                mc.user_id,
                mc.amount,
                mc.status,
                mc.due_date,
                g.group_name,
                u.name AS user_name,
                u.phone AS user_phone,
                GREATEST(0, DATEDIFF(CURRENT_DATE, mc.due_date)) AS days_overdue
            FROM monthly_collections mc
            JOIN \`groups\` g ON mc.group_id = g.id
            JOIN users u ON mc.user_id = u.id
            WHERE mc.status IN ('pending', 'overdue')
              AND mc.deleted_at IS NULL
              AND g.deleted_at IS NULL
              AND g.status IN ('Active', 'OnGoing', 'ongoing', 'active')
              AND u.deleted_at IS NULL
            ORDER BY mc.due_date ASC
            LIMIT 10
        `);

        const [recentAuctionWinners] = await db.promise().query(`
            SELECT 
                gaw.id,
                g.group_name,
                gaw.winner_name,
                gaw.winner_member_phone,
                gaw.amount_taken,
                gaw.auction_date,
                gaw.collection_period
            FROM group_auction_winners gaw
            JOIN \`groups\` g ON gaw.group_id = g.id
            WHERE gaw.deleted_at IS NULL AND g.deleted_at IS NULL
            ORDER BY gaw.auction_date DESC, gaw.created_at DESC
            LIMIT 10
        `);

        const [upcomingAuctions] = await db.promise().query(`
            SELECT id, group_name, start_date, group_amount
            FROM \`groups\`
            WHERE deleted_at IS NULL 
              AND status IN ('Active', 'OnGoing', 'ongoing', 'active', 'not-started', 'not started')
            ORDER BY start_date ASC
            LIMIT 5
        `);

        const [recentActivities] = await db.promise().query(`
            SELECT 
                mc.id,
                'payment' AS type,
                u.name AS user_name,
                g.group_name,
                mc.amount,
                mc.status,
                mc.updated_at
            FROM monthly_collections mc
            JOIN \`groups\` g ON mc.group_id = g.id
            JOIN users u ON mc.user_id = u.id
            WHERE mc.deleted_at IS NULL
            ORDER BY mc.updated_at DESC
            LIMIT 6
        `);

        const [[nextMonthRow]] = await db.promise().query(`
            SELECT COALESCE(SUM(g.group_amount / GREATEST(1, g.duration)), 0) AS projected_target
            FROM \`groups\` g
            WHERE g.deleted_at IS NULL AND g.status IN ('Active', 'OnGoing', 'ongoing', 'active')
        `);

        const monthlyTargetNum = Number(collectionRow?.total_target) || (Number(nextMonthRow?.projected_target) || 5000000);
        const monthlyCollectedNum = Number(collectionRow?.total_collected) || 0;
        const collectionRate = monthlyTargetNum > 0 ? ((monthlyCollectedNum / monthlyTargetNum) * 100).toFixed(1) : '0.0';

        const paidMembersCount = Number(collectionRow?.paid_count) || 0;
        const totalMembersCount = Number(memberCountRow?.total_members) || 0;
        const pendingMembersCount = collectionRow?.pending_count > 0
            ? Number(collectionRow.pending_count)
            : Math.max(0, totalMembersCount - paidMembersCount);
        const overdueMembersCount = Number(overdueRow?.overdue_count) || 0;

        return res.status(200).json({
            success: true,
            data: {
                metrics: {
                    activeGroups: groupCounts?.active_groups || 0,
                    completedGroups: groupCounts?.completed_groups || 0,
                    totalMembers: totalMembersCount,
                    monthlyTarget: monthlyTargetNum,
                    monthlyCollected: monthlyCollectedNum,
                    collectionRate: collectionRate,
                    paidMembers: paidMembersCount,
                    pendingMembers: pendingMembersCount,
                    overdueAmount: Number(overdueRow?.overdue_amount) || 0,
                    overdueCount: overdueMembersCount,
                },
                actionRequired: {
                    unfilledPaymentGroups: unfilledPaymentGroups || [],
                    pendingAuctionWinnerGroups: pendingAuctionWinnerGroups || [],
                    pendingMemberPayments: pendingMemberPayments || [],
                },
                auctionsHub: {
                    recentWinners: recentAuctionWinners || [],
                    upcomingAuctions: upcomingAuctions || [],
                },
                recentActivities: recentActivities || [],
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};