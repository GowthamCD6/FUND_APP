const db = require('../../config/db');
const { groupEncryptAES, groupDecryptAES } = require('../../utils/decryptAES');
const { logAuditEvent } = require('../../utils/auditLogger');

// Group Creation
exports.createGroup = async (req, res) => {
    const { groupName, totalMembers, groupAmount, duration, startDate } = req.body;
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
        const groupId = generateGroupId();

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
                COALESCE((SELECT COUNT(id) FROM group_auction_winners WHERE group_id = g.id AND deleted_at IS NULL), 0) AS completedCycles,
                COALESCE((SELECT SUM(amount) FROM monthly_collections WHERE group_id = g.id AND status = 'paid' AND deleted_at IS NULL), 0) AS collectedAmount
            FROM \`groups\` g 
            WHERE g.deleted_at IS NULL
            ORDER BY g.created_at DESC
        `);

        if (!rows || rows.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        rows.forEach(group => {
            // Auto activation ...
            if (group.status === 'not-started' || group.status === 'not started') {
                if (group.start_date) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const stDate = new Date(group.start_date);
                    if (stDate <= today) {
                        group.status = 'OnGoing';
                        db.promise().query("UPDATE `groups` SET status = 'OnGoing' WHERE id = ?", [group.id]).catch(console.error);
                    }
                }
            }

            try {
                // Mapping structure
                group.name = group.group_name;
                group.totalMembers = group.total_members;
                group.groupAmount = group.group_amount;
                group.currentMembers = group.current_members;
                group.startDate = group.start_date;
                
                // --- Dynamic Next Due Date Logic ---
                if (group.start_date) {
                    const st = new Date(group.start_date);
                    const now = new Date();
                    let elapsedMonths = (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth());
                    if (now.getDate() >= st.getDate()) {
                        elapsedMonths += 1;
                    }
                    const maxDuration = group.duration || group.total_members || 1;
                    elapsedMonths = Math.min(elapsedMonths, maxDuration);
                    const nextDueDate = new Date(st.getFullYear(), st.getMonth() + elapsedMonths, st.getDate());
                    
                    const n_dd = String(nextDueDate.getDate()).padStart(2, '0');
                    const n_mm = String(nextDueDate.getMonth() + 1).padStart(2, '0');
                    const n_yyyy = nextDueDate.getFullYear();
                    group.nextDueDate = `${n_yyyy}-${n_mm}-${n_dd}`;
                } else {
                    group.nextDueDate = null;
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
        console.error('Error fetching groups:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
};