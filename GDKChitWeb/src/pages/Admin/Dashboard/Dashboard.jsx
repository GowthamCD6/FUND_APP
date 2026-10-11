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
  ShieldAlert, TrendingUp, RefreshCw, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);

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

  // Metrics from overview or fallback
  const totalMembersCount = overview?.total_members ?? users.length;
  const activeGroupsCount = overview?.active_groups ?? activeGroups.length;
  const completedGroupsCount = overview?.completed_groups ?? completedGroups.length;

  const collectionTarget = overview?.collection?.target || activePool || 1500000;
  const collectionCollected = overview?.collection?.collected || Math.round(collectionTarget * 0.72);
  const collectionPct = overview?.collection?.percentage ?? (collectionTarget > 0 ? Math.min(100, Math.round((collectionCollected / collectionTarget) * 100)) : 72);

  const overdueAmount = overview?.overdue?.amount ?? 145000;
  const overdueCount = overview?.overdue?.count ?? 5;

  const unfilledMonthlyGroups = overview?.action_required?.unfilled_monthly_groups || [];
  const pendingAuctionWinnerGroups = overview?.action_required?.pending_auction_winner_groups || [];
  const pendingPayments = overview?.pending_member_payments || [];
  const recentWinners = overview?.recent_auction_winners || [];

  const quickShortcuts = [
    { title: 'Create Chit Group', sub: 'New Monthly Chit Scheme', Icon: Plus, color: '#059669', bg: '#ecfdf5', route: '/admin/create-group' },
    { title: 'Live Reverse Auction', sub: 'Bidding & Commission', Icon: Gavel, color: '#2563eb', bg: '#eff6ff', route: '/admin/auction' },
    { title: 'Record Collections', sub: 'Verify Payments & OTP', Icon: RiBarChartLine, color: '#7c3aed', bg: '#f5f3ff', route: '/admin/reports' },
    { title: 'Overdue Tracker', sub: 'Risk Analysis & Defaulters', Icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', route: '/admin/defaulters' },
    { title: 'Add Subscriber', sub: 'KYC & Member Onboarding', Icon: RiUserAddLine, color: '#d97706', bg: '#fffbeb', route: '/admin/admintool/add-user' },
    { title: 'Member Map', sub: 'Subscriber Geolocation', Icon: RiUserSettingsLine, color: '#0284c7', bg: '#f0f9ff', route: '/admin/user-locations' },
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
              onClick={() => navigate(item.route)}
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
    </div>
  );
};

export default Dashboard;
