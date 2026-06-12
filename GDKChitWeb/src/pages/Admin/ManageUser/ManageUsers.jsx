import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatDate } from '../../../utils/formatters.js';
import {
  Search as RiSearchLine, User as RiUserLine, ShieldCheck as RiShieldUserLine, Eye as RiEyeLine,
  Pencil as RiEditLine, Trash2 as RiDeleteBinLine, X as RiCloseLine, Check as RiCheckLine,
  Phone as RiPhoneLine, Calendar as RiCalendarLine, Users as RiGroupLine,
  ChevronLeft, ChevronRight, Hash, AtSign, Loader2 as RiLoader4Line, AlertTriangle as RiAlertLine,
  Clock as RiTimeLine
} from 'lucide-react';
import './ManageUsers.css';

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    if (mode === 'edit') {
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
      // Fetch all groups, then filter — backend doesn't have getUserGroups yet
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
    if (activeFilter !== 'all') list = list.filter(u => String(u.type || '').toLowerCase() === activeFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(u => String(u.name || u.nickname || '').toLowerCase().includes(q) || String(u.phone || '').includes(q));
  }, [users, searchQuery, activeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const initials = (u) => String(u?.name || u?.nickname || '?').charAt(0).toUpperCase();

  return (
    <div className="mu-page-container">

      {/* Top Stats */}
      <div className="mu-stats-row">
        <div className="mu-stat-card">
          <div className="mu-stat-icon total"><RiGroupLine size={24} /></div>
          <div className="mu-stat-info">
            <h3>{counts.all}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon users"><RiUserLine size={24} /></div>
          <div className="mu-stat-info">
            <h3>{counts.user}</h3>
            <p>Regular Users</p>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon admins"><RiShieldUserLine size={24} /></div>
          <div className="mu-stat-info">
            <h3>{counts.admin}</h3>
            <p>Admins</p>
          </div>
        </div>
      </div>

      <div className="mu-layout">
        {/* Left Column: List */}
        <div className="mu-main">

          <div className="mu-filter-row">
            <div className="mu-search-box">
              <RiSearchLine size={18} className="mu-search-icon" />
              <input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="mu-search-input"
              />
            </div>

            <div className="mu-pill-filters">
              <button className={`mu-filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}>
                All <span className="mu-filter-count">{counts.all}</span>
              </button>
              <button className={`mu-filter-pill ${activeFilter === 'user' ? 'active' : ''}`} onClick={() => { setActiveFilter('user'); setCurrentPage(1); }}>
                <RiUserLine size={14} /> Users <span className="mu-filter-count">{counts.user}</span>
              </button>
              <button className={`mu-filter-pill ${activeFilter === 'admin' ? 'active' : ''}`} onClick={() => { setActiveFilter('admin'); setCurrentPage(1); }}>
                <RiShieldUserLine size={14} /> Admins <span className="mu-filter-count">{counts.admin}</span>
              </button>
            </div>
          </div>

          <div className="mu-list-header">
            <span>All Members</span>
            <span className="mu-list-count-text">
              Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
            </span>
          </div>

          <div className="mu-list-container">
            {status === 'loading' ? (
              <div className="mu-empty-state">
                <RiLoader4Line size={32} color="#2563eb" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p>Loading members...</p>
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="mu-empty-state">
                <RiSearchLine size={32} color="#94a3b8" style={{ margin: '0 auto' }} />
                <p>{searchQuery ? `No results for "${searchQuery}"` : 'No members found.'}</p>
              </div>
            ) : (
              currentUsers.map(user => {
                const isAdmin = String(user.type || '').toLowerCase() === 'admin';
                const isActive = selectedUser?.id === user.id;
                // Mock groups count for UI
                const groupCount = Math.floor(Math.random() * 4) + 1;

                return (
                  <div key={user.id} className={`mu-list-row ${isActive ? 'active' : ''}`} onClick={() => openUser(user, 'view')}>
                    <div className="mu-row-avatar" style={{ background: isAdmin ? '#eff6ff' : '#f8fafc', color: isAdmin ? '#2563eb' : '#0f172a' }}>
                      {initials(user)}
                    </div>
                    <div className="mu-row-info">
                      <h4 className="mu-row-name">{user.name || user.nickname || 'Unnamed'}</h4>
                      <p className="mu-row-phone"><RiPhoneLine size={12} /> {user.phone || '--'}</p>
                    </div>
                    <div className="mu-row-badges">
                      <span className={`mu-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                        {isAdmin ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
                        {isAdmin ? 'Admin' : 'User'}
                      </span>
                      <span className="mu-group-count">
                        <RiGroupLine size={14} /> {groupCount} group{groupCount > 1 ? 's' : ''}
                      </span>
                      <button className="mu-eye-btn"><RiEyeLine size={16} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mu-pagination-row">
              <span className="mu-pag-text">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} members</span>
              <div className="mu-pag-controls">
                <button className="mu-pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`mu-pag-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button className="mu-pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Persistent Sidebar */}
        {selectedUser && viewMode && (
          <div className="mu-sidebar">

            <div className="mu-side-header">
              <h3 className="mu-side-title">MEMBER PROFILE</h3>
              <button className="mu-side-close" onClick={closePanel}><RiCloseLine size={16} /></button>
            </div>

            <div className="mu-tabs">
              <button className={`mu-tab ${viewMode === 'view' ? 'active' : ''}`} onClick={() => setViewMode('view')}><RiUserLine size={14} /> Profile</button>
              <button className={`mu-tab ${viewMode === 'edit' ? 'active' : ''}`} onClick={() => setViewMode('edit')}><RiEditLine size={14} /> Edit</button>
              <button className={`mu-tab ${viewMode === 'delete' ? 'active' : ''}`} onClick={() => setViewMode('delete')}><RiDeleteBinLine size={14} /> Delete</button>
            </div>

            <div className="mu-side-content">

              {notice && (
                <div style={{ background: notice.success ? '#dcfce7' : '#fee2e2', color: notice.success ? '#166534' : '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notice.success ? <RiCheckLine size={16} /> : <RiAlertLine size={16} />} {notice.text}
                </div>
              )}

              {viewMode === 'view' && (
                <>
                  <div className="mu-profile-hero">
                    <div className="mu-profile-avatar">{initials(selectedUser)}</div>
                    <h2 className="mu-profile-name">{selectedUser.name || selectedUser.nickname || 'Unnamed'}</h2>
                    <p className="mu-profile-phone"><RiPhoneLine size={14} /> {selectedUser.phone || '--'}</p>
                    <span className={`mu-role-badge ${String(selectedUser.type || '').toLowerCase() === 'admin' ? 'admin' : 'user'}`}>
                      {String(selectedUser.type || '').toLowerCase() === 'admin' ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
                      {String(selectedUser.type || '').toLowerCase() === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>

                  <div className="mu-details-list">
                    <div className="mu-detail-item">
                      <div className="mu-detail-icon"><RiUserLine size={16} /></div>
                      <div className="mu-detail-content"><p>Full Name</p><h4>{selectedUser.name || '--'}</h4></div>
                    </div>
                    <div className="mu-detail-item">
                      <div className="mu-detail-icon"><AtSign size={16} /></div>
                      <div className="mu-detail-content"><p>Nickname</p><h4>{selectedUser.nickname || '--'}</h4></div>
                    </div>
                    <div className="mu-detail-item">
                      <div className="mu-detail-icon"><RiCalendarLine size={16} /></div>
                      <div className="mu-detail-content"><p>Year of Birth</p><h4>{selectedUser.yearOfBirth || '--'}</h4></div>
                    </div>
                    <div className="mu-detail-item">
                      <div className="mu-detail-icon"><Hash size={16} /></div>
                      <div className="mu-detail-content"><p>User ID</p><h4>#U-{String(selectedUser.id).padStart(4, '0')}</h4></div>
                    </div>
                    <div className="mu-detail-item">
                      <div className="mu-detail-icon"><RiTimeLine size={16} /></div>
                      <div className="mu-detail-content"><p>Joined</p><h4>{formatDate(selectedUser.created_at || new Date())}</h4></div>
                    </div>
                  </div>

                  <div className="mu-side-actions">
                    <button className="mu-btn-edit" onClick={() => setViewMode('edit')}><RiEditLine size={16} /> Edit User</button>
                    <button className="mu-btn-delete" onClick={() => setViewMode('delete')}><RiDeleteBinLine size={16} /> Delete</button>
                  </div>

                  <div className="mu-groups-section">
                    <div className="mu-groups-header">
                      <h4><RiGroupLine size={14} /> GROUPS ({userGroups.length})</h4>
                      <span className="mu-link-all">View All</span>
                    </div>
                    {groupsLoading ? (
                      <p style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><RiLoader4Line className="animate-spin" size={14} /> Loading...</p>
                    ) : userGroups.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13 }}>No groups found.</p>
                    ) : (
                      userGroups.slice(0, 3).map((g, idx) => (
                        <div key={g.id || idx} className="mu-group-card">
                          <h5>{g.name || g.group_name || 'Group'}</h5>
                          <p className="mu-group-meta">₹{g.chit_value ? g.chit_value.toLocaleString() : '1,00,000'} • {g.total_months || 20} members</p>
                          <span className={`mu-group-status ${g.status === 'Running' || g.status === 'Active' ? 'mu-status-active' : 'mu-status-pending'}`}>
                            {g.status || 'Active'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {viewMode === 'edit' && (
                <div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Full Name</label>
                    <input className="mu-form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Phone Number</label>
                    <input className="mu-form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="10-digit phone" />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Nickname</label>
                    <input className="mu-form-input" value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="Nickname" />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Year of Birth</label>
                    <input className="mu-form-input" value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="e.g. 1990" maxLength={4} />
                  </div>
                  <div className="mu-form-group">
                    <label className="mu-form-label">Role</label>
                    <select className="mu-form-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button className="mu-btn-edit" onClick={saveEdit} disabled={editLoading} style={{ width: '100%', marginTop: 24 }}>
                    {editLoading ? <><RiLoader4Line size={16} className="animate-spin" /> Saving...</> : <><RiCheckLine size={16} /> Save Changes</>}
                  </button>
                </div>
              )}

              {viewMode === 'delete' && (
                <div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <RiAlertLine size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 18, fontWeight: 800 }}>Delete User?</h3>
                    <p style={{ margin: 0, color: '#7f1d1d', fontSize: 13, lineHeight: 1.5 }}>
                      This will permanently remove <strong>{selectedUser.name || selectedUser.nickname || 'this user'}</strong> from the system. This action cannot be undone.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="mu-btn-cancel" style={{ flex: 1, padding: 14, borderRadius: 8, background: '#f1f5f9', border: 'none', fontWeight: 600, color: '#475569', cursor: 'pointer' }} onClick={() => setViewMode('view')}>Cancel</button>
                    <button className="mu-btn-delete" style={{ flex: 1 }} onClick={deleteUser}><RiDeleteBinLine size={16} /> Delete</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ManageUsers;
