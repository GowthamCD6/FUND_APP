import React, { useEffect, useMemo, useState } from 'react';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const Reports = () => {
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('active');

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

  const counts = useMemo(() => {
    const all = groups.length;
    const active = groups.filter((g) => String(g.status || '').toLowerCase().includes('active')).length;
    const completed = groups.filter((g) => String(g.status || '').toLowerCase().includes('completed')).length;
    return { all, active, completed };
  }, [groups]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return groups;
    if (activeTab === 'active') return groups.filter((g) => String(g.status || '').toLowerCase().includes('active'));
    if (activeTab === 'completed') return groups.filter((g) => String(g.status || '').toLowerCase().includes('completed'));
    return groups;
  }, [activeTab, groups]);

  return (
    <div className="rn-page">
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Reports</h2>
          <p className="rn-subtitle">Monitor group progress and collections</p>
        </div>
      </div>

      <div className="rn-tabs">
        <button className={`rn-tab ${activeTab === 'all' ? 'is-active' : ''}`} onClick={() => setActiveTab('all')}>
          All ({counts.all})
        </button>
        <button className={`rn-tab ${activeTab === 'active' ? 'is-active' : ''}`} onClick={() => setActiveTab('active')}>
          Active ({counts.active})
        </button>
        <button className={`rn-tab ${activeTab === 'completed' ? 'is-active' : ''}`} onClick={() => setActiveTab('completed')}>
          Completed ({counts.completed})
        </button>
      </div>

      {status === 'loading' ? (
        <div className="rn-card">Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="rn-empty">
          <h3>No reports yet</h3>
          <p>Groups will appear here once created.</p>
        </div>
      ) : (
        <div className="rn-list">
          {filtered.map((group) => (
            <div key={group.id} className="rn-group-card">
              <div className="rn-group-header">
                <div>
                  <h3>{group.name || group.group_name || 'Untitled group'}</h3>
                  <span className={`rn-status ${String(group.status || '').toLowerCase().includes('active') ? 'is-active' : 'is-complete'}`}>
                    {group.status || 'active'}
                  </span>
                </div>
              </div>
              <div className="rn-group-body">
                <div className="rn-group-row">
                  <span>Members</span>
                  <strong>{group.totalMembers || group.total_members || '--'}</strong>
                </div>
                <div className="rn-group-row">
                  <span>Group amount</span>
                  <strong>{formatCurrency(group.groupAmount || group.group_amount)}</strong>
                </div>
                <div className="rn-group-row">
                  <span>Start date</span>
                  <strong>{formatDate(group.startDate || group.start_date)}</strong>
                </div>
                <div className="rn-group-row">
                  <span>End date</span>
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

export default Reports;
