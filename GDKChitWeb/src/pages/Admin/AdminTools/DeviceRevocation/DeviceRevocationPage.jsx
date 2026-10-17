import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  User,
  Phone,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Loader2
} from 'lucide-react';
import { makeRequest, safeJson } from '../../../../api/apiClient';
import './DeviceRevocationPage.css';

const DeviceRevocationPage = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    boundCount: 0,
    unboundCount: 0,
    revokedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BOUND' | 'UNBOUND' | 'REVOKED'

  // Revoke Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [revokeReason, setRevokeReason] = useState('Subscriber requested device transfer to a new phone');
  const [revoking, setRevoking] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  // Audit Logs Modal State
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch bindings from backend DB
  const fetchBindings = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await makeRequest('/admin/devices/bindings');
      const data = await safeJson(res);
      if (data.success && data.data) {
        setUsers(data.data.users || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching device bindings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBindings();
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await makeRequest('/admin/devices/logs');
      const data = await safeJson(res);
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenLogs = () => {
    setShowLogsModal(true);
    fetchAuditLogs();
  };

  // Perform Revocation
  const handleConfirmRevoke = async () => {
    if (!selectedUser) return;
    setRevoking(true);

    try {
      const res = await makeRequest('/admin/devices/revoke', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: revokeReason.trim() || 'Admin revoked device session for new device login'
        })
      });

      const data = await safeJson(res);
      if (!data.success) {
        throw new Error(data.message || 'Revocation failed');
      }

      setSuccessBanner(data.message || `Device session revoked for ${selectedUser.name}!`);
      setTimeout(() => setSuccessBanner(''), 4500);

      // Close modal and refresh list
      setSelectedUser(null);
      setRevokeReason('Subscriber requested device transfer to a new phone');
      await fetchBindings(true);
    } catch (err) {
      console.error('Failed to revoke device:', err);
      alert(err.message || 'Error occurred while revoking device binding.');
    } finally {
      setRevoking(false);
    }
  };

  // Filtered subscribers
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role filter: only subscribers (or exclude admins from device lock list)
      if (u.role === 'Admin') return false;

      // Status filter
      if (statusFilter === 'BOUND') {
        if (u.device_status !== 'BOUND' || !u.bound_device_id) return false;
      } else if (statusFilter === 'UNBOUND') {
        if (u.device_status === 'BOUND' && u.bound_device_id) return false;
      } else if (statusFilter === 'REVOKED') {
        if (u.device_status !== 'REVOKED') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = u.name && u.name.toLowerCase().includes(q);
        const matchesPhone = u.phone && u.phone.includes(q);
        const matchesDevice = u.device_name && u.device_name.toLowerCase().includes(q);
        const matchesDevId = u.bound_device_id && u.bound_device_id.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesDevice || matchesDevId;
      }

      return true;
    });
  }, [users, statusFilter, search]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="drp-page">
      {/* ── HEADER ── */}
      <div className="drp-header">
        <div className="drp-header-left">
          <button
            type="button"
            className="drp-back-btn"
            onClick={() => navigate('/admin/admintool')}
            title="Back to Admin Tools"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="drp-title">Device Access & Session Revocation</h1>
            <p className="drp-subtitle">
              Enforce single-device binding security. View registered subscriber hardware and revoke sessions to grant new phone access.
            </p>
          </div>
        </div>

        <div className="drp-header-actions">
          <button
            type="button"
            className="drp-secondary-btn"
            onClick={handleOpenLogs}
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>

          <button
            type="button"
            className="drp-secondary-btn"
            onClick={() => fetchBindings(true)}
            disabled={refreshing}
          >
            <RotateCcw size={16} className={refreshing ? 'drp-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── SUCCESS BANNER ── */}
      {successBanner && (
        <div className="drp-success-banner">
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* ── METRICS STRIP ── */}
      <div className="drp-metrics-grid">
        <div className="drp-metric-card">
          <div className="drp-metric-icon" style={{ background: '#ebf3ed', color: '#1b3322' }}>
            <User size={20} />
          </div>
          <div>
            <span className="drp-metric-label">Total Subscribers</span>
            <span className="drp-metric-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="drp-metric-card">
          <div className="drp-metric-icon" style={{ background: '#f0fdf4', color: '#2e7d32' }}>
            <Lock size={20} />
          </div>
          <div>
            <span className="drp-metric-label">Locked to 1 Device</span>
            <span className="drp-metric-value highlight">{stats.boundCount}</span>
          </div>
        </div>

        <div className="drp-metric-card">
          <div className="drp-metric-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
            <Unlock size={20} />
          </div>
          <div>
            <span className="drp-metric-label">Unbound / Fresh Logins</span>
            <span className="drp-metric-value">{stats.unboundCount}</span>
          </div>
        </div>

        <div className="drp-metric-card">
          <div className="drp-metric-icon" style={{ background: '#fdecec', color: '#d32f2f' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="drp-metric-label">Revocations Cleared</span>
            <span className="drp-metric-value alert">{stats.revokedCount}</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="drp-controls-bar">
        <div className="drp-search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search subscriber by name, phone, or device ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="drp-search-input"
          />
          {search && (
            <button className="drp-clear-search" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="drp-filter-tabs">
          <button
            type="button"
            className={`drp-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All ({users.filter(u => u.role !== 'Admin').length})
          </button>
          <button
            type="button"
            className={`drp-tab ${statusFilter === 'BOUND' ? 'active' : ''}`}
            onClick={() => setStatusFilter('BOUND')}
          >
            Bound to Device ({stats.boundCount})
          </button>
          <button
            type="button"
            className={`drp-tab ${statusFilter === 'UNBOUND' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNBOUND')}
          >
            Unbound ({stats.unboundCount})
          </button>
          <button
            type="button"
            className={`drp-tab ${statusFilter === 'REVOKED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('REVOKED')}
          >
            Revoked ({stats.revokedCount})
          </button>
        </div>
      </div>

      {/* ── SUBSCRIBER TABLE ── */}
      <div className="drp-table-card">
        {loading ? (
          <div className="drp-loading-state">
            <Loader2 size={32} className="drp-spin" color="#1b3322" />
            <span>Loading device binding registry from database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="drp-empty-state">
            <Smartphone size={40} color="#94a3b8" />
            <h3>No subscriber records found</h3>
            <p>Try refining your search keyword or clearing active status filters.</p>
          </div>
        ) : (
          <div className="drp-table-responsive">
            <table className="drp-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Registered Hardware</th>
                  <th>Device Status</th>
                  <th>Bound Date</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: 'right' }}>Security Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isBound = Boolean(u.bound_device_id && u.device_status === 'BOUND');
                  const isRevoked = u.device_status === 'REVOKED';
                  const isWeb = (u.device_platform || '').toLowerCase().includes('web');

                  return (
                    <tr key={u.id} className={isBound ? 'drp-row-bound' : ''}>
                      <td>
                        <div className="drp-user-cell">
                          <div className="drp-user-avatar">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="drp-user-name">{u.name}</div>
                            <div className="drp-user-phone">
                              <Phone size={11} />
                              <span>{u.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isBound ? (
                          <div className="drp-device-cell">
                            <div className="drp-device-icon">
                              {isWeb ? <Laptop size={16} /> : <Smartphone size={16} />}
                            </div>
                            <div>
                              <div className="drp-device-name">
                                {u.device_name || (u.device_platform ? `${u.device_platform} Device` : 'Mobile Phone')}
                              </div>
                              <div className="drp-device-id" title={u.bound_device_id}>
                                ID: {u.bound_device_id.length > 18 ? `${u.bound_device_id.substring(0, 18)}...` : u.bound_device_id}
                              </div>
                            </div>
                          </div>
                        ) : isRevoked ? (
                          <div className="drp-device-revoked-note">
                            <AlertTriangle size={14} color="#d32f2f" />
                            <span>Session revoked — Pending new device login</span>
                          </div>
                        ) : (
                          <span className="drp-device-empty">No device registered yet</span>
                        )}
                      </td>

                      <td>
                        {isBound ? (
                          <span className="drp-badge badge-bound">
                            <span className="drp-badge-dot dot-green"></span>
                            Locked to Device
                          </span>
                        ) : isRevoked ? (
                          <span className="drp-badge badge-revoked">
                            <span className="drp-badge-dot dot-red"></span>
                            Session Revoked
                          </span>
                        ) : (
                          <span className="drp-badge badge-unbound">
                            <span className="drp-badge-dot dot-gray"></span>
                            Unbound
                          </span>
                        )}
                      </td>

                      <td className="drp-date-cell">
                        {formatDate(u.device_bound_at)}
                      </td>

                      <td className="drp-date-cell">
                        {formatDate(u.device_last_login)}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isBound ? (
                          <button
                            type="button"
                            className="drp-revoke-btn"
                            onClick={() => setSelectedUser(u)}
                            title="Revoke device session to allow login on a new phone"
                          >
                            <ShieldAlert size={14} />
                            <span>Revoke Device</span>
                          </button>
                        ) : (
                          <span className="drp-clear-ready">
                            <Check size={14} color="#2e7d32" />
                            <span>Cleared for New Login</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── REVOKE CONFIRMATION MODAL ── */}
      {selectedUser && (
        <div className="drp-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="drp-modal-card" onClick={e => e.stopPropagation()}>
            <div className="drp-modal-header">
              <div className="drp-modal-icon-badge">
                <ShieldAlert size={22} color="#d32f2f" />
              </div>
              <div>
                <h3 className="drp-modal-title">Revoke Device Session?</h3>
                <p className="drp-modal-subtitle">
                  Clears the hardware lock for {selectedUser.name} ({selectedUser.phone})
                </p>
              </div>
              <button
                type="button"
                className="drp-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drp-modal-body">
              <div className="drp-notice-box">
                <AlertTriangle size={18} color="#d32f2f" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Important Security Action:</strong>
                  <p>
                    Revoking will immediately unlink <strong>{selectedUser.device_name || 'Current Registered Device'}</strong> and terminate all active sessions.
                    The subscriber will be immediately authorized to log in from their new phone.
                  </p>
                </div>
              </div>

              <div className="drp-field">
                <label className="drp-field-label">Reason for Device Revocation (Audit Trail)</label>
                <textarea
                  rows={3}
                  className="drp-textarea"
                  value={revokeReason}
                  onChange={e => setRevokeReason(e.target.value)}
                  placeholder="e.g. Subscriber purchased a new phone, old device lost or formatted..."
                />
              </div>
            </div>

            <div className="drp-modal-footer">
              <button
                type="button"
                className="drp-btn-cancel"
                onClick={() => setSelectedUser(null)}
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="drp-btn-confirm-revoke"
                onClick={handleConfirmRevoke}
                disabled={revoking}
              >
                {revoking ? <Loader2 size={16} className="drp-spin" /> : <ShieldAlert size={16} />}
                <span>{revoking ? 'Revoking Session...' : 'Confirm & Clear Device Lock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS MODAL ── */}
      {showLogsModal && (
        <div className="drp-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="drp-modal-card drp-modal-large" onClick={e => e.stopPropagation()}>
            <div className="drp-modal-header">
              <div className="drp-modal-icon-badge" style={{ background: '#ebf3ed', color: '#1b3322' }}>
                <History size={22} />
              </div>
              <div>
                <h3 className="drp-modal-title">Device Revocation Audit Trail</h3>
                <p className="drp-modal-subtitle">
                  Chronological history of all admin-authorized single-device resets
                </p>
              </div>
              <button
                type="button"
                className="drp-modal-close"
                onClick={() => setShowLogsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drp-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingLogs ? (
                <div className="drp-loading-state">
                  <Loader2 size={28} className="drp-spin" color="#1b3322" />
                  <span>Loading audit logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="drp-empty-state">
                  <History size={36} color="#94a3b8" />
                  <h3>No device revocations logged yet</h3>
                  <p>When an admin revokes a subscriber's device session, the audit record will appear here.</p>
                </div>
              ) : (
                <div className="drp-table-responsive">
                  <table className="drp-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Subscriber</th>
                        <th>Revoked Device</th>
                        <th>Authorized By</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td className="drp-date-cell">{formatDate(log.revoked_at)}</td>
                          <td>
                            <strong>{log.subscriber_name}</strong>
                            <div className="drp-user-phone">{log.subscriber_phone}</div>
                          </td>
                          <td>
                            <span>{log.revoked_device_name || 'Previous Device'}</span>
                          </td>
                          <td>
                            <span className="drp-badge badge-admin">
                              {log.admin_name || 'Administrator'}
                            </span>
                          </td>
                          <td style={{ maxWidth: 220, fontSize: 12.5, color: '#475569' }}>
                            {log.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="drp-modal-footer">
              <button
                type="button"
                className="drp-btn-cancel"
                onClick={() => setShowLogsModal(false)}
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceRevocationPage;
