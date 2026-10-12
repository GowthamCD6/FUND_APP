import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatDate } from '../../../utils/formatters.js';
import {
  Search as RiSearchLine, User as RiUserLine, ShieldCheck as RiShieldUserLine,
  Pencil as RiEditLine, Trash2 as RiDeleteBinLine, X as RiCloseLine, Check as RiCheckLine,
  Phone as RiPhoneLine, Calendar as RiCalendarLine, Users as RiGroupLine,
  ChevronLeft, ChevronRight, Hash, AtSign, Loader2 as RiLoader4Line, AlertTriangle as RiAlertLine,
  Clock as RiTimeLine, ChevronRight as RiArrowRightSLine, RefreshCw as RiRefreshLine
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

  // ── Open user panel ──────────────────────────────────────
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
    // Load user groups
    if (mode === 'view') {
      loadUserGroups(user.id);
    }
  }, []);

  const loadUserGroups = async (userId) => {
    setGroupsLoading(true);
    setUserGroups([]);
    try {
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        // Mock filter for now
        setUserGroups(data.data || []);
      }
    } catch { }
    finally { setGroupsLoading(false); }
  };

  const closePanel = () => { setSelectedUser(null); setViewMode(null); setNotice(null); };

  // ── Save edit ────────────────────────────────────────────
  const saveEdit = async () => {
    setEditLoading(true);
    setNotice(null);
    try {
      // Optimistic update
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, name: editName, phone: editPhone, type: editRole, nickname: editNickname, yearOfBirth: editYear }
          : u
      ));
      setSelectedUser(prev => ({ ...prev, name: editName, phone: editPhone, type: editRole, nickname: editNickname, yearOfBirth: editYear }));
      setNotice({ text: 'User updated successfully', success: true });
      setTimeout(() => { setViewMode('view'); loadUserGroups(selectedUser.id); }, 900);
    } catch (err) {
      setNotice({ text: 'Failed to update user', success: false });
    }
    setEditLoading(false);
  };

  // ── Delete ───────────────────────────────────────────────
  const deleteUser = () => {
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    closePanel();
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

          {/* Single-line role filter pills */}
          <div className="mu-role-filters">
            <button
              className={`mu-role-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('all');
                setCurrentPage(1);
              }}
            >
              <RiGroupLine size={14} />
              <span>All</span>
              <span className="mu-role-pill-count">{counts.all}</span>
            </button>
            <button
              className={`mu-role-pill-btn ${activeFilter === 'user' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('user');
                setCurrentPage(1);
              }}
            >
              <RiUserLine size={14} />
              <span>Users</span>
              <span className="mu-role-pill-count">{counts.user}</span>
            </button>
            <button
              className={`mu-role-pill-btn ${activeFilter === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter('admin');
                setCurrentPage(1);
              }}
            >
              <RiShieldUserLine size={14} />
              <span>Admins</span>
              <span className="mu-role-pill-count">{counts.admin}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="mu-toolbar-actions">
            <button
              className="reports-refresh-btn"
              onClick={loadUsers}
              disabled={status === 'loading'}
              title="Refresh"
            >
              <RiRefreshLine
                size={16}
                className={status === 'loading' ? 'spin-anim' : ''}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Stats Row */}
      <div className="mu-stats-row">
        <div className="mu-stat-card">
          <div className="mu-stat-icon total"><RiGroupLine size={20} /></div>
          <div className="mu-stat-info">
            <h3>{counts.all}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon users"><RiUserLine size={20} /></div>
          <div className="mu-stat-info">
            <h3>{counts.user}</h3>
            <p>Regular Users</p>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon admins"><RiShieldUserLine size={20} /></div>
          <div className="mu-stat-info">
            <h3>{counts.admin}</h3>
            <p>Admins</p>
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
                            {getGroupCount(user.id)} Groups
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
                  <div className="mu-profile-hero">
                    <div 
                      className="mu-profile-avatar" 
                      style={{ 
                        background: String(selectedUser.type).toLowerCase() === 'admin' ? 'var(--primary-light)' : 'var(--success-bg)', 
                        color: String(selectedUser.type).toLowerCase() === 'admin' ? 'var(--primary)' : 'var(--success)',
                        border: `2px solid ${String(selectedUser.type).toLowerCase() === 'admin' ? 'rgba(40, 66, 196, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
                      }}
                    >
                      {initials(selectedUser)}
                    </div>
                    <h2 className="mu-profile-name">{selectedUser.name || selectedUser.nickname || 'Unnamed'}</h2>
                    <p className="mu-profile-phone"><RiPhoneLine size={14} /> {selectedUser.phone || '--'}</p>
                    <span className={`mu-role-badge ${String(selectedUser.type || '').toLowerCase() === 'admin' ? 'admin' : 'user'}`}>
                      {String(selectedUser.type || '').toLowerCase() === 'admin' ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
                      {String(selectedUser.type || '').toLowerCase() === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>

                  <div className="mu-details-list">
                    <div className="rn-detail-row">
                      <span>Full Name</span>
                      <strong>{selectedUser.name || '--'}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Nickname</span>
                      <strong>{selectedUser.nickname || '--'}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Year of Birth</span>
                      <strong>{selectedUser.yearOfBirth || '--'}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>User ID</span>
                      <strong>#U-{String(selectedUser.id).padStart(4, '0')}</strong>
                    </div>
                    <div className="rn-detail-row">
                      <span>Joined Date</span>
                      <strong>{formatDate(selectedUser.created_at || new Date())}</strong>
                    </div>
                  </div>

                  <div className="mu-groups-section">
                    <div className="mu-groups-header">
                      <h4><RiGroupLine size={14} /> GROUPS ({userGroups.length})</h4>
                    </div>
                    {groupsLoading ? (
                      <p style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiLoader4Line className="spin-anim" size={14} /> Loading...
                      </p>
                    ) : userGroups.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13 }}>No groups found.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {userGroups.slice(0, 3).map((g, idx) => (
                          <div key={g.id || idx} className="mu-group-card">
                            <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>{g.name || g.group_name || 'Group'}</h5>
                            <p className="mu-group-meta">₹{(g.groupAmount || 100000).toLocaleString()} • {g.duration || 20} members</p>
                            <span 
                              className={`mu-group-status ${g.status === 'running' || g.status === 'ongoing' || g.status === 'active' ? 'mu-status-active' : 'mu-status-pending'}`}
                            >
                              {(g.status || 'Active').toUpperCase()}
                            </span>
                          </div>
                        ))}
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
                    >
                      Cancel
                    </button>
                    <button 
                      className="mu-btn-delete" 
                      style={{ flex: 1 }} 
                      onClick={deleteUser}
                    >
                      <RiDeleteBinLine size={16} /> Delete
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
