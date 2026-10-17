import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import Lottie from 'lottie-react';
import noFileAnimation from '../../../animation/no-file.json';
import {
  AlertTriangle as RiAlertLine,
  AlertOctagon as RiAlertOctagonLine,
  Search as RiSearchLine,
  RefreshCw as RiRefreshLine,
  Phone as RiPhoneLine,
  MessageCircle as RiMessageCircleLine,
  MessageSquare as RiMessageSquareLine,
  Clock as RiTimeLine,
  Check as RiCheckLine,
  ChevronRight as RiArrowRightSLine,
  X as RiCloseLine,
  Send as RiSendLine,
  Loader2 as RiLoaderLine,
  ExternalLink as RiExternalLinkLine,
  Wallet as RiWalletLine
} from 'lucide-react';
import './Defaulters.css';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';

const LottieComponent = Lottie.default || Lottie;

const DefaultersSkeleton = () => (
  <div className="mu-table-container skeleton-pulse">
    <div className="mu-table-wrapper">
      <table className="mu-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Group & Month</th>
            <th>Status & Due</th>
            <th>Amount</th>
            <th style={{ width: 220, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} style={{ pointerEvents: 'none' }}>
              <td>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 34, height: 34, background: '#e2e8f0', borderRadius: '50%' }} />
                  <div>
                    <div style={{ width: 120, height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: 80, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                </div>
              </td>
              <td>
                <div style={{ width: 100, height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 60, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
              </td>
              <td>
                <div style={{ width: 60, height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 90, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
              </td>
              <td><div style={{ width: 70, height: 16, background: '#e2e8f0', borderRadius: 4 }} /></td>
              <td style={{ textAlign: 'right' }}><div style={{ width: 140, height: 32, background: '#e2e8f0', borderRadius: 6, marginLeft: 'auto' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Defaulters = () => {
  const navigate = useNavigate();
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, overdue, critical

  // Quick Accept Payment State
  const [acceptingItem, setAcceptingItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isAccepting, setIsAccepting] = useState(false);

  // In-App Reminder Modal State
  const [reminderModalTarget, setReminderModalTarget] = useState(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [notice, setNotice] = useState(null);

  const showToast = (msg, isError = false) => {
    setNotice({ msg, isError });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeRequest('/admin/collections/defaulters');
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setDefaulters(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch defaulters list');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  // Quick Accept Payment Handler
  const handleConfirmPayment = async () => {
    if (!acceptingItem) return;
    try {
      setIsAccepting(true);
      const res = await makeRequest('/admin/reports/payment-status', {
        method: 'POST',
        body: JSON.stringify({
          groupId: acceptingItem.group_id,
          userId: acceptingItem.user_id,
          month: acceptingItem.month,
          year: acceptingItem.year,
          status: 'paid',
          amount: acceptingItem.amount,
          dueDate: acceptingItem.due_date,
          paymentMethod: paymentMethod
        })
      });

      const data = await safeJson(res);
      if (res.ok && data?.success) {
        showToast(`Payment of ${formatCurrency(acceptingItem.amount)} accepted for ${acceptingItem.user_name}!`);
        // Remove from list
        setDefaulters(prev => prev.filter(d => d.id !== acceptingItem.id));
        setAcceptingItem(null);
      } else {
        showToast(data?.message || 'Failed to accept payment', true);
      }
    } catch (err) {
      console.error('Payment acceptance failed:', err);
      showToast('Network error while processing payment. Please try again.', true);
    } finally {
      setIsAccepting(false);
    }
  };

  // Reminder Modal
  const openReminderModal = (item) => {
    const defaultMsg = `Dear ${item.user_name}, this is a gentle reminder from GDK Chit Funds. Your monthly contribution of ${formatCurrency(item.amount)} for ${item.monthName} in "${item.group_name}" is currently ${item.status.toUpperCase()}. Kindly complete your payment at the earliest.`;
    setReminderMessage(defaultMsg);
    setReminderModalTarget(item);
  };

  const handleSendInAppReminder = async () => {
    if (!reminderModalTarget || !reminderMessage.trim()) return;
    setSendingReminder(true);
    try {
      // 1. Get or create private room with the member
      const roomRes = await makeRequest('/chats/privateRoom', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: reminderModalTarget.user_id })
      });
      const roomData = await safeJson(roomRes);
      if (!roomRes.ok || !roomData?.success) {
        throw new Error(roomData?.message || 'Could not open chat room with user');
      }

      // 2. Send the reminder message
      const sendRes = await makeRequest('/chats/send', {
        method: 'POST',
        body: JSON.stringify({
          roomId: roomData.roomId,
          message: reminderMessage.trim()
        })
      });
      const sendData = await safeJson(sendRes);
      if (!sendRes.ok || !sendData?.success) {
        throw new Error(sendData?.message || 'Failed to send message');
      }

      showToast(`Reminder sent to ${reminderModalTarget.user_name} via Chat!`);
      setReminderModalTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to send in-app reminder', true);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleOpenDirectChat = async (item) => {
    try {
      const roomRes = await makeRequest('/chats/privateRoom', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: item.user_id })
      });
      const roomData = await safeJson(roomRes);
      if (roomRes.ok && roomData?.success) {
        navigate('/admin/chat', {
          state: {
            chat: {
              chatId: roomData.roomId,
              chatName: item.user_name,
              isGroup: false,
              userId: item.user_id
            }
          }
        });
      } else {
        navigate('/admin/chat');
      }
    } catch {
      navigate('/admin/chat');
    }
  };

  // WhatsApp reminder with robust phone sanitization
  const handleWhatsApp = (phone, name, amount, groupName, monthName) => {
    if (!phone) {
      alert("No phone number available for this user.");
      return;
    }
    let cleanPhone = phone.replace(/\D/g, '');
    cleanPhone = cleanPhone.replace(/^0+/, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const message = `Hello ${name}, this is a gentle reminder from GDK Chit Funds. Your payment of ${formatCurrency(amount)} for ${monthName} in group "${groupName}" is currently pending. Please make the payment at your earliest convenience. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  // Direct group inspection in Reports
  const handleInspectGroup = (item) => {
    navigate('/admin/reports', {
      state: {
        groupId: item.group_id,
        groupName: item.group_name
      }
    });
  };

  // Statistics calculation
  const stats = useMemo(() => {
    let totalOutstanding = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let criticalCount = 0;
    let criticalAmount = 0;

    defaulters.forEach(d => {
      const amt = Number(d.amount) || 0;
      totalOutstanding += amt;

      if (d.status === 'pending') {
        pendingCount += 1;
        pendingAmount += amt;
      } else if (d.status === 'overdue') {
        overdueCount += 1;
        overdueAmount += amt;
        if (d.days_overdue > 30) {
          criticalCount += 1;
          criticalAmount += amt;
        }
      }
    });

    return {
      totalCount: defaulters.length,
      totalOutstanding,
      pendingCount,
      pendingAmount,
      overdueCount,
      overdueAmount,
      criticalCount,
      criticalAmount
    };
  }, [defaulters]);

  // Filtering
  const filteredDefaulters = useMemo(() => {
    return defaulters.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        d.user_name?.toLowerCase().includes(q) || 
        d.group_name?.toLowerCase().includes(q) ||
        d.user_phone?.includes(q);
      
      let matchesStatus = true;
      if (activeTab === 'pending') {
        matchesStatus = d.status === 'pending';
      } else if (activeTab === 'overdue') {
        matchesStatus = d.status === 'overdue';
      } else if (activeTab === 'critical') {
        matchesStatus = d.status === 'overdue' && d.days_overdue > 30;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [defaulters, searchQuery, activeTab]);

  const TABS = [
    { key: 'all', label: `All (${stats.totalCount})` },
    { key: 'pending', label: `Pending (${stats.pendingCount})` },
    { key: 'overdue', label: `Overdue (${stats.overdueCount})` },
    { key: 'critical', label: `Critical >30d (${stats.criticalCount})` },
  ];

  return (
    <div className="rn-page">
      {/* ── Page Header & Action Bar Container ── */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row">
          
          {/* Tab Bar */}
          <div className="reports-tabs-wrapper">
            {TABS.map(t => (
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

          {/* Search & Refresh Buttons */}
          <div className="reports-filters-wrapper">
            {/* Search Bar */}
            <div className="reports-search-container">
              <RiSearchLine className="reports-search-icon" size={16} />
              <input
                type="text"
                className="reports-search-input"
                placeholder="Search by name, phone or group..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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
              onClick={fetchDefaulters}
              title="Refresh list"
            >
              <RiRefreshLine size={15} className={loading ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Statistics Cards ── */}
      <div className="def-stats-grid">
        <div 
          className={`def-stat-card ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          title="Click to show all records"
        >
          <div className="def-stat-icon-wrap" style={{ background: '#EBF3ED', color: '#1B5E20' }}>
            <RiWalletLine size={20} />
          </div>
          <div className="def-stat-info">
            <span className="def-stat-label">Total Outstanding</span>
            <span className="def-stat-value">{formatCurrency(stats.totalOutstanding)}</span>
            <span className="def-stat-sub">{stats.totalCount} total dues</span>
          </div>
        </div>

        <div 
          className={`def-stat-card ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          title="Click to filter pending dues"
        >
          <div className="def-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <RiTimeLine size={20} />
          </div>
          <div className="def-stat-info">
            <span className="def-stat-label">Current Cycle</span>
            <span className="def-stat-value">{formatCurrency(stats.pendingAmount)}</span>
            <span className="def-stat-sub">{stats.pendingCount} pending dues</span>
          </div>
        </div>

        <div 
          className={`def-stat-card ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
          title="Click to filter overdue dues"
        >
          <div className="def-stat-icon-wrap" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <RiAlertLine size={20} />
          </div>
          <div className="def-stat-info">
            <span className="def-stat-label">Overdue Dues</span>
            <span className="def-stat-value">{formatCurrency(stats.overdueAmount)}</span>
            <span className="def-stat-sub">{stats.overdueCount} overdue dues</span>
          </div>
        </div>

        <div 
          className={`def-stat-card ${activeTab === 'critical' ? 'active' : ''}`}
          onClick={() => setActiveTab('critical')}
          title="Click to filter critical dues (>30d late)"
        >
          <div className="def-stat-icon-wrap" style={{ background: '#7F1D1D', color: '#FECACA' }}>
            <RiAlertOctagonLine size={20} />
          </div>
          <div className="def-stat-info">
            <span className="def-stat-label">Critical (&gt;30d Late)</span>
            <span className="def-stat-value">{formatCurrency(stats.criticalAmount)}</span>
            <span className="def-stat-sub">{stats.criticalCount} high risk dues</span>
          </div>
        </div>
      </div>

      {notice && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: notice.isError ? '#FDE8E8' : '#E8F5E9',
          color: notice.isError ? '#9B1C1C' : '#1B3322',
          fontWeight: 600,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: `1px solid ${notice.isError ? '#F8B4B4' : '#C8E6C9'}`,
          marginBottom: 16
        }}>
          {notice.isError ? <RiAlertLine size={16} /> : <RiCheckLine size={16} />}
          {notice.msg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <DefaultersSkeleton />
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, textAlign: 'center', padding: '40px 20px' }}>
          <RiAlertLine size={48} color="var(--danger)" style={{ marginBottom: 14 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#0B140E' }}>Failed to Load</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7A6E' }}>{error}</p>
        </div>
      ) : filteredDefaulters.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, textAlign: 'center', padding: '48px 20px' }}>
          <LottieComponent
            animationData={noFileAnimation}
            loop={true}
            style={{ width: 220, height: 220, marginBottom: 12 }}
          />
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0B140E' }}>
            All Caught Up!
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7A6E', fontWeight: 500, maxWidth: 360 }}>
            {searchQuery ? `No results match "${searchQuery}"` : 'There are no pending or overdue payments.'}
          </p>
        </div>
      ) : (
        <div className="mu-table-container">
          <div className="mu-table-wrapper">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Group & Month</th>
                  <th>Status & Due</th>
                  <th>Amount</th>
                  <th style={{ width: 220, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDefaulters.map((item) => (
                  <tr key={item.id} className="def-row">
                    <td>
                      <div className="mu-cell-member">
                        <div 
                          className="mu-cell-avatar" 
                          style={{ 
                            background: '#EBF3ED', 
                            color: '#1B3322',
                            border: '1px solid #DCE3DC',
                            fontWeight: 800
                          }}
                        >
                          {item.user_name ? item.user_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="mu-cell-name-info">
                          <span className="mu-cell-name">{item.user_name}</span>
                          <span className="mu-cell-sub">
                            <RiPhoneLine size={12} /> {item.user_phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="def-group-name">
                        <button 
                          className="def-group-link-btn"
                          onClick={() => handleInspectGroup(item)}
                          title="Open group collection reports"
                        >
                          {item.group_name}
                          <RiExternalLinkLine size={12} style={{ opacity: 0.6 }} />
                        </button>
                      </div>
                      <div className="def-month-lbl">{item.monthName}</div>
                    </td>
                    <td>
                      <span className={`def-badge ${item.days_overdue > 30 ? 'critical' : item.status}`}>
                        {item.days_overdue > 30 ? (
                          <RiAlertOctagonLine size={10} />
                        ) : item.status === 'overdue' ? (
                          <RiAlertLine size={10} />
                        ) : (
                          <RiTimeLine size={10} />
                        )}
                        {item.days_overdue > 30 ? 'CRITICAL' : item.status.toUpperCase()}
                      </span>
                      <div className="def-due-date">
                        {formatDate(item.due_date)}
                        {item.days_overdue > 0 && <span className="def-days-late"> ({item.days_overdue}d late)</span>}
                      </div>
                    </td>
                    <td>
                      <strong className="def-amount">{formatCurrency(item.amount)}</strong>
                    </td>
                    <td className="def-action-cell">
                      <div className="def-action-group">
                        <button 
                          className="def-accept-btn"
                          onClick={() => setAcceptingItem(item)}
                          title="Accept and Record Payment"
                        >
                          <RiCheckLine size={14} />
                          <span>Accept</span>
                        </button>

                        <button 
                          className="def-reminder-btn"
                          onClick={() => openReminderModal(item)}
                          title="Send In-App Chat Reminder"
                        >
                          <RiMessageSquareLine size={13} />
                          <span>Reminder</span>
                        </button>

                        <button 
                          className="def-whatsapp-icon-btn"
                          onClick={() => handleWhatsApp(item.user_phone, item.user_name, item.amount, item.group_name, item.monthName)}
                          title="Send WhatsApp Reminder"
                        >
                          <RiMessageCircleLine size={15} />
                        </button>

                        <button 
                          className="def-link-icon-btn"
                          onClick={() => handleInspectGroup(item)}
                          title="View Group Collection Ledger"
                        >
                          <RiArrowRightSLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Accept Payment Confirmation Modal ── */}
      {acceptingItem && (
        <div className="def-modal-backdrop" onClick={() => !isAccepting && setAcceptingItem(null)}>
          <div className="def-modal-card" onClick={e => e.stopPropagation()}>
            <div className="def-modal-header">
              <h3 className="def-modal-title">
                <RiCheckLine size={18} color="var(--primary)" />
                Accept Payment
              </h3>
              <button 
                onClick={() => !isAccepting && setAcceptingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="def-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAF8', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8E2' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EBF3ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1B3322', fontSize: 16 }}>
                  {acceptingItem.user_name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0B140E' }}>
                    {acceptingItem.user_name}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6B7A6E' }}>
                    Group: <strong>{acceptingItem.group_name}</strong> · Month: <strong>{acceptingItem.monthName}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>Amount</span>
                  <strong style={{ fontSize: 16, color: '#1B5E20', fontWeight: 800 }}>
                    {formatCurrency(acceptingItem.amount)}
                  </strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1B3322', marginBottom: 6 }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  disabled={isAccepting}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #DCE3DC',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Recording this payment will immediately update the collection report, generate a receipt number, and mark the member's dues as resolved.
              </p>
            </div>

            <div className="def-modal-footer">
              <button
                className="reports-refresh-btn"
                onClick={() => setAcceptingItem(null)}
                disabled={isAccepting}
              >
                Cancel
              </button>

              <button
                className="def-accept-btn"
                onClick={handleConfirmPayment}
                disabled={isAccepting}
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                {isAccepting ? (
                  <>
                    <RiLoaderLine size={14} className="spin-anim" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <RiCheckLine size={15} />
                    <span>Confirm & Mark Paid</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send In-App Chat Reminder Modal ── */}
      {reminderModalTarget && (
        <div className="def-modal-backdrop" onClick={() => setReminderModalTarget(null)}>
          <div className="def-modal-card" onClick={e => e.stopPropagation()}>
            <div className="def-modal-header">
              <h3 className="def-modal-title">
                <RiMessageSquareLine size={18} color="var(--primary)" />
                Send Payment Reminder
              </h3>
              <button 
                onClick={() => setReminderModalTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="def-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAF8', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8E2' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EBF3ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1B3322' }}>
                  {reminderModalTarget.user_name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0B140E' }}>
                    {reminderModalTarget.user_name}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7A6E' }}>
                    Group: <strong>{reminderModalTarget.group_name}</strong> · Due: <strong>{formatCurrency(reminderModalTarget.amount)}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1B3322', marginBottom: 6 }}>
                  Reminder Message (Sent via Chat)
                </label>
                <textarea
                  rows={4}
                  value={reminderMessage}
                  onChange={e => setReminderMessage(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #DCE3DC',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="def-modal-footer">
              <button
                className="reports-refresh-btn"
                onClick={() => handleOpenDirectChat(reminderModalTarget)}
                title="Go to Live Chat with this user"
                style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RiExternalLinkLine size={14} />
                <span>Open Chat Screen</span>
              </button>
              
              <button
                className="reports-refresh-btn"
                onClick={() => setReminderModalTarget(null)}
                disabled={sendingReminder}
              >
                Cancel
              </button>

              <button
                className="def-reminder-btn"
                onClick={handleSendInAppReminder}
                disabled={sendingReminder || !reminderMessage.trim()}
              >
                {sendingReminder ? (
                  <>
                    <RiLoaderLine size={14} className="spin-anim" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RiSendLine size={14} />
                    <span>Send Reminder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Defaulters;
