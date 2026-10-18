const db = require('../../config/db');

/**
 * Format month name helper
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * 1. GET /api/admin/collections/analytics/overview
 * Returns executive high-level figures across all chit pools
 */
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const [overallRows] = await db.promise().query(`
      SELECT 
        COUNT(DISTINCT g.id) AS total_groups,
        COUNT(DISTINCT CASE WHEN g.status IN ('OnGoing', 'active') THEN g.id END) AS active_groups,
        COUNT(DISTINCT CASE WHEN g.status = 'Completed' THEN g.id END) AS completed_groups,
        COALESCE(SUM(DISTINCT g.group_amount), 0) AS total_pool_value,
        COALESCE(SUM(CASE WHEN mc.status = 'paid' THEN mc.amount ELSE 0 END), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN mc.status != 'paid' THEN mc.amount ELSE 0 END), 0) AS total_pending,
        COUNT(DISTINCT ug.user_id) AS total_subscribers,
        COALESCE(SUM(DISTINCT gmd.commission_amount), 0) AS total_commission_earned,
        COALESCE(SUM(DISTINCT gmd.discount_amount), 0) AS total_dividends_distributed
      FROM \`groups\` g
      LEFT JOIN monthly_collections mc ON g.id = mc.group_id AND mc.deleted_at IS NULL
      LEFT JOIN user_grouping ug ON g.id = ug.group_id
      LEFT JOIN group_monthly_details gmd ON g.id = gmd.group_id AND gmd.deleted_at IS NULL
      WHERE g.deleted_at IS NULL
    `);

    const data = overallRows[0] || {};
    const totalCollected = parseFloat(data.total_collected || 0);
    const totalPending = parseFloat(data.total_pending || 0);
    const totalInflowExpected = totalCollected + totalPending;
    const efficiencyRate = totalInflowExpected > 0
      ? Math.round((totalCollected / totalInflowExpected) * 1000) / 10
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalGroups: Number(data.total_groups || 0),
        activeGroups: Number(data.active_groups || 0),
        completedGroups: Number(data.completed_groups || 0),
        totalPoolValue: parseFloat(data.total_pool_value || 0),
        totalCollected,
        totalPending,
        totalInflowExpected,
        efficiencyRate,
        totalSubscribers: Number(data.total_subscribers || 0),
        totalCommissionEarned: parseFloat(data.total_commission_earned || 0),
        totalDividendsDistributed: parseFloat(data.total_dividends_distributed || 0),
      }
    });
  } catch (error) {
    console.error('getAnalyticsOverview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch collection analytics overview' });
  }
};

/**
 * 2. GET /api/admin/collections/analytics/cumulative-monthly
 * Returns corporate cumulative collections grouped month by month across ALL chits
 */
