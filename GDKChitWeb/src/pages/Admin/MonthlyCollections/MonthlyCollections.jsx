import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  Layers,
  Calculator,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  Coins,
  ShieldCheck,
  Percent,
  Calendar,
  X,
  Eye,
  Sliders,
  DollarSign,
  PieChart,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import './MonthlyCollections.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PRESETS = [
  { label: '₹1,00,000 • 20M', amount: 100000, duration: 20, members: 20, discount: 20000 },
  { label: '₹2,50,000 • 25M', amount: 250000, duration: 25, members: 25, discount: 50000 },
  { label: '₹5,00,000 • 20M', amount: 500000, duration: 20, members: 20, discount: 100000 },
  { label: '₹10,00,000 • 25M', amount: 1000000, duration: 25, members: 25, discount: 200000 },
  { label: '₹25,00,000 • 50M', amount: 2500000, duration: 50, members: 50, discount: 500000 },
];

const MonthlyCollections = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('respective'); // 'respective' | 'cumulative' | 'calculator'

  // Loading & Error states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Overview metrics
  const [overview, setOverview] = useState(null);

  // Group selector & data
  const [groupsList, setGroupsList] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);

  // Cumulative data
  const [cumulativeMonths, setCumulativeMonths] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Member drilldown modal
  const [subscriberModalPeriod, setSubscriberModalPeriod] = useState(null);

  // Interactive Calculator State
  const [calcInputs, setCalcInputs] = useState({
    groupAmount: 500000,
    duration: 20,
    totalMembers: 20,
    auctionDiscount: 100000,
    commissionRate: 5,
    expectedCollectionRate: 100
  });
  const [calcResult, setCalcResult] = useState(null);

  // ── 1. Fetch High-Level Overview & Groups List ──
  const fetchInitialData = async () => {
    try {
      setLoadingOverview(true);
      setErrorMsg('');

      const [resOverview, resGroups] = await Promise.all([
        makeRequest('/admin/collections/analytics/overview'),
        makeRequest('/admin/collections/analytics/groups-list')
      ]);

      const dataOverview = await safeJson(resOverview);
      const dataGroups = await safeJson(resGroups);

      if (dataOverview.success) {
        setOverview(dataOverview.data);
      }
      if (dataGroups.success && dataGroups.data) {
        setGroupsList(dataGroups.data);
        if (dataGroups.data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(dataGroups.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial collections analytics:', err);
      setErrorMsg('Failed to fetch collections overview. Please check network.');
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ── 2. Fetch Tab Specific Data ──
  const fetchGroupDetails = useCallback(async (groupId, year = '') => {
    if (!groupId) return;
    try {
      setLoadingData(true);
      const url = `/admin/collections/analytics/group-monthly?groupId=${groupId}${year ? `&year=${year}` : ''}`;
      const res = await makeRequest(url);
      const data = await safeJson(res);
      if (data.success) {
        setGroupDetails(data.data);
      } else {
        setErrorMsg(data.message || 'Failed to load group collections');
      }
    } catch (err) {
      console.error('Group monthly fetch error:', err);
      setErrorMsg('Network error fetching respective chit details');
    } finally {
      setLoadingData(false);
    }
  }, []);

  const fetchCumulativeData = useCallback(async (year = '') => {
    try {
      setLoadingData(true);
      const url = `/admin/collections/analytics/cumulative-monthly${year ? `?year=${year}` : ''}`;
      const res = await makeRequest(url);
      const data = await safeJson(res);
      if (data.success) {
        setCumulativeMonths(data.data || []);
      } else {
        setErrorMsg(data.message || 'Failed to load cumulative collections');
      }
    } catch (err) {
      console.error('Cumulative fetch error:', err);
      setErrorMsg('Network error fetching cumulative chit cashflow');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'respective' && selectedGroupId) {
      fetchGroupDetails(selectedGroupId, selectedYear);
    } else if (activeTab === 'cumulative') {
      fetchCumulativeData(selectedYear);
    }
  }, [activeTab, selectedGroupId, selectedYear, fetchGroupDetails, fetchCumulativeData]);

  // ── 3. Calculator Engine Calculation ──
  const runCalculation = useCallback(() => {
    const gAmount = Math.max(1000, Number(calcInputs.groupAmount) || 0);
    const dur = Math.max(1, Number(calcInputs.duration) || 1);
    const members = Math.max(1, Number(calcInputs.totalMembers) || dur);
    const disc = Math.max(0, Math.min(gAmount * 0.4, Number(calcInputs.auctionDiscount) || 0));
    const commRate = Math.max(0, Math.min(10, Number(calcInputs.commissionRate) || 5));
    const realization = Math.max(1, Math.min(100, Number(calcInputs.expectedCollectionRate) || 100));

    const baseInstallment = Math.round(gAmount / dur);
    const foremanCommission = Math.round(gAmount * (commRate / 100));
    const dividendPool = Math.max(0, disc - foremanCommission);
    const dividendPerMember = members > 0 ? Math.round(dividendPool / members) : 0;
    const netInstallmentPerMember = Math.max(0, baseInstallment - dividendPerMember);

    const grossTotalCollection = baseInstallment * members;
    const netTotalExpectedCollection = netInstallmentPerMember * members;
    const projectedCollectionInflow = Math.round(netTotalExpectedCollection * (realization / 100));
    const projectedShortfall = Math.max(0, netTotalExpectedCollection - projectedCollectionInflow);
    const prizeMoneyDisbursed = gAmount - disc;
    const netSurplus = projectedCollectionInflow - prizeMoneyDisbursed;

    setCalcResult({
      baseInstallment,
      foremanCommission,
      dividendPool,
      dividendPerMember,
      netInstallmentPerMember,
      grossTotalCollection,
      netTotalExpectedCollection,
      projectedCollectionInflow,
      projectedShortfall,
      prizeMoneyDisbursed,
      netSurplus,
      realization
    });
  }, [calcInputs]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // Handle Calculator Preset Click
  const applyPreset = (preset) => {
    setCalcInputs(prev => ({
      ...prev,
      groupAmount: preset.amount,
      duration: preset.duration,
      totalMembers: preset.members,
      auctionDiscount: preset.discount
    }));
  };

  // Populate Calculator from an Active Group
  const populateFromGroup = (g) => {
    const dur = g.duration || 20;
    const amt = g.amount || 100000;
    setCalcInputs(prev => ({
      ...prev,
      groupAmount: amt,
      duration: dur,
      totalMembers: g.totalMembers || dur,
      auctionDiscount: Math.round(amt * 0.2) // default 20%
    }));
    setActiveTab('calculator');
  };

  // ── Refresh Handler ──
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    if (activeTab === 'respective') {
      await fetchGroupDetails(selectedGroupId, selectedYear);
    } else if (activeTab === 'cumulative') {
      await fetchCumulativeData(selectedYear);
    }
    setRefreshing(false);
  };

  // ── Export to CSV ──
  const exportToCSV = () => {
    let rows = [];
    let filename = '';

    if (activeTab === 'respective' && groupDetails) {
      filename = `${groupDetails.group?.name || 'Chit'}_Monthly_Collections.csv`;
      rows.push(['Period', 'Year', 'Month', 'Base Installment', 'Auction Discount', 'Commission', 'Dividend/Member', 'Net Payable', 'Expected Inflow', 'Collected Inflow', 'Pending Inflow', 'Efficiency %', 'Paid Count', 'Pending Count', 'Status']);
      (groupDetails.months || []).forEach(m => {
        rows.push([
          m.period,
          m.year,
          m.monthName,
          m.baseInstallment,
          m.discountAmount,
          m.commissionAmount,
          m.dividendPerMember,
          m.netPayablePerMember,
          m.expectedInflow,
          m.collectedInflow,
          m.pendingInflow,
          `${m.efficiency}%`,
          m.paidCount,
          m.pendingCount,
          m.status
        ]);
      });
    } else if (activeTab === 'cumulative') {
      filename = `Cumulative_Overall_Chit_Collections.csv`;
      rows.push(['Period', 'Year', 'Month', 'Active Chits Count', 'Gross Expected', 'Dividends Credited', 'Collected Amount', 'Pending Amount', 'Realization %', 'Paid Records', 'Pending Records', 'Foreman Commission']);
      cumulativeMonths.forEach(m => {
        rows.push([
          m.period,
          m.year,
          m.monthName,
          m.activeGroupsCount,
          m.expectedAmount,
          m.totalDiscount,
          m.collectedAmount,
          m.pendingAmount,
          `${m.collectionRate}%`,
          m.paidCount,
          m.pendingCount,
          m.totalCommission
        ]);
      });
    } else if (activeTab === 'calculator' && calcResult) {
      filename = `Chit_Revenue_Calculator_Model.csv`;
      rows.push(['Parameter', 'Value']);
      rows.push(['Chit Pool Value', calcInputs.groupAmount]);
      rows.push(['Duration (Months)', calcInputs.duration]);
      rows.push(['Total Members', calcInputs.totalMembers]);
      rows.push(['Auction Discount', calcInputs.auctionDiscount]);
      rows.push(['Foreman Commission Rate (%)', `${calcInputs.commissionRate}%`]);
      rows.push(['Foreman Commission Earned', calcResult.foremanCommission]);
      rows.push(['Total Dividend Pool', calcResult.dividendPool]);
      rows.push(['Dividend per Member', calcResult.dividendPerMember]);
      rows.push(['Net Monthly Installment per Member', calcResult.netInstallmentPerMember]);
      rows.push(['Net Expected Inflow', calcResult.netTotalExpectedCollection]);
      rows.push(['Prize Money Disbursed', calcResult.prizeMoneyDisbursed]);
      rows.push(['Projected Realization Rate', `${calcInputs.expectedCollectionRate}%`]);
      rows.push(['Projected Collection Inflow', calcResult.projectedCollectionInflow]);
      rows.push(['Foreman Net Cashflow Yield', calcResult.foremanCommission]);
    }

    if (rows.length === 0) return;

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for Respective Chit tab
  const filteredRespectiveMonths = useMemo(() => {
    if (!groupDetails?.months) return [];
    if (!searchQuery.trim()) return groupDetails.months;
    const q = searchQuery.toLowerCase();
    return groupDetails.months.filter(m =>
      m.monthName.toLowerCase().includes(q) ||
      m.period.includes(q) ||
      m.year.toString().includes(q) ||
      m.status.toLowerCase().includes(q)
    );
  }, [groupDetails, searchQuery]);

  // Filtered rows for Cumulative tab
  const filteredCumulativeMonths = useMemo(() => {
    if (!cumulativeMonths) return [];
    if (!searchQuery.trim()) return cumulativeMonths;
    const q = searchQuery.toLowerCase();
    return cumulativeMonths.filter(m =>
      m.monthName.toLowerCase().includes(q) ||
      m.period.includes(q) ||
      m.year.toString().includes(q)
    );
  }, [cumulativeMonths, searchQuery]);

  // Active group object
  const currentGroup = useMemo(() => {
    return groupsList.find(g => g.id === Number(selectedGroupId)) || groupDetails?.group || null;
  }, [groupsList, selectedGroupId, groupDetails]);

  return (
    <div className="mc-page">
      {/* ── 1. Top Executive Banner ── */}
      <div className="mc-header-banner">
        <div className="mc-header-left">
          <div className="mc-header-icon-wrap">
            <Calculator size={26} strokeWidth={2.2} />
          </div>
          <div>
            <div className="mc-title-row">
              <h1 className="mc-header-title">Monthly Collections & Cumulative Analytics</h1>
              <span className="mc-badge-live">
                <span className="mc-live-dot" />
                Live Central Ledger
              </span>
            </div>
            <p className="mc-header-subtitle">
              Audit cycle-by-cycle subscriber collections, inspect cumulative multi-chit cashflows, and run reverse auction revenue calculations.
            </p>
          </div>
        </div>

        <div className="mc-header-actions">
          <button
            type="button"
            className="mc-btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={refreshing ? 'mc-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="mc-btn-primary"
            onClick={exportToCSV}
            title="Export view to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Executive KPI Cards (Overall Health) ── */}
      <div className="mc-kpi-grid">
        {/* Pool Value */}
        <div className="mc-kpi-card">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Cumulative Pool Turnover</span>
            <div className="mc-kpi-icon-wrap green">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mc-kpi-value">
            {formatCurrency(overview?.totalPoolValue || 0)}
          </div>
          <div className="mc-kpi-meta">
            <span className="mc-kpi-tag green">
              {overview?.activeGroups || 0} Active Pools
            </span>
            <span className="mc-kpi-subtext">Across {overview?.totalGroups || 0} total groups</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="mc-kpi-card highlight">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total Realized Collections</span>
            <div className="mc-kpi-icon-wrap emerald">
              <Coins size={18} />
            </div>
          </div>
          <div className="mc-kpi-value text-emerald">
            {formatCurrency(overview?.totalCollected || 0)}
          </div>
          <div className="mc-kpi-meta">
            <span className="mc-kpi-tag emerald">
              {overview?.efficiencyRate || 0}% Realized
            </span>
            <span className="mc-kpi-subtext">Direct subscriber inflow</span>
          </div>
        </div>

        {/* Pending Inflow */}
        <div className="mc-kpi-card">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Outstanding Inflow Dues</span>
            <div className="mc-kpi-icon-wrap amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="mc-kpi-value text-amber">
            {formatCurrency(overview?.totalPending || 0)}
          </div>
          <div className="mc-kpi-meta">
            <span className="mc-kpi-tag amber">
              Pending Cycles
            </span>
            <span className="mc-kpi-subtext">Tracked via defaulters ledger</span>
          </div>
        </div>

        {/* Company Yield & Dividends */}
        <div className="mc-kpi-card">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Foreman Commission Yield</span>
            <div className="mc-kpi-icon-wrap purple">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mc-kpi-value text-purple">
            {formatCurrency(overview?.totalCommissionEarned || 0)}
          </div>
          <div className="mc-kpi-meta">
            <span className="mc-kpi-tag purple">
              5% Act Directives
            </span>
            <span className="mc-kpi-subtext">Dividends: {formatCurrency(overview?.totalDividendsDistributed || 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Tab Switcher Navigation ── */}
      <div className="mc-nav-tabs-wrap">
        <div className="mc-nav-tabs">
          <button
            type="button"
            className={`mc-tab-btn ${activeTab === 'respective' ? 'active' : ''}`}
            onClick={() => setActiveTab('respective')}
          >
            <Layers size={16} />
            <span>Respective Chit Monthly Ledger</span>
          </button>
          <button
            type="button"
            className={`mc-tab-btn ${activeTab === 'cumulative' ? 'active' : ''}`}
            onClick={() => setActiveTab('cumulative')}
          >
            <BarChart3 size={16} />
            <span>Cumulative Overall Turnover</span>
          </button>
          <button
            type="button"
            className={`mc-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={16} />
            <span>Chit Revenue & Inflow Calculator</span>
          </button>
        </div>

        {/* Global Toolbar Filters */}
        <div className="mc-tab-toolbar">
          {activeTab !== 'calculator' && (
            <>
              {/* Year Filter */}
              <div className="mc-select-wrap">
                <Calendar size={14} className="mc-select-icon" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="mc-select"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="mc-search-wrap">
                <Search size={14} className="mc-search-icon" />
                <input
                  type="text"
                  placeholder="Search period or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mc-search-input"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 4. TAB 1: RESPECTIVE CHIT MONTHLY LEDGER ── */}
      {activeTab === 'respective' && (
        <div className="mc-tab-content">
          {/* Chit Scheme Selector Bar */}
          <div className="mc-chit-selector-card">
            <div className="mc-selector-header">
              <div className="mc-selector-title">
                <Building2 size={16} color="#2E7D32" />
                <span>Select Chit Group Scheme:</span>
              </div>
              <div className="mc-group-chips">
                {groupsList.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    className={`mc-group-chip ${Number(selectedGroupId) === g.id ? 'active' : ''}`}
                    onClick={() => setSelectedGroupId(g.id)}
                  >
                    <strong>{g.name}</strong>
                    <span className="mc-chip-amount">{formatCurrency(g.amount)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Group Header Summary */}
            {currentGroup && (
              <div className="mc-group-banner">
                <div className="mc-gb-left">
                  <div className="mc-gb-name-row">
                    <h2 className="mc-gb-name">{currentGroup.name}</h2>
                    <span className="mc-status-pill">{currentGroup.status || 'Active'}</span>
                  </div>
                  <div className="mc-gb-details">
                    <span>Pool Value: <strong>{formatCurrency(currentGroup.amount || currentGroup.groupAmount || 0)}</strong></span>
                    <span>•</span>
                    <span>Duration: <strong>{currentGroup.duration || 20} Months</strong></span>
                    <span>•</span>
                    <span>Members: <strong>{currentGroup.totalMembers || 20} Subscribers</strong></span>
                    <span>•</span>
                    <span>Base Installment: <strong>{formatCurrency(Math.round((currentGroup.amount || currentGroup.groupAmount || 0) / (currentGroup.duration || 20)))}/mo</strong></span>
                  </div>
                </div>

                <div className="mc-gb-actions">
                  <button
                    type="button"
                    className="mc-btn-calc-launch"
                    onClick={() => populateFromGroup(currentGroup)}
                    title="Load this chit into the Revenue Calculator"
                  >
                    <Sliders size={13} />
                    <span>Run Calculator</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Group Collection Table */}
          <div className="mc-card-table-wrap">
            <div className="mc-table-header">
              <div>
                <h3 className="mc-table-title">Cycle-by-Cycle Monthly Collections</h3>
                <span className="mc-table-subtitle">
                  Showing monthly collection installments, auction discounts, and net subscriber remittances for {currentGroup?.name || 'this chit'}
                </span>
              </div>
              <div className="mc-table-counter">
                {filteredRespectiveMonths.length} Months Recorded
              </div>
            </div>

            <div className="mc-table-container">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Collection Period</th>
                    <th>Base Due</th>
                    <th>Auction Discount</th>
                    <th>Commission (5%)</th>
                    <th>Dividend / Member</th>
                    <th>Net Payable</th>
                    <th>Realized Collections</th>
                    <th>Shortfall / Pending</th>
                    <th>Realization Rate</th>
                    <th>Subscribers</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr>
                      <td colSpan="12" className="mc-loading-td">
                        <RefreshCw size={20} className="mc-spin" />
                        <span>Loading monthly collections...</span>
                      </td>
                    </tr>
                  ) : filteredRespectiveMonths.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="mc-empty-td">
                        <Coins size={36} color="#94a3b8" />
                        <p>No collection records found for this chit and year filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRespectiveMonths.map((m, idx) => (
                      <tr key={idx} className={m.pendingCount > 0 ? 'row-pending' : 'row-paid'}>
                        <td>
                          <div className="mc-cell-period">
                            <Calendar size={13} color="#2E7D32" />
                            <strong>{m.monthName} {m.year}</strong>
                          </div>
                        </td>
                        <td>{formatCurrency(m.baseInstallment)}</td>
                        <td className="text-amber">
                          {m.discountAmount > 0 ? `-${formatCurrency(m.discountAmount)}` : '₹0'}
                        </td>
                        <td className="text-purple">{formatCurrency(m.commissionAmount)}</td>
                        <td className="text-emerald">
                          {m.dividendPerMember > 0 ? `+${formatCurrency(m.dividendPerMember)}` : '₹0'}
                        </td>
                        <td>
                          <strong className="mc-net-payable">{formatCurrency(m.netPayablePerMember)}</strong>
                        </td>
                        <td>
                          <span className="mc-collected-val">{formatCurrency(m.collectedInflow)}</span>
                        </td>
                        <td>
                          {m.pendingInflow > 0 ? (
                            <span className="mc-pending-val">{formatCurrency(m.pendingInflow)}</span>
                          ) : (
                            <span className="mc-zero-val">₹0</span>
                          )}
                        </td>
                        <td>
                          <div className="mc-progress-col">
                            <div className="mc-progress-track">
                              <div
                                className="mc-progress-bar"
                                style={{ width: `${Math.min(100, m.efficiency)}%` }}
                              />
                            </div>
                            <span className="mc-progress-text">{m.efficiency}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="mc-sub-count">
                            <strong className="text-emerald">{m.paidCount}</strong> / {m.paidCount + m.pendingCount}
                          </span>
                        </td>
                        <td>
                          {m.status === 'FULLY_COLLECTED' ? (
                            <span className="mc-badge-status paid">
                              <CheckCircle2 size={11} /> Fully Paid
                            </span>
                          ) : m.status === 'PARTIAL' ? (
                            <span className="mc-badge-status partial">
                              <Clock size={11} /> Partial
                            </span>
                          ) : (
                            <span className="mc-badge-status pending">
                              <AlertTriangle size={11} /> Due
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="mc-btn-subscribers"
                            onClick={() => setSubscriberModalPeriod(m)}
                            title="Inspect subscriber payments for this cycle"
                          >
                            <Eye size={12} />
                            <span>Subscribers</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TAB 2: CUMULATIVE OVERALL CHIT TURNOVER ── */}
      {activeTab === 'cumulative' && (
        <div className="mc-tab-content">
          <div className="mc-card-table-wrap">
            <div className="mc-table-header">
              <div>
                <h3 className="mc-table-title">Cumulative Corporate Chit Cashflow</h3>
                <span className="mc-table-subtitle">
                  Aggregated multi-chit monthly inflows, realizations, and foreman dividend distributions across the firm
                </span>
              </div>
              <div className="mc-table-counter">
                {filteredCumulativeMonths.length} Months Aggregated
              </div>
            </div>

            <div className="mc-table-container">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Month & Year</th>
                    <th>Active Pools</th>
                    <th>Gross Expected Inflow</th>
                    <th>Dividends Distributed</th>
                    <th>Realized Cash Inflow</th>
                    <th>Pending Shortfall</th>
                    <th>Realization Rate</th>
                    <th>Subscriber Receipts</th>
                    <th>Foreman Commission Yield</th>
                    <th>Net Corporate Health</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr>
                      <td colSpan="10" className="mc-loading-td">
                        <RefreshCw size={20} className="mc-spin" />
                        <span>Aggregating corporate cashflow...</span>
                      </td>
                    </tr>
                  ) : filteredCumulativeMonths.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="mc-empty-td">
                        <BarChart3 size={36} color="#94a3b8" />
                        <p>No cumulative records found for this year filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCumulativeMonths.map((m, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="mc-cell-period">
                            <Calendar size={13} color="#2E7D32" />
                            <strong>{m.monthName} {m.year}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="mc-pools-count">{m.activeGroupsCount} Chit Pools</span>
                        </td>
                        <td>
                          <strong>{formatCurrency(m.expectedAmount)}</strong>
                        </td>
                        <td className="text-emerald">
                          {formatCurrency(m.totalDiscount)}
                        </td>
                        <td>
                          <span className="mc-collected-val">{formatCurrency(m.collectedAmount)}</span>
                        </td>
                        <td>
                          {m.pendingAmount > 0 ? (
                            <span className="mc-pending-val">{formatCurrency(m.pendingAmount)}</span>
                          ) : (
                            <span className="mc-zero-val">₹0</span>
                          )}
                        </td>
                        <td>
                          <div className="mc-progress-col">
                            <div className="mc-progress-track">
                              <div
                                className="mc-progress-bar"
                                style={{
                                  width: `${Math.min(100, m.collectionRate)}%`,
                                  backgroundColor: m.collectionRate >= 80 ? '#10b981' : m.collectionRate >= 50 ? '#f59e0b' : '#ef4444'
                                }}
                              />
                            </div>
                            <span className="mc-progress-text">{m.collectionRate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="mc-sub-count">
                            <strong className="text-emerald">{m.paidCount} Paid</strong> • {m.pendingCount} Due
                          </span>
                        </td>
                        <td className="text-purple">
                          <strong>{formatCurrency(m.totalCommission)}</strong>
                        </td>
                        <td>
                          {m.collectionRate >= 90 ? (
                            <span className="mc-badge-status paid">Optimal 🟢</span>
                          ) : m.collectionRate >= 60 ? (
                            <span className="mc-badge-status partial">Fair 🟡</span>
                          ) : (
                            <span className="mc-badge-status pending">Deficit 🔴</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TAB 3: CHIT REVENUE & INFLOW CALCULATOR ── */}
      {activeTab === 'calculator' && (
        <div className="mc-tab-content">
          {/* Preset Buttons */}
          <div className="mc-presets-card">
            <div className="mc-presets-title">
              <Percent size={15} color="#2E7D32" />
              <span>Standard Regulatory Scheme Presets:</span>
            </div>
            <div className="mc-presets-buttons">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="mc-preset-btn"
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mc-calc-grid">
            {/* Left Column: Parameter Inputs & Sliders */}
            <div className="mc-calc-card inputs">
              <div className="mc-card-heading">
                <Sliders size={18} color="#2E7D32" />
                <h4>Chit Auction & Inflow Parameters</h4>
              </div>

              {/* Chit Pool Amount */}
              <div className="mc-calc-field">
                <div className="mc-field-label-row">
                  <label>Total Chit Pool Value (₹)</label>
                  <span className="mc-field-value-pill">{formatCurrency(calcInputs.groupAmount)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="5000000"
                  step="25000"
                  value={calcInputs.groupAmount}
                  onChange={(e) => setCalcInputs({ ...calcInputs, groupAmount: Number(e.target.value) })}
                  className="mc-range-slider"
                />
                <input
                  type="number"
                  value={calcInputs.groupAmount}
                  onChange={(e) => setCalcInputs({ ...calcInputs, groupAmount: Math.max(1000, Number(e.target.value)) })}
                  className="mc-calc-input"
                />
              </div>

              {/* Duration & Members */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="mc-calc-field">
                  <div className="mc-field-label-row">
                    <label>Duration (Months)</label>
                    <span className="mc-field-value-pill">{calcInputs.duration} M</span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={calcInputs.duration}
                    onChange={(e) => {
                      const d = Math.max(1, Number(e.target.value));
                      setCalcInputs({ ...calcInputs, duration: d, totalMembers: d });
                    }}
                    className="mc-calc-input"
                  />
                </div>

                <div className="mc-calc-field">
                  <div className="mc-field-label-row">
                    <label>Enrolled Members</label>
                    <span className="mc-field-value-pill">{calcInputs.totalMembers} Subs</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={calcInputs.totalMembers}
                    onChange={(e) => setCalcInputs({ ...calcInputs, totalMembers: Math.max(1, Number(e.target.value)) })}
                    className="mc-calc-input"
                  />
                </div>
              </div>

              {/* Auction Winning Bid / Discount */}
              <div className="mc-calc-field">
                <div className="mc-field-label-row">
                  <label>Auction Winning Bid / Discount (₹)</label>
                  <span className="mc-field-value-pill text-amber">
                    {formatCurrency(calcInputs.auctionDiscount)} (
                    {calcInputs.groupAmount > 0
                      ? Math.round((calcInputs.auctionDiscount / calcInputs.groupAmount) * 100)
                      : 0}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={calcInputs.groupAmount * 0.4}
                  step="5000"
                  value={calcInputs.auctionDiscount}
                  onChange={(e) => setCalcInputs({ ...calcInputs, auctionDiscount: Number(e.target.value) })}
                  className="mc-range-slider"
                />
                <input
                  type="number"
                  value={calcInputs.auctionDiscount}
                  onChange={(e) => setCalcInputs({ ...calcInputs, auctionDiscount: Math.max(0, Number(e.target.value)) })}
                  className="mc-calc-input"
                />
                <span className="mc-field-hint">
                  *Chit Funds Act 1982 sets max discount ceiling at 40% of the chit value.
                </span>
              </div>

              {/* Foreman Commission & Expected Realization */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="mc-calc-field">
                  <div className="mc-field-label-row">
                    <label>Foreman Comm (%)</label>
                    <span className="mc-field-value-pill text-purple">{calcInputs.commissionRate}%</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={calcInputs.commissionRate}
                    onChange={(e) => setCalcInputs({ ...calcInputs, commissionRate: Number(e.target.value) })}
                    className="mc-calc-input"
                  />
                </div>

                <div className="mc-calc-field">
                  <div className="mc-field-label-row">
                    <label>Realization (%)</label>
                    <span className="mc-field-value-pill text-emerald">{calcInputs.expectedCollectionRate}%</span>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={calcInputs.expectedCollectionRate}
                    onChange={(e) => setCalcInputs({ ...calcInputs, expectedCollectionRate: Number(e.target.value) })}
                    className="mc-calc-input"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Inflow & Yields */}
            <div className="mc-calc-card results">
              <div className="mc-card-heading">
                <PieChart size={18} color="#2E7D32" />
                <h4>Financial Model & Cashflow Realization</h4>
              </div>

              {/* Hero Net Installment Callout */}
              <div className="mc-hero-result-box">
                <span className="mc-hero-label">Net Subscriber Monthly Installment</span>
                <div className="mc-hero-amount">
                  {formatCurrency(calcResult?.netInstallmentPerMember || 0)}
                  <span className="mc-hero-period">/ member</span>
                </div>
                <div className="mc-hero-formula">
                  Base: {formatCurrency(calcResult?.baseInstallment || 0)} - Dividend: {formatCurrency(calcResult?.dividendPerMember || 0)}
                </div>
              </div>

              {/* Breakdown Metric Grid */}
              <div className="mc-breakdown-grid">
                <div className="mc-breakdown-item">
                  <span className="mc-bd-label">Total Expected Collection</span>
                  <span className="mc-bd-value text-emerald">
                    {formatCurrency(calcResult?.netTotalExpectedCollection || 0)}
                  </span>
                  <span className="mc-bd-sub">From {calcInputs.totalMembers} subscribers</span>
                </div>

                <div className="mc-breakdown-item">
                  <span className="mc-bd-label">Winner Prize Money</span>
                  <span className="mc-bd-value">
                    {formatCurrency(calcResult?.prizeMoneyDisbursed || 0)}
                  </span>
                  <span className="mc-bd-sub">Pool - Discount</span>
                </div>

                <div className="mc-breakdown-item">
                  <span className="mc-bd-label">Foreman Commission (5%)</span>
                  <span className="mc-bd-value text-purple">
                    {formatCurrency(calcResult?.foremanCommission || 0)}
                  </span>
                  <span className="mc-bd-sub">Statutory company yield</span>
                </div>

                <div className="mc-breakdown-item">
                  <span className="mc-bd-label">Member Dividend Pool</span>
                  <span className="mc-bd-value text-amber">
                    {formatCurrency(calcResult?.dividendPool || 0)}
                  </span>
                  <span className="mc-bd-sub">Discount - Commission</span>
                </div>
              </div>

              {/* Collection Realization Simulation */}
              <div className="mc-simulation-box">
                <div className="mc-sim-header">
                  <strong>Collection Inflow Realization Simulation</strong>
                  <span className="mc-sim-rate">{calcInputs.expectedCollectionRate}% Rate</span>
                </div>

                <div className="mc-sim-row">
                  <span>Projected Actual Inflow:</span>
                  <strong className="text-emerald">{formatCurrency(calcResult?.projectedCollectionInflow || 0)}</strong>
                </div>

                {calcResult?.projectedShortfall > 0 && (
                  <div className="mc-sim-row text-red">
                    <span>Projected Default Shortfall:</span>
                    <strong>-{formatCurrency(calcResult?.projectedShortfall || 0)}</strong>
                  </div>
                )}

                <div className="mc-sim-row">
                  <span>Foreman Net Cash Buffer:</span>
                  <strong>{formatCurrency(calcResult?.netSurplus || 0)}</strong>
                </div>
              </div>

              {/* Regulatory Directives Note */}
              <div className="mc-calc-note">
                <HelpCircle size={15} color="#2E7D32" />
                <span>
                  All calculations strictly conform to Tamil Nadu Chit Funds Rules & Central Chit Funds Act 1982. Foreman commission is capped at 5% of gross chit pool.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SUBSCRIBER PAYMENTS DRILLDOWN MODAL ── */}
      {subscriberModalPeriod && (
        <div className="mc-modal-backdrop" onClick={() => setSubscriberModalPeriod(null)}>
          <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <div>
                <h3 className="mc-modal-title">
                  Subscriber Collections: {subscriberModalPeriod.monthName} {subscriberModalPeriod.year}
                </h3>
                <span className="mc-modal-subtitle">
                  {currentGroup?.name} • Net Installment: {formatCurrency(subscriberModalPeriod.netPayablePerMember)}
                </span>
              </div>
              <button
                type="button"
                className="mc-modal-close"
                onClick={() => setSubscriberModalPeriod(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body">
              <div className="mc-sub-table-wrap">
                <table className="mc-table">
                  <thead>
                    <tr>
                      <th>Subscriber Name</th>
                      <th>Phone Number</th>
                      <th>Amount Due</th>
                      <th>Payment Status</th>
                      <th>Payment Mode</th>
                      <th>Paid Timestamp</th>
                      <th>Receipt #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subscriberModalPeriod.subscribers || []).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="mc-empty-td">
                          <Users size={28} color="#94a3b8" />
                          <p>No individual subscriber payments mapped for this cycle yet.</p>
                        </td>
                      </tr>
                    ) : (
                      subscriberModalPeriod.subscribers.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.phone}</td>
                          <td><strong>{formatCurrency(s.amount)}</strong></td>
                          <td>
                            <span className={`mc-badge-status ${s.status === 'paid' ? 'paid' : 'pending'}`}>
                              {s.status === 'paid' ? 'Paid ✅' : 'Pending ⏳'}
                            </span>
                          </td>
                          <td>{s.paymentMethod}</td>
                          <td>{s.paidDate || '—'}</td>
                          <td><code>{s.receiptNumber}</code></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mc-modal-footer">
              <button
                type="button"
                className="mc-btn-primary"
                onClick={() => setSubscriberModalPeriod(null)}
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCollections;
