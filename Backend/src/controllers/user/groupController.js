const db = require('../../config/db');

const formatDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
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
      
      const net = (Number(d.monthly_amount) || 0) + (Number(d.commission_amount) || 0) - (Number(d.discount_amount) || 0);
      monthlyData[key] = {
        status: 'pending',
        paymentAmount: Number(d.monthly_amount) || 0, 
        discount: Number(d.discount_amount) || 0,
        commission: Number(d.commission_amount) || 0,
        netAmount: net,
        dueDate: null,
        paidDate: null,
        daysPending: 0,
        auctionWinner: 'N/A',
        amountTaken: 0,
        auctionDate: null,
      };
    });

    // 2. Overwrite with actual user payments (user-specific details)
    payments.forEach(p => {
      const monthDate = new Date(p.year, p.month, 1);
      const key = `${monthNamesArray[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      const userCollectionAmount = Number(p.amount) || 0;

      if (!monthlyData[key]) {
        // Fallback if no admin details strictly exist yet
        monthlyData[key] = {
          status: p.status,
          paymentAmount: userCollectionAmount > 0 ? userCollectionAmount : null,
          discount: 0,
          commission: 0,
          netAmount: userCollectionAmount,
          dueDate: null,
          paidDate: null,
          daysPending: 0,
          auctionWinner: 'N/A',
          amountTaken: 0,
          auctionDate: null,
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
      // Do not overwrite paymentAmount with user's net collection amount, as paymentAmount dictates the UI's base amount
      if (monthlyData[key].paymentAmount == null && userCollectionAmount > 0) {
        monthlyData[key].paymentAmount = userCollectionAmount;
      }
      monthlyData[key].dueDate = p.due_date ? formatDateLocal(p.due_date) : monthlyData[key].dueDate;
      monthlyData[key].paidDate = p.paid_date ? formatDateLocal(p.paid_date) : monthlyData[key].paidDate;
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
          daysPending: 0,
          auctionWinner: 'N/A',
          amountTaken: 0,
          auctionDate: null,
        };
      }

      monthlyData[key].auctionWinner = a.winner_name || 'N/A';
      monthlyData[key].amountTaken = Number(a.amount_taken) || 0;
      monthlyData[key].auctionDate = a.auction_date ? formatDateLocal(a.auction_date) : null;
    });

    return res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Error fetching group monthly info:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
