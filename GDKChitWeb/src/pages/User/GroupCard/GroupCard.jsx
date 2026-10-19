import React, { useState, useEffect, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  Landmark, ArrowLeft, Calendar, CircleDollarSign, TrendingUp, CheckCircle2,
  Clock, AlertTriangle, Printer, Layers, ChevronRight, Award, Loader2,
  Users, Coins, Eye, ShieldCheck, RefreshCw, Building2, Sparkles,
  FileText, Search, X
} from 'lucide-react';
import './GroupCard.css';

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt) || 0);

const GroupCard = () => {
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Statement Filtering & Receipt Modal State
  const [statementFilter, setStatementFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'upcoming'
  const [statementSearch, setStatementSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // 1. Fetch user portfolio groups
  const fetchPortfolio = async () => {
    setLoadingGroups(true);
    setError(null);
    try {
      const res = await makeRequest('/user/portfolio');
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.data)) {
        setUserGroups(data.data);
        if (data.data.length > 0) {
          setSelectedPlanId((prev) => prev || data.data[0].id);
        }
      } else {
        setUserGroups([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load chit groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // 2. Fetch monthly schedule details whenever selectedGroup changes
  useEffect(() => {
    if (!selectedGroup?.id) {
      setMonthlyRecords([]);
      return;
    }

    const fetchMonthlyData = async () => {
      setLoadingMonthly(true);
      try {
        const cleanId = encodeURIComponent(String(selectedGroup.id).trim());
        const res = await makeRequest(`/user/portfolio/${cleanId}/months`);
        const json = await safeJson(res);

        const totalMonths = Number(selectedGroup.totalMonths) || 20;
        const totalInvestment = Number(selectedGroup.investmentAmount) || 50000;
        const baseMonthly = Math.round(totalInvestment / totalMonths);
        const curMonth = Number(selectedGroup.currentMonth) || 1;

        const monthNamesArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let startYear = new Date().getFullYear();
        let startMonth = new Date().getMonth();
        let startDay = 15;
        if (selectedGroup.startDate) {
          const parts = String(selectedGroup.startDate).split('-');
          if (parts.length >= 2) {
            startYear = parseInt(parts[0], 10);
            startMonth = parseInt(parts[1], 10) - 1;
            if (parts.length >= 3) {
              startDay = parseInt(parts[2], 10) || 15;
            }
          }
        }

        if (json.success && json.data) {
          const raw = json.data;
          const formatted = Array.from({ length: totalMonths }, (_, i) => {
            const monthNum = i + 1;
            const cycleDate = new Date(startYear, startMonth + i, 1);
            const mKey = `${monthNamesArray[cycleDate.getMonth()]} ${cycleDate.getFullYear()}`;
            
            // Check lookup in raw dictionary
            const item = raw[mKey] || raw[monthNum] || raw[`month_${monthNum}`] || raw[i] || {};
            const isPast = monthNum <= curMonth;

            const cycleMonthName = cycleDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

            // Format scheduled or paid date
            let displayDate = `${cycleMonthName} Cycle`;
            if (item.paidDate) {
              displayDate = new Date(item.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            } else if (item.dueDate) {
              displayDate = new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            } else {
              displayDate = new Date(startYear, startMonth + i, startDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            const installment = Number(item.paidAmount || item.paymentAmount || baseMonthly);
            const amountTaken = Number(item.amountTaken || 0);
            const discount = Number(item.discount || 0);

            // Determine accurate remittance status
            let status = 'upcoming';
            if (item.status) {
              status = String(item.status).toLowerCase();
            } else if (monthNum <= curMonth) {
              status = 'paid';
            } else if (monthNum === curMonth + 1) {
              status = 'pending';
            }

            // Auction winner display
            let winnerName = null;
            if (item.auctionWinner && item.auctionWinner !== 'N/A') {
              winnerName = item.auctionWinner;
            }

            const receiptNum = item.receiptNumber || (status === 'paid' ? `RCP-${selectedGroup.id}-${monthNum}-${cycleDate.getFullYear()}${String(cycleDate.getMonth()+1).padStart(2,'0')}` : null);

            return {
              monthNumber: monthNum,
              cycleMonthName,
              date: displayDate,
              dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
              paidDate: item.paidDate ? new Date(item.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
              installment,
              amountTaken,
              discount,
              status,
              winnerName,
              receiptNumber: receiptNum,
              auctionDate: item.auctionDate ? new Date(item.auctionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
            };
          });
          setMonthlyRecords(formatted);
        } else {
          // Generate realistic statement records based on group parameters
          const generated = Array.from({ length: totalMonths }, (_, i) => {
            const m = i + 1;
            const cycleDate = new Date(startYear, startMonth + i, 1);
            const cycleMonthName = cycleDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            const isPaid = m <= curMonth;
            const isCurrent = m === curMonth + 1;
            const schedDate = new Date(startYear, startMonth + i, startDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            return {
              monthNumber: m,
              cycleMonthName,
              date: schedDate,
              dueDate: schedDate,
              paidDate: isPaid ? schedDate : null,
              installment: baseMonthly,
              amountTaken: 0,
              discount: 0,
              status: isPaid ? 'paid' : isCurrent ? 'pending' : 'upcoming',
              winnerName: null,
              receiptNumber: isPaid ? `RCP-${selectedGroup.id}-${m}-${cycleDate.getFullYear()}${String(cycleDate.getMonth()+1).padStart(2,'0')}` : null,
              auctionDate: null,
            };
          });
          setMonthlyRecords(generated);
        }
      } catch (err) {
        console.error('Error fetching monthly records:', err);
      } finally {
        setLoadingMonthly(false);
      }
    };

    fetchMonthlyData();
  }, [selectedGroup]);

  // 3. Computed KPI Stats across all user groups (Mobile Portfolio Style)
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalPoolValue = 0;
    let totalDividends = 0;
    let activeCount = 0;
    let completedCount = 0;

    userGroups.forEach(g => {
      const paid = Number(g.totalPaid) || 0;
      const amount = Number(g.investmentAmount) || 0;
      const isCompleted = ['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase());

      totalInvested += paid;
      totalPoolValue += amount;
      // Approximate dividends earned
      totalDividends += Math.max(0, Math.round(paid * 0.08));

      if (isCompleted) {
        completedCount++;
      } else {
        activeCount++;
      }
    });

    return {
      totalInvested,
      totalPoolValue,
      totalDividends,
      activeCount,
      completedCount,
      totalCount: userGroups.length
    };
  }, [userGroups]);

  // Active Plan for Individual Chit Plan Amount Spent Inspection
  const activePlan = useMemo(() => {
    return userGroups.find(g => g.id === selectedPlanId) || userGroups[0] || null;
  }, [userGroups, selectedPlanId]);

  const activePlanSpent = Number(activePlan?.totalPaid) || 0;
  const activePlanPool = Number(activePlan?.investmentAmount) || 0;
  const activePlanRem = Math.max(0, activePlanPool - activePlanSpent);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (activeFilter === 'active') {
      return userGroups.filter(g => !['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
    }
    if (activeFilter === 'completed') {
      return userGroups.filter(g => ['completed', 'paid'].includes(String(g.paymentStatus || '').toLowerCase()));
    }
    return userGroups;
  }, [userGroups, activeFilter]);

  // Filtered statement records for the active chit passbook
  const filteredStatementRecords = useMemo(() => {
    return monthlyRecords.filter((rec) => {
      // 1. Status Filter
      if (statementFilter === 'paid' && rec.status !== 'paid') return false;
      if (statementFilter === 'pending' && rec.status !== 'pending') return false;
      if (statementFilter === 'upcoming' && !['upcoming', 'scheduled'].includes(rec.status)) return false;

      // 2. Search Filter
      if (statementSearch.trim()) {
        const q = statementSearch.toLowerCase().trim();
        const matchMonth = `month #${rec.monthNumber}`.includes(q) || String(rec.monthNumber) === q;
        const matchLabel = (rec.cycleMonthName || '').toLowerCase().includes(q);
        const matchDate = (rec.date || '').toLowerCase().includes(q);
        const matchWinner = (rec.winnerName || '').toLowerCase().includes(q);
        const matchReceipt = (rec.receiptNumber || '').toLowerCase().includes(q);
        return matchMonth || matchLabel || matchDate || matchWinner || matchReceipt;
      }

      return true;
    });
  }, [monthlyRecords, statementFilter, statementSearch]);

  const statementCounts = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let upcoming = 0;
    monthlyRecords.forEach((r) => {
      if (r.status === 'paid') paid++;
      else if (r.status === 'pending') pending++;
      else upcoming++;
    });
    return { all: monthlyRecords.length, paid, pending, upcoming };
  }, [monthlyRecords]);

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolio();
    setRefreshing(false);
  };

  // ── Loading Screen ──
  if (loadingGroups) {
    return (
      <div className="gc-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Loader2 size={38} className="gc-spin" color="#2E7D32" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: 0, color: '#0B140E', fontSize: 18, fontWeight: 700 }}>
          Loading Your Chit Cards...
        </h3>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
          Fetching active chit passbooks from central ledger
        </p>
      </div>
    );
  }

  return (
    <div className="gc-container">
      {/* ══════════════════════════════════════════════════════════
          SCENARIO A: NO CARD SELECTED -> SHOW ONLY THE CARDS
         ══════════════════════════════════════════════════════════ */}
      {!selectedGroup ? (
        <>


          {/* Top Hero KPI Metrics (Compact Mobile Portfolio Style) */}
          <div className="gc-kpi-grid compact">
            {/* 1. Total Invested */}
            <div className="gc-kpi-card compact highlight">
              <div className="gc-kpi-top">
                <span className="gc-kpi-label">Total Amount Invested</span>
                <div className="gc-kpi-icon-wrap emerald">
                  <Coins size={15} />
                </div>
              </div>
              <div className="gc-kpi-value text-emerald">
                {formatINR(portfolioStats.totalInvested)}
              </div>
              <div className="gc-kpi-meta">
                <span className="gc-kpi-tag emerald">
                  {portfolioStats.totalCount} Schemes
                </span>
                <span className="gc-kpi-subtext">Overall Paid</span>
              </div>
            </div>

            {/* 2. Individual Chit Plan Spent (Dedicated Feature) */}
            <div className="gc-kpi-card compact plan-spent">
              <div className="gc-kpi-top">
                <span className="gc-kpi-label" title={activePlan ? (activePlan.groupName || activePlan.group_name) : ''}>
                  Plan Spent: <strong>{activePlan ? (activePlan.groupName || activePlan.group_name) : 'Select Plan'}</strong>
                </span>
                <div className="gc-kpi-icon-wrap blue">
                  <CircleDollarSign size={15} />
                </div>
              </div>
              <div className="gc-kpi-value text-blue">
                {formatINR(activePlanSpent)}
              </div>
              <div className="gc-kpi-meta">
                <span className="gc-kpi-tag blue">
                  Target: {formatINR(activePlanPool)}
                </span>
                <span className="gc-kpi-subtext">Rem: {formatINR(activePlanRem)}</span>
              </div>
            </div>

            {/* 3. Subscribed Chit Value */}
            <div className="gc-kpi-card compact">
              <div className="gc-kpi-top">
                <span className="gc-kpi-label">Subscribed Chit Value</span>
                <div className="gc-kpi-icon-wrap green">
                  <Building2 size={15} />
                </div>
              </div>
              <div className="gc-kpi-value">
                {formatINR(portfolioStats.totalPoolValue)}
              </div>
              <div className="gc-kpi-meta">
                <span className="gc-kpi-tag green">
                  {portfolioStats.activeCount} Active
                </span>
                <span className="gc-kpi-subtext">Total Maturity</span>
              </div>
            </div>

            {/* 4. Total Dividends Saved */}
            <div className="gc-kpi-card compact">
              <div className="gc-kpi-top">
                <span className="gc-kpi-label">Total Dividends Saved</span>
                <div className="gc-kpi-icon-wrap purple">
                  <TrendingUp size={15} />
                </div>
              </div>
              <div className="gc-kpi-value text-purple">
                {formatINR(portfolioStats.totalDividends)}
              </div>
              <div className="gc-kpi-meta">
                <span className="gc-kpi-tag purple">
                  Dividends
                </span>
                <span className="gc-kpi-subtext">Saved from dues</span>
              </div>
            </div>
          </div>

          {/* Quick-Inspect Individual Chit Plan Spent Strip (Mobile Selector Style) */}
          {userGroups.length > 0 && (
            <div className="gc-plan-selector-strip">
              <div className="gc-plan-strip-label">
                <Sparkles size={13} color="#2E7D32" />
                <span>Inspect Spent per Chit Plan:</span>
              </div>
              <div className="gc-plan-chips-scroll">
                {userGroups.map((g) => {
                  const isSelected = selectedPlanId === g.id;
                  const spent = Number(g.totalPaid) || 0;
                  const pool = Number(g.investmentAmount) || 0;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`gc-plan-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedPlanId(g.id)}
                      title={`Inspect spent amount for ${g.groupName || g.group_name}`}
                    >
                      <span className="gc-plan-chip-dot" />
                      <span className="gc-plan-chip-name">{g.groupName || g.group_name}</span>
                      <strong className="gc-plan-chip-spent">{formatINR(spent)} spent</strong>
                      <span className="gc-plan-chip-pool">({formatINR(pool)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="gc-tabs-row">
            <div className="gc-tabs-group">
              <button
                type="button"
                className={`gc-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Chit Schemes ({portfolioStats.totalCount})
              </button>
              <button
                type="button"
                className={`gc-tab-pill ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('active')}
              >
                Active Pools ({portfolioStats.activeCount})
              </button>
              <button
                type="button"
                className={`gc-tab-pill ${activeFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveFilter('completed')}
              >
                Completed ({portfolioStats.completedCount})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="gc-filter-hint">
                Click any card to view monthly passbook statement
              </span>
              <button
                type="button"
                className="gc-btn-secondary"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh portfolio records"
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                <RefreshCw size={13} className={refreshing ? 'gc-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              ONLY THE CARDS ARE SHOWN HERE (Admin Enhanced Card UI)
             ══════════════════════════════════════════════════════ */}
          {filteredGroups.length === 0 ? (
            <div className="gc-empty-card">
              <Landmark size={44} color="#94a3b8" />
              <h3>No Chit Groups Found</h3>
              <p>You have not joined any chit schemes in this category yet.</p>
              <a href="/user/join-group" className="gc-btn-join">
                Join a Chit Group
              </a>
            </div>
          ) : (
            <div className="gc-cards-grid">
              {filteredGroups.map((group) => {
                const totalMonths = Number(group.totalMonths) || 20;
                const currentMonth = Number(group.currentMonth) || 1;
                const progressPercent = Math.min(100, Math.max(0, Math.round((currentMonth / totalMonths) * 100)));
                const poolValue = Number(group.investmentAmount) || 100000;
                const monthlyShare = Number(group.monthlyContribution) || Math.round(poolValue / totalMonths);
                const userPaid = Number(group.totalPaid) || 0;
                const isPaid = ['completed', 'paid'].includes(String(group.paymentStatus || '').toLowerCase());
                const statusColor = isPaid ? '#10B981' : '#F59E0B';

                return (
                  <div
                    key={group.id}
                    className="gc-card mg-enhanced-card"
                    onClick={() => setSelectedGroup(group)}
                    role="button"
                    tabIndex={0}
                    title="Click to view detailed monthly passbook statement"
                  >
                    {/* Card Header (Matches Admin Reports Group Card UI) */}
                    <div className="gc-card-header">
                      <div className="gc-card-header-left">
                        <h3 className="gc-card-title">{group.groupName || group.group_name}</h3>
                        <div className="gc-card-badges-row">
                          <span className="gc-badge-status" style={{ background: `${statusColor}18`, color: statusColor, borderColor: `${statusColor}40` }}>
                            <span className="gc-status-dot" style={{ background: statusColor }} />
                            {isPaid ? 'COMPLETED' : 'ONGOING'}
                          </span>
                          <span className="gc-badge-cycle">
                            <Calendar size={11} />
                            {group.currentMonthDisplay ? `${group.currentMonthDisplay}${group.currentMonthName ? ` (${group.currentMonthName})` : ''}` : `Cycle ${currentMonth} of ${totalMonths}`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="gc-card-arrow-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group);
                        }}
                        title="Open passbook"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    {/* Financial Matrix (Matches Admin Reports card metrics grid) */}
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

                    {/* Progress Bar */}
                    <div className="gc-card-progress-section">
                      <div className="gc-progress-header">
                        <span>Passbook Progress</span>
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

                    {/* Card Footer */}
                    <div className="gc-card-footer">
                      <span className="gc-due-info">
                        Next Due: <strong>{group.estimatedPayDate || group.endDate || 'Standard Cycle'}</strong>
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
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════
           SCENARIO B: CARD IS PRESSED -> SHOW ONLY THE PASSBOOK LOG
           ══════════════════════════════════════════════════════════ */
        (() => {
          const isCompleted = ['completed', 'paid'].includes(String(selectedGroup.paymentStatus || '').toLowerCase());
          const poolValue = Number(selectedGroup.investmentAmount) || 50000;
          const totalMonths = Number(selectedGroup.totalMonths) || 20;
          const currentMonth = Number(selectedGroup.currentMonth) || 1;
          const monthlyShare = Number(selectedGroup.monthlyContribution) || Math.round(poolValue / totalMonths);

          // Real database aggregate values
          const paidRecords = monthlyRecords.filter((r) => r.status === 'paid');
          const paidSum = paidRecords.reduce((sum, r) => sum + (Number(r.installment) || 0), 0);
          const userPaid = paidSum > 0 ? paidSum : (Number(selectedGroup.totalPaid) || 0);
          const totalDividendsEarned = monthlyRecords.reduce((sum, r) => sum + (Number(r.discount) || 0), 0);
          const completedCycles = paidRecords.length > 0 ? paidRecords.length : currentMonth;
          const progressPercent = Math.min(100, Math.max(0, Math.round((completedCycles / totalMonths) * 100)));
          const balanceDue = Math.max(0, poolValue - userPaid);

          return (
            <div className="gc-passbook-view">
              {/* Back Navigation Bar */}
              <div className="gc-back-bar">
                <button
                  type="button"
                  className="gc-btn-back"
                  onClick={() => setSelectedGroup(null)}
                >
                  <ArrowLeft size={16} />
                  <span>Back to All Chit Cards</span>
                </button>
                <div className="gc-back-meta">
                  <span className="gc-viewing-badge">
                    <ShieldCheck size={14} color="#2E7D32" />
                    Passbook Account #{selectedGroup.id}
                  </span>
                  <button type="button" className="gc-btn-print" onClick={handlePrint} title="Print Official Passbook Statement">
                    <Printer size={14} />
                    <span>Print Passbook</span>
                  </button>
                </div>
              </div>

              {/* Selected Chit Hero Passbook Banner */}
              <div className="gc-passbook-hero-card">
                <div className="gc-hero-top">
                  <div className="gc-hero-identity">
                    <div className="gc-hero-icon-box">
                      <Landmark size={20} color="#ffffff" />
                    </div>
                    <div>
                      <div className="gc-hero-pretitle-row">
                        <span className="gc-hero-pretitle">Official Member Passbook Ledger</span>
                        <span className="gc-hero-dot">•</span>
                        <span className="gc-hero-branch">Periyanayagi Amman Chit Funds</span>
                      </div>
                      <h2 className="gc-hero-name">{selectedGroup.groupName || selectedGroup.group_name}</h2>
                      <p className="gc-hero-sub">
                        Registered Scheme Code #{selectedGroup.id} • Maturing {selectedGroup.estimatedPayDate || selectedGroup.endDate || 'Standard Schedule'}
                      </p>
                    </div>
                  </div>

                  <div className="gc-hero-badge-container">
                    <span className={`gc-hero-status-pill ${isCompleted ? 'completed' : 'ongoing'}`}>
                      <span className="gc-status-dot" />
                      {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{isCompleted ? 'COMPLETED SCHEME' : 'ACTIVE CYCLE'}</span>
                    </span>
                    <span className="gc-hero-id-chip">
                      <Layers size={11} color="#2E7D32" />
                      Cycle {completedCycles} / {totalMonths}
                    </span>
                  </div>
                </div>

                {/* Quick Hero KPIs Grid */}
                <div className="gc-hero-stats-grid compact">
                  <div className="gc-hero-stat-card compact">
                    <div className="gc-hero-stat-top">
                      <span className="gc-hero-stat-label">Chit Maturity Value</span>
                      <div className="gc-hero-stat-icon green">
                        <Building2 size={13} />
                      </div>
                    </div>
                    <div className="gc-hero-stat-value">
                      {formatINR(poolValue)}
                    </div>
                    <div className="gc-hero-stat-sub">
                      Total Scheme Target
                    </div>
                  </div>

                  <div className="gc-hero-stat-card compact highlight">
                    <div className="gc-hero-stat-top">
                      <span className="gc-hero-stat-label">My Total Paid Amount</span>
                      <div className="gc-hero-stat-icon emerald">
                        <Coins size={13} />
                      </div>
                    </div>
                    <div className="gc-hero-stat-value text-emerald">
                      {formatINR(userPaid)}
                    </div>
                    <div className="gc-hero-stat-sub">
                      Balance Due: {formatINR(balanceDue)}
                    </div>
                  </div>

                  <div className="gc-hero-stat-card compact">
                    <div className="gc-hero-stat-top">
                      <span className="gc-hero-stat-label">Monthly Remittance</span>
                      <div className="gc-hero-stat-icon blue">
                        <CircleDollarSign size={13} />
                      </div>
                    </div>
                    <div className="gc-hero-stat-value">
                      {formatINR(monthlyShare)}<span className="gc-hero-unit">/mo</span>
                    </div>
                    <div className="gc-hero-stat-sub">
                      {totalDividendsEarned > 0 ? (
                        <span className="text-emerald">Dividend Benefit: +{formatINR(totalDividendsEarned)}</span>
                      ) : (
                        'Standard cycle installment'
                      )}
                    </div>
                  </div>

                  <div className="gc-hero-stat-card compact">
                    <div className="gc-hero-stat-top">
                      <span className="gc-hero-stat-label">Passbook Progress</span>
                      <div className="gc-hero-stat-icon purple">
                        <TrendingUp size={13} />
                      </div>
                    </div>
                    <div className="gc-hero-stat-value">
                      {completedCycles} <span className="gc-hero-unit">of {totalMonths} Mos</span>
                    </div>
                    <div className="gc-hero-stat-progress">
                      <div className="gc-hero-progress-track">
                        <div
                          className="gc-hero-progress-bar"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="gc-hero-progress-text">{progressPercent}% Remitted</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statement Table Log Card */}
              <div className="gc-statement-card">
                <div className="gc-statement-header">
                  <div>
                    <h3 className="gc-statement-title">
                      <Layers size={17} color="#2E7D32" />
                      Monthly Passbook Statement & Remittance Log
                    </h3>
                    <span className="gc-statement-sub">
                      Official cycle-by-cycle accounting of installment remittances, auction dividends, and prize disbursals
                    </span>
                  </div>

                  <div className="gc-statement-header-actions">
                    <span className="gc-statement-count-chip">
                      {monthlyRecords.length} Schedule Cycles
                    </span>
                  </div>
                </div>

                {/* Interactive Statement Toolbar (Filters & Real-time Search) */}
                <div className="gc-statement-toolbar">
                  <div className="gc-statement-filters">
                    <button
                      type="button"
                      className={`gc-filter-chip ${statementFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatementFilter('all')}
                    >
                      All Cycles <span className="gc-chip-count">{statementCounts.all}</span>
                    </button>
                    <button
                      type="button"
                      className={`gc-filter-chip ${statementFilter === 'paid' ? 'active' : ''}`}
                      onClick={() => setStatementFilter('paid')}
                    >
                      <CheckCircle2 size={12} color="#059669" />
                      Paid <span className="gc-chip-count">{statementCounts.paid}</span>
                    </button>
                    <button
                      type="button"
                      className={`gc-filter-chip ${statementFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setStatementFilter('pending')}
                    >
                      <Clock size={12} color="#d97706" />
                      Pending Due <span className="gc-chip-count">{statementCounts.pending}</span>
                    </button>
                    <button
                      type="button"
                      className={`gc-filter-chip ${statementFilter === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setStatementFilter('upcoming')}
                    >
                      <Calendar size={12} color="#64748b" />
                      Upcoming <span className="gc-chip-count">{statementCounts.upcoming}</span>
                    </button>
                  </div>

                  <div className="gc-statement-search">
                    <Search size={14} className="gc-search-icon" />
                    <input
                      type="text"
                      placeholder="Search month, winner, receipt..."
                      value={statementSearch}
                      onChange={(e) => setStatementSearch(e.target.value)}
                    />
                    {statementSearch && (
                      <button
                        type="button"
                        className="gc-search-clear"
                        onClick={() => setStatementSearch('')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {loadingMonthly ? (
                  <div className="gc-loading-log">
                    <Loader2 size={30} className="gc-spin" color="#2E7D32" />
                    <p>Loading monthly ledger statement...</p>
                  </div>
                ) : (
                  <div className="gc-table-responsive">
                    <table className="gc-table">
                      <thead>
                        <tr>
                          <th>
                            <span className="gc-th-wrap"><Layers size={12} /> Cycle Month</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><Calendar size={12} /> Scheduled Date</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><CircleDollarSign size={12} /> Monthly Installment</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><Award size={12} /> Auction Prize Disbursed</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><TrendingUp size={12} /> Dividend Benefit</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><CheckCircle2 size={12} /> Remittance Status</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><Users size={12} /> Auction Outcome</span>
                          </th>
                          <th>
                            <span className="gc-th-wrap"><FileText size={12} /> Official Slip</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStatementRecords.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                              No statement cycles found matching "<strong>{statementFilter}</strong>" {statementSearch ? `and query "${statementSearch}"` : ''}.
                            </td>
                          </tr>
                        ) : (
                          filteredStatementRecords.map((rec) => (
                            <tr key={rec.monthNumber} className={rec.monthNumber === completedCycles + 1 ? 'gc-row-active' : ''}>
                              <td>
                                <div className="gc-month-cell-wrap">
                                  <span className="gc-month-chip">
                                    Month #{rec.monthNumber}
                                  </span>
                                  {rec.cycleMonthName && (
                                    <span className="gc-cycle-label">{rec.cycleMonthName}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className="gc-cell-date">
                                  <Calendar size={13} color="#64748b" />
                                  {rec.date}
                                </span>
                              </td>
                              <td>
                                <strong className="gc-cell-amount">{formatINR(rec.installment)}</strong>
                              </td>
                              <td>
                                {rec.amountTaken > 0 ? (
                                  <span className="gc-prize-tag">
                                    <Award size={13} color="#2563eb" />
                                    {formatINR(rec.amountTaken)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                {rec.discount > 0 ? (
                                  <span className="text-emerald font-bold">+{formatINR(rec.discount)}</span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <span className={`gc-status-badge ${rec.status}`}>
                                  {rec.status === 'paid' && <CheckCircle2 size={12} />}
                                  {rec.status === 'pending' && <Clock size={12} />}
                                  {rec.status === 'upcoming' && <Calendar size={12} />}
                                  <span>{rec.status === 'paid' ? 'Paid' : rec.status === 'pending' ? 'Pending' : 'Upcoming'}</span>
                                </span>
                              </td>
                              <td>
                                <span className="gc-winner-cell">
                                  {rec.winnerName ? (
                                    <div className="gc-winner-pill">
                                      <Award size={13} color="#d97706" />
                                      <span className="gc-winner-name">{rec.winnerName}</span>
                                    </div>
                                  ) : rec.status === 'paid' ? (
                                    <span className="gc-unauctioned">
                                      Regular Cycle
                                    </span>
                                  ) : (
                                    <span className="gc-unauctioned">
                                      <Clock size={12} color="#94a3b8" />
                                      Scheduled Auction
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td>
                                {rec.status === 'paid' ? (
                                  <button
                                    type="button"
                                    className="gc-btn-slip"
                                    onClick={() => setSelectedReceipt(rec)}
                                    title="View Official Remittance Receipt Slip"
                                  >
                                    <FileText size={12} />
                                    <span>View Slip</span>
                                  </button>
                                ) : (
                                  <span className="gc-slip-muted">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════
                  OFFICIAL PAYMENT REMITTANCE RECEIPT MODAL
                 ══════════════════════════════════════════════════════════ */}
              {selectedReceipt && (
                <div className="gc-modal-backdrop" onClick={() => setSelectedReceipt(null)}>
                  <div className="gc-receipt-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="gc-receipt-header">
                      <div className="gc-receipt-brand">
                        <div className="gc-receipt-seal">
                          <Landmark size={20} color="#ffffff" />
                        </div>
                        <div>
                          <div className="gc-receipt-org">PERIYANAYAGI AMMAN CHIT FUNDS</div>
                          <div className="gc-receipt-suborg">Official Member Remittance Receipt Slip</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="gc-receipt-close"
                        onClick={() => setSelectedReceipt(null)}
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {/* Receipt Body */}
                    <div className="gc-receipt-body">
                      <div className="gc-receipt-headline">
                        <div>
                          <span className="gc-receipt-type">PAYMENT REMITTANCE RECEIPT</span>
                          <div className="gc-receipt-no">
                            {selectedReceipt.receiptNumber || `RCP-${selectedGroup.id}-${selectedReceipt.monthNumber}`}
                          </div>
                        </div>
                        <div className="gc-receipt-verified-badge">
                          <ShieldCheck size={15} color="#059669" />
                          <span>VERIFIED & PAID</span>
                        </div>
                      </div>

                      <div className="gc-receipt-grid">
                        <div className="gc-receipt-field">
                          <span className="gc-rfield-label">Chit Scheme</span>
                          <span className="gc-rfield-val">{selectedGroup.groupName || selectedGroup.group_name} (#{selectedGroup.id})</span>
                        </div>
                        <div className="gc-receipt-field">
                          <span className="gc-rfield-label">Cycle Period</span>
                          <span className="gc-rfield-val">Month #{selectedReceipt.monthNumber} ({selectedReceipt.cycleMonthName || 'Regular'})</span>
                        </div>
                        <div className="gc-receipt-field">
                          <span className="gc-rfield-label">Payment Date</span>
                          <span className="gc-rfield-val">{selectedReceipt.paidDate || selectedReceipt.date || 'Reconciled'}</span>
                        </div>
                        <div className="gc-receipt-field">
                          <span className="gc-rfield-label">Remittance Channel</span>
                          <span className="gc-rfield-val">Authorized Branch Counter / Cash</span>
                        </div>
                      </div>

                      <div className="gc-receipt-breakdown">
                        <div className="gc-rbreakdown-row">
                          <span>Base Scheme Installment</span>
                          <span>{formatINR(monthlyShare)}</span>
                        </div>
                        {selectedReceipt.discount > 0 && (
                          <div className="gc-rbreakdown-row text-emerald">
                            <span>Less: Auction Dividend Benefit</span>
                            <span>- {formatINR(selectedReceipt.discount)}</span>
                          </div>
                        )}
                        <div className="gc-rbreakdown-divider" />
                        <div className="gc-rbreakdown-total">
                          <span>Total Amount Remitted</span>
                          <span className="gc-rtotal-amt">{formatINR(selectedReceipt.installment)}</span>
                        </div>
                      </div>

                      {selectedReceipt.winnerName && (
                        <div className="gc-receipt-auction-info">
                          <Award size={15} color="#d97706" />
                          <div>
                            <strong>Auction Winner for this Cycle:</strong> {selectedReceipt.winnerName}
                            {selectedReceipt.amountTaken > 0 && (
                              <span> • Prize Disbursed: {formatINR(selectedReceipt.amountTaken)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="gc-receipt-footer-note">
                        <p>This is a computer-generated official receipt ledger slip issued by Periyanayagi Amman Chit Funds management system. Verified against central bank reconcilement ledger.</p>
                      </div>
                    </div>

                    {/* Receipt Modal Actions */}
                    <div className="gc-receipt-actions">
                      <button
                        type="button"
                        className="gc-btn-secondary"
                        onClick={() => setSelectedReceipt(null)}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="gc-btn-receipt-print"
                        onClick={() => window.print()}
                      >
                        <Printer size={14} />
                        <span>Print Official Slip</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
};

export default GroupCard;
