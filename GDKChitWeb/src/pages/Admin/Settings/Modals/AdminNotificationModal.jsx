import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import './AdminModals.css';

const AdminNotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'danger' | 'warning'

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await makeRequest('/admin/notifications');
      const data = await safeJson(res);
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (e) {
      console.warn('Notifications fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Bell size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Administrative Notifications</h2>
              <p className="adm-modal-subtitle">Live system alerts, overdue collections, and auction reminders</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: filter === 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: filter === 'all' ? '#eff6ff' : '#fff',
                  color: filter === 'all' ? '#1d4ed8' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('danger')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: filter === 'danger' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                  background: filter === 'danger' ? '#fef2f2' : '#fff',
                  color: filter === 'danger' ? '#b91c1c' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Urgent ({notifications.filter(n => n.type === 'danger').length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('warning')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: filter === 'warning' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: filter === 'warning' ? '#fffbeb' : '#fff',
                  color: filter === 'warning' ? '#b45309' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Warnings ({notifications.filter(n => n.type === 'warning').length})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'adm-spinner' : ''} />
              Refresh
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={24} className="adm-spinner" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Fetching notifications...</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 10
            }}>
              <Inbox size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ margin: 0, fontSize: 14, color: '#334155' }}>No Notifications Found</h4>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                All systems, auction schedules, and member ledgers are up to date.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredNotifs.map((n, idx) => {
                const isDanger = n.type === 'danger';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: isDanger ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${isDanger ? '#fecaca' : '#fde68a'}`
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isDanger ? '#fee2e2' : '#fef3c7',
                      color: isDanger ? '#dc2626' : '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isDanger ? <AlertTriangle size={16} /> : <Clock size={16} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDanger ? '#991b1b' : '#92400e' }}>
                          {n.title}
                        </h4>
                        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationModal;
