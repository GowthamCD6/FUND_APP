import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, Search as RiSearchLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
  ChevronDown as RiChevronDown,
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
   GROUP CARD  (mirrors RN GroupCard.jsx)
════════════════════════════════════════════════════════════════ */
const GroupCard = ({ group, onViewMembers }) => {
  const status = String(group.status || 'active').toLowerCase();
  const color = scOf(status);
  const pct = Math.min(100, Math.round(
    ((group.completedCycles || 0) / (group.duration || 20)) * 100
  ));

  return (
    <div className="gc-card">
      {/* Header */}
      <div className="gc-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="gc-name">{group.name}</h3>
          <span className="gc-badge" style={{ background: color }}>
            <StatusIcon status={status} size={10} />
            {status.toUpperCase()}
          </span>
        </div>
        <button className="gc-arrow-btn" onClick={() => onViewMembers(group)} title="View Members">
          <RiArrowRightSLine size={24} color="#9CA3AF" />
        </button>
      </div>

      {/* Info row: members + monthly amount */}
      <div className="gc-content">
        <div className="gc-info-row">
          <div className="gc-info-item">
            <RiGroupLine size={16} color="#6B7280" />
            <span className="gc-info-text">{group.totalMembers} Members</span>
          </div>
          <div className="gc-info-item">
            <RiMoneyDollarCircleLine size={16} color="#6B7280" />
            <span className="gc-info-text">{formatCurrency(group.groupAmount)}/month</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="gc-progress-wrap">
          <div className="gc-progress-hd">
            <span className="gc-progress-txt">{group.completedCycles || 0}/{group.duration || 20} Cycles</span>
            <span className="gc-progress-pct" style={{ color }}>{pct}%</span>
          </div>
          <div className="gc-bar">
            <div className="gc-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {/* Footer */}
        <div className="gc-footer">
          <span className="gc-date">
            {status === 'completed'
              ? `Completed: ${formatDate(group.completedDate)}`
              : `Start: ${formatDate(group.startDate)}`}
          </span>
          <span className="gc-collected">{formatCurrency(group.collectedAmount || 0)} collected</span>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
════════════════════════════════════════════════════════════════ */
const Reports = () => {
  const [groups, setGroups] = useState([]);
  const [apiStatus, setApiStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      setApiStatus('loading');
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => ({
        id: g.id,
        name: g.name || g.group_name || 'Untitled',
        status: String(g.status || 'Not Started').toLowerCase(),
        totalMembers: g.totalMembers || g.total_members || 0,
        completedCycles: g.completedCycles || 0,
        duration: g.duration || 20,
        groupAmount: g.groupAmount || g.group_amount || 0,
        startDate: g.startDate || g.start_date,
        endDate: g.endDate || g.end_date,
        completedDate: g.completedDate,
        collectedAmount: g.collectedAmount || 0,
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
    setGroupMembers([]);
    setMembersLoading(true);
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) setGroupMembers(data.data || []);
    } catch { }
    finally { setMembersLoading(false); }
  }, []);

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
          apiMembers={groupMembers}
          loading={membersLoading}
          onClose={() => { setSelectedGroup(null); setGroupMembers([]); }}
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
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {apiStatus === 'loading' ? (
            <div className="rn-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
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