exports.getCumulativeMonthlyCollections = async (req, res) => {
  try {
    const { year } = req.query;
    let yearFilter = '';
    const params = [];

    if (year && Number.isInteger(Number(year))) {
      yearFilter = 'AND YEAR(mc.collection_period) = ?';
      params.push(Number(year));
    }

    const [monthlyRows] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(mc.collection_period, '%Y-%m-01') AS period,
        YEAR(mc.collection_period) AS year,
        MONTH(mc.collection_period) AS month,
        COUNT(DISTINCT mc.group_id) AS active_groups_count,
        COUNT(mc.id) AS total_records,
        SUM(CASE WHEN mc.status = 'paid' THEN mc.amount ELSE 0 END) AS collected_amount,
        SUM(CASE WHEN mc.status != 'paid' THEN mc.amount ELSE 0 END) AS pending_amount,
        SUM(mc.amount) AS expected_amount,
        COUNT(CASE WHEN mc.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN mc.status != 'paid' THEN 1 END) AS pending_count
      FROM monthly_collections mc
      JOIN \`groups\` g ON mc.group_id = g.id AND g.deleted_at IS NULL
      WHERE mc.deleted_at IS NULL ${yearFilter}
      GROUP BY period, year, month
      ORDER BY period DESC
    `, params);

    // Also fetch commissions and discounts for these periods
    const [periodDetails] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(collection_period, '%Y-%m-01') AS period,
        SUM(COALESCE(discount_amount, 0)) AS total_discount,
        SUM(COALESCE(commission_amount, 0)) AS total_commission
      FROM group_monthly_details
      WHERE deleted_at IS NULL
      GROUP BY period
    `);

    const detailsMap = new Map();
    periodDetails.forEach(d => {
      detailsMap.set(d.period, {
        discount: parseFloat(d.total_discount || 0),
        commission: parseFloat(d.total_commission || 0)
      });
    });

    const formattedData = monthlyRows.map(row => {
      const monthIdx = Number(row.month) - 1;
      const collected = parseFloat(row.collected_amount || 0);
      const pending = parseFloat(row.pending_amount || 0);
      const expected = parseFloat(row.expected_amount || 0);
      const rate = expected > 0 ? Math.round((collected / expected) * 1000) / 10 : 0;
      const details = detailsMap.get(row.period) || { discount: 0, commission: 0 };

      return {
        period: row.period,
        year: Number(row.year),
        month: Number(row.month),
        monthName: MONTH_NAMES[monthIdx] || `Month ${row.month}`,
        activeGroupsCount: Number(row.active_groups_count || 0),
        totalRecords: Number(row.total_records || 0),
        collectedAmount: collected,
        pendingAmount: pending,
        expectedAmount: expected,
        paidCount: Number(row.paid_count || 0),
        pendingCount: Number(row.pending_count || 0),
        collectionRate: rate,
        totalDiscount: details.discount,
        totalCommission: details.commission,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('getCumulativeMonthlyCollections error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cumulative monthly collections' });
  }
};

/**
 * 3. GET /api/admin/collections/analytics/group-monthly
 * Returns detailed monthly breakdown for a single respective chit group
 */
exports.getGroupMonthlyCollections = async (req, res) => {
  try {
    const groupId = Number(req.query.groupId);
    const { year } = req.query;

    if (!groupId || !Number.isInteger(groupId)) {
      return res.status(400).json({ success: false, message: 'Valid groupId is required' });
    }

    // 1. Fetch group metadata
    const [[group]] = await db.promise().query(`
      SELECT 
        id, group_name, group_code, group_amount, duration, total_members, current_members,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        status
      FROM \`groups\`
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `, [groupId]);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Chit group not found' });
    }

    const duration = Number(group.duration) || 20;
    const groupAmount = parseFloat(group.group_amount || 0);
    const totalMembers = Number(group.total_members) || duration;
    const baseInstallment = duration > 0 ? Math.round(groupAmount / duration) : 0;

    // 2. Fetch monthly collections for this group
    let yearFilter = '';
    const params = [groupId];
    if (year && Number.isInteger(Number(year))) {
      yearFilter = 'AND YEAR(mc.collection_period) = ?';
      params.push(Number(year));
    }

    const [monthlyCollections] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(mc.collection_period, '%Y-%m-01') AS period,
        YEAR(mc.collection_period) AS year,
        MONTH(mc.collection_period) AS month,
        SUM(CASE WHEN mc.status = 'paid' THEN mc.amount ELSE 0 END) AS collected_amount,
        SUM(CASE WHEN mc.status != 'paid' THEN mc.amount ELSE 0 END) AS pending_amount,
        SUM(mc.amount) AS total_amount,
        COUNT(CASE WHEN mc.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN mc.status != 'paid' THEN 1 END) AS pending_count,
        COUNT(mc.id) AS total_subscribers,
        gmd.discount_amount,
        gmd.commission_amount
      FROM monthly_collections mc
      LEFT JOIN group_monthly_details gmd ON gmd.group_id = mc.group_id AND gmd.collection_period = mc.collection_period AND gmd.deleted_at IS NULL
      WHERE mc.group_id = ? AND mc.deleted_at IS NULL ${yearFilter}
      GROUP BY period, year, month, gmd.discount_amount, gmd.commission_amount
      ORDER BY period DESC
    `, params);

    // 3. Fetch individual subscriber payments for member drilldown
    const [subscriberRecords] = await db.promise().query(`
      SELECT 
        mc.id,
        mc.user_id,
        DATE_FORMAT(mc.collection_period, '%Y-%m-01') AS period,
        u.name AS user_name,
        u.phone AS user_phone,
        mc.amount,
        mc.status,
        mc.payment_method,
        DATE_FORMAT(mc.due_date, '%Y-%m-%d') AS due_date,
        DATE_FORMAT(mc.paid_date, '%Y-%m-%d %H:%i:%s') AS paid_date,
        mc.receipt_number
      FROM monthly_collections mc
      JOIN users u ON mc.user_id = u.id
      WHERE mc.group_id = ? AND mc.deleted_at IS NULL ${yearFilter}
      ORDER BY mc.collection_period DESC, u.name ASC
    `, params);

    // Group subscriber records by period
    const subscribersByPeriod = new Map();
    subscriberRecords.forEach(s => {
      if (!subscribersByPeriod.has(s.period)) {
        subscribersByPeriod.set(s.period, []);
      }
      subscribersByPeriod.get(s.period).push({
        id: s.id,
        userId: s.user_id,
        name: s.user_name,
        phone: s.user_phone,
        amount: parseFloat(s.amount || 0),
        status: s.status,
        paymentMethod: s.payment_method || 'N/A',
        dueDate: s.due_date,
        paidDate: s.paid_date,
        receiptNumber: s.receipt_number || 'N/A'
      });
    });

    let overallGroupCollected = 0;
    let overallGroupPending = 0;
    let overallDiscounts = 0;
    let overallCommissions = 0;

    const formattedMonths = monthlyCollections.map(row => {
      const monthIdx = Number(row.month) - 1;
      const collected = parseFloat(row.collected_amount || 0);
      const pending = parseFloat(row.pending_amount || 0);
      const totalAmount = parseFloat(row.total_amount || 0);
      const discount = parseFloat(row.discount_amount || 0);
      const commission = parseFloat(row.commission_amount || 0);
      const paidCount = Number(row.paid_count || 0);
      const pendingCount = Number(row.pending_count || 0);

      overallGroupCollected += collected;
      overallGroupPending += pending;
      overallDiscounts += discount;
      overallCommissions += commission;

      const efficiency = totalAmount > 0 ? Math.round((collected / totalAmount) * 1000) / 10 : 0;
      const dividendPool = Math.max(0, discount - commission);
      const dividendPerMember = totalMembers > 0 ? Math.round(dividendPool / totalMembers) : 0;
      const netPayablePerMember = Math.max(0, baseInstallment - dividendPerMember);

      return {
        period: row.period,
        year: Number(row.year),
        month: Number(row.month),
        monthName: MONTH_NAMES[monthIdx] || `Month ${row.month}`,
        baseInstallment,
        discountAmount: discount,
        commissionAmount: commission,
        dividendPool,
        dividendPerMember,
        netPayablePerMember,
        expectedInflow: totalAmount,
        collectedInflow: collected,
        pendingInflow: pending,
        paidCount,
        pendingCount,
        efficiency,
        status: pendingCount === 0 && paidCount > 0 ? 'FULLY_COLLECTED' : (paidCount > 0 ? 'PARTIAL' : 'PENDING'),
        subscribers: subscribersByPeriod.get(row.period) || []
      };
    });

    const totalGroupInflowExpected = overallGroupCollected + overallGroupPending;
    const groupEfficiency = totalGroupInflowExpected > 0
      ? Math.round((overallGroupCollected / totalGroupInflowExpected) * 1000) / 10
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.group_name,
          code: group.group_code,
          groupAmount,
          duration,
          totalMembers,
          currentMembers: Number(group.current_members || totalMembers),
          baseInstallment,
          status: group.status,
          startDate: group.start_date,
          endDate: group.end_date
        },
        summary: {
          totalCollected: overallGroupCollected,
          totalPending: overallGroupPending,
          totalExpected: totalGroupInflowExpected,
          collectionEfficiency: groupEfficiency,
          totalDiscountsDistributed: overallDiscounts,
          totalCommissionEarned: overallCommissions
        },
        months: formattedMonths
      }
    });
  } catch (error) {
    console.error('getGroupMonthlyCollections error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch group monthly collections' });
  }
};

/**
 * 4. GET /api/admin/collections/analytics/groups-list
 * Returns list of available chit groups for dropdown selection
 */
exports.getChitGroupsList = async (req, res) => {
  try {
    const [groups] = await db.promise().query(`
      SELECT 
        g.id,
        g.group_name,
        g.group_code,
        g.group_amount,
        g.duration,
        g.total_members,
        g.current_members,
        g.status,
        COALESCE(SUM(CASE WHEN mc.status = 'paid' THEN mc.amount ELSE 0 END), 0) AS total_collected
      FROM \`groups\` g
      LEFT JOIN monthly_collections mc ON g.id = mc.group_id AND mc.deleted_at IS NULL
      WHERE g.deleted_at IS NULL
      GROUP BY g.id, g.group_name, g.group_code, g.group_amount, g.duration, g.total_members, g.current_members, g.status
      ORDER BY g.status ASC, g.group_name ASC
    `);

    return res.status(200).json({
      success: true,
      data: groups.map(g => ({
        id: g.id,
        name: g.group_name,
        code: g.group_code,
        amount: parseFloat(g.group_amount || 0),
        duration: Number(g.duration || 20),
        totalMembers: Number(g.total_members || 20),
        status: g.status,
        totalCollected: parseFloat(g.total_collected || 0)
      }))
    });
  } catch (error) {
    console.error('getChitGroupsList error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chit groups list' });
  }
};

