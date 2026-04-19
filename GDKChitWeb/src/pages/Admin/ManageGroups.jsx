import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const ManageGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('Active');

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
    const match = String(activeTab || '').toLowerCase();
    return groups.filter((group) => String(group.status || '').toLowerCase() === match);
  }, [groups, activeTab]);

  const tabCounts = useMemo(() => {
    const all = groups.length;
    const active = groups.filter((g) => String(g.status || '').toLowerCase() === 'active').length;
    const notStarted = groups.filter((g) => String(g.status || '').toLowerCase().includes('not')).length;
    return { all, active, notStarted };
  }, [groups]);

  return (
    <div className="rn-page">
      <div className="rn-header">
        <button className="rn-back" onClick={() => navigate('/admin/actions')}>←</button>
        <div>
          <h2 className="rn-title">Manage Groups</h2>
          <p className="rn-subtitle">View and manage groups</p>
        </div>
      </div>

      <div className="rn-tabs">
        <button className={`rn-tab ${activeTab === 'Active' ? 'is-active' : ''}`} onClick={() => setActiveTab('Active')}>
          Active ({tabCounts.active})
        </button>
        <button className={`rn-tab ${activeTab === 'Not Started' ? 'is-active' : ''}`} onClick={() => setActiveTab('Not Started')}>
          Not Started ({tabCounts.notStarted})
        </button>
      </div>

      {status === 'loading' ? (
        <div className="rn-card">Loading groups...</div>
      ) : filtered.length === 0 ? (
        <div className="rn-empty">
          <h3>No groups found</h3>
          <p>Create a group to get started.</p>
        </div>
      ) : (
        <div className="rn-list">
          {filtered.map((group) => (
            <div key={group.id} className="rn-group-card">
              <div className="rn-group-header">
                <div>
                  <h3>{group.name || group.group_name || 'Untitled group'}</h3>
                  <span className={`rn-status ${String(group.status || '').toLowerCase().includes('active') ? 'is-active' : 'is-pending'}`}>
                    {group.status || 'Not Started'}
                  </span>
                </div>
              </div>
              <div className="rn-group-body">
                <div className="rn-group-row">
                  <span>Members</span>
                  <strong>{group.totalMembers || group.total_members || '--'}</strong>
                </div>
                <div className="rn-group-row">
                  <span>Amount</span>
                  <strong>{formatCurrency(group.groupAmount || group.group_amount)}</strong>
                </div>
                <div className="rn-group-row">
                  <span>Start</span>
                  <strong>{formatDate(group.startDate || group.start_date)}</strong>
                </div>
                <div className="rn-group-row">
                  <span>End</span>
                  <strong>{formatDate(group.endDate || group.end_date)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageGroups;
