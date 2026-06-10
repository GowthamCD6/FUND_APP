import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  CircleDollarSign as RiMoneyDollarCircleLine, ChevronRight as RiArrowRightSLine, X as RiCloseLine, Loader2 as RiLoader4Line,
} from 'lucide-react';
import './Portfolio.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const scOf = (s) => {
  const m = { paid: '#10B981', completed: '#10B981', active: '#F59E0B', pending: '#F59E0B', overdue: '#EF4444' };
  return m[String(s).toLowerCase()] || '#6B7280';
};

const Portfolio = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailGroup, setDetailGroup] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await makeRequest('/user/portfolio');
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load');
      setGroups(data.data || []);
      if (data.data?.length > 0) setSelectedGroupId(data.data[0].id);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalInvested = groups.reduce((s, g) => s + (Number(g.totalPaid) || 0), 0);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedPaid = selectedGroup ? (Number(selectedGroup.totalPaid) || 0) : 0;

  const activeGroups = groups.filter(g => g.paymentStatus !== 'completed');
  const completedGroups = groups.filter(g => g.paymentStatus === 'completed');
  const currentGroups = activeTab === 'active' ? activeGroups : completedGroups;

  const getProgress = (g) => {
    const cur = Number(g.currentMonth) || 0;
    const total = Number(g.totalMonths) || 20;
    return Math.min(100, Math.round((cur / total) * 100));
  };

  if (loading) {
    return (
      <div className="pf-empty">
        <RiLoader4Line size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading your portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-empty">
        <RiAlertLine size={48} color="#EF4444" />
        <h3>Unable to Load Portfolio</h3>
        <p>{error}</p>
        <button className="pf-retry" onClick={load}><RiRefreshLine size={16} /> Try Again</button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="pf-empty">
        <RiGroupLine size={56} color="#d1d5db" />
        <h3>No Portfolio Data</h3>
        <p>You haven't joined any chit groups yet.</p>
      </div>
    );
  }

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div>
          <h2 className="pf-title">Portfolio</h2>
          <p className="pf-sub">Your investment overview</p>
        </div>
        <button className="pf-refresh" onClick={load}><RiRefreshLine size={18} /></button>
      </div>

      {/* Summary Cards */}
      <div className="pf-summary">
        <div className="pf-sum-card pf-sum-primary">
          <p className="pf-sum-label">Total Amount Invested</p>
          <h3 className="pf-sum-val">{formatCurrency(totalInvested)}</h3>
          <p className="pf-sum-info">{groups.length} groups joined</p>
        </div>
        <div className="pf-sum-card">
          <p className="pf-sum-label">{selectedGroup ? selectedGroup.groupName : 'Select a Group'}</p>
          <h3 className="pf-sum-val">{formatCurrency(selectedPaid)}</h3>
          <p className="pf-sum-info">Amount paid in this group</p>
        </div>
      </div>

      {/* Group Selector */}
      <div className="pf-selector">
        {groups.map(g => (
          <button key={g.id} className={`pf-chip ${selectedGroupId === g.id ? 'active' : ''}`}
            onClick={() => setSelectedGroupId(g.id)}>
            {g.groupName} ({formatCurrency(g.investmentAmount)})
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="pf-tabs">
        <button className={`pf-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}>
          Active Groups ({activeGroups.length})
        </button>
        <button className={`pf-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}>
          Completed ({completedGroups.length})
        </button>
      </div>

      {/* Group Cards */}
      <div className="pf-groups">
        {currentGroups.length > 0 ? currentGroups.map(g => {
          const pct = getProgress(g);
          const color = g.paymentStatus === 'completed' ? '#10B981' : '#F59E0B';
          return (
            <div key={g.id} className="pf-group-card" onClick={() => setDetailGroup(g)}>
              <div className="pf-gc-top">
                <div>
                  <h4 className="pf-gc-name">{g.groupName}</h4>
                  <p className="pf-gc-members"><RiGroupLine size={13} /> {g.totalMembers || '--'} Members</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="pf-gc-status" style={{ background: `${color}18`, color }}>{g.paymentStatus?.toUpperCase()}</span>
                  <p className="pf-gc-amount">{formatCurrency(g.monthlyContribution)}/mo</p>
                </div>
              </div>
              <div className="pf-gc-progress">
                <div className="pf-gc-progress-hd">
                  <span>{g.currentMonth || 0}/{g.totalMonths || 20} Cycles</span>
                  <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div className="pf-gc-bar"><div className="pf-gc-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
              </div>
              <div className="pf-gc-footer">
                <span>Total: {formatCurrency(g.investmentAmount)}</span>
                <span>Paid: {formatCurrency(g.totalPaid || 0)}</span>
              </div>
            </div>
          );
        }) : (
          <div className="pf-empty-sm">
            <RiGroupLine size={40} color="#d1d5db" />
            <p>{activeTab === 'active' ? 'No active groups found' : 'No completed groups found'}</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailGroup && (
        <div className="uh-modal-backdrop" onClick={() => setDetailGroup(null)}>
          <div className="uh-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{detailGroup.groupName}</h3>
              <button onClick={() => setDetailGroup(null)} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Investment', val: formatCurrency(detailGroup.investmentAmount) },
                { label: 'Monthly', val: formatCurrency(detailGroup.monthlyContribution) },
                { label: 'Total Paid', val: formatCurrency(detailGroup.totalPaid || 0) },
                { label: 'Status', val: detailGroup.paymentStatus?.toUpperCase() },
                { label: 'Cycles', val: `${detailGroup.currentMonth || 0}/${detailGroup.totalMonths || 20}` },
                { label: 'Members', val: detailGroup.totalMembers || '--' },
                { label: 'Start Date', val: formatDate(detailGroup.startDate) },
                { label: 'Next Due', val: formatDate(detailGroup.estimatedPayDate) },
              ].map((item, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
