import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from './shared/SectionHeader.jsx';
import EmptyState from './shared/EmptyState.jsx';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { toTitleCase } from '../../utils/formatters.js';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const name = String(user.name || user.nickname || '').toLowerCase();
      const phone = String(user.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [users, search]);

  return (
    <div className="page">
      <SectionHeader
        title="Users"
        subtitle="Manage admins and members"
        action={
          <input
            className="ghost-input"
            placeholder="Search name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        }
      />

      {status === 'loading' ? (
        <div className="panel">Loading users...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" subtitle="Add users from Quick Actions." />
      ) : (
        <div className="panel">
          <div className="table">
            <div className="table-row table-head">
              <span>Name</span>
              <span>Role</span>
              <span>Phone</span>
              <span>Email</span>
              <span>Joined</span>
            </div>
            {filtered.map((user) => (
              <div key={user.id} className="table-row">
                <div>
                  <strong>{user.name || user.nickname || 'Unnamed'}</strong>
                  <p className="muted">ID {user.id}</p>
                </div>
                <span className="pill pill-soft">{toTitleCase(user.type || 'user')}</span>
                <span>{user.phone || '--'}</span>
                <span>{user.email || '--'}</span>
                <span>{user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-IN') : '--'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