/**
 * 5. POST /api/admin/collections/analytics/calculate
 * Interactive Calculation Engine for Chit Collections, Auctions & Dividends
 */
exports.calculateChitCollection = async (req, res) => {
  try {
    const {
      groupAmount = 100000,
      duration = 20,
      totalMembers = 20,
      auctionDiscount = 20000,
      commissionRate = 5, // 5% default standard in Chit Funds Act 1982
      expectedCollectionRate = 100 // percentage
    } = req.body;

    const gAmount = Math.max(1000, parseFloat(groupAmount) || 100000);
    const dur = Math.max(1, parseInt(duration) || 20);
    const members = Math.max(1, parseInt(totalMembers) || dur);
    const disc = Math.max(0, Math.min(gAmount * 0.4, parseFloat(auctionDiscount) || 0)); // max 40% cap
    const commRate = Math.max(0, Math.min(10, parseFloat(commissionRate) || 5));
    const realization = Math.max(1, Math.min(100, parseFloat(expectedCollectionRate) || 100));

    // Base installment per member
    const baseInstallment = Math.round(gAmount / dur);

    // Company commission (5% of chit pool value)
    const foremanCommission = Math.round(gAmount * (commRate / 100));

    // Dividend pool to be distributed to subscribers
    const dividendPool = Math.max(0, disc - foremanCommission);

    // Dividend per subscriber
    const dividendPerMember = members > 0 ? Math.round(dividendPool / members) : 0;

    // Actual Net installment payable per subscriber
    const netInstallmentPerMember = Math.max(0, baseInstallment - dividendPerMember);

    // Total gross and net collection expected from all members
    const grossTotalCollection = baseInstallment * members;
    const netTotalExpectedCollection = netInstallmentPerMember * members;

    // Projected realization based on expected collection rate
    const projectedCollectionInflow = Math.round(netTotalExpectedCollection * (realization / 100));
    const projectedShortfall = Math.max(0, netTotalExpectedCollection - projectedCollectionInflow);

    // Prize money paid to winning bidder
    const prizeMoneyDisbursed = gAmount - disc;

    // Net Foreman cashflow / yield
    const foremanNetYield = foremanCommission;

    return res.status(200).json({
      success: true,
      data: {
        inputs: {
          groupAmount: gAmount,
          duration: dur,
          totalMembers: members,
          auctionDiscount: disc,
          commissionRate: commRate,
          expectedCollectionRate: realization
        },
        installments: {
          baseInstallment,
          netInstallmentPerMember,
          dividendPerMember,
          savingsPerMember: dividendPerMember
        },
        pools: {
          auctionDiscount: disc,
          foremanCommission,
          dividendPool,
          grossTotalCollection,
          netTotalExpectedCollection,
          prizeMoneyDisbursed
        },
        projections: {
          projectedCollectionInflow,
          projectedShortfall,
          foremanNetYield
        }
      }
    });
  } catch (error) {
    console.error('calculateChitCollection error:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate chit collection' });
  }
};
