const db = require('../../config/db');

const toSafeNumber = (val, fallback = 0) => {
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
};

const formatDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

exports.getPortfolio = async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
    const [rows] = await db.promise().query(
      `
      SELECT 
        g.id, 
        g.group_name, 
        g.group_amount, 
        g.total_members,
        g.current_members,
        g.duration, 
        g.start_date, 
        g.end_date, 
        g.status,
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM monthly_collections mc
          WHERE mc.group_id = g.id AND mc.user_id = ug.user_id AND LOWER(mc.status) = 'paid' AND mc.deleted_at IS NULL
        ) as total_paid,
        (
          SELECT COALESCE(COUNT(*), 0)
          FROM monthly_collections mc
          WHERE mc.group_id = g.id AND mc.user_id = ug.user_id AND LOWER(mc.status) = 'paid' AND mc.deleted_at IS NULL
        ) as paid_cycles,
        (
          SELECT mc.status
          FROM monthly_collections mc
          WHERE mc.group_id = g.id AND mc.user_id = ug.user_id AND mc.deleted_at IS NULL
          ORDER BY mc.collection_period DESC
          LIMIT 1
        ) as latest_status
      FROM user_grouping ug
      INNER JOIN \`groups\` g ON ug.group_id = g.id
      INNER JOIN users u ON ug.user_id = u.id
      WHERE ug.user_id = ? AND g.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY g.created_at DESC
      `,
      [userId]
    );

    const chitGroups = rows.map((row) => {
      const totalMembers = toSafeNumber(row.total_members, 1);
      const duration = toSafeNumber(row.duration, totalMembers);
      const safeDuration = duration > 0 ? duration : 1;
      const monthlyAmount = Math.round(toSafeNumber(row.group_amount, 0) / safeDuration);
      const paidCycles = Math.max(0, Math.min(safeDuration, Number(row.paid_cycles) || 0));
      const requiredPayment = toSafeNumber(row.group_amount, 0) || monthlyAmount * safeDuration;

      const isFullyPaid = paidCycles >= safeDuration;
      
      let reportStatus = 'pending';
      if (isFullyPaid) {
          reportStatus = 'completed';
      } else if (row.latest_status) {
          reportStatus = (row.latest_status.toLowerCase() === 'paid') ? 'paid' : 'pending';
      }

      const completedCycles = isFullyPaid ? safeDuration : paidCycles;
      
      let estimatedPayDate = row.end_date;
      if (!estimatedPayDate && row.start_date) {
         const d = new Date(row.start_date);
         d.setMonth(d.getMonth() + safeDuration);
         estimatedPayDate = formatDateLocal(d);
      } else if (estimatedPayDate) {
         estimatedPayDate = formatDateLocal(estimatedPayDate);
      }

      return {
        id: row.id,
        groupId: 'GRP-' + row.id,
        groupName: row.group_name,
        investmentAmount: toSafeNumber(row.group_amount, 0),
        totalPaid: toSafeNumber(row.total_paid, 0),
        totalMembers,
        currentMembers: toSafeNumber(row.current_members, 0),
        startDate: row.start_date ? formatDateLocal(row.start_date) : null,
        estimatedPayDate: estimatedPayDate || 'N/A',
        paymentStatus: reportStatus,
        monthlyContribution: monthlyAmount,
        currentMonth: completedCycles,
        totalMonths: safeDuration,
      };
    });

    res.json({ success: true, data: chitGroups });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
