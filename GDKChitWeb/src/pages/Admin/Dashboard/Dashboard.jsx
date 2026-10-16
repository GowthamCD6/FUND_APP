import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Users as RiGroupLine, Plus, Plus as RiAddLine, UserPlus as RiUserAddLine,
  Settings as RiSettings3Line, UserCog as RiUserSettingsLine, BarChart3 as RiBarChartLine,
  CircleDollarSign as RiMoneyDollarCircleLine, Check as RiCheckLine, Clock as RiTimeLine,
  AlertTriangle, AlertTriangle as RiAlertLine, ChevronRight as RiArrowRightSLine, ShieldCheck as RiShieldUserLine,
  User as RiUserLine, Calendar as RiCalendarLine, Zap as RiZapLine, Layers, Gavel,
  ShieldAlert, TrendingUp, RefreshCw, ArrowUpRight, CheckCircle2, BellRing, Send, X, Activity, Radio
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);

  // Broadcast Modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [gRes, uRes, oRes] = await Promise.all([
        makeRequest('/admin/groups/getGroups'),
        makeRequest('/admin/users/getAllUsers'),
        makeRequest('/admin/dashboard-overview')
      ]);

      const [gData, uData, oData] = await Promise.all([
        safeJson(gRes),
        safeJson(uRes),
        safeJson(oRes)
      ]);

      if (gRes.ok && gData?.success) setGroups(gData.data || []);
      if (uRes.ok && uData?.success) setUsers(uData.data || []);
      if (oRes.ok && oData?.success) setOverview(oData.data || null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendBroadcast = async (e) => {
    if (e) e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastNotice({ type: 'error', text: 'Please fill both title and announcement message.' });
      return;
    }
    setSendingBroadcast(true);
    setBroadcastNotice(null);
    try {
      const res = await makeRequest('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetGroupId: broadcastTargetGroup || null,
        })
      });
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setBroadcastNotice({ type: 'success', text: 'Announcement broadcast sent successfully to subscribers!' });
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastTitle('');
          setBroadcastMessage('');
          setBroadcastTargetGroup('');
          setBroadcastNotice(null);
        }, 1500);
      } else {
        setBroadcastNotice({ type: 'error', text: data?.message || 'Failed to send broadcast announcement.' });
      }
    } catch (err) {
      setBroadcastNotice({ type: 'error', text: err.message || 'Network error while broadcasting.' });
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Derived calculations fallback
  const activeGroups = useMemo(() => {
    return groups.filter(g => {
      const s = String(g.status || '').toLowerCase();
      return s === 'active' || s === 'ongoing';
    });
  }, [groups]);

  const completedGroups = useMemo(() => {
    return groups.filter(g => String(g.status || '').toLowerCase() === 'completed');
  }, [groups]);

  const totalPool = useMemo(() => {
    return groups.reduce((acc, g) => acc + Number(g.groupAmount || g.group_amount || 0), 0);
  }, [groups]);

  const activePool = useMemo(() => {
    return activeGroups.reduce((acc, g) => acc + Number(g.groupAmount || g.group_amount || 0), 0);
  }, [activeGroups]);

  // Real Metrics from overview or live fallback
  const totalMembersCount = overview?.metrics?.totalMembers ?? (overview?.total_members ?? users.length);
  const activeGroupsCount = overview?.metrics?.activeGroups ?? (overview?.active_groups ?? activeGroups.length);
  const completedGroupsCount = overview?.metrics?.completedGroups ?? (overview?.completed_groups ?? completedGroups.length);

  const collectionTarget = overview?.metrics?.monthlyTarget ?? (overview?.collection?.target || activePool || 1500000);
  const collectionCollected = overview?.metrics?.monthlyCollected ?? (overview?.collection?.collected || 0);
  const collectionPct = overview?.metrics?.collectionRate !== undefined
    ? parseFloat(overview.metrics.collectionRate)
    : (collectionTarget > 0 ? Math.min(100, Math.round((collectionCollected / collectionTarget) * 100)) : 0);

  const overdueAmount = overview?.metrics?.overdueAmount ?? (overview?.overdue?.amount ?? 0);
  const overdueCount = overview?.metrics?.overdueCount ?? (overview?.overdue?.count ?? 0);

  const unfilledMonthlyGroups = overview?.actionRequired?.unfilledPaymentGroups || overview?.action_required?.unfilled_monthly_groups || [];
  const pendingAuctionWinnerGroups = overview?.actionRequired?.pendingAuctionWinnerGroups || overview?.action_required?.pending_auction_winner_groups || [];
  const pendingPayments = overview?.actionRequired?.pendingMemberPayments || overview?.pending_member_payments || [];
  const recentWinners = overview?.auctionsHub?.recentWinners || overview?.recent_auction_winners || [];
  const recentActivities = overview?.recentActivities || [];

  const quickShortcuts = [
    { title: 'Create Chit Group', sub: 'New Monthly Chit Scheme', Icon: Plus, color: '#059669', bg: '#ecfdf5', action: () => navigate('/admin/create-group') },
    { title: 'Live Reverse Auction', sub: 'Bidding & Lucky Draw', Icon: Gavel, color: '#2563eb', bg: '#eff6ff', action: () => navigate('/admin/auction') },
    { title: 'Record Collections', sub: 'Verify Payments & OTP', Icon: RiBarChartLine, color: '#7c3aed', bg: '#f5f3ff', action: () => navigate('/admin/reports') },
    { title: 'Broadcast Alert', sub: 'Push Notice to All', Icon: Radio, color: '#db2777', bg: '#fdf2f8', action: () => setShowBroadcastModal(true) },
    { title: 'Overdue Tracker', sub: 'Risk Analysis & Defaulters', Icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', action: () => navigate('/admin/defaulters') },
    { title: 'Add Subscriber', sub: 'KYC & Member Onboarding', Icon: RiUserAddLine, color: '#d97706', bg: '#fffbeb', action: () => navigate('/admin/admintool/add-user') },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* ─── 1. TOP TREASURY COMMAND HERO ─── */}
      <div className="treasury-hero-banner">
        {/* Pool Column */}
        <div className="treasury-pool-col">
          <span className="treasury-kpi-label">
            <RiMoneyDollarCircleLine size={15} color="#2563eb" />
            Total Chit Fund Pool
          </span>
          <h2 className="treasury-pool-amount">{formatCurrency(totalPool > 0 ? totalPool : 8500000)}</h2>
          <div className="treasury-pool-meta">
            <span>Active Volume: <strong>{formatCurrency(activePool > 0 ? activePool : 5200000)}</strong></span>
            <span>•</span>
            <span>Chits: <strong>{groups.length} plans</strong></span>
          </div>
        </div>

        {/* Collection Target & Gauge Column */}
        <div className="treasury-collection-col">
          <div className="treasury-collection-header">
            <span className="treasury-kpi-label">
              <TrendingUp size={14} color="#1e40af" />
              Monthly Realized Collections
            </span>
            <span className="treasury-collection-pct">{collectionPct}% Realized</span>
          </div>
          <div className="treasury-progress-track">
            <div className="treasury-progress-fill" style={{ width: `${Math.min(collectionPct, 100)}%` }} />
          </div>
          <div className="treasury-collection-numbers">
            <span>Collected: <strong>{formatCurrency(collectionCollected)}</strong></span>
            <span>Target: <strong>{formatCurrency(collectionTarget)}</strong></span>
          </div>
        </div>

        {/* Risk / Overdue Alert Column */}
        <div className="treasury-risk-col">
          <span className="treasury-kpi-label" style={{ color: '#dc2626' }}>
            <ShieldAlert size={14} color="#dc2626" />
            Active Collection Risk
          </span>
          <h3 className="treasury-risk-amount">{formatCurrency(overdueAmount)}</h3>
          <button
            type="button"
            className="treasury-risk-btn"
            onClick={() => navigate('/admin/defaulters')}
          >
            <AlertTriangle size={13} />
            Resolve {overdueCount > 0 ? `${overdueCount} Overdue Accounts` : 'Overdues'}
          </button>
        </div>
      </div>

      {/* ─── 2. ACTION REQUIRED ALERT HUB (If any pending operational tasks) ─── */}
      {(unfilledMonthlyGroups.length > 0 || pendingAuctionWinnerGroups.length > 0 || overdueCount > 0) && (
        <div className="dash-action-hub">
          <div className="dash-action-hub-header">
            <h3 className="dash-action-hub-title">
              <AlertTriangle size={18} color="#d97706" />
              Operational Actions Required This Cycle
            </h3>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                color: '#92400e',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={refreshing ? 'spin-anim' : ''} />
              Sync Data
            </button>
          </div>

          <div className="dash-action-cards-grid">
            {unfilledMonthlyGroups.length > 0 && (
              <div className="dash-action-item">
                <div className="dash-action-item-info">
                  <h4 className="dash-action-item-heading">Record Monthly Installment Details</h4>
                  <p className="dash-action-item-desc">
                    {unfilledMonthlyGroups.length} active group(s) have not yet had their monthly dividend sheet saved for the period.
                  </p>
                </div>
                <button
                  type="button"
                  className="dash-action-btn-mini"
                  onClick={() => navigate('/admin/reports')}
                >
                  Fill Sheet
                </button>
              </div>
            )}

            {pendingAuctionWinnerGroups.length > 0 && (
              <div className="dash-action-item">
                <div className="dash-action-item-info">
                  <h4 className="dash-action-item-heading">Declare Auction Winner</h4>
                  <p className="dash-action-item-desc">
                    {pendingAuctionWinnerGroups.length} group auction(s) require winning bid verification and ledger entry.
                  </p>
                </div>
                <button
                  type="button"
                  className="dash-action-btn-mini"
                  onClick={() => navigate('/admin/auction')}
                >
                  Conduct Auction
                </button>
              </div>
            )}

            {overdueAmount > 0 && (
              <div className="dash-action-item">
                <div className="dash-action-item-info">
                  <h4 className="dash-action-item-heading">Follow Up On Delinquent Accounts</h4>
                  <p className="dash-action-item-desc">
                    {overdueCount} member(s) have past due balances totaling {formatCurrency(overdueAmount)}.
                  </p>
                </div>
                <button
                  type="button"
                  className="dash-action-btn-mini"
                  onClick={() => navigate('/admin/defaulters')}
                >
                  Defaulters Desk
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. 6-KPI EXECUTIVE METRICS ROW ─── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Total Members</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <RiGroupLine size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{totalMembersCount}</span>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Active Chit Groups</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#ecfdf5', color: '#059669' }}>
              <RiTimeLine size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{activeGroupsCount}</span>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Completed Chits</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <RiCheckLine size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{completedGroupsCount}</span>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Registered Subscribers</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#fffbeb', color: '#d97706' }}>
              <RiUserLine size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{users.filter(u => u.type !== 'admin').length || totalMembersCount}</span>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Admin Officers</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <RiShieldUserLine size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{users.filter(u => u.type === 'admin').length || 1}</span>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-card-header">
            <span className="dash-kpi-title">Total Chit Schemes</span>
            <div className="dash-kpi-icon-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
              <Layers size={16} />
            </div>
          </div>
          <span className="dash-kpi-value">{groups.length}</span>
        </div>
      </div>

      {/* ─── 4. EXECUTIVE OPERATIONAL SHORTCUTS ─── */}
      <div className="dash-shortcuts-bar">
        {quickShortcuts.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <button
              key={idx}
              type="button"
              className="dash-shortcut-btn"
              onClick={item.action || (() => navigate(item.route))}
            >
              <div className="dash-shortcut-icon" style={{ background: item.bg, color: item.color }}>
                <Icon size={18} />
              </div>
              <div className="dash-shortcut-text">
                <span className="dash-shortcut-title">{item.title}</span>
                <span className="dash-shortcut-sub">{item.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── 5. DUAL-COLUMN OPERATIONAL RADAR ─── */}
      <div className="dash-radar-grid">
        {/* Left: Active Chit Group Operations Radar */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title-group">
              <Layers size={18} color="#2563eb" />
              <h3 className="dash-panel-title">Active Chit Schemes Radar ({activeGroups.length})</h3>
            </div>
            <button
              type="button"
              className="dash-panel-action-link"
              onClick={() => navigate('/admin/manage-groups')}
            >
              Manage All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="dash-panel-body">
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                Loading chit fund schemes...
              </div>
            ) : activeGroups.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13.5 }}>No active chit schemes running currently.</p>
                <button
                  type="button"
                  className="dash-action-btn-mini"
                  onClick={() => navigate('/admin/create-group')}
                >
                  Create New Scheme
                </button>
              </div>
            ) : (
              activeGroups.slice(0, 6).map((group) => {
                const totalCycles = Number(group.duration || group.totalMonths || 20);
                const currentCycle = Number(group.completedCycles || 1);
                const pct = Math.min(100, Math.round((currentCycle / totalCycles) * 100));

                return (
                  <div
                    key={group.id}
                    className="chit-radar-row"
                    onClick={() => navigate('/admin/reports')}
                  >
                    <div className="chit-radar-icon-box">
                      <RiTimeLine size={20} color="#059669" />
                    </div>
                    <div className="chit-radar-details">
                      <div className="chit-radar-name-bar">
                        <h4 className="chit-radar-name">{group.name || group.group_name || `Chit Plan #${group.id}`}</h4>
                        <span className="chit-radar-cycle-badge">
                          Month {currentCycle} of {totalCycles}
                        </span>
                      </div>
                      <div className="chit-radar-progress-bar">
                        <div className="chit-radar-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="chit-radar-meta-row">
                        <span>Members: <strong>{group.membersCount || group.totalMembers || 20}</strong></span>
                        <span>•</span>
                        <span>Monthly Due: <strong>{formatCurrency((group.groupAmount || 100000) / totalCycles)}</strong></span>
                      </div>
                    </div>
                    <div className="chit-radar-amount-box">
                      <div className="chit-radar-total-val">{formatCurrency(group.groupAmount || group.group_amount)}</div>
                      <span className="chit-radar-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
                        ACTIVE
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Reverse Auction Winners & Ledger */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title-group">
              <Gavel size={18} color="#7c3aed" />
              <h3 className="dash-panel-title">Auction Winners & Disbursements</h3>
            </div>
            <button
              type="button"
              className="dash-panel-action-link"
              onClick={() => navigate('/admin/auction')}
            >
              Auction Portal <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="dash-panel-body">
            {recentWinners.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13.5 }}>No recorded auction winner disbursements for recent periods.</p>
                <button
                  type="button"
                  className="dash-action-btn-mini"
                  onClick={() => navigate('/admin/auction')}
                >
                  Conduct Auction
                </button>
              </div>
            ) : (
              recentWinners.slice(0, 6).map((winner, idx) => (
                <div key={winner.id || idx} className="auction-winner-item">
                  <div className="auction-winner-left">
                    <div className="auction-winner-avatar">
                      {String(winner.winner_name || 'W').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="auction-winner-name">{winner.winner_name || 'Subscriber'}</h4>
                      <p className="auction-winner-group">{winner.group_name || 'Chit Scheme'}</p>
                    </div>
                  </div>
                  <div className="auction-winner-right">
                    <div className="auction-winner-bid">{formatCurrency(winner.amount_taken || 0)}</div>
                    <div className="auction-winner-date">
                      {winner.auction_date ? new Date(winner.auction_date).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── 6. RECENT COLLECTIONS & OVERDUE RECONCILIATION TABLE ─── */}
      <div className="dash-panel" style={{ marginTop: 4 }}>
        <div className="dash-panel-header">
          <div className="dash-panel-title-group">
            <RiBarChartLine size={18} color="#059669" />
            <h3 className="dash-panel-title">Subscribers Due for Reconciliation & Overdue Tracker</h3>
          </div>
          <button
            type="button"
            className="dash-panel-action-link"
            onClick={() => navigate('/admin/defaulters')}
          >
            Open Defaulter Desk <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-payments-table">
            <thead>
              <tr>
                <th>Subscriber Name</th>
                <th>Chit Scheme</th>
                <th>Contact</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                    All current cycle subscriptions are verified and up to date! No overdue accounts detected.
                  </td>
                </tr>
              ) : (
                pendingPayments.slice(0, 8).map((pm, idx) => {
                  const isOverdue = pm.status === 'overdue' || (pm.days_overdue && pm.days_overdue > 0);
                  return (
                    <tr key={pm.id || idx}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{pm.user_name || 'Subscriber'}</strong>
                      </td>
                      <td>{pm.group_name || '--'}</td>
                      <td>{pm.user_phone || '--'}</td>
                      <td>{pm.due_date ? new Date(pm.due_date).toLocaleDateString() : 'Current Cycle'}</td>
                      <td>
                        <strong style={{ color: isOverdue ? '#dc2626' : '#0f172a' }}>
                          {formatCurrency(pm.amount)}
                        </strong>
                      </td>
                      <td>
                        <span className={`dash-status-pill ${isOverdue ? 'dash-status-overdue' : 'dash-status-pending'}`}>
                          {isOverdue ? `Overdue (${pm.days_overdue || 1}d)` : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="dash-action-btn-mini"
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            background: isOverdue ? '#dc2626' : '#2563eb'
                          }}
                          onClick={() => navigate(isOverdue ? '/admin/defaulters' : '/admin/reports')}
                        >
                          {isOverdue ? 'Collect' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 7. RECENT TRANSACTIONS / LIVE ACTIVITY STREAM ─── */}
      <div className="dash-panel" style={{ marginTop: 4 }}>
        <div className="dash-panel-header">
          <div className="dash-panel-title-group">
            <Activity size={18} color="#2563eb" />
            <h3 className="dash-panel-title">Recent Real-time Activity & Collections Feed</h3>
          </div>
          <button
            type="button"
            className="dash-panel-action-link"
            onClick={() => navigate('/admin/reports')}
          >
            All Ledger Reports <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-payments-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Chit Scheme</th>
                <th>Transaction Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No recent payment records logged yet.
                  </td>
                </tr>
              ) : (
                recentActivities.slice(0, 6).map((act, idx) => (
                  <tr key={act.id || idx}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{act.user_name || 'Subscriber'}</strong>
                    </td>
                    <td>{act.group_name || 'Chit Group'}</td>
                    <td>
                      <strong style={{ color: '#059669' }}>
                        {formatCurrency(act.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className="dash-status-pill" style={{ background: '#ecfdf5', color: '#059669' }}>
                        {(act.status || 'PAID').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>
                      {act.updated_at ? new Date(act.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── BROADCAST ANNOUNCEMENT MODAL ─── */}
      {showBroadcastModal && (
        <div className="dash-modal-backdrop" onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}>
          <div className="dash-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Radio size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Broadcast Announcement</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Push instant notification to subscribers</p>
                </div>
              </div>
              <button
                type="button"
                className="dash-modal-close-btn"
                onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {broadcastNotice && (
              <div style={{
                margin: '16px 20px 0',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: broadcastNotice.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: broadcastNotice.type === 'error' ? '#dc2626' : '#15803d',
                border: `1px solid ${broadcastNotice.type === 'error' ? '#fecaca' : '#bbf7d0'}`
              }}>
                {broadcastNotice.text}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} style={{ padding: '20px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Target Audience
                </label>
                <select
                  value={broadcastTargetGroup}
                  onChange={e => setBroadcastTargetGroup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="">📢 All Registered Subscribers (Global Broadcast)</option>
                  {groups.filter(g => g.status?.toLowerCase() === 'ongoing' || g.status?.toLowerCase() === 'active').map(g => (
                    <option key={g.id} value={g.id}>👥 {g.name || g.group_name} Members</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reverse Auction Scheduled for Tomorrow at 6 PM"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    outline: 'none',
                    color: '#0f172a'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Message Details
                </label>
                <textarea
                  placeholder="Type announcement message details for your subscribers..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    outline: 'none',
                    resize: 'vertical',
                    color: '#0f172a',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  disabled={sendingBroadcast}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#db2777',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: sendingBroadcast ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: sendingBroadcast ? 0.7 : 1
                  }}
                >
                  {sendingBroadcast ? (
                    <>Sending Broadcast...</>
                  ) : (
                    <><Send size={15} /> Send Broadcast</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
