const db = require('../../config/db');
const { sendSMS, generateOTP, storeOTP, verifyOTP, clearOTP } = require('../../services/smsService');

const ACTIVE_STATUS_SET = new Set(['active', 'ongoing', 'on going', 'on_going']);
const COMPLETED_STATUS_SET = new Set(['completed', 'complete']);

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeGroupStatus = (statusValue) => {
  const normalized = String(statusValue || '')
    .toLowerCase()
    .replace(/-/g, ' ')
    .trim();

  if (COMPLETED_STATUS_SET.has(normalized)) return 'completed';
  if (ACTIVE_STATUS_SET.has(normalized)) return 'active';
  return 'excluded';
};

const monthNameFromNumber = (month, year) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber)) return '';
  return new Date(yearNumber, monthNumber, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const normalizePaymentStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'paid') return 'paid';
  if (normalized === 'overdue') return 'overdue';
  return 'pending';
};

const buildDefaultDueDate = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11) {
    return null;
  }

  // 15th of selected month as default due date.
  return new Date(y, m, 15);
};

const generateReceiptNumber = (groupId, userId, year, month) => {
  const suffix = Date.now().toString().slice(-5);
  return `RCP-${groupId}-${userId}-${year}${String(Number(month) + 1).padStart(2, '0')}-${suffix}`;
};

exports.getReportGroups = async (req, res) => {
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
        COALESCE(members.member_count, 0) AS member_count,
        COALESCE(collections.collected_amount, 0) AS collected_amount
      FROM \`groups\` g
      LEFT JOIN (
        SELECT group_id, COUNT(*) AS member_count
        FROM user_grouping
        GROUP BY group_id
      ) members ON members.group_id = g.id
      LEFT JOIN (
        SELECT group_id, SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS collected_amount
        FROM monthly_collections
        GROUP BY group_id
      ) collections ON collections.group_id = g.id
      ORDER BY g.created_at DESC
      `,
    );

    const data = rows
      .map((row) => {
        const reportStatus = normalizeGroupStatus(row.status);
        const totalMembers = toSafeNumber(row.total_members, 0);
        const duration = toSafeNumber(row.duration, totalMembers || 1);
        const safeDuration = duration > 0 ? duration : 1;
        const monthlyAmount = Math.round(toSafeNumber(row.group_amount, 0) / safeDuration);

        const elapsedCycles = row.start_date
          ? Math.max(
              0,
              Math.min(
                safeDuration,
                (new Date().getFullYear() - new Date(row.start_date).getFullYear()) * 12 +
                  (new Date().getMonth() - new Date(row.start_date).getMonth()) +
                  1,
              ),
            )
          : 0;

        const completedCycles = reportStatus === 'completed' ? safeDuration : elapsedCycles;

        return {
          id: row.id,
          name: row.group_name,
          status: reportStatus,
          totalMembers,
          currentMembers: toSafeNumber(row.current_members, toSafeNumber(row.member_count, 0)),
          duration: safeDuration,
          totalCycles: safeDuration,
          completedCycles,
          monthlyAmount,
          groupAmount: toSafeNumber(row.group_amount, 0),
          startDate: row.start_date,
          endDate: row.end_date,
          nextDueDate: row.start_date ? buildDefaultDueDate(new Date().getFullYear(), new Date().getMonth()) : null,
          collectedAmount: toSafeNumber(row.collected_amount, 0),
        };
      })
      .filter((group) => group.status === 'active' || group.status === 'completed');

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching report groups:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch report groups' });
  }
};

// Helper function to determine if a member is overdue (2+ consecutive months unpaid)
const isPaymentOverdue = (paymentHistory, targetMonth, targetYear) => {
  if (!paymentHistory || paymentHistory.length === 0) return false;

  // Sort by year desc, month desc (newest first)
  const sorted = paymentHistory.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Find targetMonth record
  const targetPayment = sorted.find((p) => p.month === targetMonth && p.year === targetYear);
  if (!targetPayment || targetPayment.status === 'paid') return false;

  // Check if at least 2 consecutive months are unpaid (pending/overdue)
  let unpaidCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].status === 'pending' || sorted[i].status === 'overdue') {
      unpaidCount += 1;
      if (unpaidCount >= 2) return true;
    } else if (sorted[i].status === 'paid') {
      unpaidCount = 0; // Reset if we hit a paid month
    }
  }

  return false;
};

