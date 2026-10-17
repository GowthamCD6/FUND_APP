import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, User as RiUserLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
  CheckCircle as RiCheckCircleLine, Phone as RiPhoneLine, ShieldCheck, Search as RiSearchLine
} from 'lucide-react';
import { MONTHS, scOf, StatusIcon } from '../Reports.jsx';

/* ════════════════════════════════════════════════════════════════
   MEMBER CHIT CARD  (payment history side panel)
════════════════════════════════════════════════════════════════ */
const MemberChitCard = ({ member, monthlyAmount, onClose }) => (
  <div className="rp-overlay" onClick={onClose}>
    <div className="rp-panel" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="rp-ph">
        <div className="md-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48, fontSize: 18, border: '2px solid rgba(27, 51, 34, 0.15)' }}>
          {String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 17, color: 'var(--text-heading, #0B140E)' }}>{member.name}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted, #6B7A6E)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiPhoneLine size={13} /> {member.phone || '--'}
          </p>
        </div>
        <button className="rp-close" onClick={onClose}><RiCloseLine size={18} /></button>
      </div>

      <div style={{ padding: '16px 24px 8px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Official Ledger & Payment History
        </p>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {(member.paymentHistory || []).map((p, i) => (
          <div key={i} className="rp-hist-row">
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14, color: 'var(--text-heading, #0B140E)' }}>{p.monthName}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted, #6B7A6E)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RiCalendarLine size={12} />
                {p.paidDate ? `Paid: ${formatDate(p.paidDate)}` : `Due: ${formatDate(p.dueDate)}`}
              </p>
              {p.receiptNumber && (
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--secondary, #A3704C)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <RiFileListLine size={11} /> {p.receiptNumber}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#0B140E' }}>{formatCurrency(p.amount)}</p>
              <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: `${scOf(p.status)}18`, color: scOf(p.status), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <StatusIcon status={p.status} size={9} /> {(p.status || '').toUpperCase()}
              </span>
            </div>
          </div>
        ))}
        {!(member.paymentHistory || []).length && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '36px 0' }}>No payment records found.</p>
        )}
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   PAYMENT EDITOR MODAL
════════════════════════════════════════════════════════════════ */
const PaymentEditor = ({ member, payment, selMonth, selYear, monthlyAmount, onSave, onClose, isSubmitting }) => {
  const [newStatus, setNewStatus] = useState(payment?.status || 'pending');
  const OPTIONS = [
    { value: 'paid', label: 'Mark as Paid / Accepted', Icon: RiCheckLine, desc: 'Payment received & confirmed in ledger' },
    { value: 'pending', label: 'Mark as Pending', Icon: RiTimeLine, desc: 'Awaiting payment from member' },
    { value: 'overdue', label: 'Mark as Overdue', Icon: RiAlertLine, desc: 'Payment past due date' },
  ];

  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <RiEditLine size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Update Collection Status</h3>
        </div>
        <p style={{ margin: '4px 0 6px', fontSize: 14, color: 'var(--muted)' }}>
          {member.name} · {MONTHS[selMonth]} {selYear}
        </p>
        <p style={{ margin: '0 0 18px', fontWeight: 800, fontSize: 26, color: 'var(--text-heading, #0B140E)' }}>
          {formatCurrency(payment?.amount || monthlyAmount)}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {OPTIONS.map(({ value, label, Icon, desc }) => (
            <button key={value} onClick={() => setNewStatus(value)}
              style={{ 
                padding: '14px 16px', 
                border: `2px solid ${newStatus === value ? scOf(value) : 'var(--border)'}`, 
                borderRadius: '8px', 
                background: newStatus === value ? `${scOf(value)}12` : 'var(--surface)', 
                cursor: 'pointer', 
                textAlign: 'left', 
                transition: 'all 0.15s', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12 
              }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${scOf(value)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={scOf(value)} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: newStatus === value ? scOf(value) : 'var(--text)' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
              </div>
              {newStatus === value && <RiCheckLine size={16} color={scOf(value)} />}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={onClose} 
            style={{ padding: '13px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface2, #E8ECE8)', fontWeight: 700, cursor: 'pointer', fontSize: 14, color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => onSave(member.id || member.userId, newStatus, payment?.amount || monthlyAmount)}
            style={{ 
              padding: '13px', 
              borderRadius: '8px', 
              border: 'none', 
              background: scOf(newStatus), 
              color: '#fff', 
              fontWeight: 700, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', 
              fontSize: 14, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 6 
            }}
          >
            {isSubmitting ? <RiLoader4Line size={16} className="spin-anim" /> : <RiCheckLine size={16} />} 
            Save Status
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MEMBER DETAILS PANEL  (Live Data Synchronized)
════════════════════════════════════════════════════════════════ */
const MemberDetailsPanel = ({ group, onClose, onRefreshParent }) => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [chitCardMember, setChitCardMember] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [notice, setNotice] = useState(null);

  // Fetch real-time members and payments for this group and selected month
  const loadGroupMembers = useCallback(async (m = selMonth, y = selYear) => {
    if (!group?.id) return;
    setLoading(true);
    try {
      const res = await makeRequest(`/admin/reports/group-members?groupId=${group.id}&month=${m}&year=${y}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setMembers(data.data?.members || []);
      } else {
        // Fallback to basic group members if specialized reporting endpoint returned empty
        const fallbackRes = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
        const fallbackData = await safeJson(fallbackRes);
        if (fallbackRes.ok && fallbackData?.success) {
          const list = fallbackData.members || fallbackData.data || [];
          setMembers(list.map(mem => ({
            id: mem.userId || mem.id,
            name: mem.name || 'Member',
            phone: mem.phone || '--',
            currentPayment: {
              month: m,
              year: y,
              amount: group.monthlyAmount || Math.round((group.groupAmount || 0) / (group.duration || 20)),
              status: 'pending',
            },
            paymentHistory: [],
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching real-time member payments:', err);
    } finally {
      setLoading(false);
    }
  }, [group, selMonth, selYear]);

  useEffect(() => {
    loadGroupMembers(selMonth, selYear);
  }, [loadGroupMembers, selMonth, selYear]);

  const monthlyAmt = group.monthlyAmount || Math.round((group.groupAmount || 0) / (group.duration || 20));
  const isCurrentMonth = selMonth === now.getMonth() && selYear === now.getFullYear();

  // Compute live stats based on actual member payment records
  const stats = useMemo(() => {
    let paid = 0, pending = 0, overdue = 0, collected = 0;
    members.forEach(m => {
      const p = (m.paymentHistory || []).find(x => Number(x.month) === Number(selMonth) && Number(x.year) === Number(selYear)) || m.currentPayment;
      const s = String(p?.status || 'pending').toLowerCase();
      const amt = Number(p?.amount || monthlyAmt);
      if (s === 'paid') {
        paid++;
        collected += amt;
      } else if (s === 'overdue') {
        overdue++;
      } else {
        pending++;
      }
    });
    return { paid, pending, overdue, collected };
  }, [members, selMonth, selYear, monthlyAmt]);

  const [searchMember, setSearchMember] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredMembers = useMemo(() => {
    let list = members;
    if (statusFilter !== 'all') {
      list = list.filter(m => {
        const p = (m.paymentHistory || []).find(x => Number(x.month) === Number(selMonth) && Number(x.year) === Number(selYear)) || m.currentPayment;
        return String(p?.status || 'pending').toLowerCase() === statusFilter;
      });
    }
    if (searchMember.trim()) {
      const q = searchMember.toLowerCase();
      list = list.filter(m => 
        String(m.name || '').toLowerCase().includes(q) ||
        String(m.phone || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, statusFilter, searchMember, selMonth, selYear]);

  // Update payment directly to the backend API
  const handleUpdatePayment = useCallback(async (memberId, newStatus, customAmount) => {
    setIsSaving(true);
    setUpdatingMemberId(memberId);
    setNotice(null);
    try {
      const res = await makeRequest('/admin/reports/payment-status', {
        method: 'POST',
        body: JSON.stringify({
          groupId: group.id,
          userId: memberId,
          month: selMonth,
          year: selYear,
          status: newStatus,
          amount: customAmount || monthlyAmt,
          paymentMethod: 'cash',
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update payment status');

      // Update locally immediately for instantaneous UI response
      setMembers(prev => prev.map(m => {
        if (Number(m.id || m.userId) !== Number(memberId)) return m;
        const existingHistory = m.paymentHistory || [];
        const hasEntry = existingHistory.some(p => Number(p.month) === Number(selMonth) && Number(p.year) === Number(selYear));
        const updatedHistory = hasEntry
          ? existingHistory.map(p => {
              if (Number(p.month) !== Number(selMonth) || Number(p.year) !== Number(selYear)) return p;
              return {
                ...p,
                status: newStatus,
                paidDate: newStatus === 'paid' ? (data.data?.paidDate || new Date().toISOString()) : null,
                receiptNumber: data.data?.receiptNumber || (newStatus === 'paid' ? `RCP-${group.id}-${memberId}` : null),
              };
            })
          : [
              {
                month: selMonth,
                year: selYear,
                monthName: `${MONTHS[selMonth]} ${selYear}`,
                amount: customAmount || monthlyAmt,
                status: newStatus,
                dueDate: `${selYear}-${String(selMonth + 1).padStart(2, '0')}-15`,
                paidDate: newStatus === 'paid' ? (data.data?.paidDate || new Date().toISOString()) : null,
                receiptNumber: data.data?.receiptNumber || (newStatus === 'paid' ? `RCP-${group.id}-${memberId}` : null),
              },
              ...existingHistory,
            ];

        return {
          ...m,
          currentPayment: {
            ...(m.currentPayment || {}),
            status: newStatus,
            paidDate: newStatus === 'paid' ? (data.data?.paidDate || new Date().toISOString()) : null,
            receiptNumber: data.data?.receiptNumber || null,
          },
          paymentHistory: updatedHistory,
        };
      }));

      setNotice({ text: `Payment status updated to ${newStatus.toUpperCase()}`, success: true });
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      setNotice({ text: err.message || 'Error updating payment status', success: false });
    } finally {
      setIsSaving(false);
      setUpdatingMemberId(null);
      setEditTarget(null);
      setEditPayment(null);
    }
  }, [group.id, selMonth, selYear, monthlyAmt, onRefreshParent]);

  // Quick Accept: One-click acceptance
  const handleQuickAccept = (member, payment) => {
    handleUpdatePayment(member.id || member.userId, 'paid', payment?.amount || monthlyAmt);
  };

  const STAT_CARDS = [
    { label: 'Paid / Accepted', value: stats.paid, Icon: RiCheckLine, color: '#10B981' },
    { label: 'Pending', value: stats.pending, Icon: RiTimeLine, color: '#F59E0B' },
    { label: 'Overdue', value: stats.overdue, Icon: RiAlertLine, color: '#EF4444' },
    { label: 'Collected This Month', value: formatCurrency(stats.collected), Icon: RiMoneyDollarCircleLine, color: 'var(--primary)' },
  ];

  const getAvailableMonths = () => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let startYear = currentYear;
    let startMonth = 0;

    const groupStart = group.startDate || group.start_date;
    if (groupStart) {
      const parsedDate = typeof groupStart === 'string' ? groupStart.replace(' ', 'T') : groupStart;
      const startDate = new Date(parsedDate);
      if (!Number.isNaN(startDate.getTime())) {
        startYear = startDate.getFullYear();
        startMonth = startDate.getMonth();
      }
    }

    const availableMonths = [];
    const endYear = Math.max(currentYear, startYear);

    for (let y = startYear; y <= endYear; y++) {
      const sMonth = y === startYear ? startMonth : 0;
      let eMonth = 11;

      if (y === endYear) {
        if (endYear === currentYear) {
          eMonth = Math.max(currentMonth, y === startYear ? startMonth : 0);
        } else {
          eMonth = startMonth;
        }
      } else if (y === currentYear) {
        eMonth = currentMonth;
      }

      for (let m = sMonth; m <= eMonth; m++) {
        availableMonths.push({
          index: m,
          year: y,
          name: MONTHS[m],
          id: `${y}-${m}`
        });
      }
    }
    return availableMonths.reverse();
  };

  const availableMonthsList = getAvailableMonths();

  return (
    <>
      {/* ── Page Header & Action Bar Container ── */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row" style={{ borderTop: 'none', padding: '16px 22px', alignItems: 'center' }}>
          
          {/* Left: Back Button & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
            <button className="md-back-btn" onClick={onClose} title="Back to Groups">
              <RiArrowLeftLine size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-heading, #0B140E)' }}>
                  {group.name}
                </h3>
                {isCurrentMonth && (
                  <span style={{ background: '#2E7D32', color: '#fff', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <RiTimeLine size={10} /> CURRENT CYCLE
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted, #6B7A6E)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <RiMoneyDollarCircleLine size={14} color="#10b981" /> {formatCurrency(monthlyAmt)}/mo per member
                <span style={{ color: '#cbd5e1' }}>·</span>
                <RiGroupLine size={14} /> {members.length} registered members
              </p>
            </div>
          </div>

          {/* Right: Refresh & Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="reports-refresh-btn" 
              onClick={() => loadGroupMembers(selMonth, selYear)}
              title="Refresh Live Payments"
            >
              <RiRefreshLine size={15} className={loading ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                className="reports-refresh-btn" 
                onClick={() => setShowMonthPicker(v => !v)}
                style={{ fontWeight: 700, borderColor: 'var(--primary-border, #C8DEC9)' }}
              >
                <RiCalendarLine size={16} color="var(--primary)" />
                <span>{MONTHS[selMonth]} {selYear}</span>
                <RiArrowRightSLine size={16} color="var(--primary)" style={{ transform: showMonthPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              {showMonthPicker && (
                <div className="md-month-picker" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, width: 220, margin: 0 }}>
                  {availableMonthsList.map((mInfo) => (
                    <button key={mInfo.id} className={`md-month-item${mInfo.index === selMonth && mInfo.year === selYear ? ' active' : ''}`}
                      onClick={() => { setSelMonth(mInfo.index); setSelYear(mInfo.year); setShowMonthPicker(false); }}>
                      {mInfo.name} {mInfo.year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {notice && (
        <div style={{ margin: '14px 0 0', padding: '10px 16px', borderRadius: 8, background: notice.success ? '#E8F5E9' : '#FFEBEE', color: notice.success ? '#1B3322' : '#D32F2F', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${notice.success ? '#C8E6C9' : '#FFCDD2'}` }}>
          {notice.success ? <RiCheckLine size={16} /> : <RiAlertLine size={16} />}
          {notice.text}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="md-stats-row" style={{ background: 'transparent', borderBottom: 'none', padding: '0 0 4px', gap: 14 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="md-stat-card" style={{ background: '#ffffff', border: '1px solid #DCE3DC', borderRadius: 12, boxShadow: '0 2px 6px rgba(27,51,34,0.03)', padding: '16px 12px' }}>
            <div style={{ background: `${s.color}15`, padding: 8, borderRadius: 8, marginBottom: 2 }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <span className="md-stat-val" style={{ color: '#0B140E', fontSize: 20, fontWeight: 800 }}>{s.value}</span>
            <span className="md-stat-lbl" style={{ color: '#6B7A6E', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Table Toolbar (Search, Filter Pills & View Toggle) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '3px 4px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {[
            { key: 'all', label: `All (${members.length})` },
            { key: 'paid', label: `Paid (${stats.paid})` },
            { key: 'pending', label: `Pending (${stats.pending})` },
            { key: 'overdue', label: `Overdue (${stats.overdue})` },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: 6,
                background: statusFilter === f.key ? '#ffffff' : 'transparent',
                color: statusFilter === f.key ? '#1B3322' : '#64748b',
                fontWeight: statusFilter === f.key ? 700 : 600,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: statusFilter === f.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right side: Search & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <RiSearchLine size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 30px 6px 32px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {searchMember && (
              <button
                type="button"
                onClick={() => setSearchMember('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <RiCloseLine size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table View ── */}
      <div className="rp-table-container">
          <div className="rp-table-wrapper">
            <table className="rp-table">
              <thead>
                <tr>
                  <th style={{ width: 45, textAlign: 'center' }}>#</th>
                  <th>Member</th>
                  <th>Auction Status</th>
                  <th>Monthly Due</th>
                  <th>Status</th>
                  <th>Collection Record</th>
                  <th style={{ textAlign: 'right', minWidth: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
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
                      <td><div style={{ width: 90, height: 20, background: '#e2e8f0', borderRadius: 100 }} /></td>
                      <td><div style={{ width: 65, height: 14, background: '#e2e8f0', borderRadius: 4 }} /></td>
                      <td><div style={{ width: 75, height: 20, background: '#e2e8f0', borderRadius: 100 }} /></td>
                      <td><div style={{ width: 100, height: 12, background: '#e2e8f0', borderRadius: 4 }} /></td>
                      <td><div style={{ width: 120, height: 30, background: '#e2e8f0', borderRadius: 6, marginLeft: 'auto' }} /></td>
                    </tr>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                      <RiGroupLine size={36} color="#cbd5e1" style={{ marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No members found matching your filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => {
                    const payment = (m.paymentHistory || []).find(p => Number(p.month) === Number(selMonth) && Number(p.year) === Number(selYear)) || m.currentPayment;
                    const status = payment?.status || 'pending';
                    const color = scOf(status);
                    const isPaid = status === 'paid';
                    const initials = String(m.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const isUpdating = updatingMemberId === (m.id || m.userId);

                    return (
                      <tr key={m.userId || m.id}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: 12 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div className="rp-cell-member">
                            <div className="rp-avatar" style={{ background: `${color}18`, color, border: `1.5px solid ${color}33` }}>
                              {initials}
                            </div>
                            <div className="rp-name-info">
                              <span className="rp-name">{m.name}</span>
                              <span className="rp-sub">
                                <RiPhoneLine size={11} /> {m.phone || '--'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {m.hasWonAuction ? (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              background: '#fef3c7', 
                              color: '#b45309', 
                              border: '1px solid #fde68a', 
                              padding: '3px 10px', 
                              borderRadius: 100, 
                              fontSize: 11, 
                              fontWeight: 700 
                            }}>
                              <ShieldCheck size={12} color="#d97706" /> Prize Received {m.auctionPrize?.amountTaken ? `(₹${Number(m.auctionPrize.amountTaken).toLocaleString('en-IN')})` : ''}
                            </span>
                          ) : (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              background: '#f1f5f9', 
                              color: '#64748b', 
                              border: '1px solid #e2e8f0', 
                              padding: '3px 10px', 
                              borderRadius: 100, 
                              fontSize: 11, 
                              fontWeight: 600 
                            }}>
                              Eligible for Auction
                            </span>
                          )}
                        </td>
                        <td>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>
                            {formatCurrency(payment?.amount || monthlyAmt)}
                          </strong>
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
                            <StatusIcon status={status} size={11} />
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {isPaid && payment?.paidDate ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <RiCheckLine size={12} /> Paid: {formatDate(payment.paidDate)}
                              </span>
                              {payment.receiptNumber && (
                                <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <RiFileListLine size={10} /> {payment.receiptNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: status === 'overdue' ? '#dc2626' : '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <RiCalendarLine size={12} /> Due: {formatDate(payment?.dueDate || `${selYear}-${String(selMonth + 1).padStart(2, '0')}-15`)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {!isPaid ? (
                              <button
                                type="button"
                                className="reports-refresh-btn"
                                style={{
                                  background: '#2E7D32',
                                  borderColor: '#2E7D32',
                                  color: '#ffffff',
                                  height: 32,
                                  padding: '4px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                }}
                                disabled={isUpdating}
                                onClick={() => handleQuickAccept(m, payment)}
                                title="Accept & Confirm Payment"
                              >
                                {isUpdating ? <RiLoader4Line size={13} className="spin-anim" /> : <RiCheckLine size={13} />}
                                <span>Accept</span>
                              </button>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                border: '1px solid #C8E6C9',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}>
                                <RiCheckCircleLine size={13} /> Accepted
                              </span>
                            )}

                            <button
                              type="button"
                              className="reports-refresh-btn"
                              style={{ height: 32, padding: '4px 10px', fontSize: 12 }}
                              onClick={() => { setEditTarget(m); setEditPayment(payment); }}
                              title="Edit Status"
                            >
                              <RiEditLine size={12} /> <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="reports-refresh-btn"
                              style={{ height: 32, padding: '4px 10px', fontSize: 12 }}
                              onClick={() => setChitCardMember(m)}
                              title="View Full Ledger History"
                            >
                              <RiHistoryLine size={12} /> <span>Ledger</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Chit Card Panel */}
      {chitCardMember && (
        <MemberChitCard
          member={chitCardMember}
          monthlyAmount={monthlyAmt}
          onClose={() => setChitCardMember(null)}
        />
      )}

      {/* Payment Editor */}
      {editTarget && (
        <PaymentEditor
          member={editTarget}
          payment={editPayment}
          selMonth={selMonth}
          selYear={selYear}
          monthlyAmount={monthlyAmt}
          onSave={handleUpdatePayment}
          onClose={() => { setEditTarget(null); setEditPayment(null); }}
          isSubmitting={isSaving}
        />
      )}
    </>
  );
};

export default MemberDetailsPanel;

