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
                mc.due_date,
                mc.paid_date,
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
