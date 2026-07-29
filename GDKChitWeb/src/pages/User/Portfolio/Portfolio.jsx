import React, { useState, useEffect, useCallback } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  RefreshCw as RiRefreshLine, Users as RiGroupLine, Check as RiCheckLine, Clock as RiTimeLine, AlertTriangle as RiAlertLine,
  CircleDollarSign as RiMoneyDollarCircleLine, ChevronRight as RiArrowRightSLine, X as RiCloseLine, Loader2 as RiLoader4Line,
  ChevronRight as RiChevronRightLine,
} from 'lucide-react';
import './Portfolio.css';
import GroupDetailedInfo from './GroupDetailedInfo.jsx';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SC = {
  active: '#10B981',
  ongoing: '#10B981',
  completed: '#6B46C1',
  paid: '#10B981',
  pending: '#F59E0B',
  overdue: '#EF4444',
  'not started': '#6B7280',
};
const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';

const StatusIcon = ({ status, size = 11 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'paid' || s === 'completed' || s === 'active' || s === 'ongoing' ? RiCheckLine
    : s === 'overdue' ? RiAlertLine
      : RiTimeLine;
  return <Icon size={size} color={scOf(s)} style={{ verticalAlign: 'middle', marginRight: 4 }} />;
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

  const getColor = (status) => {
    return status === 'completed' ? '#10B981' : '#F59E0B';
  };

  if (loading) {
    return (
      <div className="rn-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="rn-empty">
          <RiLoader4Line size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, fontWeight: 600 }}>Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rn-page">
        <div className="rn-empty">
          <RiAlertLine size={48} color="#EF4444" />
          <h3 style={{ marginTop: 16 }}>Unable to Load Portfolio</h3>
          <p>{error}</p>
          <button className="reports-refresh-btn" style={{ marginTop: 14, display: 'inline-flex', margin: '14px auto 0' }} onClick={load}>
            <RiRefreshLine size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rn-page">
        <div className="rn-empty" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <RiGroupLine size={56} color="#d1d5db" />
          <h3 style={{ marginTop: 16 }}>No Portfolio Data</h3>
          <p>You haven't joined any chit groups yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rn-page">
      
      {/* Header Container */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row">
          
          <div className="reports-tabs-wrapper">
            <button
              className={`reports-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Groups ({activeGroups.length})
            </button>
            <button
              className={`reports-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedGroups.length})
            </button>
          </div>

          <div className="reports-filters-wrapper">
            <button
              className="reports-refresh-btn"
              onClick={load}
              disabled={loading}
              title="Refresh"
            >
              <RiRefreshLine
                size={16}
                className={loading ? 'spin-anim' : ''}
              />
              <span>Refresh</span>
            </button>
          </div>
          
        </div>
      </div>

      {/* Hero Stats Row */}
      <div className="pf-stats-row">
        <div className="pf-stat-card primary">
          <div className="pf-stat-icon total"><RiMoneyDollarCircleLine size={24} /></div>
          <div className="pf-stat-info">
            <h3>{formatCurrency(totalInvested)}</h3>
            <p>Total Amount Invested</p>
          </div>
        </div>
        <div className="pf-stat-card">
          <div className="pf-stat-icon group"><RiGroupLine size={24} /></div>
          <div className="pf-stat-info">
            <h3 style={{ color: 'var(--primary)' }}>{formatCurrency(selectedPaid)}</h3>
            <p>Paid in {selectedGroup ? selectedGroup.groupName : 'selected group'}</p>
          </div>
        </div>
      </div>

      {/* Group Chips Selector */}
      <div className="pf-selector">
        {groups.map(g => (
          <button 
            key={g.id} 
            className={`pf-chip ${selectedGroupId === g.id ? 'active' : ''}`}
            onClick={() => setSelectedGroupId(g.id)}
          >
            {g.groupName} ({formatCurrency(g.investmentAmount)})
          </button>
        ))}
      </div>

      {/* Group Cards Grid */}
      {currentGroups.length > 0 ? (
        <div className="rn-list" style={{ marginTop: 12 }}>
          {currentGroups.map(g => {
            const pct = getProgress(g);
            const color = getColor(g.paymentStatus);
            return (
              <div key={g.id} className="gc-card" onClick={() => setDetailGroup(g)}>
                <div className="gc-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="gc-name">{g.groupName}</h3>
                    <span className="gc-badge" style={{ background: color }}>
                      <StatusIcon status={g.paymentStatus || 'ACTIVE'} size={10} />
                      {(g.paymentStatus || 'ACTIVE').toUpperCase()}
                    </span>
                  </div>
                  <button className="gc-arrow-btn" title="View Details">
                    <RiChevronRightLine size={24} color="#9CA3AF" />
                  </button>
                </div>
                
                <div className="gc-content">
                  <div className="gc-info-row">
                    <div className="gc-info-item">
                      <RiGroupLine size={16} color="#64748b" />
                      <span className="gc-info-text">{g.totalMembers || '--'} Members</span>
                    </div>
                    <div className="gc-info-item" style={{ justifyContent: 'flex-end' }}>
                      <RiMoneyDollarCircleLine size={16} color="#64748b" />
                      <span className="gc-info-text">{formatCurrency(g.monthlyContribution)}/mo</span>
                    </div>
                  </div>

                  <div className="gc-progress-wrap">
                    <div className="gc-progress-hd">
                      <span className="gc-progress-txt">{g.currentMonth || 0}/{g.totalMonths || 20} Cycles</span>
                      <span className="gc-progress-pct" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="gc-bar">
                      <div className="gc-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>

                  <div className="gc-footer" style={{ marginBottom: 12 }}>
                    <span className="gc-date">Total: {formatCurrency(g.investmentAmount)}</span>
                    <span className="gc-date" style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 800 }}>Paid: {formatCurrency(g.totalPaid || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rn-empty">
          <RiGroupLine size={48} color="var(--subtle)" style={{ marginBottom: 16 }} />
          <h3>No Groups Found</h3>
          <p>{activeTab === 'active' ? 'You have no active chit groups.' : 'You have no completed chit groups.'}</p>
        </div>
      )}

      {/* Detailed Info Panel Modal */}
      {detailGroup && (
        <GroupDetailedInfo 
          group={detailGroup} 
          onClose={() => setDetailGroup(null)} 
        />
      )}
    </div>
  );
};

export default Portfolio;
