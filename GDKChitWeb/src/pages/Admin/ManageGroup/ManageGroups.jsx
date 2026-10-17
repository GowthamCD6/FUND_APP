import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  ArrowLeft as RiArrowLeftLine, Plus as RiAddLine, Info as RiInformationLine, Users as RiGroupLine,
  UserPlus as RiUserAddLine, Trash2 as RiDeleteBinLine, X as RiCloseLine, Loader2 as RiLoader4Line,
  Check as RiCheckLine, AlertTriangle as RiAlertLine, Search as RiSearchLine, RefreshCw as RiRefreshLine,
  Phone as RiPhoneLine, Clock as RiTimeLine, CircleDollarSign as RiMoneyDollarCircleLine,
  Pencil as RiPencilLine, Trophy as RiTrophyLine, ChevronLeft as RiChevronLeftLine, ChevronRight as RiChevronRightLine,
  Calendar as RiCalendarLine
} from 'lucide-react';
import './ManageGroups.css';
import EditModal from './Modal/EditModal.jsx';
import PaymentD from './Modal/PaymentD.jsx';
import AuctionW from './Modal/AuctionW.jsx';
import MemberRegistration from './Modal/MemberRegistration.jsx';
import Lottie from 'lottie-react';
import noFileAnimation from '../../../animation/no-file.json';

const LottieComponent = Lottie.default || Lottie;

const SC = {
  active: '#10B981',
  ongoing: '#10B981',
  completed: '#3B82F6',
  paid: '#10B981',
  pending: '#F59E0B',
  overdue: '#EF4444',
  'not started': '#F59E0B',
  'not-started': '#F59E0B',
};
const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';

