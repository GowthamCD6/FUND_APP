import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  KeyRound, ArrowLeft, RefreshCw, Copy, Check, Clock, Phone,
  ShieldCheck, Inbox, Search, Filter, AlertCircle, CheckCircle2,
  Calendar
} from 'lucide-react';
import './OtpRequestsPage.css';

const OtpRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | active | expired
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchOtpRequests();
  }, []);

  const fetchOtpRequests = async () => {
    setLoading(true);
    try {
      const res = await makeRequest('/user/otp-requests');
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch OTP requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (req) => {
    navigator.clipboard.writeText(req.otp || req.code || '');
    setCopiedId(req.id || req.phone);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredRequests = requests.filter(req => {
    const q = search.toLowerCase();
    const matchesSearch = (
      (req.phone || '').includes(q) ||
      (req.name || req.username || '').toLowerCase().includes(q) ||
      (req.purpose || req.type || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;

    const isExpired = req.isExpired || (req.expiresAt && new Date(req.expiresAt) < new Date());
    if (filterType === 'active') return !isExpired;
    if (filterType === 'expired') return isExpired;
    return true;
  });

  return (
    <div className="orp-page">
      {/* ── HEADER ── */}
      <div className="orp-header">
        <div className="orp-header-left">
          <button
            type="button"
            className="orp-back-btn"
            onClick={() => navigate('/admin/admintool')}
            title="Back to Admin Tools"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="orp-title">Subscriber Authorization OTP Stream</h1>
            <p className="orp-subtitle">Live audit log for 2FA one-time passwords, login tokens, and withdrawal verification codes</p>
          </div>
        </div>

        <button
          type="button"
          className="orp-refresh-btn"
          onClick={fetchOtpRequests}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          <span>Refresh Codes</span>
        </button>
      </div>

      {/* ── ACTION / FILTER BAR ── */}
      <div className="orp-toolbar">
        <div className="orp-search-wrap">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search phone number, subscriber name, or purpose..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="orp-search-input"
          />
        </div>

        <div className="orp-tabs">
          {[
            { key: 'all', label: `All Requests (${requests.length})` },
            { key: 'active', label: 'Active Codes' },
            { key: 'expired', label: 'Expired / Verified' }
          ].map(t => (
            <button
              key={t.key}
              type="button"
              className={`orp-tab-btn ${filterType === t.key ? 'active' : ''}`}
              onClick={() => setFilterType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST CONTAINER ── */}
      <div className="orp-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={32} color="#4f46e5" className="spin-anim" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Syncing live verification requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <Inbox size={44} style={{ margin: '0 auto 14px', strokeWidth: 1.5 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#1e293b' }}>No OTP verification requests detected</h3>
            <p style={{ margin: 0, fontSize: 13 }}>New subscriber verification attempts and withdrawal requests will appear here automatically.</p>
          </div>
        ) : (
          <div className="orp-list">
            {filteredRequests.map((req, idx) => {
              const code = req.otp || req.code || '------';
              const phone = req.phone || req.phoneNumber || 'Unknown';
              const name = req.name || req.userName || 'Subscriber';
              const time = req.createdAt || req.requestedAt || new Date().toISOString();
              const isExpired = req.isExpired || (req.expiresAt && new Date(req.expiresAt) < new Date());
              const isCopied = copiedId === (req.id || req.phone);

              return (
                <div key={req.id || idx} className={`orp-item ${isExpired ? 'expired' : ''}`}>
                  <div className="orp-item-left">
                    <div className="orp-icon-box">
                      <Phone size={18} />
                    </div>

                    <div className="orp-item-info">
                      <div className="orp-item-topline">
                        <strong className="orp-phone">{phone}</strong>
                        <span className="orp-name">({name})</span>
                        <span className={`orp-badge ${isExpired ? 'expired' : 'valid'}`}>
                          {isExpired ? 'Expired / Used' : 'Active (Valid)'}
                        </span>
                      </div>

                      <div className="orp-item-meta">
                        <span><Calendar size={12} /> {new Date(time).toLocaleDateString()}</span>
                        <span><Clock size={12} /> {new Date(time).toLocaleTimeString()}</span>
                        <span>Purpose: <strong>{req.purpose || req.type || 'Account Login'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="orp-item-right">
                    <div className="orp-code-display">
                      <span className="orp-code-label">OTP PIN</span>
                      <strong className="orp-code-text">{code}</strong>
                    </div>

                    <button
                      type="button"
                      className={`orp-copy-btn ${isCopied ? 'copied' : ''}`}
                      onClick={() => handleCopy(req)}
                      title="Copy OTP to Clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpRequestsPage;
