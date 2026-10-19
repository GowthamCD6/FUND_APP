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

const getElapsedMonths = (startDateStr) => {
  if (!startDateStr) return 0;
  const parts = startDateStr.split('-');
  if (parts.length < 2) return 0;
  
  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  
  const yearDiff = todayYear - startYear;
  const monthDiff = todayMonth - startMonth;
  const totalMonthDiff = yearDiff * 12 + monthDiff;
  
  if (totalMonthDiff < 0) {
    return 0; // Future start date
  }
  
  return totalMonthDiff + 1; // Include the starting month
};

exports.getPortfolio = async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id) : null;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing user credentials' });
  }

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
        ) as latest_status,
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM monthly_collections mc
          WHERE mc.group_id = g.id AND LOWER(mc.status) = 'paid' AND mc.deleted_at IS NULL
        ) as group_collected_amount,
        (
          SELECT COUNT(id)
          FROM group_auction_winners gaw
          WHERE gaw.group_id = g.id AND gaw.deleted_at IS NULL
        ) as group_completed_cycles
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
      } else if (row.start_date) {
          const startDateStr = formatDateLocal(row.start_date);
          const elapsed = Math.min(safeDuration, getElapsedMonths(startDateStr));
          if (elapsed > 0) {
              if (paidCycles >= elapsed) {
                  reportStatus = 'paid';
              } else {
                  reportStatus = (row.latest_status && row.latest_status.toLowerCase() === 'overdue') ? 'overdue' : 'pending';
              }
          } else {
              // Group hasn't started yet
              reportStatus = (paidCycles > 0) ? 'paid' : 'pending';
          }
      } else if (row.latest_status) {
          reportStatus = (row.latest_status.toLowerCase() === 'paid') ? 'paid' : 'pending';
      }

      const getOrdinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      let currentMonthNum = 1;
      let currentMonthName = 'Month 1';
      if (row.start_date) {
        const st = new Date(row.start_date);
        st.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = (today.getFullYear() - st.getFullYear()) * 12 + (today.getMonth() - st.getMonth()) + 1;
        currentMonthNum = Math.min(safeDuration, Math.max(1, diff));

        const monthNamesArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const cycleDate = new Date(st.getFullYear(), st.getMonth() + (currentMonthNum - 1), 1);
        currentMonthName = `${monthNamesArray[cycleDate.getMonth()]} ${cycleDate.getFullYear()}`;
      }
      const currentMonthDisplay = `${getOrdinal(currentMonthNum)} Month of ${safeDuration}`;

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
        currentMonth: currentMonthNum,
        currentMonthNum,
        currentMonthDisplay,
        currentMonthName,
        paidCycles,
        completedCycles: paidCycles,
        totalMonths: safeDuration,
        duration: safeDuration,
        groupCollectedAmount: toSafeNumber(row.group_collected_amount, 0),
        groupCompletedCycles: Number(row.group_completed_cycles) || 0,
      };
    });

    res.json({ success: true, data: chitGroups });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
