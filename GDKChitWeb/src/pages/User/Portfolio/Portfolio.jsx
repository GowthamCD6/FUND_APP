import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  RefreshCw, Users, CheckCircle2, Clock, AlertTriangle,
  CircleDollarSign, ChevronRight, Loader2, Coins, Building2,
  TrendingUp, Layers, Landmark, Calendar, Sparkles
} from 'lucide-react';
import './Portfolio.css';
import GroupDetailedInfo from './GroupDetailedInfo.jsx';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusBadge = (status) => {
  const s = String(status || 'active').toLowerCase();
  switch (s) {
    case 'completed':
    case 'paid':
      return {
        label: 'COMPLETED',
        bg: '#ECFDF5',
        color: '#059669',
        border: '#A7F3D0',
        dot: '#10B981',
      };
    case 'overdue':
      return {
        label: 'OVERDUE',
        bg: '#FEF2F2',
        color: '#DC2626',
        border: '#FECACA',
        dot: '#EF4444',
      };
    case 'pending':
      return {
        label: 'PENDING',
        bg: '#FFFBEB',
        color: '#D97706',
        border: '#FDE68A',
        dot: '#F59E0B',
      };
    default:
      return {
        label: 'ACTIVE',
        bg: '#EBF3ED',
        color: '#1B3322',
        border: '#C8DEC9',
        dot: '#2E7D32',
      };
  }
};

