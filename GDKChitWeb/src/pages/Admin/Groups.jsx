import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from './shared/SectionHeader.jsx';
import EmptyState from './shared/EmptyState.jsx';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency, formatDate, toTitleCase } from '../../utils/formatters.js';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setStatus('loading');
        const response = await makeRequest('/admin/groups/getGroups');
        const data = await safeJson(response);
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load groups');
        }
        setGroups(data.data || []);
        setStatus('ready');
      } catch (error) {
        setGroups([]);
        setStatus('error');
      }
    };

    loadGroups();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((group) => {
      const name = String(group.name || group.group_name || '').toLowerCase();
      const code = String(group.groupCode || group.group_code || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [groups, search]);

  return (
    <div className="page">
      <SectionHeader
        title="Groups"
        subtitle="Manage active and upcoming groups"
        action={
          <input
            className="ghost-input"
            placeholder="Search by name or code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        }
      />

      {status === 'loading' ? (
        <div className="panel">Loading groups...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No groups found" subtitle="Create a group from Quick Actions." />
      ) : (
        <div className="panel">
          <div className="table">
            <div className="table-row table-head">
              <span>Name</span>
              <span>Status</span>
              <span>Members</span>
              <span>Group amount</span>
              <span>Start date</span>
              <span>End date</span>
            </div>
            {filtered.map((group) => (
              <div key={group.id} className="table-row">
                <div>
                  <strong>{group.name || group.group_name || 'Untitled'}</strong>
                  <p className="muted">{group.groupCode || group.group_code || '---'}</p>
                </div>
                <span className="pill pill-soft">{toTitleCase(group.status || 'active')}</span>
                <span>{group.totalMembers || group.total_members || '--'}</span>
                <span>{formatCurrency(group.groupAmount || group.group_amount)}</span>
                <span>{formatDate(group.startDate || group.start_date)}</span>
                <span>{formatDate(group.endDate || group.end_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
