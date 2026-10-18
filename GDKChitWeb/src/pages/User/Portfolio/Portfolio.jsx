import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  Coins, Building2, TrendingUp, CircleDollarSign, CheckCircle2,
  Calendar, ChevronRight, RefreshCw, Loader2, Landmark, Users,
  Sparkles, ShieldCheck, AlertTriangle
} from 'lucide-react';
import '../GroupCard/GroupCard.css';
import './Portfolio.css';
import GroupDetailedInfo from './GroupDetailedInfo.jsx';

const formatINR = (amt) => {
  if (amt == null || amt === '' || isNaN(Number(amt))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amt));
};

const formatDueDate = (dateStr) => {
  if (!dateStr) return 'Standard Schedule';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
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

  const totalPoolValue = useMemo(() => {
    return groups.reduce((s, g) => s + (Number(g.investmentAmount) || 0), 0);
  }, [groups]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  const selectedPaid = Number(selectedGroup?.totalPaid) || 0;
  const selectedPool = Number(selectedGroup?.investmentAmount) || 0;
  const selectedRemaining = Math.max(0, selectedPool - selectedPaid);
  const selectedProgress = selectedPool > 0 ? Math.min(100, Math.round((selectedPaid / selectedPool) * 100)) : 0;

  const activeGroups = useMemo(() => {
    return groups.filter((g) => !['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
  }, [groups]);

  const completedGroups = useMemo(() => {
    return groups.filter((g) => ['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
  }, [groups]);

  const currentGroups = activeTab === 'active' ? activeGroups : completedGroups;

  if (loading) {
    return (
      <div className="gc-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Loader2 size={38} className="gc-spin" color="#2E7D32" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: 0, color: '#0B140E', fontSize: 18, fontWeight: 700 }}>
          Loading Your Investment Portfolio...
        </h3>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
          Fetching active chit passbooks from central ledger
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gc-container">
        <div className="gc-empty-card">
          <AlertTriangle size={44} color="#DC2626" />
          <h3>Unable to Load Portfolio</h3>
          <p>{error}</p>
          <button type="button" className="gc-btn-secondary" onClick={load} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gc-container">
      {/* ── 1. Top Filter Tabs & Refresh Bar ── */}
      <div className="gc-tabs-row" style={{ background: '#ffffff', padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
        <div className="gc-tabs-group">
          <button
            type="button"
            className={`gc-tab-pill ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Groups ({activeGroups.length})
          </button>
          <button
            type="button"
            className={`gc-tab-pill ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedGroups.length})
          </button>
        </div>

        <button
          type="button"
          className="gc-btn-secondary"
          onClick={load}
          disabled={loading}
          title="Refresh Portfolio Records"
        >
          <RefreshCw size={13} className={loading ? 'gc-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 2. Top Hero KPI Metrics Row (Compact Style) ── */}
      <div className="gc-kpi-grid compact">
        {/* Metric 1: Total Invested */}
        <div className="gc-kpi-card compact highlight">
          <div className="gc-kpi-top">
            <span className="gc-kpi-label">Total Amount Invested</span>
            <div className="gc-kpi-icon-wrap emerald">
              <Coins size={15} />
            </div>
          </div>
          <div className="gc-kpi-value text-emerald">
            {formatINR(totalInvested)}
          </div>
          <div className="gc-kpi-meta">
            <span className="gc-kpi-tag emerald">
              {groups.length} Schemes
            </span>
            <span className="gc-kpi-subtext">Overall Paid</span>
          </div>
        </div>

        {/* Metric 2: Paid in Selected Scheme */}
        <div className="gc-kpi-card compact plan-spent">
          <div className="gc-kpi-top">
            <span className="gc-kpi-label" title={selectedGroup ? (selectedGroup.groupName || selectedGroup.group_name) : ''}>
              Paid: <strong>{selectedGroup ? (selectedGroup.groupName || selectedGroup.group_name) : 'Select Scheme'}</strong>
            </span>
            <div className="gc-kpi-icon-wrap blue">
              <CircleDollarSign size={15} />
            </div>
          </div>
          <div className="gc-kpi-value text-blue">
            {formatINR(selectedPaid)}
          </div>
          <div className="gc-kpi-meta">
            <span className="gc-kpi-tag blue">
              Target: {formatINR(selectedPool)}
            </span>
            <span className="gc-kpi-subtext">Rem: {formatINR(selectedRemaining)}</span>
          </div>
        </div>

        {/* Metric 3: Subscribed Chit Pool Value */}
        <div className="gc-kpi-card compact">
          <div className="gc-kpi-top">
            <span className="gc-kpi-label">Subscribed Chit Value</span>
            <div className="gc-kpi-icon-wrap green">
              <Building2 size={15} />
            </div>
          </div>
          <div className="gc-kpi-value">
            {formatINR(totalPoolValue)}
          </div>
          <div className="gc-kpi-meta">
            <span className="gc-kpi-tag green">
              {activeGroups.length} Active
            </span>
            <span className="gc-kpi-subtext">Total Maturity</span>
          </div>
        </div>

        {/* Metric 4: Selected Scheme Progress */}
        <div className="gc-kpi-card compact">
          <div className="gc-kpi-top">
            <span className="gc-kpi-label">Scheme Remittance</span>
            <div className="gc-kpi-icon-wrap purple">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="gc-kpi-value text-purple">
            {selectedProgress}%
          </div>
          <div className="gc-kpi-meta">
            <span className="gc-kpi-tag purple">
              Cycle {selectedGroup?.currentMonth || 0}/{selectedGroup?.totalMonths || 20}
            </span>
            <span className="gc-kpi-subtext">Remitted</span>
          </div>
        </div>
      </div>

      {/* ── 3. Quick-Inspect Scheme Selector Chips Strip ── */}
      {groups.length > 0 && (
        <div className="gc-plan-selector-strip">
          <div className="gc-plan-strip-label">
            <Sparkles size={13} color="#2E7D32" />
            <span>Inspect Scheme Paid:</span>
          </div>
          <div className="gc-plan-chips-scroll">
            {groups.map((g) => {
              const isSelected = selectedGroupId === g.id;
              const spent = Number(g.totalPaid) || 0;
              const pool = Number(g.investmentAmount) || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`gc-plan-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedGroupId(g.id)}
                  title={`Inspect spent amount for ${g.groupName || g.group_name}`}
                >
                  <span className="gc-plan-chip-dot" />
                  <span className="gc-plan-chip-name">{g.groupName || g.group_name}</span>
                  <strong className="gc-plan-chip-spent">{formatINR(spent)} paid</strong>
                  <span className="gc-plan-chip-pool">({formatINR(pool)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Chit Cards Grid (EXACT UI AS IN AUCTION PAGE) ── */}
      {currentGroups.length === 0 ? (
        <div className="gc-empty-card">
          <Landmark size={44} color="#94a3b8" />
          <h3>No Chit Groups Found</h3>
          <p>
            {activeTab === 'active'
              ? 'You have no active chit schemes in this category yet.'
              : 'You have no completed chit schemes yet.'}
          </p>
          <a href="/user/join-group" className="gc-btn-join">
            Join a Chit Group
          </a>
        </div>
      ) : (
        <div className="gc-cards-grid">
          {currentGroups.map((group) => {
            const totalMonths = Number(group.totalMonths) || 20;
            const currentMonth = Number(group.currentMonth) || 1;
            const progressPercent = Math.min(100, Math.max(0, Math.round((currentMonth / totalMonths) * 100)));
            const poolValue = Number(group.investmentAmount) || 100000;
            const monthlyShare = Number(group.monthlyContribution) || Math.round(poolValue / totalMonths);
            const userPaid = Number(group.totalPaid) || 0;
            const isPaid = ['completed', 'paid'].includes(String(group.paymentStatus || '').toLowerCase());
            const isOverdue = String(group.paymentStatus || '').toLowerCase() === 'overdue';
            const isPending = String(group.paymentStatus || '').toLowerCase() === 'pending';

            const statusBg = isPaid ? '#E8F5E9' : (isOverdue ? '#FEF2F2' : (isPending ? '#FFFBEB' : '#EBF3ED'));
            const statusColor = isPaid ? '#2E7D32' : (isOverdue ? '#DC2626' : (isPending ? '#D97706' : '#1B3322'));
            const statusBorder = isPaid ? '#C8E6C9' : (isOverdue ? '#FECACA' : (isPending ? '#FDE68A' : '#C8DEC9'));
            const statusDot = isPaid ? '#10B981' : (isOverdue ? '#EF4444' : (isPending ? '#F59E0B' : '#2E7D32'));
            const statusLabel = isPaid ? 'COMPLETED' : (isOverdue ? 'OVERDUE' : (isPending ? 'PENDING' : 'ACTIVE'));
            const isSelected = selectedGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`gc-card mg-enhanced-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setDetailGroup(group);
                }}
                role="button"
                tabIndex={0}
                title="Click to view detailed monthly passbook statement"
              >
                {/* Card Header (Exact Auction Page Header) */}
                <div className="gc-card-header">
                  <div className="gc-card-header-left">
                    <h3 className="gc-card-title">{group.groupName || group.group_name}</h3>
                    <div className="gc-card-badges-row">
                      <span
                        className="gc-badge-status"
                        style={{
                          background: statusBg,
                          color: statusColor,
                          borderColor: statusBorder,
                        }}
                      >
                        <span className="gc-status-dot" style={{ background: statusDot }} />
                        {statusLabel}
                      </span>
                      <span className="gc-badge-cycle">
                        <Calendar size={11} />
                        Cycle {currentMonth} of {totalMonths}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gc-card-arrow-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupId(group.id);
                      setDetailGroup(group);
                    }}
                    title="Open passbook"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Financial Matrix (Exact 4-Box Grid from Auction Page) */}
                <div className="gc-card-metrics-grid">
                  <div className="gc-metric-box">
                    <span className="gc-metric-label">
                      <Landmark size={12} color="#64748b" />
                      Chit Value
                    </span>
                    <strong className="gc-metric-val">{formatINR(poolValue)}</strong>
                  </div>

                  <div className="gc-metric-box">
                    <span className="gc-metric-label">
                      <CircleDollarSign size={12} color="#64748b" />
                      Monthly Share
                    </span>
                    <strong className="gc-metric-val">{formatINR(monthlyShare)}/mo</strong>
                  </div>

                  <div className="gc-metric-box">
                    <span className="gc-metric-label">
                      <Users size={12} color="#64748b" />
                      Total Members
                    </span>
                    <strong className="gc-metric-val">{group.totalMembers || totalMonths} Subs</strong>
                  </div>

                  <div className="gc-metric-box highlight">
                    <span className="gc-metric-label">
                      <CheckCircle2 size={12} color="#15803d" />
                      My Total Paid
                    </span>
                    <strong className="gc-metric-val text-emerald">{formatINR(userPaid)}</strong>
                  </div>
                </div>

                {/* Progress Bar (Exact Auction Page Progress) */}
                <div className="gc-card-progress-section">
                  <div className="gc-progress-header">
                    <span>Cycle Progress</span>
                    <strong>{progressPercent}% Complete</strong>
                  </div>
                  <div className="gc-progress-track">
                    <div
                      className="gc-progress-bar"
                      style={{
                        width: `${progressPercent}%`,
                        background: isPaid ? '#10B981' : 'linear-gradient(90deg, #1B3322 0%, #2E7D32 100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Card Footer (Exact Auction Page Footer) */}
                <div className="gc-card-footer">
                  <span className="gc-due-info">
                    Next Due: <strong>{formatDueDate(group.estimatedPayDate || group.endDate)}</strong>
                  </span>
                  <span className="gc-click-cta">
                    View Statement <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. Detailed Info Modal (Opens on Card Click) ── */}
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