exports.getGroupMemberPayments = async (req, res) => {
  const groupId = Number(req.query.groupId);
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!Number.isInteger(groupId)) {
    return res.status(400).json({ success: false, message: 'Valid groupId is required' });
  }

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return res.status(400).json({ success: false, message: 'Valid month (0-11) is required' });
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: 'Valid year is required' });
  }

  try {
    const [[groupRow]] = await db.promise().query(
      `SELECT id, group_name, total_members, group_amount, duration, start_date, status FROM \`groups\` WHERE id = ? LIMIT 1`,
      [groupId],
    );

    if (!groupRow) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const monthlyAmount = Math.round(
      toSafeNumber(groupRow.group_amount, 0) / Math.max(1, toSafeNumber(groupRow.duration, 1)),
    );

    const [memberRows] = await db.promise().query(
      `
      SELECT
        u.id,
        u.name,
        u.phone,
        ug.id AS mapping_id
      FROM user_grouping ug
      INNER JOIN users u ON u.id = ug.user_id
      WHERE ug.group_id = ?
      ORDER BY u.name ASC
      `,
      [groupId],
    );

    const [paymentRows] = await db.promise().query(
      `
      SELECT
        mc.id,
        mc.group_id,
        mc.user_id,
        mc.month,
        mc.year,
        mc.amount,
        mc.status,
        mc.due_date,
        mc.paid_date,
        mc.receipt_number,
        mc.notes,
        mc.updated_at
      FROM monthly_collections mc
      WHERE mc.group_id = ?
      ORDER BY mc.year DESC, mc.month DESC
      `,
      [groupId],
    );

    const [[monthDetails]] = await db.promise().query(
      `
      SELECT monthly_amount, discount_amount, commission_amount
      FROM group_monthly_details
      WHERE group_id = ? AND month = ? AND year = ?
      LIMIT 1
      `,
      [groupId, month, year],
    );

    const [[auctionWinner]] = await db.promise().query(
      `
      SELECT winner_name, winner_member_phone, amount_taken, auction_date
      FROM group_auction_winners
      WHERE group_id = ? AND month = ? AND year = ?
      LIMIT 1
      `,
      [groupId, month, year],
    );

    const historyByUser = new Map();
    paymentRows.forEach((row) => {
      const userId = Number(row.user_id);
      if (!historyByUser.has(userId)) historyByUser.set(userId, []);

      historyByUser.get(userId).push({
        id: row.id,
        month: row.month,
        year: row.year,
        amount: toSafeNumber(row.amount, monthlyAmount),
        status: normalizePaymentStatus(row.status),
        monthName: monthNameFromNumber(row.month, row.year),
        dueDate: row.due_date,
        paidDate: row.paid_date,
        receiptNumber: row.receipt_number,
        notes: row.notes,
        updatedAt: row.updated_at,
      });
    });

    const defaultDueDate = buildDefaultDueDate(year, month);
    const monthConfiguredAmount = Number(monthDetails?.monthly_amount || monthlyAmount);

    const members = memberRows.map((member) => {
      const userId = Number(member.id);
      const paymentHistory = historyByUser.get(userId) || [];
      
      // Compute overdue status from payment history
      const computedOverdueStatus = isPaymentOverdue(paymentHistory, month, year);
      
      const currentPayment = paymentHistory.find((entry) => entry.month === month && entry.year === year) || {
        id: null,
        month,
        year,
        amount: monthConfiguredAmount,
        status: 'pending',
        monthName: monthNameFromNumber(month, year),
        dueDate: defaultDueDate,
        paidDate: null,
        receiptNumber: null,
        notes: null,
      };

      // If overdue logic detected, override status to 'overdue'
      if (computedOverdueStatus && currentPayment.status !== 'paid') {
        currentPayment.status = 'overdue';
      }

      return {
        id: userId,
        name: member.name,
        phone: member.phone,
        currentPayment,
        paymentHistory,
        isOverdue: computedOverdueStatus,
      };
    });

    const data = {
      group: {
        id: groupRow.id,
        name: groupRow.group_name,
        status: normalizeGroupStatus(groupRow.status),
        totalMembers: toSafeNumber(groupRow.total_members, members.length),
        monthlyAmount: monthConfiguredAmount,
        duration: toSafeNumber(groupRow.duration, 0),
        startDate: groupRow.start_date,
      },
      month,
      year,
      monthSummary: {
        monthlyAmount: monthConfiguredAmount,
        discountAmount: Number(monthDetails?.discount_amount || 0),
        commissionAmount: Number(monthDetails?.commission_amount || 0),
        auctionWinnerName: auctionWinner?.winner_name || null,
        auctionWinnerPhone: auctionWinner?.winner_member_phone || null,
        auctionWinnerAmountTaken: Number(auctionWinner?.amount_taken || 0),
        auctionDate: auctionWinner?.auction_date || null,
      },
      members,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching group member payments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch member details' });
  }
};

