const db = require('../../config/db');
const { groupEncryptAES, groupDecryptAES } = require('../../utils/decryptAES');
const { logAuditEvent } = require('../../utils/auditLogger');

// Group Creation
exports.createGroup = async (req, res) => {
    const { groupCode, groupName, totalMembers, groupAmount, duration, startDate } = req.body;
    const creatorId = req.user ? (req.user.userId || req.user.id) : null;

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const start = startDate
            ? new Date(startDate.split('/').reverse().join('-'))
            : null;

        const generateGroupId = () => {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `GRP${timestamp}${random}`;
        };
        const groupId = groupCode || generateGroupId();

        const end_date = start && duration
            ? new Date(start.getFullYear(), start.getMonth() + Number(duration), start.getDate())
            : null;

        const plainGroupCode = String(groupId);
        const finalGroupCode = groupEncryptAES(plainGroupCode);

        const sql = `
            INSERT INTO \`groups\`
            (group_code, group_name, total_members, group_amount, duration, start_date, end_date, created_by)
            VALUES (?,?,?,?,?,?,?,?)
        `;
        const params = [
            finalGroupCode,
            groupName,
            Number(totalMembers) || null,
            Number(groupAmount) || null,
            Number(duration) || null,
            start,
            end_date,
            creatorId ? Number(creatorId) : null,
        ];

        const [result] = await connection.query(sql, params);
        const insertId = result.insertId;

        // Auto-create default settings in group_settings
        const settingsSql = `
            INSERT INTO group_settings 
            (group_id, max_members, created_by)
            VALUES (?, ?, ?)
        `;
        await connection.query(settingsSql, [
            insertId,
            Number(totalMembers) || 20,
            creatorId ? Number(creatorId) : null
        ]);

        // Auto-create group broadcast chat room
        const chatSql = `
            INSERT INTO chat_rooms (type, group_id) 
            VALUES ('group_broadcast', ?)
        `;
        await connection.query(chatSql, [insertId]);

        // Log the audit event
        await logAuditEvent(req, {
            actionType: 'INSERT',
            tableName: 'groups',
            recordId: insertId,
            newValues: { groupName, totalMembers, groupAmount, duration, start_date: start }
        });

        await connection.commit();

        const groupData = {
            id: insertId,
            group_code: plainGroupCode,
            group_name: groupName
        };

        return res.status(201).json({ success: true, data: groupData });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating group:', error);
        return res.status(500).json({ success: false, message: 'Failed to create group' });
    } finally {
        connection.release();
    }
};

// Fetch Groups for Manage Groups Page
exports.getGroups = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT 
                g.*,
                ROUND(COALESCE(g.group_amount / NULLIF(g.duration, 0), 0), 2) AS monthly_amount,
                COALESCE((SELECT COUNT(id) FROM group_auction_winners WHERE group_id = g.id AND deleted_at IS NULL), 0) AS completedCycles,
                COALESCE((SELECT SUM(amount) FROM monthly_collections WHERE group_id = g.id AND status = 'paid' AND deleted_at IS NULL), 0) AS collectedAmount
            FROM \`groups\` g 
            WHERE g.deleted_at IS NULL
            ORDER BY g.created_at DESC
        `);

        console.log('Fetched groups from DB:', rows ? rows.length : 0, 'groups');

        if (!rows || rows.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        rows.forEach(group => {
            // Auto activation - Check if group should be activated
            if (group.status === 'Not Started' && group.start_date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const stDate = new Date(group.start_date);
                stDate.setHours(0, 0, 0, 0);
                
                console.log(`Group ${group.id}: Status=${group.status}, StartDate=${stDate.toISOString()}, Today=${today.toISOString()}`);
                
                if (stDate <= today) {
                    console.log(`Auto-activating group ${group.id}`);
                    group.status = 'OnGoing';
                    db.promise().query("UPDATE `groups` SET status = 'OnGoing' WHERE id = ?", [group.id]).catch(console.error);
                }
            }

            try {
                // Mapping structure
                group.name = group.group_name;
                group.totalMembers = group.total_members || 0;
                group.groupAmount = group.group_amount || 0;
                group.monthlyAmount = group.monthly_amount || 0;
                group.totalCycles = group.total_months || group.duration || 12;
                group.members_count = group.current_members || group.total_members || 0;
                group.currentMembers = group.current_members;
                group.startDate = group.start_date;
                group.members = [];
                
                // --- Dynamic Month & Next Due Date Logic ---
                const duration = Math.max(1, Number(group.duration) || Number(group.total_members) || 20);
                group.duration = duration;
                group.totalCycles = duration;

                const getOrdinalSuffix = (n) => {
                    const s = ['th', 'st', 'nd', 'rd'];
                    const v = n % 100;
                    return n + (s[(v - 20) % 10] || s[v] || s[0]);
                };

                if (group.start_date) {
                    const st = new Date(group.start_date);
                    const now = new Date();
                    st.setHours(0, 0, 0, 0);
                    now.setHours(0, 0, 0, 0);

                    let elapsedMonths = (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth());
                    if (now.getDate() >= st.getDate()) {
                        elapsedMonths += 1;
                    }
                    const maxDuration = duration;
                    const clampedMonths = Math.min(Math.max(1, elapsedMonths), maxDuration);
                    const nextDueDate = new Date(st.getFullYear(), st.getMonth() + clampedMonths, st.getDate());
                    
                    const n_dd = String(nextDueDate.getDate()).padStart(2, '0');
                    const n_mm = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                    const n_yyyy = nextDueDate.getFullYear();
                    group.nextDueDate = `${n_yyyy}-${n_mm}-${n_dd}`;

                    if (now < st) {
                        group.currentMonthNum = 1;
                        group.currentMonthOrdinal = '1st Month';
                        group.currentMonthDisplay = `Upcoming (1st Month of ${duration})`;
                        group.monthStatus = 'upcoming';
                    } else if (elapsedMonths > duration) {
                        group.currentMonthNum = duration;
                        group.currentMonthOrdinal = `${getOrdinalSuffix(duration)} Month`;
                        group.currentMonthDisplay = `Completed (${getOrdinalSuffix(duration)} of ${duration})`;
                        group.monthStatus = 'completed';
                    } else {
                        const mNum = Math.max(1, elapsedMonths);
                        const ord = `${getOrdinalSuffix(mNum)} Month`;
                        group.currentMonthNum = mNum;
                        group.currentMonthOrdinal = ord;
                        group.currentMonthDisplay = `${ord} of ${duration}`;
                        group.monthStatus = 'active';
                    }
                } else {
                    group.nextDueDate = null;
                    group.currentMonthNum = 1;
                    group.currentMonthOrdinal = '1st Month';
                    group.currentMonthDisplay = `1st Month of ${duration}`;
                    group.monthStatus = 'not-started';
                }

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
                // pass
            }
        });
        
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('ERROR in getGroups:', error.message, error.stack);
        return res.status(500).json({ success: false, message: 'Failed to fetch groups: ' + error.message });
    }
};