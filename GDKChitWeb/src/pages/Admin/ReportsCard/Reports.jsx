import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  RiRefreshLine, RiGroupLine, RiCheckLine, RiTimeLine, RiAlertLine,
  RiCloseLine, RiLoader4Line, RiCalendarLine, RiUserLine,
  RiHistoryLine, RiEditLine, RiArrowRightSLine, RiInformationLine,
  RiFileListLine, RiMoneyDollarCircleLine, RiArrowLeftLine,
} from '../../../icons.jsx';

/* ─── Constants ──────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SC = {
  active:    '#10B981',
  completed: '#6B46C1',
  paid:      '#10B981',
  pending:   '#F59E0B',
  overdue:   '#EF4444',
};
const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';

/* ─── Helpers ────────────────────────────────────────────────── */
function generatePaymentHistory(memberId, groupStartDate, monthlyAmount) {
  const history = [];
  const start = groupStartDate ? new Date(groupStartDate) : new Date();
  const now   = new Date();
  const d     = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= now) {
    const month = d.getMonth(), year = d.getFullYear();
    const r = Math.random();
    const status = r > 0.25 ? 'paid' : r > 0.1 ? 'pending' : 'overdue';
    history.push({
      month, year,
      monthName: `${MONTHS[month]} ${year}`,
      status,
      amount: monthlyAmount || 0,
      paidDate:      status === 'paid' ? new Date(year, month, Math.floor(Math.random()*20)+1).toISOString() : null,
      dueDate:       new Date(year, month, 15).toISOString(),
      receiptNumber: status === 'paid' ? `RCP${memberId}${year}${String(month).padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}` : null,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return history.reverse();
}

/* ─── StatusIcon ─────────────────────────────────────────────── */
const StatusIcon = ({ status, size = 13 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'paid' || s === 'completed' ? RiCheckLine
             : s === 'overdue'                   ? RiAlertLine
             : RiTimeLine;
  return <Icon size={size} color={scOf(s)} />;
};

/* ════════════════════════════════════════════════════════════════
   GROUP CARD  (mirrors RN GroupCard.jsx)
════════════════════════════════════════════════════════════════ */
const GroupCard = ({ group, onViewMembers }) => {
  const status = String(group.status || 'active').toLowerCase();
  const color  = scOf(status);
  const pct    = Math.min(100, Math.round(
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
   MEMBER CHIT CARD  (payment history side panel)
════════════════════════════════════════════════════════════════ */
const MemberChitCard = ({ member, monthlyAmount, onClose }) => (
  <div className="rp-overlay" onClick={onClose}>
    <div className="rp-panel" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="rp-ph">
        <div className="md-avatar" style={{ background: `${scOf('paid')}18`, color: scOf('paid'), width: 48, height: 48, fontSize: 18 }}>
          {String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{member.name}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiUserLine size={12} /> {member.phone || '--'}
          </p>
        </div>
        <button className="rp-close" onClick={onClose}><RiCloseLine size={18} /></button>
      </div>

      <p style={{ margin: '4px 0 14px', fontSize: 12, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Full Payment History
      </p>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {(member.paymentHistory || []).map((p, i) => (
          <div key={i} className="rp-hist-row">
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.monthName}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RiCalendarLine size={11} />
                {p.paidDate ? `Paid: ${formatDate(p.paidDate)}` : `Due: ${formatDate(p.dueDate)}`}
              </p>
              {p.receiptNumber && (
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiFileListLine size={11} /> {p.receiptNumber}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15 }}>{formatCurrency(p.amount)}</p>
              <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: `${scOf(p.status)}18`, color: scOf(p.status), display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <StatusIcon status={p.status} size={9} /> {(p.status || '').toUpperCase()}
              </span>
            </div>
          </div>
        ))}
        {!(member.paymentHistory || []).length && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0' }}>No payment history yet.</p>
        )}
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   PAYMENT EDITOR MODAL  (mirrors RN PaymentStatusEditior)
════════════════════════════════════════════════════════════════ */
const PaymentEditor = ({ member, payment, selMonth, selYear, monthlyAmount, onSave, onClose }) => {
  const [newStatus, setNewStatus] = useState(payment?.status || 'pending');
  const OPTIONS = [
    { value: 'paid',    label: 'Mark as Paid',    Icon: RiCheckLine,  desc: 'Payment received successfully' },
    { value: 'pending', label: 'Mark as Pending',  Icon: RiTimeLine,   desc: 'Payment not yet received' },
    { value: 'overdue', label: 'Mark as Overdue',  Icon: RiAlertLine,  desc: 'Payment is past due date' },
  ];

  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <RiEditLine size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Payment</h3>
        </div>
        <p style={{ margin: '4px 0 6px', fontSize: 14, color: 'var(--muted)' }}>
          {member.name} · {MONTHS[selMonth]} {selYear}
        </p>
        <p style={{ margin: '0 0 18px', fontWeight: 800, fontSize: 26, color: 'var(--text)' }}>
          {formatCurrency(payment?.amount || monthlyAmount)}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {OPTIONS.map(({ value, label, Icon, desc }) => (
            <button key={value} onClick={() => setNewStatus(value)}
              style={{ padding: '14px 16px', border: `2px solid ${newStatus === value ? scOf(value) : 'var(--border)'}`, borderRadius: 'var(--radius)', background: newStatus === value ? `${scOf(value)}12` : 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${scOf(value)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={scOf(value)} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: newStatus === value ? scOf(value) : 'var(--text)' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
              </div>
              {newStatus === value && <RiCheckLine size={16} color={scOf(value)} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '13px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface2)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(member.id || member.userId, newStatus)}
            style={{ padding: '13px', borderRadius: 'var(--radius)', border: 'none', background: scOf(newStatus), color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RiCheckLine size={16} /> Save Status
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MEMBER CARD (inside MemberDetails panel, mirrors RN renderMemberCard)
════════════════════════════════════════════════════════════════ */
const MemberCard = ({ member, monthlyAmount, selMonth, selYear, onChitCard, onEdit }) => {
  const payment = (member.paymentHistory || []).find(p => p.month === selMonth && p.year === selYear);
  const status  = payment?.status || 'pending';
  const color   = scOf(status);
  const initials = String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="md-member-card" style={{ borderLeftColor: color }}>
      {/* Avatar + Info */}
      <div className="md-member-left">
        <div className="md-avatar" style={{ background: `${color}18`, color }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="md-name">{member.name || 'Unknown'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{member.phone || '--'}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatCurrency(payment?.amount || monthlyAmount)}</span>
          </div>
        </div>
      </div>

      {/* Status + Actions */}
      <div className="md-member-right">
        <span className="md-status-badge" style={{ background: color }}>
          <StatusIcon status={status} size={10} /> {status.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          <button className="md-act-btn" onClick={() => onChitCard(member)} title="Payment History">
            <RiHistoryLine size={14} />
          </button>
          <button className="md-act-btn" onClick={() => onEdit(member, payment)} title="Edit Payment">
            <RiEditLine size={14} />
          </button>
          <button className="md-act-btn" onClick={() => onChitCard(member)} title="Details">
            <RiArrowRightSLine size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MEMBER DETAILS PANEL  (mirrors RN MemberDetails screen)
════════════════════════════════════════════════════════════════ */
const MemberDetailsPanel = ({ group, apiMembers, loading, onClose }) => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [chitCardMember, setChitCardMember]   = useState(null);
  const [editTarget,     setEditTarget]       = useState(null);
  const [editPayment,    setEditPayment]       = useState(null);
  const [members,        setMembers]           = useState([]);

  // Hydrate payment history once
  useEffect(() => {
    const monthlyAmt = group.groupAmount || 0;
    setMembers(apiMembers.map(m => ({
      ...m,
      paymentHistory: generatePaymentHistory(m.userId || m.id, group.startDate, monthlyAmt),
    })));
  }, [apiMembers, group]);

  const monthlyAmt = group.groupAmount || 0;
  const isCurrentMonth = selMonth === now.getMonth() && selYear === now.getFullYear();

  // Per-month stats
  const stats = useMemo(() => {
    let paid = 0, pending = 0, overdue = 0;
    members.forEach(m => {
      const p = (m.paymentHistory || []).find(x => x.month === selMonth && x.year === selYear);
      const s = p?.status || 'pending';
      if (s === 'paid') paid++; else if (s === 'overdue') overdue++; else pending++;
    });
    return { paid, pending, overdue, collected: paid * monthlyAmt };
  }, [members, selMonth, selYear, monthlyAmt]);

  // Update payment locally
  const updatePayment = useCallback((memberId, newStatus) => {
    setMembers(prev => prev.map(m => {
      if ((m.id || m.userId) !== memberId) return m;
      return {
        ...m,
        paymentHistory: (m.paymentHistory || []).map(p => {
          if (p.month !== selMonth || p.year !== selYear) return p;
          return {
            ...p, status: newStatus,
            paidDate:      newStatus === 'paid' ? new Date().toISOString() : null,
            receiptNumber: newStatus === 'paid' ? `RCP${memberId}${selYear}${selMonth}${Date.now()%10000}` : null,
          };
        }),
      };
    }));
    setEditTarget(null); setEditPayment(null);
  }, [selMonth, selYear]);

  const STAT_CARDS = [
    { label: 'Paid',      value: stats.paid,                      Icon: RiCheckLine,              color: '#10B981' },
    { label: 'Pending',   value: stats.pending,                    Icon: RiTimeLine,               color: '#F59E0B' },
    { label: 'Overdue',   value: stats.overdue,                    Icon: RiAlertLine,              color: '#EF4444' },
    { label: 'Collected', value: formatCurrency(stats.collected),  Icon: RiMoneyDollarCircleLine,  color: 'var(--primary)' },
  ];

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="rp-panel rp-panel-wide" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rp-ph" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 0 }}>
          <button className="md-back-btn" onClick={onClose}><RiArrowLeftLine size={18} /></button>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800 }}>{group.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiMoneyDollarCircleLine size={13} /> {formatCurrency(monthlyAmt)}/month
              <span style={{ color: 'var(--border)' }}>·</span>
              <RiGroupLine size={13} /> {members.length} members
            </p>
          </div>
          <button className="rp-close" onClick={onClose}><RiCloseLine size={18} /></button>
        </div>

        {/* ── Month Selector ── */}
        <div className="md-month-selector">
          <div className="md-month-hd">
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Payment Details for:</span>
            {isCurrentMonth && (
              <span style={{ background: '#10B981', color: '#fff', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RiTimeLine size={11} /> Current Month
              </span>
            )}
          </div>
          <button className="md-month-btn" onClick={() => setShowMonthPicker(v => !v)}>
            <RiCalendarLine size={16} color="#64748B" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS[selMonth]} {selYear}</span>
            <RiArrowRightSLine size={16} color="#64748B" style={{ transform: showMonthPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* ── Month Picker ── */}
        {showMonthPicker && (
          <div className="md-month-picker">
            {MONTHS.map((m, i) => (
              <button key={i} className={`md-month-item${i === selMonth ? ' active' : ''}`}
                onClick={() => { setSelMonth(i); setShowMonthPicker(false); }}>
                {m} {selYear}
              </button>
            ))}
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="md-stats-row">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="md-stat-card" style={{ background: `${s.color}12` }}>
              <s.Icon size={24} color={s.color} />
              <span className="md-stat-val" style={{ color: s.color }}>{s.value}</span>
              <span className="md-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Members List ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <RiLoader4Line size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <RiGroupLine size={48} color="var(--border)" style={{ marginBottom: 12 }} />
              <p>No members in this group yet.</p>
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
              />
            ))
          )}
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
          onSave={updatePayment}
          onClose={() => { setEditTarget(null); setEditPayment(null); }}
        />
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
════════════════════════════════════════════════════════════════ */
const Reports = () => {
  const [groups,         setGroups]         = useState([]);
  const [apiStatus,      setApiStatus]      = useState('loading');
  const [activeTab,      setActiveTab]      = useState('active');
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [groupMembers,   setGroupMembers]   = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setApiStatus('loading');
      const res  = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => ({
        id:              g.id,
        name:            g.name || g.group_name || 'Untitled',
        status:          String(g.status || 'Not Started').toLowerCase(),
        totalMembers:    g.totalMembers || g.total_members || 0,
        completedCycles: g.completedCycles || 0,
        duration:        g.duration || 20,
        groupAmount:     g.groupAmount || g.group_amount || 0,
        startDate:       g.startDate || g.start_date,
        endDate:         g.endDate || g.end_date,
        completedDate:   g.completedDate,
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
      const res  = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) setGroupMembers(data.data || []);
    } catch {}
    finally { setMembersLoading(false); }
  }, []);

  const counts = useMemo(() => ({
    all:        groups.length,
    active:     groups.filter(g => g.status === 'active').length,
    completed:  groups.filter(g => g.status === 'completed').length,
    notStarted: groups.filter(g => g.status.includes('not')).length,
  }), [groups]);

  const filtered = useMemo(() => {
    if (activeTab === 'all')         return groups;
    if (activeTab === 'active')      return groups.filter(g => g.status === 'active');
    if (activeTab === 'completed')   return groups.filter(g => g.status === 'completed');
    if (activeTab === 'not-started') return groups.filter(g => g.status.includes('not'));
    return groups;
  }, [groups, activeTab]);

  const TABS = [
    { key: 'all',         label: `All (${counts.all})` },
    { key: 'active',      label: `Active (${counts.active})` },
    { key: 'completed',   label: `Completed (${counts.completed})` },
    { key: 'not-started', label: `Not Started (${counts.notStarted})` },
  ];

  return (
    <div className="rn-page">
      <style>{`
        /* ── Group Card ── */
        .gc-card { background:#fff; border-radius:16px; margin-bottom:16px; box-shadow:0 2px 6px rgba(0,0,0,0.1); overflow:hidden; transition:box-shadow 0.18s, transform 0.18s; }
        .gc-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.13); transform:translateY(-2px); }
        .gc-header { display:flex; justify-content:space-between; align-items:flex-start; padding:20px 20px 12px; }
        .gc-name { margin:0 0 8px; font-size:18px; font-weight:700; color:#1F2937; }
        .gc-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; }
        .gc-arrow-btn { background:transparent; border:none; cursor:pointer; padding:8px; border-radius:8px; margin-left:8px; transition:background 0.15s; }
        .gc-arrow-btn:hover { background:var(--primary-light); }
        .gc-content { padding:0 20px 20px; }
        .gc-info-row { display:flex; justify-content:space-between; margin-bottom:16px; }
        .gc-info-item { display:flex; align-items:center; gap:6px; flex:1; }
        .gc-info-text { font-size:14px; color:#6B7280; font-weight:500; }
        .gc-progress-wrap { margin-bottom:16px; }
        .gc-progress-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .gc-progress-txt { font-size:14px; font-weight:600; color:#374151; }
        .gc-progress-pct { font-size:14px; font-weight:700; }
        .gc-bar { height:6px; background:#E5E7EB; border-radius:3px; overflow:hidden; }
        .gc-bar-fill { height:100%; border-radius:3px; transition:width 0.8s; }
        .gc-footer { display:flex; justify-content:space-between; align-items:center; }
        .gc-date { font-size:12px; color:#6B7280; }
        .gc-collected { font-size:14px; font-weight:700; color:#059669; }

        /* ── Member Details Panel ── */
        .rp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:stretch; justify-content:flex-end; }
        .rp-panel { background:var(--surface); width:100%; max-width:540px; display:flex; flex-direction:column; padding:0; overflow:hidden; animation:slideRight 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .rp-panel-wide { max-width:600px; }
        @keyframes slideRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        .rp-ph { display:flex; align-items:center; gap:12px; padding:20px; }
        .rp-close { background:var(--surface2); border:none; border-radius:8px; width:34px; height:34px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--muted); transition:background 0.15s; }
        .rp-close:hover { background:var(--primary-light); color:var(--primary); }
        .rp-hist-row { display:flex; justify-content:space-between; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--border); }
        .rp-hist-row:last-child { border-bottom:none; }

        /* ── Month selector ── */
        .md-month-selector { padding:14px 20px; border-bottom:1px solid var(--border); background:var(--bg); }
        .md-month-hd { display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
        .md-month-btn { display:flex; align-items:center; gap:8px; background:#EFF3FF; border:none; border-radius:10px; padding:10px 16px; cursor:pointer; transition:background 0.15s; }
        .md-month-btn:hover { background:var(--primary-light); }
        .md-month-picker { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); margin:0 20px; max-height:220px; overflow-y:auto; }
        .md-month-item { display:block; width:100%; text-align:left; padding:10px 16px; border:none; background:transparent; font-size:14px; color:var(--text); cursor:pointer; transition:background 0.15s; }
        .md-month-item:hover { background:var(--bg); }
        .md-month-item.active { background:var(--primary-light); color:var(--primary); font-weight:700; }

        /* ── Stats row ── */
        .md-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:14px 20px; border-bottom:1px solid var(--border); }
        .md-stat-card { border-radius:var(--radius); padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .md-stat-val { font-size:18px; font-weight:800; }
        .md-stat-lbl { font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; }

        /* ── Member cards ── */
        .md-member-card { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid var(--border); border-left:4px solid transparent; transition:background 0.15s; }
        .md-member-card:hover { background:var(--bg); }
        .md-member-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .md-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; flex-shrink:0; }
        .md-name { margin:0 0 3px; font-size:15px; font-weight:700; color:var(--text); }
        .md-member-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
        .md-status-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:10px; font-weight:700; color:#fff; }
        .md-act-btn { background:var(--surface2); border:none; border-radius:6px; width:30px; height:30px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:background 0.15s; }
        .md-act-btn:hover { background:var(--primary-light); color:var(--primary); }
        .md-back-btn { background:var(--surface2); border:none; border-radius:8px; width:36px; height:36px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
        .md-back-btn:hover { background:var(--primary-light); color:var(--primary); }

        /* ── List bg ── */
        .rn-list { background:#F9FAFB; padding:20px; border-radius:var(--radius-lg); }

        @media(max-width:640px) {
          .md-stats-row { grid-template-columns:repeat(2,1fr); }
          .rp-panel, .rp-panel-wide { max-width:100%; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Page Header ── */}
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Reports</h2>
          <p className="rn-subtitle">Live group monitoring and member payment tracking</p>
        </div>
        <button className="rn-notify" onClick={loadGroups} title="Refresh"
          style={{ animation: apiStatus === 'loading' ? 'spin 1s linear infinite' : 'none' }}>
          <RiRefreshLine size={18} />
        </button>
      </div>

      {/* ── Tab Bar (mirrors RN tabContainer) ── */}
      <div className="rn-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`rn-tab${activeTab === t.key ? ' is-active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
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

      {/* ── Member Details Side Panel ── */}
      {selectedGroup && (
        <MemberDetailsPanel
          group={selectedGroup}
          apiMembers={groupMembers}
          loading={membersLoading}
          onClose={() => { setSelectedGroup(null); setGroupMembers([]); }}
        />
      )}
    </div>
  );
};

export default Reports;
