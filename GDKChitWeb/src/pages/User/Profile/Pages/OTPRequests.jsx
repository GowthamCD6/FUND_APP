import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest } from '../../../../api/apiClient.js';
import {
  ShieldCheck, ArrowLeft, KeyRound, Copy, Check, Clock,
  AlertCircle, RefreshCw, Loader2, CheckCircle2
} from 'lucide-react';
import './ProfilePages.css';

const OTPRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest('/user/otp-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch OTP requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCopy = async (req) => {
    if (!req.otp_code) return;
    navigator.clipboard.writeText(req.otp_code);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Mark viewed if pending
    if (req.status === 'pending') {
      try {
        await makeRequest(`/user/otp-requests/${req.id}/viewed`, { method: 'POST' });
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, status: 'viewed' } : r))
        );
      } catch (e) {
        // silent
      }
    }
  };

  return (
    <div className="pp-container">
      <div className="pp-header">
        <button className="pp-back-btn" onClick={() => navigate('/user/profile')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="pp-title">Authorization OTP Requests</h2>
          <p className="pp-subtitle">
            Secure verification OTP codes issued for chit actions, auction payouts, and changes.
          </p>
        </div>
      </div>

      <div className="pp-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            Active & Recent OTPs
          </h3>
          <button
            onClick={fetchRequests}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>Checking for new OTP requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <KeyRound size={48} color="var(--subtle)" style={{ margin: '0 auto 14px' }} />
            <h4 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: 16 }}>No Pending OTP Requests</h4>
            <p style={{ margin: 0, fontSize: 13.5 }}>
              Whenever admin requires your authorization, verification OTPs will appear here instantly.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {req.group_name || `Group #${req.group_id}`}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          req.status === 'pending'
                            ? '#fef3c7'
                            : req.status === 'viewed'
                            ? '#dbeafe'
                            : '#ecfdf5',
                        color:
                          req.status === 'pending'
                            ? '#b45309'
                            : req.status === 'viewed'
                            ? '#1d4ed8'
                            : '#15803d',
                      }}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    Expires: {req.expires_at ? new Date(req.expires_at).toLocaleTimeString() : 'In 10 mins'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface)',
                      border: '1.5px dashed var(--primary)',
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: 4,
                      color: 'var(--primary)',
                    }}
                  >
                    {req.otp_code}
                  </div>

                  <button
                    onClick={() => handleCopy(req)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      background: copiedId === req.id ? '#10b981' : 'var(--primary)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {copiedId === req.id ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === req.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPRequests;
