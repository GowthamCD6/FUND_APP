import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, Search as RiSearchLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
  ChevronDown as RiChevronDown, LayoutGrid as RiLayoutGrid, List as RiList,
} from 'lucide-react';
import './Reports.css';
import MemberDetailsPanel from './MemberDetails/MemberDetailsPanel.jsx';
import Lottie from 'lottie-react';
import noFileAnimation from '../../../animation/no-file.json';

const LottieComponent = Lottie.default || Lottie;

/* ─── Constants ──────────────────────────────────────────────── */
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SC = {
  active: '#10B981',
  ongoing: '#10B981',
  completed: '#6B46C1',
  paid: '#10B981',
  pending: '#F59E0B',
  overdue: '#EF4444',
  'not started': '#6B7280',
};
export const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';


/* ─── StatusIcon ─────────────────────────────────────────────── */
export const StatusIcon = ({ status, size = 13 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'paid' || s === 'completed' || s === 'active' || s === 'ongoing' ? RiCheckLine
    : s === 'overdue' ? RiAlertLine
      : RiTimeLine;
  return <Icon size={size} color={scOf(s)} />;
};


const GroupCardSkeleton = () => (
  <div className="gc-card skeleton-pulse" style={{ pointerEvents: 'none' }}>
    <div className="gc-header" style={{ paddingBottom: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: '30%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
      </div>
      <div style={{ width: 34, height: 34, background: '#e2e8f0', borderRadius: 6 }} />
    </div>
    <div className="gc-content">
      <div className="gc-info-row" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: '40%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
        <div style={{ width: '40%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
      </div>
      <div className="gc-progress-wrap" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: '50%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
          <div style={{ width: '15%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }} />
      </div>
      <div className="gc-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '40%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
        <div style={{ width: '30%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   GROUP CARD  (mirrors ManageGroups card style & layout)
════════════════════════════════════════════════════════════════ */
const GroupCard = ({ group, onViewMembers }) => {
  const status = String(group.status || 'active').toLowerCase();
  const color = scOf(status);
  const totalCycles = Number(group.duration) || 20;
  const completed = Number(group.completedCycles) || 0;
  const remainingCycles = Math.max(0, totalCycles - completed);
  const pct = Math.min(100, Math.round((completed / totalCycles) * 100));
  const poolValue = Number(group.groupAmount) || 0;
  const monthlyAmount = group.monthlyAmount || (totalCycles > 0 ? Math.round(poolValue / totalCycles) : 0);

  return (
    <div className="gc-card mg-enhanced-card" onClick={() => onViewMembers(group)}>
      {/* Header */}
      <div className="gc-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 className="gc-name" style={{ margin: 0 }}>{group.name}</h3>
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="gc-badge" style={{ background: color }}>
              <StatusIcon status={group.status} size={10} />
              {String(group.status || 'Active').toUpperCase()}
            </span>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 4, 
              background: '#eff6ff', 
              color: '#1d4ed8', 
              border: '1px solid #bfdbfe', 
              padding: '2px 8px', 
              borderRadius: 100, 
              fontSize: 11, 
              fontWeight: 700 
            }}>
              <RiCalendarLine size={11} /> {group.currentMonthDisplay || (group.duration ? `1st Month of ${group.duration}` : '1st Month')}
            </span>
          </div>
        </div>
        <button 
          className="gc-arrow-btn" 
          onClick={(e) => { e.stopPropagation(); onViewMembers(group); }} 
          title="View Collections & Members"
        >
          <RiArrowRightSLine size={24} color="#9CA3AF" />
        </button>
      </div>

      {/* Content */}
      <div className="gc-content">
        {/* Financial & Membership Stats Matrix */}
        <div className="mg-card-metrics-grid">
          <div className="mg-metric-item">
            <span className="mg-metric-lbl">
              <RiGroupLine size={13} color="#64748b" /> Total Members
            </span>
            <strong className="mg-metric-val">{group.totalMembers} Members</strong>
          </div>

          <div className="mg-metric-item">
            <span className="mg-metric-lbl">
              <RiMoneyDollarCircleLine size={13} color="#64748b" /> Monthly Share
            </span>
            <strong className="mg-metric-val">{formatCurrency(monthlyAmount)}/mo</strong>
          </div>

          <div className="mg-metric-item">
            <span className="mg-metric-lbl">
              <RiMoneyDollarCircleLine size={13} color="#10b981" /> Pool Value
            </span>
            <strong className="mg-metric-val" style={{ color: '#0f172a' }}>{formatCurrency(poolValue)}</strong>
          </div>

          <div className="mg-metric-item">
            <span className="mg-metric-lbl">
              <RiTimeLine size={13} color="#64748b" /> Duration
            </span>
            <strong className="mg-metric-val">{totalCycles} Months</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="gc-progress-wrap" style={{ marginTop: 14, marginBottom: 14 }}>
          <div className="gc-progress-hd">
            <span className="gc-progress-txt">{completed}/{totalCycles} Cycles ({remainingCycles} left)</span>
            <span className="gc-progress-pct" style={{ color }}>{pct}%</span>
          </div>
          <div className="gc-bar">
            <div className="gc-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {/* Footer */}
        <div className="gc-footer" style={{ paddingTop: 12 }}>
          <span className="gc-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <RiCalendarLine size={13} color="#64748b" />
            {status === 'completed'
              ? `Completed: ${formatDate(group.completedDate || group.endDate)}`
              : `Start: ${formatDate(group.startDate)}`}
          </span>
          <span className="gc-collected">
            {formatCurrency(group.collectedAmount || 0)} collected
          </span>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
════════════════════════════════════════════════════════════════ */
const Reports = () => {
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [apiStatus, setApiStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const loadGroups = useCallback(async () => {
    try {
      setApiStatus('loading');
      // Fetch comprehensive reporting group stats with real-time collected amounts
      let res = await makeRequest('/admin/reports/groups');
      let data = await safeJson(res);
      
      if (!res.ok || !data?.success) {
        // Fallback to groups API if needed
        res = await makeRequest('/admin/groups/getGroups');
        data = await safeJson(res);
      }
      
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => ({
        id: g.id,
        name: g.name || g.group_name || 'Untitled',
        groupCode: g.groupCode || g.group_code || '',
        status: String(g.status || 'Not Started').toLowerCase(),
        totalMembers: g.totalMembers || g.total_members || 0,
        completedCycles: g.completedCycles || 0,
        duration: g.duration || g.totalCycles || 20,
        groupAmount: g.groupAmount || g.group_amount || 0,
        monthlyAmount: g.monthlyAmount || 0,
        startDate: g.startDate || g.start_date,
        endDate: g.endDate || g.end_date,
        completedDate: g.completedDate,
        collectedAmount: Number(g.collectedAmount || g.collected_amount || 0),
      }));
      setGroups(mapped);
      setApiStatus('ready');
    } catch {
      setGroups([]);
      setApiStatus('error');
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const openGroupMembers = useCallback(async (group) => {
    setSelectedGroup(group);
  }, []);

  // Auto-open group if redirected with groupId or groupName in location state
  useEffect(() => {
    if (location.state?.groupId && groups.length > 0) {
      const target = groups.find(g => String(g.id) === String(location.state.groupId) || (g.name && g.name.toLowerCase() === String(location.state.groupName || '').toLowerCase()));
      if (target) {
        openGroupMembers(target);
      }
    } else if (location.state?.groupName && groups.length > 0) {
      const target = groups.find(g => g.name && g.name.toLowerCase() === String(location.state.groupName).toLowerCase());
      if (target) {
        openGroupMembers(target);
      }
    }
  }, [location.state, groups, openGroupMembers]);

  const counts = useMemo(() => ({
    all: groups.length,
    active: groups.filter(g => g.status === 'active' || g.status === 'ongoing').length,
    completed: groups.filter(g => g.status === 'completed').length,
    notStarted: groups.filter(g => g.status.includes('not') || g.status === 'not started').length,
  }), [groups]);

  const filtered = useMemo(() => {
    let list = groups;
    if (activeTab === 'active') list = groups.filter(g => g.status === 'active' || g.status === 'ongoing');
    else if (activeTab === 'completed') list = groups.filter(g => g.status === 'completed');
    else if (activeTab === 'not-started') list = groups.filter(g => g.status.includes('not') || g.status === 'not started');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.name.toLowerCase().includes(q) || 
        String(g.id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [groups, activeTab, searchQuery]);

  const TABS = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
    { key: 'not-started', label: `Not Started (${counts.notStarted})` },
  ];

  return (
    <div className="rn-page">


      {selectedGroup ? (
        <MemberDetailsPanel
          group={selectedGroup}
          onClose={() => { setSelectedGroup(null); }}
          onRefreshParent={loadGroups}
        />
      ) : (
        <>
          {/* ── Page Header & Action Bar Container ── */}
          <div className="reports-header-container">

            {/* Attached Action Bar (Tabs, Dropdowns, Action Button) */}
            <div className="reports-toolbar-row">
              {/* Tab Bar */}
              <div className="reports-tabs-wrapper">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    className={`reports-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(t.key);
                      setSearchQuery(''); // Reset search on tab change
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search & Action Button */}
              <div className="reports-filters-wrapper">
                {/* Search Bar */}
                <div className="reports-search-container">
                  <RiSearchLine className="reports-search-icon" size={16} />
                  <input
                    type="text"
                    className="reports-search-input"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="reports-search-clear"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      <RiCloseLine size={14} />
                    </button>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  className="reports-refresh-btn"
                  onClick={loadGroups}
                  title="Refresh"
                >
                  <RiRefreshLine
                    size={16}
                    className={apiStatus === 'loading' ? 'spin-anim' : ''}
                  />
                  <span>Refresh</span>
                </button>

                {/* View Toggle */}
                <div className="rp-view-toggle">
                  <button
                    type="button"
                    className={`rp-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                  >
                    <RiList size={14} /> Table
                  </button>
                  <button
                    type="button"
                    className={`rp-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                    title="Card Grid View"
                  >
                    <RiLayoutGrid size={14} /> Cards
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {apiStatus === 'loading' ? (
            viewMode === 'table' ? (
              <div className="rp-table-container">
                <div className="rp-table-wrapper">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 45, textAlign: 'center' }}>#</th>
                        <th>Group Name</th>
                        <th>Status</th>
                        <th>Total Members</th>
                        <th>Monthly Share</th>
                        <th>Pool Value</th>
                        <th>Duration & Progress</th>
                        <th>Total Collected</th>
                        <th style={{ textAlign: 'right', minWidth: 150 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="skeleton-pulse" style={{ pointerEvents: 'none' }}>
                          <td style={{ textAlign: 'center' }}><div style={{ width: 16, height: 12, background: '#e2e8f0', margin: '0 auto', borderRadius: 3 }} /></td>
                          <td>
                            <div className="rp-cell-member">
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0' }} />
                              <div>
                                <div style={{ width: 110, height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 5 }} />
                                <div style={{ width: 70, height: 11, background: '#e2e8f0', borderRadius: 4 }} />
                              </div>
                            </div>
                          </td>
                          <td><div style={{ width: 75, height: 20, background: '#e2e8f0', borderRadius: 100 }} /></td>
                          <td><div style={{ width: 70, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                          <td><div style={{ width: 65, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                          <td><div style={{ width: 75, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                          <td><div style={{ width: 120, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                          <td><div style={{ width: 70, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                          <td><div style={{ width: 90, height: 30, background: '#e2e8f0', borderRadius: 6, marginLeft: 'auto' }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rn-list">
                {Array.from({ length: 6 }).map((_, i) => (
                  <GroupCardSkeleton key={i} />
                ))}
              </div>
            )
          ) : apiStatus === 'error' ? (
            <div className="rn-empty">
              <RiAlertLine size={48} color="var(--danger)" style={{ marginBottom: 14 }} />
              <h3>Failed to Load</h3>
              <p>Could not fetch groups from the server.</p>
              <button className="rn-primary" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={loadGroups}>
                <RiRefreshLine size={15} /> Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 340, padding: '32px 0', textAlign: 'center' }}>
              <LottieComponent 
                animationData={noFileAnimation} 
                loop={true} 
                style={{ width: 220, height: 220 }} 
              />
              <h3 style={{ margin: '12px 0 6px', fontSize: '16px', fontWeight: 700, color: '#030712' }}>No groups found</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                No {activeTab === 'all' ? '' : activeTab === 'not-started' ? 'not started' : activeTab} groups available yet.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="rp-table-container">
              <div className="rp-table-wrapper">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45, textAlign: 'center' }}>#</th>
                      <th>Group Name</th>
                      <th>Status</th>
                      <th>Total Members</th>
                      <th>Monthly Share</th>
                      <th>Pool Value</th>
                      <th>Duration & Progress</th>
                      <th>Collected</th>
                      <th style={{ textAlign: 'right', minWidth: 150 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((group, idx) => {
                      const status = String(group.status || 'active').toLowerCase();
                      const color = scOf(status);
                      const totalCycles = Number(group.duration) || 20;
                      const completed = Number(group.completedCycles) || 0;
                      const pct = Math.min(100, Math.round((completed / totalCycles) * 100));
                      const poolValue = Number(group.groupAmount) || 0;
                      const monthlyAmount = group.monthlyAmount || (totalCycles > 0 ? Math.round(poolValue / totalCycles) : 0);

                      return (
                        <tr 
                          key={group.id} 
                          onClick={() => openGroupMembers(group)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: 12 }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div className="rp-cell-member">
                              <div className="rp-avatar" style={{ background: `${color}15`, color, border: `1.5px solid ${color}33` }}>
                                {String(group.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="rp-name-info">
                                <span className="rp-name">{group.name}</span>
                                <span className="rp-sub">
                                  <RiCalendarLine size={11} /> {group.currentMonthDisplay || (group.duration ? `Month 1 of ${group.duration}` : '1st Month')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 10px',
                              borderRadius: 100,
                              fontSize: 11,
                              fontWeight: 700,
                              background: `${color}18`,
                              color: color,
                              border: `1px solid ${color}33`
                            }}>
                              <StatusIcon status={group.status} size={11} />
                              {String(group.status || 'Active').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              {group.totalMembers} Members
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>
                              {formatCurrency(monthlyAmount)}/mo
                            </strong>
                          </td>
                          <td>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>
                              {formatCurrency(poolValue)}
                            </strong>
                          </td>
                          <td style={{ minWidth: 150 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                                {completed}/{totalCycles} Cycles ({pct}%)
                              </span>
                              <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#2E7D32', fontSize: 14 }}>
                              {formatCurrency(group.collectedAmount)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="reports-refresh-btn"
                              onClick={(e) => { e.stopPropagation(); openGroupMembers(group); }}
                              style={{ height: 32, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}
                              title="View Collections & Members"
                            >
                              <span>Collections</span>
                              <RiArrowRightSLine size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rn-list">
              {filtered.map(g => (
                <GroupCard key={g.id} group={g} onViewMembers={openGroupMembers} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
