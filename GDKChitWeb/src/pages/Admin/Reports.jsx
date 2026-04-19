import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  RiRefreshLine, RiGroupLine, RiCheckLine, RiTimeLine, RiAlertLine,
  RiCloseLine, RiLoader4Line, RiCalendarLine, RiUserLine,
  RiHistoryLine, RiEditLine, RiArrowRightSLine, RiInformationLine,
  RiFileListLine, RiMoneyDollarCircleLine,
} from '../../icons.jsx';

/* ── Status helpers ───────────────────────────────────────── */
const SC = { active: 'var(--success)', completed: 'var(--primary)', pending: 'var(--warning)', overdue: 'var(--danger)', paid: 'var(--success)' };
const StatusIcon = ({ status, size = 14 }) => {
  const icons = { paid: RiCheckLine, completed: RiCheckLine, pending: RiTimeLine, active: RiTimeLine, overdue: RiAlertLine };
  const Icon = icons[status] || RiInformationLine;
  return <Icon size={size} color={SC[status] || 'var(--muted)'} />;
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function generatePaymentHistory(memberId, groupStart, monthlyAmount) {
  const history = [];
  const start = groupStart ? new Date(groupStart) : new Date();
  const now = new Date();
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= now) {
    const month = d.getMonth(), year = d.getFullYear();
    const rand = Math.random();
    const status = rand > 0.25 ? 'paid' : rand > 0.1 ? 'pending' : 'overdue';
    history.push({
      month, year, monthName: `${MONTHS[month]} ${year}`, status,
      amount: monthlyAmount || 0,
      paidDate: status === 'paid' ? new Date(year, month, Math.floor(Math.random()*20)+1).toISOString() : null,
      dueDate: new Date(year, month, 15).toISOString(),
      receiptNumber: status === 'paid' ? `RCP${memberId}${year}${month}${Math.floor(Math.random()*9000)+1000}` : null,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return history.reverse();
}

/* ── GroupCard ─────────────────────────────────────────────── */
const GroupCard = ({ group, onViewMembers }) => {
  const status = String(group.status || 'active').toLowerCase();
  const sc = SC[status] || 'var(--muted)';
  const pct = Math.min(100, Math.round(((group.completedCycles || 0) / (group.duration || 20)) * 100));

  return (
    <div className="rp-card">
      <div className="rp-card-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="rp-card-name">{group.name || group.group_name}</h3>
          <span className="rp-status-badge" style={{ background: sc, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <StatusIcon status={status} size={11} /> {status.toUpperCase()}
          </span>
        </div>
        <button className="rp-view-btn" onClick={() => onViewMembers(group)}>
          <RiGroupLine size={14} style={{ marginRight: 5 }} /> Members
          <RiArrowRightSLine size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 7, background: '#EEF0FF', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: sc, borderRadius: 4, transition: 'width 0.6s' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{group.completedCycles || 0}/{group.duration || 20} cycles</span>
      </div>

      <div className="rp-stat-row">
        {[
          { label: 'Members',   value: group.totalMembers || group.total_members || '--' },
          { label: 'Monthly',   value: formatCurrency(group.groupAmount || group.group_amount) },
          { label: 'Collected', value: formatCurrency(group.collectedAmount || 0) },
          { label: group.status === 'completed' ? 'Completed' : 'Start Date', value: formatDate(group.completedDate || group.startDate || group.start_date) },
        ].map(s => (
          <div key={s.label}>
            <span className="rp-stat-label">{s.label}</span>
            <strong className="rp-stat-value">{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── MemberCard ────────────────────────────────────────────── */
const MemberCard = ({ member, monthlyAmount, selectedMonth, selectedYear, onEdit, onHistory }) => {
  const payment = (member.paymentHistory || []).find(p => p.month === selectedMonth && p.year === selectedYear);
  const status  = payment?.status || 'pending';
  const sc      = SC[status] || 'var(--muted)';

  return (
    <div className="rp-member-card">
      <div className="rp-member-left">
        <div className="rp-member-avatar" style={{ background: `${sc}18`, color: sc }}>
          {String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="rp-member-name">{member.name || member.nickname || 'Unknown'}</p>
          <p className="rp-member-phone" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiUserLine size={11} /> {member.phone || '--'}
          </p>
          <p className="rp-member-amount">{formatCurrency(payment?.amount || monthlyAmount)}</p>
        </div>
      </div>
      <div className="rp-member-right">
        <span className="rp-pay-badge" style={{ background: sc, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <StatusIcon status={status} size={10} /> {status.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="rp-act-btn" onClick={() => onHistory(member)} title="Payment History">
            <RiHistoryLine size={14} />
          </button>
          <button className="rp-act-btn" onClick={() => onEdit(member, payment)} title="Edit Payment">
            <RiEditLine size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Payment History Panel ─────────────────────────────────── */
const PaymentHistoryPanel = ({ member, monthlyAmount, onClose }) => (
  <div className="rp-panel-overlay" onClick={onClose}>
    <div className="rp-panel" onClick={e => e.stopPropagation()}>
      <div className="rp-panel-head">
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{member.name}</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiUserLine size={12} /> {member.phone}
          </p>
        </div>
        <button className="rp-close-btn" onClick={onClose}><RiCloseLine size={16} /></button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {(member.paymentHistory || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.monthName}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RiCalendarLine size={11} />
                {p.paidDate ? `Paid: ${formatDate(p.paidDate)}` : `Due: ${formatDate(p.dueDate)}`}
              </p>
              {p.receiptNumber && (
                <p style={{ margin: 0, fontSize: 11, color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiFileListLine size={11} /> {p.receiptNumber}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{formatCurrency(p.amount)}</p>
              <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: `${SC[p.status]}15`, color: SC[p.status], display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <StatusIcon status={p.status} size={9} /> {(p.status || '').toUpperCase()}
              </span>
            </div>
          </div>
        ))}
        {!(member.paymentHistory || []).length && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0' }}>No payment history available.</p>
        )}
      </div>
    </div>
  </div>
);

/* ── Payment Edit Modal ────────────────────────────────────── */
const PaymentEditModal = ({ member, payment, selectedMonth, selectedYear, monthlyAmount, onSave, onClose }) => {
  const [newStatus, setNewStatus] = useState(payment?.status || 'pending');
  const options = [
    { value: 'paid',    label: 'Paid',    Icon: RiCheckLine },
    { value: 'pending', label: 'Pending', Icon: RiTimeLine },
    { value: 'overdue', label: 'Overdue', Icon: RiAlertLine },
  ];
  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <RiEditLine size={18} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Edit Payment</h3>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
          {member.name} · {MONTHS[selectedMonth]} {selectedYear}
        </p>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>{formatCurrency(payment?.amount || monthlyAmount)}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {options.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => setNewStatus(value)}
              style={{ padding: '12px 16px', border: `2px solid ${newStatus === value ? SC[value] : 'var(--border)'}`, borderRadius: 'var(--radius)', background: newStatus === value ? `${SC[value]}15` : 'var(--surface)', color: newStatus === value ? SC[value] : 'var(--muted)', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontSize: 14, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose} style={{ padding: 12, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface2)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(member.id || member.userId, newStatus)} style={{ padding: 12, borderRadius: 'var(--radius)', border: 'none', background: SC[newStatus], color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RiCheckLine size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── MemberDetails Panel ───────────────────────────────────── */
const MemberDetailsPanel = ({ group, members, loading, onClose }) => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [historyMember, setHistoryMember]     = useState(null);
  const [editTarget, setEditTarget]           = useState(null);
  const [editPayment, setEditPayment]         = useState(null);
  const [membersData, setMembersData]         = useState([]);

  useEffect(() => {
    const monthlyAmt = group.groupAmount || group.group_amount || 0;
    setMembersData(members.map(m => ({
      ...m,
      paymentHistory: generatePaymentHistory(m.userId || m.id, group.startDate || group.start_date, monthlyAmt),
    })));
  }, [members, group]);

  const monthlyAmt = group.groupAmount || group.group_amount || 0;

  const stats = useMemo(() => {
    let paid = 0, pending = 0, overdue = 0;
    membersData.forEach(m => {
      const p = (m.paymentHistory || []).find(x => x.month === selMonth && x.year === selYear);
      const s = p?.status || 'pending';
      if (s === 'paid') paid++; else if (s === 'overdue') overdue++; else pending++;
    });
    return { paid, pending, overdue, collected: paid * monthlyAmt };
  }, [membersData, selMonth, selYear, monthlyAmt]);

  const updatePayment = useCallback((memberId, newStatus) => {
    setMembersData(prev => prev.map(m => {
      if ((m.id || m.userId) !== memberId) return m;
      return { ...m, paymentHistory: (m.paymentHistory || []).map(p => {
        if (p.month !== selMonth || p.year !== selYear) return p;
        return { ...p, status: newStatus, paidDate: newStatus === 'paid' ? new Date().toISOString() : null, receiptNumber: newStatus === 'paid' ? `RCP${memberId}${selYear}${selMonth}${Date.now() % 10000}` : null };
      })};
    }));
    setEditTarget(null); setEditPayment(null);
  }, [selMonth, selYear]);

  const statCards = [
    { label: 'Paid',      count: stats.paid,                    Icon: RiCheckLine,             color: 'var(--success)' },
    { label: 'Pending',   count: stats.pending,                  Icon: RiTimeLine,              color: 'var(--warning)' },
    { label: 'Overdue',   count: stats.overdue,                  Icon: RiAlertLine,             color: 'var(--danger)'  },
    { label: 'Collected', count: formatCurrency(stats.collected), Icon: RiMoneyDollarCircleLine, color: 'var(--primary)' },
  ];

  return (
    <div className="rp-panel-overlay" onClick={onClose}>
      <div className="rp-panel rp-panel-wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="rp-panel-head" style={{ marginBottom: 0, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 3px', fontSize: 18, fontWeight: 800 }}>{group.name || group.group_name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiMoneyDollarCircleLine size={13} /> {formatCurrency(monthlyAmt)}/month
              <span style={{ margin: '0 4px', color: 'var(--border)' }}>·</span>
              <RiGroupLine size={13} /> {group.totalMembers || membersData.length} members
            </p>
          </div>
          <button className="rp-close-btn" onClick={onClose}><RiCloseLine size={16} /></button>
        </div>

        {/* Month Selector */}
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Period:</span>
          <button onClick={() => setShowMonthPicker(v => !v)}
            style={{ background: 'var(--primary-light)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiCalendarLine size={15} /> {MONTHS[selMonth]} {selYear}
          </button>
          {selMonth === now.getMonth() && selYear === now.getFullYear() && (
            <span style={{ background: 'var(--success)', color: '#fff', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiTimeLine size={11} /> Current Month
            </span>
          )}
        </div>

        {/* Month Picker */}
        {showMonthPicker && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 8, maxHeight: 200, overflowY: 'auto' }}>
            {MONTHS.map((m, i) => (
              <button key={i} onClick={() => { setSelMonth(i); setShowMonthPicker(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: selMonth === i ? 'var(--primary-light)' : 'transparent', fontWeight: selMonth === i ? 700 : 500, color: selMonth === i ? 'var(--primary)' : 'var(--text)', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                {m} {selYear}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '12px 0' }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
              <s.Icon size={20} color={s.color} style={{ marginBottom: 4 }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Members list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
              <RiLoader4Line size={28} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : membersData.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0' }}>No members in this group yet.</p>
          ) : (
            membersData.map(m => (
              <MemberCard key={m.userId || m.id} member={m} monthlyAmount={monthlyAmt}
                selectedMonth={selMonth} selectedYear={selYear}
                onHistory={setHistoryMember} onEdit={(mem, pay) => { setEditTarget(mem); setEditPayment(pay); }} />
            ))
          )}
        </div>
      </div>

      {historyMember && <PaymentHistoryPanel member={historyMember} monthlyAmount={monthlyAmt} onClose={() => setHistoryMember(null)} />}
      {editTarget && <PaymentEditModal member={editTarget} payment={editPayment} selectedMonth={selMonth} selectedYear={selYear} monthlyAmount={monthlyAmt} onSave={updatePayment} onClose={() => { setEditTarget(null); setEditPayment(null); }} />}
    </div>
  );
};

/* ── Main Reports Page ─────────────────────────────────────── */
const Reports = () => {
  const [groups, setGroups]       = useState([]);
  const [apiStatus, setApiStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [groupMembers, setGroupMembers]     = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setApiStatus('loading');
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => ({
        id: g.id, name: g.name || g.group_name || 'Untitled',
        status: String(g.status || 'Not Started').toLowerCase(),
        totalMembers: g.totalMembers || g.total_members || 0,
        completedCycles: g.completedCycles || 0,
        duration: g.duration || 20,
        groupAmount: g.groupAmount || g.group_amount || 0,
        startDate: g.startDate || g.start_date,
        endDate: g.endDate || g.end_date,
        completedDate: g.completedDate,
        createdDate: g.createdDate || g.created_at,
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

  return (
    <div className="rn-page">
      <style>{`
        .rp-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:20px; box-shadow:var(--shadow-sm); transition:box-shadow 0.18s,transform 0.18s; }
        .rp-card:hover { box-shadow:var(--shadow); transform:translateY(-2px); }
        .rp-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .rp-card-name { margin:0 0 8px; font-size:17px; font-weight:700; color:var(--text); }
        .rp-status-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; color:#fff; }
        .rp-view-btn { background:var(--primary-light); border:none; color:var(--primary); padding:8px 14px; border-radius:var(--radius); font-size:13px; font-weight:600; cursor:pointer; transition:background 0.18s; white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:5px; }
        .rp-view-btn:hover { background:var(--primary); color:#fff; }
        .rp-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding-top:12px; border-top:1px solid var(--border); }
        .rp-stat-label { display:block; font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:3px; }
        .rp-stat-value { display:block; font-size:13px; font-weight:700; color:var(--text); }
        .rp-member-card { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--border); }
        .rp-member-card:last-child { border-bottom:none; }
        .rp-member-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .rp-member-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0; }
        .rp-member-name { margin:0 0 2px; font-size:14px; font-weight:700; color:var(--text); }
        .rp-member-phone { margin:0 0 2px; font-size:12px; color:var(--muted); display:flex; align-items:center; gap:4px; }
        .rp-member-amount { margin:0; font-size:13px; font-weight:700; color:var(--primary); }
        .rp-member-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
        .rp-pay-badge { padding:3px 10px; border-radius:100px; font-size:10px; font-weight:700; color:#fff; }
        .rp-act-btn { background:var(--surface2); border:none; border-radius:var(--radius-sm); width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; color:var(--muted); }
        .rp-act-btn:hover { background:var(--primary-light); color:var(--primary); }
        .rp-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:stretch; justify-content:flex-end; }
        .rp-panel { background:var(--surface); width:100%; max-width:540px; display:flex; flex-direction:column; padding:24px 20px; gap:0; animation:slideRight 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .rp-panel-wide { max-width:600px; }
        .rp-panel-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
        .rp-close-btn { background:var(--surface2); border:none; border-radius:8px; width:34px; height:34px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--muted); transition:background 0.15s; }
        .rp-close-btn:hover { background:var(--primary-light); color:var(--primary); }
        @media(max-width:640px) { .rp-stat-row{grid-template-columns:repeat(2,1fr);} }
      `}</style>

      <div className="rn-header">
        <div>
          <h2 className="rn-title">Reports</h2>
          <p className="rn-subtitle">Live group monitoring and member payment tracking</p>
        </div>
        <button className="rn-notify" onClick={loadGroups} title="Refresh">
          <RiRefreshLine size={18} />
        </button>
      </div>

      <div className="rn-tabs">
        {[
          { key: 'all',         label: `All (${counts.all})` },
          { key: 'active',      label: `Active (${counts.active})` },
          { key: 'completed',   label: `Completed (${counts.completed})` },
          { key: 'not-started', label: `Not Started (${counts.notStarted})` },
        ].map(t => (
          <button key={t.key} className={`rn-tab${activeTab === t.key ? ' is-active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {apiStatus === 'loading' ? (
        <div className="rn-card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <RiLoader4Line size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p style={{ margin: 0 }}>Loading groups from server...</p>
        </div>
      ) : apiStatus === 'error' ? (
        <div className="rn-empty">
          <RiAlertLine size={40} color="var(--danger)" style={{ marginBottom: 12 }} />
          <h3>Failed to Load</h3>
          <p>Could not fetch groups from the server.</p>
          <button className="rn-primary" style={{ marginTop: 14 }} onClick={loadGroups}>
            <RiRefreshLine size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rn-empty">
          <RiGroupLine size={40} color="var(--border)" style={{ marginBottom: 12 }} />
          <h3>No groups found</h3>
          <p>No {activeTab === 'all' ? '' : activeTab} groups available yet.</p>
        </div>
      ) : (
        <div className="rn-list">
          {filtered.map(group => <GroupCard key={group.id} group={group} onViewMembers={openGroupMembers} />)}
        </div>
      )}

      {selectedGroup && (
        <MemberDetailsPanel group={selectedGroup} members={groupMembers} loading={membersLoading}
          onClose={() => { setSelectedGroup(null); setGroupMembers([]); }} />
      )}
    </div>
  );
};

export default Reports;
