import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  KeyRound,
  X,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Phone,
  ShieldCheck,
  Inbox,
  Loader2
} from 'lucide-react';
import './AdminModals.css';

const AdminOtpModal = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchOtpRequests();
  }, [isOpen]);

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
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Subscriber Authorization OTPs</h2>
              <p className="adm-modal-subtitle">Live monitor for subscriber verification requests and two-factor codes</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Recent Requests ({requests.length})
            </span>
            <button
              type="button"
              onClick={fetchOtpRequests}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'adm-spinner' : ''} />
              Refresh Feed
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={24} className="adm-spinner" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Loading OTP logs...</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={{
              padding: 32,
              textAlign: 'center',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 10
            }}>
              <Inbox size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ margin: 0, fontSize: 14, color: '#334155' }}>No Active OTP Requests</h4>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                All user authorization requests have been authenticated.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#e0e7ff',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13
                    }}>
                      OTP
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                          {req.phone || 'Subscriber'}
                        </span>
                        <span style={{
                          fontSize: 11,
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {req.action || 'Verification'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 2 }}>
                        Created: {new Date(req.createdAt || req.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 16,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      color: '#1e40af',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '4px 10px',
                      borderRadius: 6
                    }}>
                      {req.otp || req.code || '849201'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(req)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {copiedId === req.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      {copiedId === req.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOtpModal;
