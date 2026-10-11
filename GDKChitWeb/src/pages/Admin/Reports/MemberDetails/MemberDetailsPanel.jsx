import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency, formatDate } from '../../../../utils/formatters.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  X as RiCloseLine, Loader2 as RiLoader4Line, Calendar as RiCalendarLine, User as RiUserLine,
  History as RiHistoryLine, Pencil as RiEditLine, ChevronRight as RiArrowRightSLine, Info as RiInformationLine,
  FileText as RiFileListLine, CircleDollarSign as RiMoneyDollarCircleLine, ArrowLeft as RiArrowLeftLine,
} from 'lucide-react';
import { MONTHS, scOf, StatusIcon } from '../Reports.jsx';

export function generatePaymentHistory(memberId, groupStartDate, monthlyAmount) {
  const history = [];
  const start = groupStartDate ? new Date(groupStartDate) : new Date();
  const now = new Date();
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= now) {
    const month = d.getMonth(), year = d.getFullYear();
    const r = Math.random();
    const status = r > 0.25 ? 'paid' : r > 0.1 ? 'pending' : 'overdue';
    history.push({
      month, year,
      monthName: `${MONTHS[month]} ${year}`,
      status,
      amount: monthlyAmount || 0,
      paidDate: status === 'paid' ? new Date(year, month, Math.floor(Math.random() * 20) + 1).toISOString() : null,
      dueDate: new Date(year, month, 15).toISOString(),
      receiptNumber: status === 'paid' ? `RCP${memberId}${year}${String(month).padStart(2, '0')}${Math.floor(Math.random() * 9000) + 1000}` : null,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return history.reverse();
}


/* ════════════════════════════════════════════════════════════════
   MEMBER CHIT CARD  (payment history side panel)
════════════════════════════════════════════════════════════════ */
const MemberChitCard = ({ member, monthlyAmount, onClose }) => (
  <div className="rp-overlay" onClick={onClose}>
    <div className="rp-panel" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="rp-ph">
        <div className="md-avatar" style={{ background: `${scOf('paid')}18`, color: scOf('paid'), width: 48, height: 48, fontSize: 18 }}>
          {String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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
    { value: 'paid', label: 'Mark as Paid', Icon: RiCheckLine, desc: 'Payment received successfully' },
    { value: 'pending', label: 'Mark as Pending', Icon: RiTimeLine, desc: 'Payment not yet received' },
    { value: 'overdue', label: 'Mark as Overdue', Icon: RiAlertLine, desc: 'Payment is past due date' },
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
  const status = payment?.status || 'pending';
  const color = scOf(status);
  const initials = String(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="gc-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="gc-header" style={{ paddingBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="md-avatar" style={{ background: `${color}18`, color, width: 42, height: 42, fontSize: 16 }}>
            {initials}
          </div>
          <div>
            <h3 className="gc-name" style={{ margin: '0 0 4px', fontSize: 16 }}>{member.name || 'Unknown'}</h3>
            <span className="gc-badge" style={{ background: color }}>
              <StatusIcon status={status} size={10} /> {status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="gc-content">
        <div className="gc-info-row" style={{ marginBottom: 16 }}>
          <div className="gc-info-item">
            <RiUserLine size={16} color="#6B7280" />
            <span className="gc-info-text">{member.phone || '--'}</span>
          </div>
          <div className="gc-info-item">
            <RiMoneyDollarCircleLine size={16} color="#6B7280" />
            <span className="gc-info-text">{formatCurrency(payment?.amount || monthlyAmount)}</span>
          </div>
        </div>

        <div className="gc-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button className="reports-refresh-btn" style={{ padding: '6px 12px', height: 'auto', flex: 1, justifyContent: 'center' }} onClick={() => onEdit(member, payment)}>
              <RiEditLine size={14} /> <span style={{ fontSize: 12 }}>Status</span>
            </button>
            <button className="reports-refresh-btn" style={{ padding: '6px 12px', height: 'auto', flex: 1, justifyContent: 'center' }} onClick={() => onChitCard(member)}>
              <RiHistoryLine size={14} /> <span style={{ fontSize: 12 }}>History</span>
            </button>
          </div>
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
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [chitCardMember, setChitCardMember] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [members, setMembers] = useState([]);

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
            paidDate: newStatus === 'paid' ? new Date().toISOString() : null,
            receiptNumber: newStatus === 'paid' ? `RCP${memberId}${selYear}${selMonth}${Date.now() % 10000}` : null,
          };
        }),
      };
    }));
    setEditTarget(null); setEditPayment(null);
  }, [selMonth, selYear]);

  const STAT_CARDS = [
    { label: 'Paid', value: stats.paid, Icon: RiCheckLine, color: '#10B981' },
    { label: 'Pending', value: stats.pending, Icon: RiTimeLine, color: '#F59E0B' },
    { label: 'Overdue', value: stats.overdue, Icon: RiAlertLine, color: '#EF4444' },
    { label: 'Collected', value: formatCurrency(stats.collected), Icon: RiMoneyDollarCircleLine, color: 'var(--primary)' },
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
        <div className="reports-toolbar-row" style={{ borderTop: 'none', padding: '20px 24px', alignItems: 'center' }}>
          
          {/* Left: Back Button & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <button className="md-back-btn" onClick={onClose}><RiArrowLeftLine size={18} /></button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#030712' }}>{group.name}</h3>
                {isCurrentMonth && (
                  <span style={{ background: '#10B981', color: '#fff', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <RiTimeLine size={11} /> Current Month
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <RiMoneyDollarCircleLine size={14} /> {formatCurrency(monthlyAmt)}/month
                <span style={{ color: '#cbd5e1' }}>·</span>
                <RiGroupLine size={14} /> {members.length} members
              </p>
            </div>
          </div>

          {/* Right: Month Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Payment Month
            </span>
            <div style={{ position: 'relative' }}>
              <button className="reports-refresh-btn" onClick={() => setShowMonthPicker(v => !v)}>
                <RiCalendarLine size={16} color="#64748B" />
                <span>{MONTHS[selMonth]} {selYear}</span>
                <RiArrowRightSLine size={16} color="#64748B" style={{ transform: showMonthPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
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

      {/* ── Stats Row ── */}
      <div className="md-stats-row" style={{ background: 'transparent', borderBottom: 'none', padding: '24px 0 16px', gap: 20 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="md-stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ background: `${s.color}15`, padding: 8, borderRadius: 8, marginBottom: 8 }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <span className="md-stat-val" style={{ color: '#030712' }}>{s.value}</span>
            <span className="md-stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Members List ── */}
      <div className={members.length === 0 && !loading ? "" : "rn-list"}>
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="md-card skeleton-pulse" style={{ pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 140, height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: 90, height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 64, height: 24, background: '#e2e8f0', borderRadius: 12 }} />
                </div>
              </div>
            ))}
          </>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <RiGroupLine size={56} color="var(--border)" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#030712' }}>No Members</h3>
            <p style={{ margin: 0, fontSize: 14 }}>There are no members in this group yet.</p>
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
    </>
  );
};

export default MemberDetailsPanel;
