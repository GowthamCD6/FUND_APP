const db = require('../../config/db');

exports.getMemberPaymentHistory = async (req, res) => {
    const { groupId, userId } = req.query;

    if (!groupId || !userId) {
        return res.status(400).json({ success: false, message: 'groupId and userId are required' });
    }

    try {
        const sql = `
            SELECT 
                mc.id,
                MONTH(mc.collection_period) - 1 AS month,
                YEAR(mc.collection_period) AS year,
                mc.amount,
                mc.status,
                DATE_FORMAT(mc.due_date, '%Y-%m-%d') AS due_date,
                DATE_FORMAT(mc.paid_date, '%Y-%m-%d %H:%i:%s') AS paid_date,
                mc.receipt_number,
                g.group_name,
                u.name as user_name
            FROM monthly_collections mc
            JOIN \`groups\` g ON mc.group_id = g.id
            JOIN users u ON mc.user_id = u.id
            WHERE mc.group_id = ? AND mc.user_id = ?
              AND mc.deleted_at IS NULL
              AND g.deleted_at IS NULL
              AND u.deleted_at IS NULL
            ORDER BY mc.collection_period DESC
        `;

        const [rows] = await db.promise().query(sql, [groupId, userId]);

        const paymentHistory = rows.map(row => ({
            ...row,
            monthName: new Date(row.year, row.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
        }));

        return res.status(200).json({ success: true, data: paymentHistory });
    } catch (error) {
        console.error('Error fetching member payment history:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
};

exports.getGlobalDefaulters = async (req, res) => {
    try {
        // 1. Fetch explicitly recorded pending/overdue collections
        const recordedSql = `
            SELECT 
                mc.id,
                mc.group_id,
                mc.user_id,
                MONTH(mc.collection_period) - 1 AS month,
                YEAR(mc.collection_period) AS year,
                mc.amount,
                mc.status,
                DATE_FORMAT(mc.due_date, '%Y-%m-%d') as due_date,
                g.group_name,
                u.name as user_name,
                u.phone as user_phone,
                DATEDIFF(CURRENT_DATE, mc.due_date) as days_overdue
            FROM monthly_collections mc
            JOIN \`groups\` g ON mc.group_id = g.id
            JOIN users u ON mc.user_id = u.id
            WHERE mc.status IN ('pending', 'overdue')
              AND mc.deleted_at IS NULL
              AND g.deleted_at IS NULL
              AND g.status IN ('active', 'ongoing')
              AND u.deleted_at IS NULL
            ORDER BY mc.due_date ASC
        `;

        const [recordedRows] = await db.promise().query(recordedSql);

        // 2. Fetch all active groups and their enrolled members to compute current dues for unrecorded months
        const [activeGroups] = await db.promise().query(`
            SELECT id, group_name, group_amount, duration, start_date
            FROM \`groups\`
            WHERE deleted_at IS NULL AND status IN ('active', 'ongoing')
        `);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        const combinedList = [...recordedRows];
        const existingKeys = new Set(
            recordedRows.map(r => `${r.group_id}_${r.user_id}_${r.year}_${r.month}`)
        );

        // Check each active group's members
        for (const g of activeGroups) {
            const [members] = await db.promise().query(`
                SELECT u.id as user_id, u.name as user_name, u.phone as user_phone
                FROM user_grouping ug
                JOIN users u ON ug.user_id = u.id
                WHERE ug.group_id = ? AND u.deleted_at IS NULL
            `, [g.id]);

            const totalCycles = Number(g.duration) || 20;
            const monthlyAmount = totalCycles > 0 ? Math.round(Number(g.group_amount || 0) / totalCycles) : 0;
            const startDate = g.start_date ? new Date(g.start_date) : new Date();

            for (const member of members) {
                // Check past cycles up to current month
                for (let idx = 0; idx < totalCycles; idx++) {
                    const cycleDate = new Date(startDate.getFullYear(), startDate.getMonth() + idx, 1);
                    const cMonth = cycleDate.getMonth();
                    const cYear = cycleDate.getFullYear();

                    if (cYear > currentYear || (cYear === currentYear && cMonth > currentMonth)) {
                        break;
                    }

                    const key = `${g.id}_${member.user_id}_${cYear}_${cMonth}`;
                    if (!existingKeys.has(key)) {
                        // Check if paid in database
                        const [[paidRow]] = await db.promise().query(`
                            SELECT id, status FROM monthly_collections
                            WHERE group_id = ? AND user_id = ? 
                              AND MONTH(collection_period) = ? AND YEAR(collection_period) = ?
                              AND deleted_at IS NULL
                            LIMIT 1
                        `, [g.id, member.user_id, cMonth + 1, cYear]);

                        if (!paidRow || paidRow.status !== 'paid') {
                            const isPastMonth = cYear < currentYear || (cYear === currentYear && cMonth < currentMonth);
                            const dueDateStr = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-15`;
                            const dueDate = new Date(cYear, cMonth, 15);
                            const isOverdue = isPastMonth || (cYear === currentYear && cMonth === currentMonth && currentDate > 15);
                            const daysDiff = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

                            combinedList.push({
                                id: paidRow ? paidRow.id : `gen_${g.id}_${member.user_id}_${cYear}_${cMonth}`,
                                group_id: g.id,
                                user_id: member.user_id,
                                month: cMonth,
                                year: cYear,
                                amount: monthlyAmount,
                                status: isOverdue ? 'overdue' : 'pending',
                                due_date: dueDateStr,
                                group_name: g.group_name,
                                user_name: member.user_name,
                                user_phone: member.user_phone,
                                days_overdue: isOverdue ? daysDiff : 0,
                            });
                            existingKeys.add(key);
                        }
                    }
                }
            }
        }

        const defaulters = combinedList.map(row => ({
            ...row,
            monthName: new Date(row.year, row.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
        }));

        // Sort by overdue days desc, then due_date asc
        defaulters.sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (b.status === 'overdue' && a.status !== 'overdue') return 1;
            return new Date(a.due_date) - new Date(b.due_date);
        });

        return res.status(200).json({ success: true, data: defaulters });
    } catch (error) {
        console.error('Error fetching global defaulters:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch defaulters' });
    }
};
