import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, User as RiUserLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
  CheckCircle as RiCheckCircleLine, Phone as RiPhoneLine, ShieldCheck
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
   MEMBER CARD WITH QUICK ACCEPT ACTION
════════════════════════════════════════════════════════════════ */
const MemberCard = ({ member, monthlyAmount, selMonth, selYear, onChitCard, onEdit, onQuickAccept, isUpdating }) => {
  const payment = (member.paymentHistory || []).find(p => Number(p.month) === Number(selMonth) && Number(p.year) === Number(selYear)) || member.currentPayment;
  const status = payment?.status || 'pending';
  const color = scOf(status);
  const initials = String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isPaid = status === 'paid';

  return (
    <div className="gc-card mg-enhanced-card" style={{ borderTop: `4px solid ${color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header */}
        <div className="gc-header" style={{ padding: '18px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="md-avatar" style={{ background: `${color}18`, color, width: 44, height: 44, fontSize: 16, fontWeight: 700, border: `1.5px solid ${color}33` }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="gc-name" style={{ margin: '0 0 4px', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.name || 'Unknown'}
              </h3>
              <span className="gc-badge" style={{ background: color }}>
                <StatusIcon status={status} size={10} /> {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="gc-content" style={{ padding: '0 20px 16px' }}>
          <div className="mg-card-metrics-grid" style={{ marginBottom: 12, padding: '10px 12px' }}>
            <div className="mg-metric-item">
              <span className="mg-metric-lbl">
                <RiPhoneLine size={12} color="#64748b" /> Contact
              </span>
              <strong className="mg-metric-val" style={{ fontSize: 13 }}>{member.phone || '--'}</strong>
            </div>
            <div className="mg-metric-item">
              <span className="mg-metric-lbl">
                <RiMoneyDollarCircleLine size={12} color="#10b981" /> Due / Month
              </span>
              <strong className="mg-metric-val" style={{ fontSize: 13, color: '#0B140E' }}>
                {formatCurrency(payment?.amount || monthlyAmount)}
              </strong>
            </div>
          </div>

          {payment?.paidDate && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#2E7D32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RiCheckLine size={13} /> Paid on {formatDate(payment.paidDate)}
            </p>
          )}

          {payment?.receiptNumber && (
            <p style={{ margin: 0, fontSize: 11, color: '#6B7A6E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiFileListLine size={11} /> {payment.receiptNumber}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="gc-footer" style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
          {/* Quick Accept Button for fast admin processing */}
          {!isPaid ? (
            <button 
              className="reports-refresh-btn" 
              style={{ 
                flex: 1.4, 
                background: '#2E7D32', 
                borderColor: '#2E7D32', 
                color: '#ffffff', 
                justifyContent: 'center', 
                fontWeight: 700, 
                height: 36,
                padding: '6px 12px',
                boxShadow: '0 2px 6px rgba(46, 125, 50, 0.2)'
              }} 
              disabled={isUpdating}
              onClick={() => onQuickAccept(member, payment)}
              title="Accept & Confirm Payment directly"
            >
              {isUpdating ? <RiLoader4Line size={14} className="spin-anim" /> : <RiCheckLine size={15} color="#ffffff" />} 
              <span style={{ fontSize: 12 }}>Accept Payment</span>
            </button>
          ) : (
            <button 
              className="reports-refresh-btn" 
              style={{ 
                flex: 1.4, 
                background: '#E8F5E9', 
                borderColor: '#C8E6C9', 
                color: '#2E7D32', 
                justifyContent: 'center', 
                fontWeight: 700, 
                height: 36,
                padding: '6px 12px',
                cursor: 'default'
              }}
              title="Payment Confirmed"
            >
              <RiCheckCircleLine size={15} color="#2E7D32" /> 
              <span style={{ fontSize: 12 }}>Accepted</span>
            </button>
          )}

          <button 
            className="reports-refresh-btn" 
            style={{ padding: '6px 10px', height: 36, flex: 0.8, justifyContent: 'center' }} 
            onClick={() => onEdit(member, payment)}
            title="Edit Status"
          >
            <RiEditLine size={13} /> <span style={{ fontSize: 12 }}>Edit</span>
          </button>

          <button 
            className="reports-refresh-btn" 
            style={{ padding: '6px 10px', height: 36, flex: 0.8, justifyContent: 'center' }} 
            onClick={() => onChitCard(member)}
            title="View Full Ledger History"
          >
            <RiHistoryLine size={13} /> <span style={{ fontSize: 12 }}>Ledger</span>
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
        const updatedHistory = (m.paymentHistory || []).map(p => {
          if (Number(p.month) !== Number(selMonth) || Number(p.year) !== Number(selYear)) return p;
          return {
            ...p,
            status: newStatus,
            paidDate: newStatus === 'paid' ? new Date().toISOString() : null,
            receiptNumber: data.data?.receiptNumber || (newStatus === 'paid' ? `RCP-${group.id}-${memberId}` : null),
          };
        });
        return {
          ...m,
          currentPayment: {
            ...(m.currentPayment || {}),
            status: newStatus,
            paidDate: newStatus === 'paid' ? new Date().toISOString() : null,
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

      {/* ── Members List ── */}
      <div className={members.length === 0 && !loading ? "" : "rn-list"}>
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="gc-card mg-enhanced-card skeleton-pulse" style={{ pointerEvents: 'none', height: 210 }}>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#e2e8f0' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ width: '30%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ height: 40, background: '#f8fafc', borderRadius: 8, marginBottom: 14 }} />
                  <div style={{ height: 32, background: '#e2e8f0', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', background: '#ffffff', borderRadius: 12, border: '1px solid #DCE3DC' }}>
            <RiGroupLine size={56} color="var(--border)" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0B140E' }}>No Members Enrolled</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7A6E' }}>There are no registered members associated with this chit group.</p>
          </div>
        ) : (
          members.map(m => (
            <MemberCard
              key={m.userId || m.id}
              member={m}
              monthlyAmount={monthlyAmt}
              selMonth={selMonth}
              selYear={selYear}
              onChitCard={setChitCardMember}
              onEdit={(mem, pay) => { setEditTarget(mem); setEditPayment(pay); }}
              onQuickAccept={handleQuickAccept}
              isUpdating={updatingMemberId === (m.id || m.userId)}
            />
          ))
        )}
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

