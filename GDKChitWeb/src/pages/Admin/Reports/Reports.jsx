import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, User as RiUserLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
  ChevronDown as RiChevronDown,
} from 'lucide-react';
import './Reports.css';
import MemberDetailsPanel from './MemberDetails/MemberDetailsPanel.jsx';

/* ─── Constants ──────────────────────────────────────────────── */
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SC = {
  active: '#10B981',
  completed: '#6B46C1',
  paid: '#10B981',
  pending: '#F59E0B',
  overdue: '#EF4444',
};
export const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';


/* ─── StatusIcon ─────────────────────────────────────────────── */
export const StatusIcon = ({ status, size = 13 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'paid' || s === 'completed' ? RiCheckLine
    : s === 'overdue' ? RiAlertLine
      : RiTimeLine;
  return <Icon size={size} color={scOf(s)} />;
};

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
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    active: groups.filter(g => g.status === 'active').length,
    completed: groups.filter(g => g.status === 'completed').length,
    notStarted: groups.filter(g => g.status.includes('not')).length,
  }), [groups]);

  const filtered = useMemo(() => {
    let list = groups;
    if (activeTab === 'active') list = groups.filter(g => g.status === 'active');
    else if (activeTab === 'completed') list = groups.filter(g => g.status === 'completed');
    else if (activeTab === 'not-started') list = groups.filter(g => g.status.includes('not'));

    if (selectedGroupFilter) {
      list = list.filter(g => String(g.id) === String(selectedGroupFilter));
    }
    return list;
  }, [groups, activeTab, selectedGroupFilter]);

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
            {/* Title and Profile Row */}
            <div className="reports-title-row">
              <div className="reports-title-group">
                <h2 className="reports-page-title">Reports</h2>
                <p className="reports-page-subtitle">Live group monitoring and member payment tracking</p>
              </div>
              <div className="reports-profile-group">
                <span className="reports-profile-name">Gowtham CD</span>
                <div className="reports-profile-avatar">
                  <RiUserLine size={18} />
                </div>
              </div>
            </div>

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
                      setSelectedGroupFilter(''); // Reset group filter on tab change
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Dropdowns & Action Button */}
              <div className="reports-filters-wrapper">
                {/* Group Selector Dropdown */}
                <div className="reports-select-container">
                  <select
                    className="reports-select"
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  >
                    <option value="">All Groups</option>
                    {groups
                      .filter(g => activeTab === 'all' || 
                        (activeTab === 'active' && g.status === 'active') || 
                        (activeTab === 'completed' && g.status === 'completed') || 
                        (activeTab === 'not-started' && g.status.includes('not'))
                      )
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.totalMembers} members)
                        </option>
                      ))}
                  </select>
                  <RiChevronDown className="reports-select-icon" size={16} />
                </div>

                {/* Category/Branch Dropdown */}
                <div className="reports-select-container">
                  <select
                    className="reports-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                  </select>
                  <RiChevronDown className="reports-select-icon" size={16} />
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
            <div className="rn-card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
              <RiLoader4Line size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
              <p style={{ margin: 0 }}>Loading groups from server...</p>
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
            <div className="rn-empty">
              <RiGroupLine size={48} color="var(--border)" style={{ marginBottom: 14 }} />
              <h3>No groups found</h3>
              <p>No {activeTab === 'all' ? '' : activeTab} groups available yet.</p>
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
