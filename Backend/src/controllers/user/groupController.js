const db = require('../../config/db');
const { groupDecryptAES } = require('../../utils/decryptAES');
const { logAuditEvent } = require('../../utils/auditLogger');

const formatDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// Join Group by Group Code
exports.joinGroup = async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id) : null;
  const { groupCode } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: User identification missing' });
  }

  if (!groupCode || !groupCode.trim()) {
    return res.status(400).json({ success: false, message: 'Group code is required' });
  }

  const inputCode = groupCode.trim().toUpperCase();

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Find the group by decrypting stored codes and matching with ROW LOCKING
    const [allGroups] = await connection.query(
      "SELECT id, group_code, group_name, total_members, current_members, group_amount, duration, status FROM `groups` WHERE deleted_at IS NULL FOR UPDATE"
    );

    let matchedGroup = null;
    for (const group of allGroups) {
      try {
        const decryptedCode = groupDecryptAES(group.group_code);
        if (decryptedCode.toUpperCase() === inputCode) {
          matchedGroup = group;
          break;
        }
      } catch (decErr) {
        // Skip groups with corrupted codes
        continue;
      }
    }

    if (!matchedGroup) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        errorType: 'INVALID_CODE',
        message: 'No group found with this code. Please check and try again.'
      });
    }

    // 2. Check if group is completed or inactive
    if (matchedGroup.status === 'Completed') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        errorType: 'GROUP_COMPLETED',
        message: 'This group has been completed and is no longer accepting members.'
      });
    }

    // 3. Check if user is already a member
    const [existingMember] = await connection.query(
      'SELECT id FROM user_grouping WHERE group_id = ? AND user_id = ?',
      [matchedGroup.id, userId]
    );

    if (existingMember.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        errorType: 'ALREADY_MEMBER',
        message: `You are already a member of "${matchedGroup.group_name}".`
      });
    }

    // 4. Check if group is full using live count from user_grouping
    const [liveMemberRows] = await connection.query(
      'SELECT COUNT(*) as live_cnt FROM user_grouping WHERE group_id = ?',
      [matchedGroup.id]
    );
    const currentCount = Number(liveMemberRows[0].live_cnt) || 0;
    const maxMembers = matchedGroup.total_members || 0;

    if (maxMembers > 0 && currentCount >= maxMembers) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        errorType: 'GROUP_FULL',
        message: `This group has reached its member limit (${currentCount}/${maxMembers}). Contact the group administrator.`
      });
    }

    // 5. All checks passed — add user to group
    await connection.query(
      'INSERT INTO user_grouping (group_id, user_id) VALUES (?, ?)',
      [matchedGroup.id, userId]
    );

    // 6. Increment current_members count
    await connection.query(
      'UPDATE `groups` SET current_members = current_members + 1, version = version + 1 WHERE id = ?',
      [matchedGroup.id]
    );

    // 7. Audit log
    await logAuditEvent(req, {
      actionType: 'JOIN_GROUP',
      tableName: 'user_grouping',
      recordId: matchedGroup.id,
      newValues: { userId, groupName: matchedGroup.group_name }
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `You have successfully joined "${matchedGroup.group_name}"!`,
      data: {
        groupId: matchedGroup.id,
        groupName: matchedGroup.group_name,
        groupAmount: matchedGroup.group_amount,
        totalMembers: matchedGroup.total_members,
        currentMembers: (currentCount + 1),
        duration: matchedGroup.duration,
        status: matchedGroup.status
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error joining group:', error);
    return res.status(500).json({ success: false, message: 'Failed to join group. Please try again.' });
  } finally {
    connection.release();
  }
};

exports.getGroupMonthlyInfo = async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id) : null;
  let rawGroupId = req.params.groupId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user credentials' });
  }

  if (rawGroupId && String(rawGroupId).startsWith('GRP-')) {
    rawGroupId = String(rawGroupId).split('-')[1];
  }

  try {
    // Verify user is a member of the requested group (IDOR Prevention)
    const [membership] = await db.promise().query(
      `SELECT id FROM user_grouping WHERE user_id = ? AND group_id = ?`,
      [userId, rawGroupId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not a member of this group' });
    }

    const [[groupInfo]] = await db.promise().query(
      `SELECT start_date, duration FROM \`groups\` WHERE id = ? AND deleted_at IS NULL`,
      [rawGroupId]
    );

    let currentRunningMonth = 1;
    let groupStartDate = null;
    if (groupInfo && groupInfo.start_date) {
      groupStartDate = new Date(groupInfo.start_date);
      groupStartDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = (today.getFullYear() - groupStartDate.getFullYear()) * 12 + (today.getMonth() - groupStartDate.getMonth()) + 1;
      const duration = Number(groupInfo.duration) || 20;
      currentRunningMonth = Math.min(duration, Math.max(1, diff));
    }

    const evaluateMonthStatus = (rawStatus, monthDate) => {
      const s = String(rawStatus || '').toLowerCase();
      if (s === 'paid' || s === 'completed') {
        return 'paid';
      }
      if (groupStartDate) {
        const mIndex = (monthDate.getFullYear() - groupStartDate.getFullYear()) * 12 + (monthDate.getMonth() - groupStartDate.getMonth()) + 1;
        if (mIndex < currentRunningMonth) {
          return 'overdue';
        }
        return 'pending';
      }
      return s === 'overdue' ? 'overdue' : 'pending';
    };

    const [payments] = await db.promise().query(
      `SELECT MONTH(collection_period) - 1 AS month, YEAR(collection_period) AS year, amount, status, due_date, paid_date, receipt_number 
       FROM monthly_collections 
       WHERE group_id = ? AND user_id = ? AND deleted_at IS NULL`,
      [rawGroupId, userId]
    );

    const [auctions] = await db.promise().query(
      `SELECT MONTH(collection_period) - 1 AS month, YEAR(collection_period) AS year, winner_name, amount_taken, auction_date 
       FROM group_auction_winners 
       WHERE group_id = ? AND deleted_at IS NULL`,
      [rawGroupId]
    );

    const [monthlyDetails] = await db.promise().query(
      `SELECT MONTH(collection_period) - 1 AS month, YEAR(collection_period) AS year, monthly_amount, discount_amount, commission_amount, payment_due_date, customer_notes AS notes 
       FROM group_monthly_details 
       WHERE group_id = ? AND deleted_at IS NULL`,
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
        status: evaluateMonthStatus('pending', monthDate),
        paymentAmount: Number(d.monthly_amount) || 0, 
        discount: Number(d.discount_amount) || 0,
        commission: Number(d.commission_amount) || 0,
        netAmount: net,
        dueDate: d.payment_due_date ? formatDateLocal(d.payment_due_date) : null,
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
      const computedStatus = evaluateMonthStatus(p.status, monthDate);

      if (!monthlyData[key]) {
        // Fallback if no admin details strictly exist yet
        monthlyData[key] = {
          status: computedStatus,
          paymentAmount: userCollectionAmount > 0 ? userCollectionAmount : null,
          paidAmount: computedStatus === 'paid' ? userCollectionAmount : 0,
          receiptNumber: p.receipt_number || null,
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
      if (computedStatus === 'pending' && p.due_date) {
        const due = new Date(p.due_date);
        const diff = due.getTime() - new Date().getTime();
        if (diff > 0) {
          daysPending = Math.floor(diff / (1000 * 3600 * 24));
        }
      }

      monthlyData[key].status = computedStatus;
      if (computedStatus === 'paid') {
        monthlyData[key].paidAmount = userCollectionAmount;
      }
      monthlyData[key].receiptNumber = p.receipt_number || monthlyData[key].receiptNumber || null;
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

exports.checkActiveAuction = async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'groupId is required' });
    }
    const [rows] = await db.promise().query(
      "SELECT id, auction_type, initial_amount, duration, status FROM group_auctions WHERE group_id = ? AND status = 'active' LIMIT 1",
      [groupId]
    );
    if (rows.length > 0) {
      return res.json({
        success: true,
        active: true,
        auction: rows[0]
      });
    } else {
      return res.json({
        success: true,
        active: false,
        auction: null
      });
    }
  } catch (error) {
    console.error('Error checking active auction status:', error);
    return res.status(500).json({ success: false, message: 'Server error checking auction status' });
  }
};
