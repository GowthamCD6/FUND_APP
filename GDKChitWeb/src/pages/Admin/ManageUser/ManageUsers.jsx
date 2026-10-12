import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatDate } from '../../../utils/formatters.js';
import {
  Search as RiSearchLine, User as RiUserLine, ShieldCheck as RiShieldUserLine,
  Pencil as RiEditLine, Trash2 as RiDeleteBinLine, X as RiCloseLine, Check as RiCheckLine,
  Phone as RiPhoneLine, Calendar as RiCalendarLine, Users as RiGroupLine,
  ChevronLeft, ChevronRight, Hash, AtSign, Loader2 as RiLoader4Line, AlertTriangle as RiAlertLine,
  Clock as RiTimeLine, ChevronRight as RiArrowRightSLine, RefreshCw as RiRefreshLine,
  Copy as RiCopyLine, Key as RiKeyLine, Ban as RiBanLine, UserCheck as RiUserCheckLine,
  MessageSquare as RiMessageLine, ExternalLink as RiExternalLinkLine, ShieldAlert
} from 'lucide-react';
import './ManageUsers.css';

const UserTableSkeleton = () => (
  <div className="mu-table-container skeleton-pulse">
    <div className="mu-table-wrapper">
      <table className="mu-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined Date</th>
            <th>Groups</th>
            <th style={{ width: 60 }}></th>
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
                    <div style={{ width: 60, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                </div>
              </td>
              <td><div style={{ width: 100, height: 12, background: '#e2e8f0', borderRadius: 4 }} /></td>
              <td><div style={{ width: 60, height: 16, background: '#e2e8f0', borderRadius: 100 }} /></td>
              <td><div style={{ width: 90, height: 12, background: '#e2e8f0', borderRadius: 4 }} /></td>
              <td><div style={{ width: 50, height: 12, background: '#e2e8f0', borderRadius: 4 }} /></td>
              <td><div style={{ width: 32, height: 32, background: '#e2e8f0', borderRadius: 6 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ManageUsers = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'view'|'edit'|'delete'

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editNickname, setEditNickname] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [notice, setNotice] = useState(null); // {text, success}

  // Groups for user
  const [userGroups, setUserGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Pagination (10 rows is standard and clean for tabular display)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Load users from API ──────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setStatus('loading');
      const res = await makeRequest('/admin/users/getAllUsers');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load users');
      setUsers(data.data || []);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Parse actual user's enrolled groups from API contributedGroups
  const getUserGroupsList = useCallback((contributedGroupsStr) => {
    if (!contributedGroupsStr || contributedGroupsStr === 'None') return [];
    return contributedGroupsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, []);

  const getRealGroupCount = useCallback((user) => {
    const list = getUserGroupsList(user?.contributedGroups);
    return list.length;
  }, [getUserGroupsList]);

  // Open user panel with their real enrolled groups
  const openUser = useCallback((user, mode = 'view') => {
    setSelectedUser(user);
    setViewMode(mode);
    setNotice(null);
    if (mode === 'edit' || mode === 'view') {
      setEditName(user.name || user.nickname || '');
      setEditPhone(user.phone || '');
      setEditRole(String(user.type || 'user').toLowerCase());
      setEditNickname(user.nickname || '');
      setEditYear(user.yearOfBirth || '');
    }
    if (mode === 'view') {
      loadUserGroups(user);
    }
  }, []);

  const loadUserGroups = async (user) => {
    setGroupsLoading(true);
    setUserGroups([]);
    try {
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        const allGroups = data.data || [];
        const enrolledNames = getUserGroupsList(user?.contributedGroups);
        
        // Match groups where user is a participant
        const matched = allGroups.filter(g => {
          const gName = (g.name || g.group_name || '').trim().toLowerCase();
          return enrolledNames.some(en => en.toLowerCase() === gName);
        });
        
        setUserGroups(matched);
      }
    } catch (err) {
      console.warn('Error loading user groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const closePanel = () => { setSelectedUser(null); setViewMode(null); setNotice(null); };

  // ── Save edit with Real API ──────────────────────────────
  const saveEdit = async () => {
    if (!editName.trim()) {
      setNotice({ text: 'Please enter a valid user name', success: false });
      return;
    }
    setEditLoading(true);
    setNotice(null);
    try {
      const res = await makeRequest('/admin/users/updateUser', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          name: editName.trim(),
          phone: editPhone.trim(),
          type: editRole,
          nickname: editNickname.trim(),
          yearOfBirth: editYear.trim(),
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id
            ? { ...u, name: editName, phone: editPhone, type: editRole, nickname: editNickname, yearOfBirth: editYear }
            : u
        ));
        setSelectedUser(prev => ({ ...prev, name: editName, phone: editPhone, type: editRole, nickname: editNickname, yearOfBirth: editYear }));
        setNotice({ text: 'User details updated successfully!', success: true });
        setTimeout(() => { 
          setViewMode('view');
          if (selectedUser) loadUserGroups(selectedUser);
        }, 1000);
      } else {
        setNotice({ text: data?.message || 'Failed to update user', success: false });
      }
    } catch (err) {
      setNotice({ text: 'Network error: Failed to update user', success: false });
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete with Real API ─────────────────────────────────
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteUser = async () => {
    setDeleteLoading(true);
    setNotice(null);
    try {
      const res = await makeRequest('/admin/users/deleteUser', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        closePanel();
      } else {
        setNotice({ text: data?.message || 'Failed to delete user', success: false });
      }
    } catch (err) {
      setNotice({ text: 'Network error: Failed to delete user', success: false });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Block / Unblock Shortcut ─────────────────────────────
  const [blockLoading, setBlockLoading] = useState(false);
  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    const isCurrentlyBlocked = Number(selectedUser.isActive) === 0;
    
    if (isCurrentlyBlocked) {
      if (!window.confirm(`Unblock ${selectedUser.name || 'this user'}?`)) return;
      setBlockLoading(true);
      try {
        const res = await makeRequest('/admin/users/unblock', {
          method: 'POST',
          body: JSON.stringify({ userId: selectedUser.id }),
        });
        const data = await safeJson(res);
        if (res.ok && data?.success) {
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: 1, blockReason: null } : u));
          setSelectedUser(prev => ({ ...prev, isActive: 1, blockReason: null }));
          setNotice({ text: 'User unblocked successfully!', success: true });
        } else {
          setNotice({ text: data?.message || 'Failed to unblock user', success: false });
        }
      } catch (err) {
        setNotice({ text: 'Network error: Could not unblock', success: false });
      } finally {
        setBlockLoading(false);
      }
    } else {
      const reason = window.prompt(`Enter reason for blocking ${selectedUser.name || 'this user'}:`, 'Administrative block');
      if (!reason || !reason.trim()) return;
      setBlockLoading(true);
      try {
        const res = await makeRequest('/admin/users/block', {
          method: 'POST',
          body: JSON.stringify({ userId: selectedUser.id, reason: reason.trim() }),
        });
        const data = await safeJson(res);
        if (res.ok && data?.success) {
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: 0, blockReason: reason } : u));
          setSelectedUser(prev => ({ ...prev, isActive: 0, blockReason: reason }));
          setNotice({ text: 'User has been blocked.', success: true });
        } else {
          setNotice({ text: data?.message || 'Failed to block user', success: false });
        }
      } catch (err) {
        setNotice({ text: 'Network error: Could not block user', success: false });
      } finally {
        setBlockLoading(false);
      }
    }
  };

  // ── Reset Password Shortcut ──────────────────────────────
  const [resetLoading, setResetLoading] = useState(false);
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Reset password for ${selectedUser.name || 'this user'} to default (Year of Birth)?`)) return;
    setResetLoading(true);
    try {
      const res = await makeRequest('/admin/users/resetPassword', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        setNotice({ 
          text: `Password reset successfully! Default password: ${data.defaultPassword || selectedUser.yearOfBirth || 'YOB'}`, 
          success: true 
        });
      } else {
        setNotice({ text: data?.message || 'Failed to reset password', success: false });
      }
    } catch (err) {
      setNotice({ text: 'Network error: Could not reset password', success: false });
    } finally {
      setResetLoading(false);
    }
  };

  // ── Copy to Clipboard ───────────────────────────────────
  const [copyNotice, setCopyNotice] = useState('');
  const copyToClipboard = (text, label) => {
    if (!text || text === '--') return;
    navigator.clipboard?.writeText(String(text));
    setCopyNotice(label);
    setTimeout(() => setCopyNotice(''), 2200);
  };

  // ── Filtered lists ───────────────────────────────────────
  const counts = useMemo(() => ({
    all: users.length,
    admin: users.filter(u => String(u.type || '').toLowerCase() === 'admin').length,
    user: users.filter(u => String(u.type || '').toLowerCase() !== 'admin').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeFilter !== 'all') {
      if (activeFilter === 'admin') {
        list = list.filter(u => String(u.type || '').toLowerCase() === 'admin');
      } else {
        list = list.filter(u => String(u.type || '').toLowerCase() !== 'admin');
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(u => 
      String(u.name || u.nickname || '').toLowerCase().includes(q) || 
      String(u.phone || '').includes(q)
    );
  }, [users, searchQuery, activeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const initials = (u) => String(u?.name || u?.nickname || '?').charAt(0).toUpperCase();

  // Helper for stable mock group counts
  const getGroupCount = (userId) => (Number(userId || 0) % 3) + 1;

  return (
    <div className="rn-page">
      
      {/* ── Single-Line Header & Filters Toolbar ── */}
      <div className="reports-header-container">
        <div className="mu-unified-toolbar">
          {/* Search Box */}
          <div className="mu-unified-search">
            <RiSearchLine className="mu-unified-search-icon" size={16} />
            <input
              type="text"
              className="mu-unified-search-input"
              placeholder="Search by name, phone or username..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                className="reports-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                title="Clear search"
              >
                <RiCloseLine size={14} />
              </button>
            )}
          </div>

          {/* Single-line role filter pills with icons and counts */}
          <div className="mu-role-filters">
            <button
              className={`mu-role-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('all');
                setCurrentPage(1);
              }}
            >
              <RiGroupLine size={15} />
              <span>Total Members</span>
              <span className="mu-role-pill-count">{counts.all}</span>
            </button>
            <button
              className={`mu-role-pill-btn ${activeFilter === 'user' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('user');
                setCurrentPage(1);
              }}
            >
              <RiUserLine size={15} />
              <span>Regular Users</span>
              <span className="mu-role-pill-count">{counts.user}</span>
            </button>
            <button
              className={`mu-role-pill-btn ${activeFilter === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('admin');
                setCurrentPage(1);
              }}
            >
              <RiShieldUserLine size={15} />
              <span>Admins</span>
              <span className="mu-role-pill-count">{counts.admin}</span>
            </button>
          </div>
        </div>
      </div>

      {/* List / Table Section */}
      {status === 'loading' ? (
        <UserTableSkeleton />
      ) : status === 'error' ? (
        <div className="rn-empty">
          <RiAlertLine size={48} color="var(--danger)" style={{ marginBottom: 14 }} />
          <h3>Failed to Load</h3>
          <p>Could not fetch members from the server.</p>
          <button className="reports-refresh-btn" style={{ marginTop: 14, display: 'inline-flex', margin: '14px auto 0' }} onClick={loadUsers}>
            <RiRefreshLine size={15} /> Retry
          </button>
        </div>
      ) : currentUsers.length === 0 ? (
        <div className="rn-empty" style={{ minHeight: 'calc(100vh - 380px)' }}>
          <RiUserLine size={48} color="var(--subtle)" style={{ marginBottom: 12 }} />
          <h3>No members found</h3>
          <p>{searchQuery ? `No results match "${searchQuery}"` : 'No members registered yet.'}</p>
        </div>
      ) : (
        <>
          <div className="mu-table-container">
            <div className="mu-table-wrapper">
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Groups</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => {
                    const isAdmin = String(user.type || '').toLowerCase() === 'admin';
                    return (
                      <tr key={user.id} onClick={() => openUser(user, 'view')}>
                        <td>
                          <div className="mu-cell-member">
                            <div 
                              className="mu-cell-avatar" 
                              style={{ 
                                background: isAdmin ? 'var(--primary-light)' : 'var(--success-bg)', 
                                color: isAdmin ? 'var(--primary)' : 'var(--success)',
                                border: `1px solid ${isAdmin ? 'rgba(40, 66, 196, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
                              }}
                            >
                              {initials(user)}
                            </div>
                            <div className="mu-cell-name-info">
                              <span className="mu-cell-name">{user.name || 'Unnamed'}</span>
                              <span className="mu-cell-sub">{user.nickname ? `@${user.nickname}` : '--'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="mu-cell-phone">
                            <RiPhoneLine size={13} color="var(--muted)" />
                            {user.phone || '--'}
                          </span>
                        </td>
                        <td>
                          <span className={`mu-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                            {isAdmin ? <RiShieldUserLine size={10} /> : <RiUserLine size={10} />}
                            {isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                            {formatDate(user.created_at || new Date())}
                          </span>
                        </td>
                        <td>
                          <span className="mu-cell-groups">
                            <RiGroupLine size={13} color="var(--muted)" />
                            {getRealGroupCount(user)} {getRealGroupCount(user) === 1 ? 'Group' : 'Groups'}
                          </span>
                        </td>
                        <td className="mu-action-btn-cell">
                          <button className="mu-action-btn" title="View Profile">
                            <RiArrowRightSLine size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mu-pagination-row">
              <span className="mu-pag-text">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} members
              </span>
              <div className="mu-pag-controls">
                <button 
                  className="mu-pag-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`mu-pag-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="mu-pag-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detail Drawer Overlay ── */}
      {selectedUser && viewMode && (
        <div className="mu-panel-overlay" onClick={closePanel}>
          <div className="mu-panel" onClick={e => e.stopPropagation()}>
            
            {/* Panel Header */}
            <div className="mg2-panel-head">
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#030712' }}>
                  {selectedUser.name || selectedUser.nickname || 'Unnamed'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  {selectedUser.phone || '--'} · {String(selectedUser.type || 'User').toUpperCase()}
                </p>
              </div>
              <button className="rp-close" onClick={closePanel}>
                <RiCloseLine size={16} />
              </button>
            </div>

            {/* Panel Tabs */}
            <div className="mg2-panel-tabs">
              <button 
                className={`mg2-panel-tab ${viewMode === 'view' ? 'active' : ''}`} 
                onClick={() => setViewMode('view')}
              >
                <RiUserLine size={14} /> Profile
              </button>
              <button 
                className={`mg2-panel-tab ${viewMode === 'edit' ? 'active' : ''}`} 
                onClick={() => setViewMode('edit')}
              >
                <RiEditLine size={14} /> Edit
              </button>
              <button 
                className={`mg2-panel-tab ${viewMode === 'delete' ? 'active' : ''}`} 
                onClick={() => setViewMode('delete')}
              >
                <RiDeleteBinLine size={14} /> Delete
              </button>
            </div>

            {notice && (
              <div 
                style={{ 
                  background: notice.success ? '#d1fae5' : '#fee2e2', 
                  color: notice.success ? '#065f46' : '#991b1b', 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  fontSize: 13, 
                  fontWeight: 600, 
                  marginBottom: 16, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8 
                }}
              >
                {notice.success ? <RiCheckLine size={15} /> : <RiAlertLine size={15} />}
                {notice.text}
              </div>
            )}

            {/* Scrollable details */}
            <div className="mg2-details-container" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {viewMode === 'view' && (
                <>
                  {/* Copy Notification Toast */}
                  {copyNotice && (
                    <div className="mu-copy-toast">
                      <RiCheckLine size={14} /> Copied {copyNotice} to clipboard!
                    </div>
                  )}

                  {/* Profile Hero Card */}
                  <div className="mu-profile-hero">
                    <div 
                      className="mu-profile-avatar" 
                      style={{ 
                        background: String(selectedUser.type).toLowerCase() === 'admin' ? 'var(--primary-light)' : 'var(--success-bg)', 
                        color: String(selectedUser.type).toLowerCase() === 'admin' ? 'var(--primary)' : 'var(--success)',
                        border: `2px solid ${String(selectedUser.type).toLowerCase() === 'admin' ? 'rgba(40, 66, 196, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}
                    >
                      {initials(selectedUser)}
                    </div>
                    <h2 className="mu-profile-name">{selectedUser.name || selectedUser.nickname || 'Unnamed'}</h2>
                    
                    <div className="mu-hero-pills">
                      <span className={`mu-role-badge ${String(selectedUser.type || '').toLowerCase() === 'admin' ? 'admin' : 'user'}`}>
                        {String(selectedUser.type || '').toLowerCase() === 'admin' ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
                        {String(selectedUser.type || '').toLowerCase() === 'admin' ? 'Admin' : 'Regular User'}
                      </span>
                      
                      <span className={`mu-status-pill ${Number(selectedUser.isActive) === 0 ? 'blocked' : 'active'}`}>
                        {Number(selectedUser.isActive) === 0 ? <RiBanLine size={12} /> : <RiCheckLine size={12} />}
                        {Number(selectedUser.isActive) === 0 ? 'Blocked' : 'Active Account'}
                      </span>
                    </div>

                    {Number(selectedUser.isActive) === 0 && selectedUser.blockReason && (
                      <div className="mu-blocked-warning">
                        <ShieldAlert size={14} />
                        <span><strong>Reason:</strong> {selectedUser.blockReason}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Quick Management Shortcuts ── */}
                  <div className="mu-shortcuts-panel">
                    <div className="mu-shortcuts-title">
                      <span>QUICK SHORTCUTS</span>
                    </div>
                    
                    <div className="mu-shortcuts-grid">
                      {/* Edit Details */}
                      <button 
                        className="mu-shortcut-card"
                        onClick={() => setViewMode('edit')}
                        title="Edit profile information"
                      >
                        <div className="mu-shortcut-icon edit">
                          <RiEditLine size={16} />
                        </div>
                        <div className="mu-shortcut-info">
                          <span className="mu-shortcut-name">Edit Profile</span>
                          <span className="mu-shortcut-desc">Update name, phone, role</span>
                        </div>
                      </button>

                      {/* Reset Password */}
                      <button 
                        className="mu-shortcut-card"
                        onClick={handleResetPassword}
                        disabled={resetLoading}
                        title="Reset password to default year of birth"
                      >
                        <div className="mu-shortcut-icon key">
                          {resetLoading ? <RiLoader4Line size={16} className="spin-anim" /> : <RiKeyLine size={16} />}
                        </div>
                        <div className="mu-shortcut-info">
                          <span className="mu-shortcut-name">Reset Password</span>
                          <span className="mu-shortcut-desc">Reset to birth year</span>
                        </div>
                      </button>

                      {/* Block / Unblock Account */}
                      <button 
                        className={`mu-shortcut-card ${Number(selectedUser.isActive) === 0 ? 'unblock' : 'block'}`}
                        onClick={handleToggleBlock}
                        disabled={blockLoading}
                        title={Number(selectedUser.isActive) === 0 ? 'Unblock user' : 'Block user'}
                      >
                        <div className={`mu-shortcut-icon ${Number(selectedUser.isActive) === 0 ? 'success' : 'danger'}`}>
                          {blockLoading ? (
                            <RiLoader4Line size={16} className="spin-anim" />
                          ) : Number(selectedUser.isActive) === 0 ? (
                            <RiUserCheckLine size={16} />
                          ) : (
                            <RiBanLine size={16} />
                          )}
                        </div>
                        <div className="mu-shortcut-info">
                          <span className="mu-shortcut-name">
                            {Number(selectedUser.isActive) === 0 ? 'Unblock User' : 'Block User'}
                          </span>
                          <span className="mu-shortcut-desc">
                            {Number(selectedUser.isActive) === 0 ? 'Restore login access' : 'Restrict system access'}
                          </span>
                        </div>
                      </button>

                      {/* Message / Chat */}
                      <button 
                        className="mu-shortcut-card"
                        onClick={() => {
                          closePanel();
                          navigate('/admin/chat');
                        }}
                        title="Open admin chat to message user"
                      >
                        <div className="mu-shortcut-icon chat">
                          <RiMessageLine size={16} />
                        </div>
                        <div className="mu-shortcut-info">
                          <span className="mu-shortcut-name">Open Chat</span>
                          <span className="mu-shortcut-desc">Send message or notice</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ── User Information with Quick Copy ── */}
                  <div className="mu-details-section">
                    <div className="mu-shortcuts-title">
                      <span>MEMBER DETAILS</span>
                    </div>

                    <div className="mu-details-list">
                      <div className="rn-detail-row">
                        <span>Full Name</span>
                        <div className="mu-detail-value-wrapper">
                          <strong>{selectedUser.name || '--'}</strong>
                          {selectedUser.name && (
                            <button 
                              className="mu-copy-btn" 
                              onClick={() => copyToClipboard(selectedUser.name, 'Full Name')}
                              title="Copy name"
                            >
                              <RiCopyLine size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rn-detail-row">
                        <span>Phone Number</span>
                        <div className="mu-detail-value-wrapper">
                          <strong>{selectedUser.phone || '--'}</strong>
                          {selectedUser.phone && (
                            <button 
                              className="mu-copy-btn" 
                              onClick={() => copyToClipboard(selectedUser.phone, 'Phone number')}
                              title="Copy phone"
                            >
                              <RiCopyLine size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rn-detail-row">
                        <span>Nickname / Handle</span>
                        <div className="mu-detail-value-wrapper">
                          <strong>{selectedUser.nickname ? `@${selectedUser.nickname}` : '--'}</strong>
                          {selectedUser.nickname && (
                            <button 
                              className="mu-copy-btn" 
                              onClick={() => copyToClipboard(selectedUser.nickname, 'Nickname')}
                              title="Copy nickname"
                            >
                              <RiCopyLine size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rn-detail-row">
                        <span>Year of Birth</span>
                        <strong>{selectedUser.yearOfBirth || selectedUser.dateOfBirth || '--'}</strong>
                      </div>

                      <div className="rn-detail-row">
                        <span>User ID</span>
                        <div className="mu-detail-value-wrapper">
                          <strong>#U-{String(selectedUser.id).padStart(4, '0')}</strong>
                          <button 
                            className="mu-copy-btn" 
                            onClick={() => copyToClipboard(String(selectedUser.id), 'User ID')}
                            title="Copy User ID"
                          >
                            <RiCopyLine size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="rn-detail-row">
                        <span>Joined Date</span>
                        <strong>{formatDate(selectedUser.created_at || new Date())}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ── Enrolled Groups with direct shortcuts ── */}
                  <div className="mu-groups-section">
                    <div className="mu-groups-header">
                      <h4>
                        <RiGroupLine size={14} /> ENROLLED GROUPS ({getRealGroupCount(selectedUser)})
                      </h4>
                      {getRealGroupCount(selectedUser) > 0 && (
                        <button 
                          className="mu-groups-nav-link"
                          onClick={() => {
                            closePanel();
                            navigate('/admin/manage-groups');
                          }}
                        >
                          Manage Groups <RiExternalLinkLine size={12} />
                        </button>
                      )}
                    </div>
                    {groupsLoading ? (
                      <p style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiLoader4Line className="spin-anim" size={14} /> Loading groups...
                      </p>
                    ) : getRealGroupCount(selectedUser) === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13, margin: '8px 0' }}>Not enrolled in any chit groups yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {userGroups.length > 0 ? (
                          userGroups.map((g, idx) => (
                            <div key={g.id || idx} className="mu-group-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                    {g.name || g.group_name || 'Chit Plan'}
                                  </h5>
                                  <p className="mu-group-meta">
                                    ₹{Number(g.groupAmount || g.group_amount || 0).toLocaleString()} • {g.duration || g.totalMembers || 20} months
                                  </p>
                                </div>
                                <span 
                                  className={`mu-group-status ${String(g.status || '').toLowerCase().includes('comp') ? 'mu-status-pending' : 'mu-status-active'}`}
                                >
                                  {String(g.status || 'Active').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          getUserGroupsList(selectedUser.contributedGroups).map((gName, idx) => (
                            <div key={idx} className="mu-group-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                  {gName}
                                </h5>
                                <span className="mu-group-status mu-status-active">
                                  ACTIVE
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {viewMode === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Full Name</label>
                    <input 
                      className="mu-form-input" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      placeholder="Full name" 
                    />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Phone Number</label>
                    <input 
                      className="mu-form-input" 
                      value={editPhone} 
                      onChange={e => setEditPhone(e.target.value)} 
                      placeholder="10-digit phone" 
                    />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Nickname</label>
                    <input 
                      className="mu-form-input" 
                      value={editNickname} 
                      onChange={e => setEditNickname(e.target.value)} 
                      placeholder="Nickname" 
                    />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Year of Birth</label>
                    <input 
                      className="mu-form-input" 
                      value={editYear} 
                      onChange={e => setEditYear(e.target.value)} 
                      placeholder="e.g. 1990" 
                      maxLength={4} 
                    />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Role</label>
                    <select 
                      className="mu-form-select" 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <button 
                    className="mu-btn-edit" 
                    onClick={saveEdit} 
                    disabled={editLoading} 
                    style={{ marginTop: 12 }}
                  >
                    {editLoading ? (
                      <><RiLoader4Line size={16} className="spin-anim" /> Saving...</>
                    ) : (
                      <><RiCheckLine size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              )}

              {viewMode === 'delete' && (
                <div>
                  <div 
                    style={{ 
                      background: 'var(--danger-bg)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: 12, 
                      padding: 24, 
                      textAlign: 'center', 
                      marginBottom: 24 
                    }}
                  >
                    <div 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: 'var(--danger)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 16px' 
                      }}
                    >
                      <RiAlertLine size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: 'var(--danger)', fontSize: 18, fontWeight: 800 }}>
                      Delete User?
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>
                      This will permanently remove <strong>{selectedUser.name || selectedUser.nickname || 'this user'}</strong> from the system. This action cannot be undone.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      className="mu-btn-cancel" 
                      style={{ flex: 1 }} 
                      onClick={() => setViewMode('view')}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                    <button 
                      className="mu-btn-delete" 
                      style={{ flex: 1 }} 
                      onClick={deleteUser}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <><RiLoader4Line size={16} className="spin-anim" /> Deleting...</>
                      ) : (
                        <><RiDeleteBinLine size={16} /> Delete User</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;
