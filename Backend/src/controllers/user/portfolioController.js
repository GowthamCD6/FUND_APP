const db = require('../../config/db');

// Helper to reliably parse numbers
const toSafeNumber = (val, fallback = 0) => {
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
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
          WHERE mc.group_id = g.id AND mc.user_id = ug.user_id AND mc.status = 'paid'
        ) as total_paid
      FROM user_grouping ug
      INNER JOIN \`groups\` g ON ug.group_id = g.id
      WHERE ug.user_id = ?
      ORDER BY g.created_at DESC
      `,
      [userId]
    );

    const chitGroups = rows.map((row) => {
      const reportStatus = row.status === 'completed' ? 'completed' : 'pending';
      const totalMembers = toSafeNumber(row.total_members, 1);
      const duration = toSafeNumber(row.duration, totalMembers);
      const safeDuration = duration > 0 ? duration : 1;
      const monthlyAmount = Math.round(toSafeNumber(row.group_amount, 0) / safeDuration);

      let currentMonthVal = 0;
      if (row.start_date) {
        const startDt = new Date(row.start_date);
        const now = new Date();
        const elapsed = (now.getFullYear() - startDt.getFullYear()) * 12 +
                        (now.getMonth() - startDt.getMonth()) + 1;
        currentMonthVal = Math.max(0, Math.min(safeDuration, elapsed));
      }

      const completedCycles = reportStatus === 'completed' ? safeDuration : currentMonthVal;
      
      let estimatedPayDate = row.end_date;
      if (!estimatedPayDate && row.start_date) {
         const d = new Date(row.start_date);
         d.setMonth(d.getMonth() + safeDuration);
         estimatedPayDate = d.toISOString().split('T')[0];
      }

      return {
        id: row.id,
        groupId: `GRP-${row.id}`,
        groupName: row.group_name,
        investmentAmount: toSafeNumber(row.group_amount, 0),
        totalPaid: toSafeNumber(row.total_paid, 0),
        totalMembers,
        currentMembers: toSafeNumber(row.current_members, 0),
        startDate: row.start_date || null,
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

exports.getNotifications = async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
    const [rows] = await db.promise().query(
      `
      SELECT 
        g.group_name, 
        g.start_date,
        g.duration
      FROM user_grouping ug
      INNER JOIN \`groups\` g ON ug.group_id = g.id
      WHERE ug.user_id = ? AND g.status = 'OnGoing'
      `,
      [userId]
    );

    const notifications = [];

    rows.forEach(group => {
      if (group.start_date) {
        const st = new Date(group.start_date);
        const now = new Date();
        now.setHours(0,0,0,0);
        
        let elapsedMonths = (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth());
        if (now.getDate() >= st.getDate()) {
            elapsedMonths += 1;
        }
        
        const maxDuration = group.duration || 1;
        if (elapsedMonths <= maxDuration) {
          const nextDueDate = new Date(st.getFullYear(), st.getMonth() + elapsedMonths, st.getDate());
          nextDueDate.setHours(0,0,0,0);
          
          const timeDiff = nextDueDate.getTime() - now.getTime();
          const daysAway = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysAway === 3) {
            notifications.push({
              id: `notif-${group.group_name}-3`,
              type: 'warning',
              title: 'Upcoming Payment Reminder',
              message: `The next cycle for "${group.group_name}" is due in exactly 3 days (${nextDueDate.toLocaleDateString()}). Please make sure you're prepared.`,
              date: new Date().toISOString()
            });
          } else if (daysAway === 0) {
            notifications.push({
              id: `notif-${group.group_name}-0`,
              type: 'danger',
              title: 'Payment Due Today!',
              message: `The payment cycle for "${group.group_name}" is due today. Head to your group dashboard to proceed.`,
              date: new Date().toISOString()
            });
          }
        }
      }
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getGroupMonthlyInfo = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  let rawGroupId = req.params.groupId;
  if (rawGroupId && rawGroupId.startsWith('GRP-')) {
    rawGroupId = rawGroupId.split('-')[1];
  }

  try {
    const [payments] = await db.promise().query(
      `SELECT month, year, amount, status, due_date, paid_date, receipt_number 
       FROM monthly_collections 
       WHERE group_id = ? AND user_id = ?`,
      [rawGroupId, userId]
    );

    const [auctions] = await db.promise().query(
      `SELECT month, year, winner_name, amount_taken, auction_date 
       FROM group_auction_winners 
       WHERE group_id = ?`,
      [rawGroupId]
    );

    const [monthlyDetails] = await db.promise().query(
      `SELECT month, year, monthly_amount, discount_amount, commission_amount, notes 
       FROM group_monthly_details 
       WHERE group_id = ?`,
      [rawGroupId]
    );

    const monthlyData = {};
    const monthNamesArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Map all group monthly details as the BASE source of truth for the group
    monthlyDetails.forEach(d => {
      const monthDate = new Date(d.year, d.month, 1);
      const key = `${monthNamesArray[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      
      monthlyData[key] = {
        status: 'pending', // Default
        paymentAmount: Number(d.monthly_amount) || 0,
        discount: Number(d.discount_amount) || 0,
        commission: Number(d.commission_amount) || 0,
        netAmount: (Number(d.monthly_amount) || 0) + (Number(d.commission_amount) || 0) - (Number(d.discount_amount) || 0),
        dueDate: null,
        paidDate: null,
        daysPending: 0,
        auctionWinner: 'N/A',
        amountTaken: 0,
        auctionDate: null
      };
    });

    // 2. Overwrite with actual user payments (user-specific details)
    payments.forEach(p => {
      const monthDate = new Date(p.year, p.month, 1);
      const key = `${monthNamesArray[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      
      const paymentAmount = Number(p.amount) || 0;
      
      if (!monthlyData[key]) {
         monthlyData[key] = {
            status: p.status,
            paymentAmount: paymentAmount,
            discount: 0,
            commission: 0,
            netAmount: paymentAmount,
            dueDate: null,
            paidDate: null,
            daysPending: 0,
            auctionWinner: 'N/A',
            amountTaken: 0,
            auctionDate: null
         };
      }

      let daysPending = 0;
      if (p.status === 'pending' && p.due_date) {
        const due = new Date(p.due_date);
        const diff = due.getTime() - new Date().getTime();
        if (diff > 0) {
            daysPending = Math.floor(diff / (1000 * 3600 * 24));
        }
      }

      monthlyData[key].status = p.status;
      monthlyData[key].paymentAmount = paymentAmount > 0 ? paymentAmount : monthlyData[key].paymentAmount;
      monthlyData[key].dueDate = p.due_date ? new Date(p.due_date).toISOString().split('T')[0] : null;
      monthlyData[key].paidDate = p.paid_date ? new Date(p.paid_date).toISOString().split('T')[0] : null;
      monthlyData[key].daysPending = daysPending;
    });

    // 3. Overwrite with auctions
    auctions.forEach(a => {
      const monthDate = new Date(a.year, a.month, 1);
      const key = `${monthNamesArray[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
           status: 'pending',
           paymentAmount: 0,
           discount: 0,
           commission: 0,
           netAmount: 0,
           dueDate: null,
           paidDate: null,
           daysPending: 0
        };
      }
      
      monthlyData[key].auctionWinner = a.winner_name || 'N/A';
      monthlyData[key].amountTaken = Number(a.amount_taken) || 0;
      monthlyData[key].auctionDate = a.auction_date ? new Date(a.auction_date).toISOString().split('T')[0] : null;
    });

    return res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Error fetching group monthly info:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