const StatusIcon = ({ status, size = 11 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'paid' || s === 'completed' || s === 'active' || s === 'ongoing' ? RiCheckLine
    : s === 'overdue' ? RiAlertLine
      : RiTimeLine;
  return <Icon size={size} color={scOf(s)} style={{ verticalAlign: 'middle', marginRight: 4 }} />;
};

const ManageGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'details'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [notice, setNotice] = useState(null); // {text, success}
  const [searchQuery, setSearchQuery] = useState('');



  // ── Monthly Snapshot & Modal States ────────────────────────
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = current month, -1 = prev, etc.
  const [monthlySnapshot, setMonthlySnapshot] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);

  // Modal visibilities & loading states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [isAuctionSaving, setIsAuctionSaving] = useState(false);

  // ── Month offset calculation helpers ───────────────────────
  const getPeriodFromOffset = useCallback((offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      date,
    };
  }, []);

  const getMonthLabel = useCallback((offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, []);

  const loadMonthSnapshot = useCallback(async (groupId, offset) => {
    if (!groupId) return;
    setSnapshotLoading(true);
    try {
      const period = getPeriodFromOffset(offset);
      const res = await makeRequest(`/admin/groups/getMonthlySnapshot?groupId=${groupId}&month=${period.month}&year=${period.year}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setMonthlySnapshot(data.data || { payment: null, winner: null });
      } else {
        setMonthlySnapshot({ payment: null, winner: null });
      }
    } catch (err) {
      console.error('Error fetching snapshot:', err);
      setMonthlySnapshot({ payment: null, winner: null });
    } finally {
      setSnapshotLoading(false);
    }
  }, [getPeriodFromOffset]);

  const loadGroupMembers = useCallback(async (groupId) => {
    if (!groupId) {
      setGroupMembers([]);
      return;
    }
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${groupId}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setGroupMembers(data.members || data.data || []);
      } else {
        setGroupMembers([]);
      }
    } catch (err) {
      console.error('Error fetching group members for modal:', err);
      setGroupMembers([]);
    }
  }, []);

  // Load snapshot when group or month changes
  useEffect(() => {
    if (selectedGroup?.id) {
      loadMonthSnapshot(selectedGroup.id, currentMonth);
      loadGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup?.id, currentMonth, loadMonthSnapshot, loadGroupMembers]);

  // Reset month offset when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      setCurrentMonth(0);
    } else {
      setMonthlySnapshot(null);
      setGroupMembers([]);
    }
  }, [selectedGroup]);

  // Check if viewing month is start month
  const isStartMonth = useMemo(() => {
    if (!selectedGroup) return true;
    const period = getPeriodFromOffset(currentMonth);
    const startStr = selectedGroup.startDate;
    if (!startStr) return false;
    const startDt = new Date(startStr);
    if (isNaN(startDt.getTime())) return false;
    
    const periodYearMonth = period.year * 12 + period.month;
    const startYearMonth = startDt.getFullYear() * 12 + startDt.getMonth();
    return periodYearMonth <= startYearMonth;
  }, [selectedGroup, currentMonth, getPeriodFromOffset]);

  const totalGroupDuration = Number(selectedGroup?.duration || selectedGroup?.totalMembers || 20);
  const parsedStartDt = selectedGroup?.startDate ? new Date(selectedGroup.startDate) : null;
  const currentNow = new Date();

  const viewPeriod = getPeriodFromOffset(currentMonth);
  const viewingCycleMonth = (parsedStartDt && !isNaN(parsedStartDt.getTime()))
    ? Math.max(1, (viewPeriod.year - parsedStartDt.getFullYear()) * 12 + (viewPeriod.month - parsedStartDt.getMonth()) + 1)
    : 1;

  const maxElapsedCycle = (parsedStartDt && !isNaN(parsedStartDt.getTime()))
    ? Math.max(1, (currentNow.getFullYear() - parsedStartDt.getFullYear()) * 12 + (currentNow.getMonth() - parsedStartDt.getMonth()) + 1)
    : 1;

  const selectCycleMonth = (cycleNum) => {
    if (!parsedStartDt || isNaN(parsedStartDt.getTime())) return;
    const targetAbsoluteMonth = (parsedStartDt.getFullYear() * 12 + parsedStartDt.getMonth()) + (cycleNum - 1);
    const todayAbsoluteMonth = (currentNow.getFullYear() * 12 + currentNow.getMonth());
    const targetOffset = targetAbsoluteMonth - todayAbsoluteMonth;
    setCurrentMonth(targetOffset);
  };

  // ── Load groups ──────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    try {
      setStatus('loading');
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => {
        const rawStatus = String(g.status || '').toLowerCase().trim();
        const totalNum = Number(g.totalMembers || g.total_members) || 1;
        const completed = Number(g.completedCycles) || 0;
        let status = 'Active';
        if (rawStatus.includes('not started') || rawStatus === 'not-started') {
          status = 'Not Started';
        } else if (rawStatus === 'completed' || (completed > 0 && completed >= totalNum)) {
          status = 'Completed';
        }

        return {
          id: g.id,
          name: g.name || g.group_name || 'Untitled',
          status,
          totalMembers: g.totalMembers !== undefined ? g.totalMembers : (g.total_members !== undefined ? g.total_members : 0),
          duration: g.duration || totalNum || 20,
          groupAmount: g.groupAmount || g.group_amount || 0,
          startDate: g.startDate || g.start_date,
          endDate: g.endDate || g.end_date,
          createdDate: g.createdDate || g.created_at,
          groupCode: g.groupCode || '',
          completedCycles: completed,
        };
      });
      setGroups(mapped);
      setStatus('ready');
    } catch {
      setGroups([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Open group details ───────────────────────────────────
  const openGroupDetails = useCallback(async (group) => {
    setSelectedGroup(group);
    setViewMode('details');
    setNotice(null);
  }, []);

  // Auto-open group if passed from navigation state
  useEffect(() => {
    if (location.state?.groupId && groups.length > 0) {
      const target = groups.find(g => String(g.id) === String(location.state.groupId) || (g.name && g.name.toLowerCase() === String(location.state.groupName || '').toLowerCase()));
      if (target) {
        openGroupDetails(target);
      }
    } else if (location.state?.groupName && groups.length > 0) {
      const target = groups.find(g => g.name && g.name.toLowerCase() === String(location.state.groupName).toLowerCase());
      if (target) {
        openGroupDetails(target);
      }
    }
  }, [location.state, groups, openGroupDetails]);



  const handleMembersUpdate = (groupId, newCount, updatedList) => {
    if (updatedList) {
      setGroupMembers(updatedList);
    } else if (groupId) {
      loadGroupMembers(groupId);
    }
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, totalMembers: newCount } : g));
    setSelectedGroup(prev => prev && prev.id === groupId ? { ...prev, totalMembers: newCount } : prev);
  };

  // ── Delete group (local only; add API if available) ──────
  const confirmDelete = (g) => { setDelTarget(g); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    setGroups(prev => prev.filter(g => g.id !== delTarget.id));
    setShowDeleteConfirm(false);
    setDelTarget(null);
    if (selectedGroup?.id === delTarget?.id) { setSelectedGroup(null); setViewMode(null); }
  };

  // ── Save Group Info (Edit Group Modal) ──────────────────────
  const handleEditGroupSave = async (editData) => {
    setIsEditSaving(true);
    try {
      setNotice(null);
      const res = await makeRequest('/admin/groups/updateGroup', {
        method: 'POST',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          groupName: editData.groupName,
          totalAmount: editData.totalAmount,
          numberOfUsers: editData.numberOfUsers,
          createdDate: editData.createdDate,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update group');

      // Update groups in list
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? {
        ...g,
        name: editData.groupName,
        groupAmount: Number(editData.totalAmount),
        duration: Number(editData.numberOfUsers),
        totalMembers: Number(editData.numberOfUsers),
        startDate: editData.createdDate,
      } : g));

      // Update selectedGroup details
      setSelectedGroup(prev => ({
        ...prev,
        name: editData.groupName,
        groupAmount: Number(editData.totalAmount),
        duration: Number(editData.numberOfUsers),
        totalMembers: Number(editData.numberOfUsers),
        startDate: editData.createdDate,
      }));

      setShowEditModal(false);
      setNotice({ text: 'Group details updated successfully', success: true });
    } catch (err) {
      setNotice({ text: err.message || 'Failed to update group', success: false });
    } finally {
      setIsEditSaving(false);
    }
  };

  // ── Save Payment Details ───────────────────────────────────
  const handlePaymentSave = async (paymentData) => {
    setIsPaymentSaving(true);
    try {
      setNotice(null);
      const period = getPeriodFromOffset(currentMonth);
      const res = await makeRequest('/admin/groups/saveMonthlyDetails', {
        method: 'POST',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          month: period.month,
          year: period.year,
          currentMonthAmount: Number(paymentData.currentMonthAmount) || 0,
          elathThalupadi: Number(paymentData.elathThalupadi) || 0,
          commission: Number(paymentData.commission) || 0,
          notes: paymentData.notes || '',
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to save payment details');

      // Refresh snapshot
      await loadMonthSnapshot(selectedGroup.id, currentMonth);
      setShowPaymentModal(false);
      setNotice({ text: 'Payment details saved successfully', success: true });
    } catch (err) {
      setNotice({ text: err.message || 'Failed to save payment details', success: false });
    } finally {
      setIsPaymentSaving(false);
    }
  };

  // ── Save Auction Winner ───────────────────────────────────
  const handleAuctionWinnerSave = async (winnerData) => {
    setIsAuctionSaving(true);
    try {
      setNotice(null);
      const period = getPeriodFromOffset(currentMonth);

      let winnerUserId = null;
      try {
        const memRes = await makeRequest(`/admin/groups/getMembers?groupId=${selectedGroup.id}`);
        const memData = await safeJson(memRes);
        if (memRes.ok && memData?.success) {
          const membersList = memData.members || memData.data || [];
          const matched = membersList.find(
            m => m.phone === winnerData.chitWinnerMemberId ||
            (m.userId && String(m.userId) === winnerData.chitWinnerMemberId)
          );
          if (matched) winnerUserId = matched.userId;
        }
      } catch (err) {
        console.warn('Failed to fetch members for winner matching', err);
      }

      const res = await makeRequest('/admin/groups/saveAuctionWinner', {
        method: 'POST',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          month: period.month,
          year: period.year,
          chitWinnerName: winnerData.chitWinnerName,
          chitWinnerMemberId: winnerData.chitWinnerMemberId,
          amountTaken: Number(winnerData.amountTaken) || 0,
          datePicked: winnerData.datePicked,
          winnerUserId,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to save auction winner');

      // Refresh snapshot & group members
      await loadMonthSnapshot(selectedGroup.id, currentMonth);
      loadGroupMembers(selectedGroup.id);
      setShowAuctionModal(false);
      setNotice({ text: 'Auction winner details saved successfully', success: true });
    } catch (err) {
      setNotice({ text: err.message || 'Failed to save auction winner', success: false });
    } finally {
      setIsAuctionSaving(false);
    }
  };

  // ── Filters & counts ─────────────────────────────────────
  const counts = useMemo(() => ({
    all: groups.length,
    active: groups.filter(g => g.status === 'Active').length,
    notStarted: groups.filter(g => g.status === 'Not Started').length,
    completed: groups.filter(g => g.status === 'Completed').length,
  }), [groups]);

  const filtered = useMemo(() => {
    let list = groups;
    if (activeTab === 'active') list = groups.filter(g => g.status === 'Active');
    else if (activeTab === 'not-started') list = groups.filter(g => g.status === 'Not Started');
    else if (activeTab === 'completed') list = groups.filter(g => g.status === 'Completed');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        String(g.id).toLowerCase().includes(q) ||
        String(g.groupCode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [groups, activeTab, searchQuery]);

  // Memos for users are now handled inside the MemberRegistration modal component

  return (
    <div className="rn-page">
      {/* ── Page Header & Action Bar Container ── */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row">
          {/* Tab Bar */}
          <div className="reports-tabs-wrapper">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'active', label: `Active (${counts.active})` },
              { key: 'not-started', label: `Not Started (${counts.notStarted})` },
              { key: 'completed', label: `Completed (${counts.completed})` },
            ].map(t => (
              <button
                key={t.key}
                className={`reports-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(t.key);
                  setSearchQuery('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search & New Group Action */}
          <div className="reports-filters-wrapper">
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

            <button
              className="reports-refresh-btn"
              onClick={() => navigate('/admin/create-group')}
              title="New Group"
              style={{
                border: '1px solid #2E7D32',
                background: '#2E7D32',
                color: '#FFFFFF',
                fontWeight: 600,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RiAddLine size={16} color="#FFFFFF" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {status === 'loading' ? (
        <div className="rn-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gc-card skeleton-pulse" style={{ pointerEvents: 'none', height: 260 }}>
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
              </div>
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="rn-empty">
          <RiAlertLine size={36} color="var(--danger)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#030712', fontWeight: 700 }}>Failed to load groups</h3>
          <p><button className="reports-refresh-btn" style={{ margin: '12px auto 0' }} onClick={loadGroups}>
            <RiRefreshLine size={16} /> Retry
          </button></p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 340, padding: '32px 0', textAlign: 'center' }}>
          <LottieComponent
            animationData={noFileAnimation}
            loop={true}
            style={{ width: 220, height: 220 }}
          />
          <h3 style={{ margin: '12px 0 6px', fontSize: '16px', fontWeight: 700, color: '#030712' }}>
            No groups found
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7A6E', fontWeight: 500 }}>
            No {activeTab === 'all' ? '' : activeTab === 'not-started' ? 'not started' : activeTab} groups match your query.
          </p>
        </div>
      ) : (
        <div className="rn-list">
          {filtered.map(g => {
            const color = scOf(g.status);
            const totalCycles = Number(g.duration) || 20;
            const completed = Number(g.completedCycles) || 0;
            const remainingCycles = Math.max(0, totalCycles - completed);
            const pct = Math.min(100, Math.round((completed / totalCycles) * 100));
            const poolValue = Number(g.groupAmount) || 0;
            const monthlyAmount = g.monthlyAmount || (totalCycles > 0 ? Math.round(poolValue / totalCycles) : 0);

            return (
              <div key={g.id} className="gc-card mg-enhanced-card" onClick={() => openGroupDetails(g)}>
                {/* Header */}
                <div className="gc-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 className="gc-name" style={{ margin: 0 }}>{g.name}</h3>
                      {g.groupCode && (
                        <span className="mg-code-chip">{g.groupCode}</span>
                      )}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="gc-badge" style={{ background: color }}>
                        <StatusIcon status={g.status} size={10} />
                        {g.status.toUpperCase()}
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
                        <RiCalendarLine size={11} /> {g.currentMonthDisplay || (g.duration ? `1st Month of ${g.duration}` : '1st Month')}
                      </span>
                    </div>
                  </div>
                  <button className="gc-arrow-btn" onClick={(e) => { e.stopPropagation(); openGroupDetails(g); }} title="View Group Details">
                    <RiChevronRightLine size={24} color="#9CA3AF" />
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
                      <strong className="mg-metric-val">{g.totalMembers} Members</strong>
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

                  {/* Dates Footer */}
                  <div className="gc-footer" style={{ paddingTop: 12 }}>
                    <span className="gc-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <RiCalendarLine size={13} color="#64748b" />
                      Start: {formatDate(g.startDate)}
                    </span>
                    <span className="gc-date" style={{ textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                      End: {formatDate(g.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Side Panel ───────────────────────────────────── */}
      {selectedGroup && viewMode && (
        <div className="mg2-panel-overlay" onClick={() => { setSelectedGroup(null); setViewMode(null); setNotice(''); }}>
          <div className="mg2-panel" onClick={e => e.stopPropagation()}>
            {/* Panel Header */}
            <div className="mg2-panel-head">
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#030712' }}>{selectedGroup.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    {formatCurrency(selectedGroup.groupAmount)}/month · {selectedGroup.totalMembers} members
                  </p>
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
                    <RiCalendarLine size={11} /> {selectedGroup.currentMonthDisplay || `${selectedGroup.duration || 20} Months`}
                  </span>
                </div>
              </div>
              <button className="rp-close" onClick={() => { setSelectedGroup(null); setViewMode(null); setNotice(''); }}>
                <RiCloseLine size={16} />
              </button>
            </div>

            {/* Panel Tabs */}
            <div className="mg2-panel-tabs">
              <button
                className={`mg2-panel-tab ${viewMode === 'details' ? 'active' : ''}`}
                onClick={() => setViewMode('details')}
              >
                <RiInformationLine size={14} /> Details
              </button>
              <button
                className={`mg2-panel-tab ${viewMode === 'groups' ? 'active' : ''}`}
                onClick={() => setViewMode('groups')}
              >
                <RiGroupLine size={14} /> Members
              </button>
            </div>

            {notice && (
              <div style={{ background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: '6px', fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                {notice.success ? <RiCheckLine size={15} /> : <RiAlertLine size={15} />}
                {notice.text}
              </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && (
              <div className="mg2-details-container">
                {/* ── Group Info Section ── */}
                <div className="mg2-section-card">
                  <div className="mg2-card-header">
                    <h4 className="mg2-card-title"><RiGroupLine size={16} /> Group Info</h4>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="mg2-icon-edit-btn" onClick={() => setShowEditModal(true)} title="Edit Group Info">
                        <RiPencilLine size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="mg2-icon-edit-btn" style={{ borderColor: '#fca5a5', color: '#ef4444' }} onClick={() => confirmDelete(selectedGroup)} title="Delete Group">
                        <RiDeleteBinLine size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="mg2-card-body">
                    <div className="rn-detail-row">
                      <span>Group Name</span>
                      <strong>{selectedGroup.name}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Status</span>
                      <strong style={{ color: scOf(selectedGroup.status), fontWeight: 700 }}>
                        {selectedGroup.status.toUpperCase()}
                      </strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Total Members</span>
                      <strong>{selectedGroup.totalMembers || '--'}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Group Amount</span>
                      <strong>{formatCurrency(selectedGroup.groupAmount)}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Duration</span>
                      <strong>{selectedGroup.duration || selectedGroup.totalMembers || '--'} months</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Current Month Cycle</span>
                      <strong style={{ color: '#1d4ed8', fontWeight: 800 }}>
                        {selectedGroup.currentMonthDisplay || `1st Month of ${selectedGroup.duration || 20}`}
                      </strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Start Date</span>
                      <strong>{formatDate(selectedGroup.startDate)}</strong>
                    </div>
                    {selectedGroup.endDate && (
                      <div className="rn-detail-row">
                        <span>End Date</span>
                        <strong>{formatDate(selectedGroup.endDate)}</strong>
                      </div>
                    )}
                    <div className="rn-detail-row">
                      <span>Group Code</span>
                      <strong>{selectedGroup.groupCode || '--'}</strong>
                    </div>
                  </div>
                </div>

                {/* ── Month Indicator & Quick Month Pills ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ede9fe', padding: '4px 10px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                    <RiCalendarLine size={14} color="#6b46c1" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#6b46c1', letterSpacing: '0.4px' }}>
                      MONTH {viewingCycleMonth} OF {totalGroupDuration}
                    </span>
                  </div>
                  {viewingCycleMonth === maxElapsedCycle && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      Current Active Cycle
                    </span>
                  )}
                </div>

                {/* Quick Month Pills Bar (1, 2, 3...) */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                  {Array.from({ length: totalGroupDuration }, (_, i) => i + 1).map(cycleNum => {
                    const isSelected = viewingCycleMonth === cycleNum;
                    const isPastOrCurrent = cycleNum <= maxElapsedCycle;
                    return (
                      <button
                        key={cycleNum}
                        type="button"
                        onClick={() => selectCycleMonth(cycleNum)}
                        disabled={snapshotLoading}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          border: isSelected ? '1px solid #5b21b6' : '1px solid #e2e8f0',
                          background: isSelected ? '#6b46c1' : (isPastOrCurrent ? '#ffffff' : '#f8fafc'),
                          color: isSelected ? '#ffffff' : (isPastOrCurrent ? '#334155' : '#94a3b8'),
                          boxShadow: isSelected ? '0 2px 4px rgba(107, 70, 193, 0.2)' : 'none'
                        }}
                      >
                        Month {cycleNum}
                      </button>
                    );
                  })}
                </div>

                {/* ── Month Navigation Section ── */}
                <div className="mg2-month-nav">
                  <button
                    className="mg2-month-nav-btn"
                    onClick={() => setCurrentMonth(prev => prev - 1)}
                    disabled={isStartMonth || snapshotLoading}
                    title="Previous Month"
                  >
                    <RiChevronLeftLine size={16} />
                    <span>Prev</span>
                  </button>
                  
                  <div className="mg2-month-display">
                    <span className="mg2-month-label">
                      {snapshotLoading ? 'Updating Month...' : `Viewing Month ${viewingCycleMonth} of ${totalGroupDuration}`}
                    </span>
                    <strong className="mg2-month-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {getMonthLabel(currentMonth)}
                      {snapshotLoading && (
                        <RiLoader4Line size={14} className="spin-anim" color="var(--primary)" />
                      )}
                    </strong>
                    {currentMonth === 0 && <span className="mg2-current-badge">Current</span>}
                  </div>

                  <button
                    className="mg2-month-nav-btn"
                    onClick={() => setCurrentMonth(prev => prev + 1)}
                    disabled={viewingCycleMonth >= totalGroupDuration || snapshotLoading}
                    title="Next Month"
                  >
                    <span>Next</span>
                    <RiChevronRightLine size={16} />
                  </button>
                </div>

                {snapshotLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Payment Skeleton */}
                    <div className="mg2-section-card skeleton-pulse" style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '40%', height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 14 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: '35%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                        <div style={{ width: '25%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: '30%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                        <div style={{ width: '20%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                        <div style={{ width: '40%', height: 14, background: '#e2e8f0', borderRadius: 4 }} />
                        <div style={{ width: '30%', height: 14, background: '#e2e8f0', borderRadius: 4 }} />
                      </div>
                    </div>

                    {/* Auction Winner Skeleton */}
                    <div className="mg2-section-card skeleton-pulse" style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '35%', height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 14 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: '30%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                        <div style={{ width: '40%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ width: '35%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                        <div style={{ width: '25%', height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── Payment Details Section ── */}
                    <div className="mg2-section-card">
                      <div className="mg2-card-header">
                        <h4 className="mg2-card-title"><RiMoneyDollarCircleLine size={16} /> Payment Config</h4>
                        <button className="mg2-icon-edit-btn" onClick={() => setShowPaymentModal(true)} title="Edit Monthly Payments">
                          <RiPencilLine size={14} />
                          <span>Configure</span>
                        </button>
                      </div>
                      <div className="mg2-card-body">
                        {monthlySnapshot?.payment ? (
                          <>
                            <div className="rn-detail-row">
                              <span>Amount to be Paid</span>
                              <strong>{formatCurrency(monthlySnapshot.payment.currentMonthAmount)}</strong>
                            </div>
                            <div className="rn-detail-row">
                              <span>Discount (எலத் தள்ளுபடி)</span>
                              <strong style={{ color: '#dc2626' }}>- {formatCurrency(monthlySnapshot.payment.elathThalupadi)}</strong>
                            </div>
                            <div className="rn-detail-row">
                              <span>Commission (கசர்)</span>
                              <strong style={{ color: '#10b981' }}>+ {formatCurrency(monthlySnapshot.payment.commission)}</strong>
                            </div>
                            <div className="rn-detail-row net-amount-row" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 8, marginTop: 8 }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>Net Collection Amount</span>
                              <strong style={{ color: 'var(--primary)', fontSize: 15, fontWeight: 800 }}>
                                {formatCurrency(
                                  Number(monthlySnapshot.payment.currentMonthAmount) +
                                  Number(monthlySnapshot.payment.commission) -
                                  Number(monthlySnapshot.payment.elathThalupadi)
                                )}
                              </strong>
                            </div>
                            {monthlySnapshot.payment.notes && (
                              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                <strong>Notes:</strong> {monthlySnapshot.payment.notes}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ padding: '12px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                            No custom payment details configured for this month.
                            <div style={{ marginTop: 6, fontSize: 12 }}>Using group monthly default: <strong>{formatCurrency(Math.round((selectedGroup.groupAmount || 0) / (selectedGroup.duration || 20)))}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Auction Winner Section ── */}
                    <div className="mg2-section-card">
                      <div className="mg2-card-header">
                        <h4 className="mg2-card-title"><RiTrophyLine size={16} /> Auction Winner</h4>
                        <button className="mg2-icon-edit-btn" onClick={() => setShowAuctionModal(true)} title="Register Winner">
                          <RiTrophyLine size={14} />
                          <span>{monthlySnapshot?.winner ? 'Edit Winner' : 'Register'}</span>
                        </button>
                      </div>
                      <div className="mg2-card-body">
                        {monthlySnapshot?.winner ? (
                          <>
                            <div className="rn-detail-row">
                              <span>Winner Name</span>
                              <strong style={{ color: '#b45309' }}>{monthlySnapshot.winner.chitWinnerName}</strong>
                            </div>
                            <div className="rn-detail-row">
                              <span>Winner Phone</span>
                              <strong>{monthlySnapshot.winner.chitWinnerMemberId || '--'}</strong>
                            </div>
                            <div className="rn-detail-row">
                              <span>Amount Taken</span>
                              <strong style={{ color: '#059669' }}>{formatCurrency(monthlySnapshot.winner.amountTaken)}</strong>
                            </div>
                            <div className="rn-detail-row">
                              <span>Auction Date</span>
                              <strong>{formatDate(monthlySnapshot.winner.datePicked)}</strong>
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '12px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                            No winner registered for this month's auction cycle.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Groups (Members list & Adder) View */}
            {viewMode === 'groups' && (
              <MemberRegistration
                inline={true}
                isOpen={true}
                group={selectedGroup}
                onMembersUpdate={handleMembersUpdate}
              />
            )}

          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="rn-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="rn-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 800 }}>
              <RiDeleteBinLine size={20} /> Delete Group?
            </h3>
            <p style={{ color: '#334155', fontSize: 14 }}>Are you sure you want to delete <strong>{delTarget?.name}</strong>?</p>
            <div className="rn-form-row" style={{ marginTop: 16 }}>
              <button style={{ padding: 12, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="rn-primary rn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer' }} onClick={doDelete}>
                <RiDeleteBinLine size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}



      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={selectedGroup}
        onSave={handleEditGroupSave}
        isSaving={isEditSaving}
      />

      <PaymentD
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialData={monthlySnapshot?.payment}
        defaultAmount={selectedGroup?.monthlyAmount || Math.round((selectedGroup?.groupAmount || 0) / (selectedGroup?.duration || 20))}
        onSave={handlePaymentSave}
        isSaving={isPaymentSaving}
      />

      <AuctionW
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        initialData={monthlySnapshot?.winner}
        onSave={handleAuctionWinnerSave}
        isSaving={isAuctionSaving}
        groupMembers={groupMembers}
      />
    </div>
  );
};

export default ManageGroups;
