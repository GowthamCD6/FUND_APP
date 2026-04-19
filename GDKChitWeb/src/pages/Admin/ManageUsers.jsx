import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedRole, setEditedRole] = useState('user');
  const [editedNickname, setEditedNickname] = useState('');
  const [editedYear, setEditedYear] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setStatus('loading');
        const response = await makeRequest('/admin/users/getAllUsers');
        const data = await safeJson(response);
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load users');
        }
        setUsers(data.data || []);
        setStatus('ready');
      } catch (error) {
        setUsers([]);
        setStatus('error');
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const name = String(user.name || user.nickname || '').toLowerCase();
      const phone = String(user.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery]);

  const openMenu = (user) => {
    setSelectedUser(user);
    setShowMenu(true);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  const openEdit = () => {
    if (!selectedUser) return;
    setEditedName(selectedUser.name || selectedUser.nickname || '');
    setEditedPhone(selectedUser.phone || '');
    setEditedRole(String(selectedUser.type || 'user').toLowerCase());
    setEditedNickname(selectedUser.nickname || '');
    const year = selectedUser.dateOfBirth ? String(selectedUser.dateOfBirth).slice(0, 4) : '';
    setEditedYear(year);
    setShowEdit(true);
  };

  const confirmEdit = () => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: editedName,
              phone: editedPhone,
              type: editedRole,
              nickname: editedNickname,
              dateOfBirth: editedYear ? `${editedYear}-01-01` : user.dateOfBirth,
            }
          : user
      )
    );
    setShowEdit(false);
  };

  const confirmDelete = () => {
    setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
    setShowDelete(false);
  };

  return (
    <div className="rn-page">
      <div className="rn-header">
        <button className="rn-back" onClick={() => navigate('/admin/actions')}>←</button>
        <div>
          <h2 className="rn-title">Manage Users</h2>
          <p className="rn-subtitle">View and manage users</p>
        </div>
      </div>

      <div className="rn-search">
        <input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {status === 'loading' ? (
        <div className="rn-card">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="rn-empty">
          <h3>No users found</h3>
          <p>Try a different search.</p>
        </div>
      ) : (
        <div className="rn-list">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rn-user-card">
              <div className="rn-user-info">
                <div className={`rn-user-avatar ${String(user.type || '').toLowerCase() === 'admin' ? 'is-admin' : ''}`}>
                  {String(user.type || '').toLowerCase() === 'admin' ? 'A' : 'U'}
                </div>
                <div>
                  <p className="rn-user-name">{user.name || user.nickname || 'Unnamed'}</p>
                  <p className="rn-user-phone">{user.phone || '--'}</p>
                </div>
              </div>
              <button className="rn-menu-button" onClick={() => openMenu(user)}>⋮</button>
            </div>
          ))}
        </div>
      )}

      {showMenu ? (
        <div className="rn-modal-backdrop" onClick={closeMenu}>
          <div className="rn-modal" onClick={(event) => event.stopPropagation()}>
            <button className="rn-menu-action" onClick={() => { setShowView(true); closeMenu(); }}>View Details</button>
            <button className="rn-menu-action" onClick={() => { closeMenu(); openEdit(); }}>Edit User</button>
            <button className="rn-menu-action is-danger" onClick={() => { closeMenu(); setShowDelete(true); }}>Delete User</button>
          </div>
        </div>
      ) : null}

      {showView ? (
        <div className="rn-modal-backdrop" onClick={() => setShowView(false)}>
          <div className="rn-modal rn-modal-wide" onClick={(event) => event.stopPropagation()}>
            <h3>User Details</h3>
            <div className="rn-detail-row"><span>Name</span><strong>{selectedUser?.name || selectedUser?.nickname || 'N/A'}</strong></div>
            <div className="rn-detail-row"><span>Phone</span><strong>{selectedUser?.phone || 'N/A'}</strong></div>
            <div className="rn-detail-row"><span>Role</span><strong>{selectedUser?.type || 'user'}</strong></div>
            <button className="rn-primary" onClick={() => setShowView(false)}>Close</button>
          </div>
        </div>
      ) : null}

      {showEdit ? (
        <div className="rn-modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="rn-modal rn-modal-wide" onClick={(event) => event.stopPropagation()}>
            <h3>Edit User</h3>
            <label className="rn-input-group">
              Full Name
              <input value={editedName} onChange={(event) => setEditedName(event.target.value)} />
            </label>
            <label className="rn-input-group">
              Phone Number
              <input value={editedPhone} onChange={(event) => setEditedPhone(event.target.value)} />
            </label>
            <label className="rn-input-group">
              Nickname
              <input value={editedNickname} onChange={(event) => setEditedNickname(event.target.value)} />
            </label>
            <label className="rn-input-group">
              Birth Year
              <input value={editedYear} onChange={(event) => setEditedYear(event.target.value)} />
            </label>
            <label className="rn-input-group">
              Role
              <select value={editedRole} onChange={(event) => setEditedRole(event.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="rn-primary" onClick={confirmEdit}>Update User</button>
          </div>
        </div>
      ) : null}

      {showDelete ? (
        <div className="rn-modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="rn-modal rn-modal-wide" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete {selectedUser?.name || selectedUser?.nickname || 'this user'}?</p>
            <div className="rn-form-row">
              <button className="rn-primary" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="rn-primary rn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageUsers;
