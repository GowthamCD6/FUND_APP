const db = require('../../config/db');
const { sendSMS, generateOTP, storeOTP, verifyOTP, clearOTP } = require('../../services/smsService');
const { logAuditEvent } = require('../../utils/auditLogger');

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
  return new Date(y, m, 15);
};

const generateReceiptNumber = (groupId, userId, year, month) => {
  const suffix = Date.now().toString().slice(-5);
  return `RCP-${groupId}-${userId}-${year}${String(Number(month) + 1).padStart(2, '0')}-${suffix}`;
};

const getPeriodKey = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
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
        FROM user_grouping ug
        INNER JOIN users u ON ug.user_id = u.id
        WHERE u.deleted_at IS NULL
        GROUP BY group_id
      ) members ON members.group_id = g.id
      LEFT JOIN (
        SELECT group_id, SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS collected_amount
        FROM monthly_collections
        WHERE deleted_at IS NULL
        GROUP BY group_id
      ) collections ON collections.group_id = g.id
      WHERE g.deleted_at IS NULL
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

  // Sort by date desc (newest first)
  const sorted = paymentHistory.sort((a, b) => {
    return new Date(b.collection_period).getTime() - new Date(a.collection_period).getTime();
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

  const collectionPeriodStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  try {
    const [[groupRow]] = await db.promise().query(
      `SELECT id, group_name, total_members, group_amount, duration, start_date, status FROM \`groups\` WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
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
      WHERE ug.group_id = ? AND u.deleted_at IS NULL
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
        MONTH(mc.collection_period) - 1 AS month,
        YEAR(mc.collection_period) AS year,
        mc.collection_period,
        mc.amount,
        mc.status,
        mc.due_date,
        mc.paid_date,
        mc.receipt_number,
        mc.customer_notes AS notes,
        mc.updated_at
      FROM monthly_collections mc
      WHERE mc.group_id = ? AND mc.deleted_at IS NULL
      ORDER BY mc.collection_period DESC
      `,
      [groupId],
    );

    const [[monthDetails]] = await db.promise().query(
      `
      SELECT monthly_amount, discount_amount, commission_amount
      FROM group_monthly_details
      WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [groupId, collectionPeriodStr],
    );

    const [[auctionWinner]] = await db.promise().query(
      `
      SELECT winner_name, winner_member_phone, amount_taken, auction_date
      FROM group_auction_winners
      WHERE group_id = ? AND collection_period = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [groupId, collectionPeriodStr],
    );

    const historyByUser = new Map();
    paymentRows.forEach((row) => {
      const userId = Number(row.user_id);
      if (!historyByUser.has(userId)) historyByUser.set(userId, []);

      historyByUser.get(userId).push({
        id: row.id,
        month: row.month,
        year: row.year,
        collection_period: row.collection_period,
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
      
      const computedOverdueStatus = isPaymentOverdue(paymentHistory, month, year);
      
      const currentPayment = paymentHistory.find((entry) => entry.month === month && entry.year === year) || {
        id: null,
        month,
        year,
        collection_period: collectionPeriodStr,
        amount: monthConfiguredAmount,
        status: 'pending',
        monthName: monthNameFromNumber(month, year),
        dueDate: defaultDueDate,
        paidDate: null,
        receiptNumber: null,
        notes: null,
      };

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
  
  // V4 specific new columns
  const paymentMethod = req.body.paymentMethod || (status === 'paid' ? 'cash' : null);
  const transactionReference = req.body.transactionReference || null;
  const penaltyAmount = Number(req.body.penaltyAmount) || 0.00;
  const discountReason = req.body.discountReason || null;
  const sourcePlatform = req.body.sourcePlatform || 'admin_panel';

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.status(400).json({ success: false, message: 'Valid groupId and userId are required' });
  }

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return res.status(400).json({ success: false, message: 'Valid month (0-11) is required' });
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: 'Valid year is required' });
  }

  const collectionPeriodStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const [[groupRow]] = await connection.query(
      `SELECT group_amount, duration FROM \`groups\` WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [groupId],
    );

    if (!groupRow) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify optimistic locking / finalized checks
    const [[existingCollection]] = await connection.query(
      'SELECT id, is_locked FROM monthly_collections WHERE group_id = ? AND user_id = ? AND collection_period = ? AND deleted_at IS NULL LIMIT 1',
      [groupId, userId, collectionPeriodStr]
    );

    if (existingCollection && existingCollection.is_locked) {
      connection.release();
      return res.status(400).json({ success: false, message: 'This collection month is finalized/locked and cannot be modified.' });
    }

    const computedAmount = Math.round(
      toSafeNumber(groupRow.group_amount, 0) / Math.max(1, toSafeNumber(groupRow.duration, 1)),
    );

    const amount = Number.isFinite(Number(req.body.amount)) ? Number(req.body.amount) : computedAmount;
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : buildDefaultDueDate(year, month);
    const paidDate = status === 'paid' ? new Date() : null;
    const receiptNumber = status === 'paid' ? (req.body.receiptNumber || generateReceiptNumber(groupId, userId, year, month)) : null;
    const notes = req.body.notes ? String(req.body.notes) : null;

    const creatorId = req.user ? (req.user.userId || req.user.id) : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const deviceInfo = req.headers['user-agent'];

    // 1. Insert/update monthly_collections
    await connection.query(
      `
      INSERT INTO monthly_collections
      (group_id, user_id, collection_period, amount, status, due_date, paid_date, receipt_number, customer_notes,
       payment_method, transaction_reference, penalty_amount, discount_reason, source_platform, ip_address, device_info, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        status = VALUES(status),
        due_date = VALUES(due_date),
        paid_date = VALUES(paid_date),
        receipt_number = VALUES(receipt_number),
        customer_notes = VALUES(customer_notes),
        payment_method = VALUES(payment_method),
        transaction_reference = VALUES(transaction_reference),
        penalty_amount = VALUES(penalty_amount),
        discount_reason = VALUES(discount_reason),
        source_platform = VALUES(source_platform),
        ip_address = VALUES(ip_address),
        device_info = VALUES(device_info),
        updated_by = VALUES(created_by),
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        groupId,
        userId,
        collectionPeriodStr,
        amount,
        status,
        dueDate,
        paidDate,
        receiptNumber,
        notes,
        paymentMethod,
        transactionReference,
        penaltyAmount,
        discountReason,
        sourcePlatform,
        ipAddress ? String(ipAddress).substring(0, 45) : null,
        deviceInfo ? String(deviceInfo).substring(0, 255) : null,
        creatorId ? Number(creatorId) : null
      ],
    );

    // Get the collection primary key ID
    let collectionId = existingCollection ? existingCollection.id : null;
    if (!collectionId) {
      const [[lookup]] = await connection.query(
        'SELECT id FROM monthly_collections WHERE group_id = ? AND user_id = ? AND collection_period = ? LIMIT 1',
        [groupId, userId, collectionPeriodStr]
      );
      collectionId = lookup.id;
    }

    // 2. If status is paid, create/update record in payment_transactions table
    if (status === 'paid') {
      const txSql = `
        INSERT INTO payment_transactions
        (collection_id, amount, payment_method, transaction_reference, receipt_number, status, paid_at, created_by)
        VALUES (?, ?, ?, ?, ?, 'success', ?, ?)
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          payment_method = VALUES(payment_method),
          transaction_reference = VALUES(transaction_reference),
          paid_at = VALUES(paid_at),
          updated_by = VALUES(created_by),
          version = version + 1
      `;
      await connection.query(txSql, [
        collectionId,
        amount,
        paymentMethod || 'cash',
        transactionReference || null,
        receiptNumber,
        paidDate,
        creatorId ? Number(creatorId) : null
      ]);
    }

    // 3. Log Audit Event
    await logAuditEvent(req, {
      actionType: 'UPDATE_PAYMENT',
      tableName: 'monthly_collections',
      recordId: collectionId,
      newValues: {
        status,
        amount,
        paymentMethod,
        receiptNumber,
        penaltyAmount,
        discountReason
      }
    });

    await connection.commit();

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
    await connection.rollback();
    console.error('Error updating member payment status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  } finally {
    connection.release();
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
      `SELECT id, group_name, start_date, duration, total_members, group_amount FROM \`groups\` WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [groupId],
    );

    if (!groupRow) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const [[memberRow]] = await db.promise().query(
      `SELECT id, name, phone FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId],
    );

    if (!memberRow) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const [paymentRows] = await db.promise().query(
      `
      SELECT 
        id,
        MONTH(collection_period) - 1 AS month,
        YEAR(collection_period) AS year,
        collection_period,
        amount,
        status,
        due_date,
        paid_date,
        receipt_number
      FROM monthly_collections
      WHERE group_id = ? AND user_id = ? AND deleted_at IS NULL
      ORDER BY collection_period ASC
      `,
      [groupId, userId],
    );

    const [monthMetaRows] = await db.promise().query(
      `
      SELECT
        gmd.collection_period,
        MONTH(gmd.collection_period) - 1 AS month,
        YEAR(gmd.collection_period) AS year,
        gmd.monthly_amount,
        gmd.discount_amount,
        gmd.commission_amount,
        gaw.winner_name
      FROM group_monthly_details gmd
      LEFT JOIN group_auction_winners gaw
        ON gaw.group_id = gmd.group_id
       AND gaw.collection_period = gmd.collection_period
       AND gaw.deleted_at IS NULL
      WHERE gmd.group_id = ? AND gmd.deleted_at IS NULL
      `,
      [groupId],
    );

    const paymentByPeriod = new Map();
    paymentRows.forEach((row) => {
      paymentByPeriod.set(getPeriodKey(row.collection_period), row);
    });

    const metaByPeriod = new Map();
    monthMetaRows.forEach((row) => {
      metaByPeriod.set(getPeriodKey(row.collection_period), {
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
      const key = `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}-01`;
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
    const { userId, groupId, groupName } = req.body;

    if (!userId || !groupId) {
      return res.status(400).json({ success: false, message: 'userId and groupId are required' });
    }

    // Expire any previous pending OTP requests for this user+group
    await db.promise().query(
      `UPDATE otp_requests SET status = 'expired' WHERE user_id = ? AND group_id = ? AND status IN ('pending', 'viewed')`,
      [userId, groupId]
    );

    // Generate a 6-digit OTP and store it in the database with 10 minute expiry
    const otp = generateOTP();
    const expiryMinutes = 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Resolve group name if not provided
    let resolvedGroupName = groupName || '';
    if (!resolvedGroupName) {
      const [groupRows] = await db.promise().query('SELECT group_name FROM `groups` WHERE id = ?', [groupId]);
      resolvedGroupName = groupRows.length > 0 ? groupRows[0].group_name : `Group ${groupId}`;
    }

    await db.promise().query(
      `INSERT INTO otp_requests (user_id, group_id, group_name, otp_code, status, expires_at) VALUES (?, ?, ?, ?, 'pending', ?)`,
      [userId, groupId, resolvedGroupName, otp, expiresAt]
    );

    console.log(`[OTP] Created in-app OTP for user ${userId}, group ${groupId}: ${otp} (expires in ${expiryMinutes}min)`);

    return res.status(200).json({
      success: true,
      message: 'OTP request sent to user app',
      data: {
        otpSent: true,
        expiryMinutes,
        method: 'in_app',
      },
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyPaymentOTP = async (req, res) => {
  try {
    const { otp, groupId, userId, month, year } = req.body;

    if (!otp || !userId || !groupId) {
      return res.status(400).json({ success: false, message: 'OTP, userId, and groupId are required' });
    }

    // Find a valid (non-expired, non-used) OTP request for this user+group
    const [rows] = await db.promise().query(
      `SELECT id, otp_code, status, expires_at FROM otp_requests 
       WHERE user_id = ? AND group_id = ? AND status IN ('pending', 'viewed') AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, groupId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
    }

    const otpRecord = rows[0];

    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP matched — mark as used
    await db.promise().query(
      `UPDATE otp_requests SET status = 'used', updated_at = NOW() WHERE id = ?`,
      [otpRecord.id]
    );

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