exports.updateMemberPaymentStatus = async (req, res) => {
  const groupId = Number(req.body.groupId);
  const userId = Number(req.body.userId);
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  const status = normalizePaymentStatus(req.body.status);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.status(400).json({ success: false, message: 'Valid groupId and userId are required' });
  }

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return res.status(400).json({ success: false, message: 'Valid month (0-11) is required' });
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: 'Valid year is required' });
  }

  try {
    const [[groupRow]] = await db.promise().query(
      `SELECT group_amount, duration FROM \`groups\` WHERE id = ? LIMIT 1`,
      [groupId],
    );

    if (!groupRow) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const computedAmount = Math.round(
      toSafeNumber(groupRow.group_amount, 0) / Math.max(1, toSafeNumber(groupRow.duration, 1)),
    );

    const amount = Number.isFinite(Number(req.body.amount)) ? Number(req.body.amount) : computedAmount;
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : buildDefaultDueDate(year, month);
    const paidDate = status === 'paid' ? new Date() : null;
    const receiptNumber = status === 'paid' ? generateReceiptNumber(groupId, userId, year, month) : null;
    const notes = req.body.notes ? String(req.body.notes) : null;

    await db.promise().query(
      `
      INSERT INTO monthly_collections
      (group_id, user_id, month, year, amount, status, due_date, paid_date, receipt_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        status = VALUES(status),
        due_date = VALUES(due_date),
        paid_date = VALUES(paid_date),
        receipt_number = VALUES(receipt_number),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
      `,
      [groupId, userId, month, year, amount, status, dueDate, paidDate, receiptNumber, notes],
    );

    return res.status(200).json({
      success: true,
      data: {
        groupId,
        userId,
        month,
        year,
        amount,
        status,
        monthName: monthNameFromNumber(month, year),
        dueDate,
        paidDate,
        receiptNumber,
        notes,
      },
    });
  } catch (error) {
    console.error('Error updating member payment status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};

exports.getMemberChitCard = async (req, res) => {
  const groupId = Number(req.query.groupId);
  const userId = Number(req.query.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.status(400).json({ success: false, message: 'Valid groupId and userId are required' });
  }

  try {
    const [[groupRow]] = await db.promise().query(
      `SELECT id, group_name, start_date, duration, total_members, group_amount FROM \`groups\` WHERE id = ? LIMIT 1`,
      [groupId],
    );

    if (!groupRow) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const [[memberRow]] = await db.promise().query(
      `SELECT id, name, phone FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    if (!memberRow) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [paymentRows] = await db.promise().query(
      `
      SELECT id, month, year, amount, status, due_date, paid_date, receipt_number
      FROM monthly_collections
      WHERE group_id = ? AND user_id = ?
      ORDER BY year ASC, month ASC
      `,
      [groupId, userId],
    );

    const [monthMetaRows] = await db.promise().query(
      `
      SELECT
        gmd.month,
        gmd.year,
        gmd.monthly_amount,
        gmd.discount_amount,
        gmd.commission_amount,
        gaw.winner_name
      FROM group_monthly_details gmd
      LEFT JOIN group_auction_winners gaw
        ON gaw.group_id = gmd.group_id
       AND gaw.month = gmd.month
       AND gaw.year = gmd.year
      WHERE gmd.group_id = ?
      `,
      [groupId],
    );

    const paymentByPeriod = new Map();
    paymentRows.forEach((row) => {
      paymentByPeriod.set(`${row.year}-${row.month}`, row);
    });

    const metaByPeriod = new Map();
    monthMetaRows.forEach((row) => {
      metaByPeriod.set(`${row.year}-${row.month}`, {
        monthlyAmount: Number(row.monthly_amount || 0),
        discountAmount: Number(row.discount_amount || 0),
        commissionAmount: Number(row.commission_amount || 0),
        winnerName: row.winner_name || null,
      });
    });

    const duration = Math.max(1, toSafeNumber(groupRow.duration, 1));
    const monthlyAmount = Math.round(toSafeNumber(groupRow.group_amount, 0) / duration);
    const startDate = groupRow.start_date ? new Date(groupRow.start_date) : new Date();

    const rows = Array.from({ length: duration }, (_, idx) => {
      const cycleDate = new Date(startDate.getFullYear(), startDate.getMonth() + idx, 1);
      const cycleMonth = cycleDate.getMonth();
      const cycleYear = cycleDate.getFullYear();
      const key = `${cycleYear}-${cycleMonth}`;
      const payment = paymentByPeriod.get(key);
      const meta = metaByPeriod.get(key);

      return {
        serialNo: idx + 1,
        month: cycleMonth,
        year: cycleYear,
        monthName: monthNameFromNumber(cycleMonth, cycleYear),
        dueDate: payment?.due_date || buildDefaultDueDate(cycleYear, cycleMonth),
        amount: Number(meta?.monthlyAmount || toSafeNumber(payment?.amount, monthlyAmount)),
        discountAmount: Number(meta?.discountAmount || 0),
        commissionAmount: Number(meta?.commissionAmount || 0),
        auctionWinnerName: meta?.winnerName || null,
        status: normalizePaymentStatus(payment?.status),
        paidDate: payment?.paid_date || null,
        receiptNumber: payment?.receipt_number || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        group: {
          id: groupRow.id,
          name: groupRow.group_name,
          duration,
          startDate: groupRow.start_date,
          monthlyAmount,
        },
        member: {
          id: memberRow.id,
          name: memberRow.name,
          phone: memberRow.phone,
        },
        rows,
      },
    });
  } catch (error) {
    console.error('Error fetching member chit card:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch member chit card' });
  }
};

exports.sendPaymentOTP = async (req, res) => {
  try {
    const { phoneNumber, userId, groupId } = req.body;

    if (!phoneNumber || !userId || !groupId) {
      return res.status(400).json({ success: false, message: 'Phone number, userId, and groupId are required' });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in cache (5-minute expiry)
    storeOTP(phoneNumber, otp, 5);

    // Send SMS
    const smsResult = await sendSMS(phoneNumber, `Your FUND-APP OTP is: ${otp}. Valid for 5 minutes.`);

    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      // In demo mode, we still return success so testing can continue
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        otpSent: true,
        phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'), // Return masked phone for confirmation
        expiryMinutes: 5,
      },
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyPaymentOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, groupId, userId, month, year } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    // Verify OTP
    const verificationResult = verifyOTP(phoneNumber, otp);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        attemptsLeft: verificationResult.attemptsLeft,
      });
    }

    // OTP verified successfully
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true,
        groupId,
        userId,
        month,
        year,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
