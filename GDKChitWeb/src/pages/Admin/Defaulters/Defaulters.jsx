import React, { useState, useEffect, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import Lottie from 'lottie-react';
import noFileAnimation from '../../../animation/no-file.json';
import {
  AlertTriangle as RiAlertLine,
  Search as RiSearchLine,
  RefreshCw as RiRefreshLine,
  Phone as RiPhoneLine,
  MessageCircle as RiMessageCircleLine,
  Clock as RiTimeLine,
  Check as RiCheckLine,
  ChevronRight as RiArrowRightSLine,
  X as RiCloseLine
} from 'lucide-react';
import './Defaulters.css';

const LottieComponent = Lottie.default || Lottie;

const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'nil';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const DefaultersSkeleton = () => (
  <div className="mu-table-container skeleton-pulse">
    <div className="mu-table-wrapper">
      <table className="mu-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Group & Month</th>
            <th>Status & Due</th>
            <th>Amount</th>
            <th style={{ width: 120 }}>Action</th>
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
                    <div style={{ width: 80, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                </div>
              </td>
              <td>
                <div style={{ width: 100, height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 60, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
              </td>
              <td>
                <div style={{ width: 60, height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 90, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
              </td>
              <td><div style={{ width: 70, height: 16, background: '#e2e8f0', borderRadius: 4 }} /></td>
              <td><div style={{ width: 90, height: 32, background: '#e2e8f0', borderRadius: 6 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Defaulters = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, overdue

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeRequest('/admin/collections/defaulters');
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setDefaulters(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch defaulters list');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const handleWhatsApp = (phone, name, amount, groupName, monthName) => {
    if (!phone) {
      alert("No phone number available for this user.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hello ${name}, this is a gentle reminder from GDK Chit Funds. Your payment of ₹${amount} for the month of ${monthName} in group "${groupName}" is currently pending. Please make the payment at your earliest convenience. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const filteredDefaulters = useMemo(() => {
    return defaulters.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        d.user_name?.toLowerCase().includes(q) || 
        d.group_name?.toLowerCase().includes(q) ||
        d.user_phone?.includes(q);
      
      const matchesStatus = activeTab === 'all' || d.status === activeTab;
      
      return matchesSearch && matchesStatus;
    });
  }, [defaulters, searchQuery, activeTab]);

  const counts = useMemo(() => ({
    all: defaulters.length,
    pending: defaulters.filter(d => d.status === 'pending').length,
    overdue: defaulters.filter(d => d.status === 'overdue').length,
  }), [defaulters]);

  const TABS = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'overdue', label: `Overdue (${counts.overdue})` },
  ];

  return (
    <div className="rn-page">
      {/* ── Page Header & Action Bar Container ── */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row">
          
          {/* Tab Bar */}
          <div className="reports-tabs-wrapper">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`reports-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(t.key);
                  setSearchQuery('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search, Action Buttons */}
          <div className="reports-filters-wrapper">
            {/* Search Bar */}
            <div className="reports-search-container">
              <RiSearchLine className="reports-search-icon" size={16} />
              <input
                type="text"
                className="reports-search-input"
                placeholder="Search by name, phone or group..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="reports-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <DefaultersSkeleton />
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, textAlign: 'center', padding: '40px 20px' }}>
          <RiAlertLine size={48} color="var(--danger)" style={{ marginBottom: 14 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#0B140E' }}>Failed to Load</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7A6E' }}>{error}</p>
        </div>
      ) : filteredDefaulters.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, textAlign: 'center', padding: '48px 20px' }}>
          <LottieComponent
            animationData={noFileAnimation}
            loop={true}
            style={{ width: 220, height: 220, marginBottom: 12 }}
          />
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0B140E' }}>
            All Caught Up!
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7A6E', fontWeight: 500, maxWidth: 360 }}>
            {searchQuery ? `No results match "${searchQuery}"` : 'There are no pending or overdue payments.'}
          </p>
        </div>
      ) : (
        <div className="mu-table-container" style={{ marginTop: 20 }}>
          <div className="mu-table-wrapper">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Group & Month</th>
                  <th>Status & Due</th>
                  <th>Amount</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDefaulters.map((item) => (
                  <tr key={item.id} className="def-row">
                    <td>
                      <div className="mu-cell-member">
                        <div 
                          className="mu-cell-avatar" 
                          style={{ 
                            background: 'var(--primary-light)', 
                            color: 'var(--primary)',
                            border: '1px solid rgba(40, 66, 196, 0.15)'
                          }}
                        >
                          {item.user_name ? item.user_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="mu-cell-name-info">
                          <span className="mu-cell-name">{item.user_name}</span>
                          <span className="mu-cell-sub">
                            <RiPhoneLine size={12} /> {item.user_phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="def-group-name">{item.group_name}</div>
                      <div className="def-month-lbl">{item.monthName}</div>
                    </td>
                    <td>
                      <span className={`def-badge ${item.status}`}>
                        {item.status === 'overdue' ? <RiAlertLine size={10} /> : <RiTimeLine size={10} />}
                        {item.status.toUpperCase()}
                      </span>
                      <div className="def-due-date">
                        {formatDate(item.due_date)}
                        {item.days_overdue > 0 && <span className="def-days-late"> ({item.days_overdue}d late)</span>}
                      </div>
                    </td>
                    <td>
                      <strong className="def-amount">{formatCurrency(item.amount)}</strong>
                    </td>
                    <td className="mu-action-btn-cell" style={{ textAlign: 'left' }}>
                      <button 
                        className="def-whatsapp-btn"
                        onClick={() => handleWhatsApp(item.user_phone, item.user_name, item.amount, item.group_name, item.monthName)}
                        title="Send WhatsApp Reminder"
                      >
                        <RiMessageCircleLine size={14} />
                        Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Defaulters;