const Portfolio = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailGroup, setDetailGroup] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeRequest('/user/portfolio');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load portfolio');
      const groupList = data.data || [];
      setGroups(groupList);
      if (groupList.length > 0) {
        setSelectedGroupId((prev) => (prev && groupList.some(g => g.id === prev) ? prev : groupList[0].id));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalInvested = useMemo(() => {
    return groups.reduce((s, g) => s + (Number(g.totalPaid) || 0), 0);
  }, [groups]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  const selectedPaid = Number(selectedGroup?.totalPaid) || 0;
  const selectedPool = Number(selectedGroup?.investmentAmount) || 0;

  const activeGroups = useMemo(() => {
    return groups.filter((g) => !['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
  }, [groups]);

  const completedGroups = useMemo(() => {
    return groups.filter((g) => ['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
  }, [groups]);

  const currentGroups = activeTab === 'active' ? activeGroups : completedGroups;

  const getProgress = (g) => {
    const cur = Number(g.currentMonth) || 0;
    const total = Number(g.totalMonths) || 20;
    return Math.min(100, Math.max(0, Math.round((cur / total) * 100)));
  };

  if (loading) {
    return (
      <div className="pf-container">
        <div className="pf-state-box">
          <Loader2 size={36} className="pf-spin" color="#2E7D32" />
          <p className="pf-state-text">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-container">
        <div className="pf-state-box">
          <AlertTriangle size={42} color="#DC2626" />
          <h3 className="pf-state-title">Unable to Load Portfolio</h3>
          <p className="pf-state-desc">{error}</p>
          <button className="pf-btn-retry" onClick={load}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="pf-container">
        <div className="pf-state-box">
          <Users size={48} color="#94A3B8" />
          <h3 className="pf-state-title">No Portfolio Data</h3>
          <p className="pf-state-desc">You have not joined any active chit groups yet.</p>
          <a href="/user/join-group" className="pf-btn-join">
            Join a Chit Scheme
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      {/* ── 1. Top Toolbar (Tabs & Refresh) ── */}
      <div className="pf-toolbar-card">
        <div className="pf-tabs-group">
          <button
            type="button"
            className={`pf-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span className="pf-tab-dot" />
            Active Groups ({activeGroups.length})
          </button>
          <button
            type="button"
            className={`pf-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedGroups.length})
          </button>
        </div>

        <button
          type="button"
          className="pf-btn-refresh"
          onClick={load}
          disabled={loading}
          title="Refresh Portfolio"
        >
          <RefreshCw size={14} className={loading ? 'pf-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 2. Hero Stats Row (Total Invested & Paid in Selected Group) ── */}
      <div className="pf-stats-grid">
        {/* Stat Card 1: Total Amount Invested */}
        <div className="pf-stat-card primary">
          <div className="pf-stat-icon total">
            <Coins size={22} />
          </div>
          <div className="pf-stat-info">
            <span className="pf-stat-label">TOTAL AMOUNT INVESTED</span>
            <h3 className="pf-stat-val">{formatCurrency(totalInvested)}</h3>
            <span className="pf-stat-sub">Across all {groups.length} enrolled schemes</span>
          </div>
        </div>

        {/* Stat Card 2: Paid in Selected Group */}
        <div className="pf-stat-card">
          <div className="pf-stat-icon group">
            <Users size={22} />
          </div>
          <div className="pf-stat-info">
            <div className="pf-stat-header-row">
              <span className="pf-stat-label">PAID IN {selectedGroup ? selectedGroup.groupName : 'SELECTED GROUP'}</span>
              {selectedGroup && (
                <span className="pf-stat-pool-badge">
                  Target: {formatCurrency(selectedPool)}
                </span>
              )}
            </div>
            <h3 className="pf-stat-val text-emerald">{formatCurrency(selectedPaid)}</h3>
            <span className="pf-stat-sub">
              Remaining: {formatCurrency(Math.max(0, selectedPool - selectedPaid))}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Group Selector Chips Strip ── */}
      <div className="pf-chips-strip">
        <div className="pf-chips-label">
          <Sparkles size={13} color="#2E7D32" />
          <span>Inspect Paid per Scheme:</span>
        </div>
        <div className="pf-chips-scroll">
          {groups.map((g) => {
            const isSelected = selectedGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`pf-chip-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedGroupId(g.id)}
                title={`Inspect payment progress for ${g.groupName}`}
              >
                <span className="pf-chip-dot" />
                <span className="pf-chip-name">{g.groupName}</span>
                <span className="pf-chip-amount">({formatCurrency(g.investmentAmount)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Group Cards Grid ── */}
      {currentGroups.length > 0 ? (
        <div className="pf-cards-grid">
          {currentGroups.map((g) => {
            const pct = getProgress(g);
            const badge = getStatusBadge(g.paymentStatus);
            const totalMonths = Number(g.totalMonths) || 20;
            const curMonth = Number(g.currentMonth) || 0;
            const monthlyShare = Number(g.monthlyContribution) || Math.round((Number(g.investmentAmount) || 100000) / totalMonths);
            const poolValue = Number(g.investmentAmount) || 0;
            const paidValue = Number(g.totalPaid) || 0;

            return (
              <div
                key={g.id}
                className="pf-group-card"
                onClick={() => setDetailGroup(g)}
                role="button"
                tabIndex={0}
                title="Click to view detailed monthly passbook statement"
              >
                {/* Header: Title, Badges, Circular Chevron */}
                <div className="pf-card-top">
                  <div className="pf-card-title-col">
                    <h3 className="pf-card-name">{g.groupName || g.group_name}</h3>
                    <div className="pf-card-badges">
                      <span
                        className="pf-badge-status"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          borderColor: badge.border,
                        }}
                      >
                        <span className="pf-badge-dot" style={{ background: badge.dot }} />
                        {badge.label}
                      </span>
                      <span className="pf-badge-cycle">
                        <Calendar size={11} />
                        Cycle {curMonth} of {totalMonths}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pf-card-arrow"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailGroup(g);
                    }}
                    title="View Group Passbook"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* 4-Metric Grid (Matches Member Chit Card UI) */}
                <div className="pf-card-metrics-grid">
                  <div className="pf-metric-box">
                    <span className="pf-metric-label">
                      <Landmark size={12} color="#6B7A6E" />
                      Chit Value
                    </span>
                    <strong className="pf-metric-val">{formatCurrency(poolValue)}</strong>
                  </div>

                  <div className="pf-metric-box">
                    <span className="pf-metric-label">
                      <CircleDollarSign size={12} color="#6B7A6E" />
                      Monthly Share
                    </span>
                    <strong className="pf-metric-val">{formatCurrency(monthlyShare)}/mo</strong>
                  </div>

                  <div className="pf-metric-box">
                    <span className="pf-metric-label">
                      <Users size={12} color="#6B7A6E" />
                      Total Members
                    </span>
                    <strong className="pf-metric-val">{g.totalMembers || totalMonths} Subs</strong>
                  </div>

                  <div className="pf-metric-box highlight">
                    <span className="pf-metric-label">
                      <CheckCircle2 size={12} color="#15803d" />
                      My Total Paid
                    </span>
                    <strong className="pf-metric-val text-emerald">{formatCurrency(paidValue)}</strong>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="pf-progress-section">
                  <div className="pf-progress-header">
                    <span>Cycle Progress: {curMonth}/{totalMonths}</span>
                    <strong style={{ color: badge.color }}>{pct}% Complete</strong>
                  </div>
                  <div className="pf-progress-track">
                    <div
                      className="pf-progress-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          badge.label === 'COMPLETED'
                            ? '#10B981'
                            : 'linear-gradient(90deg, #1B3322 0%, #2E7D32 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* Card Footer (Next Due & Click CTA) */}
                <div className="pf-card-footer">
                  <span className="pf-due-info">
                    Next Due: <strong>{g.estimatedPayDate || g.endDate || 'Standard Cycle'}</strong>
                  </span>
                  <span className="pf-click-cta">
                    View Statement <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pf-state-box empty">
          <Users size={42} color="#94A3B8" />
          <h3 className="pf-state-title">No Groups Found</h3>
          <p className="pf-state-desc">
            {activeTab === 'active'
              ? 'You have no active chit groups in this category.'
              : 'You have no completed chit groups yet.'}
          </p>
        </div>
      )}

      {/* ── 5. Detailed Info Modal (Opens on Card Click) ── */}
      {detailGroup && (
        <GroupDetailedInfo
          group={detailGroup}
          onClose={() => setDetailGroup(null)}
        />
      )}
    </div>
  );
};

export default Portfolio;
