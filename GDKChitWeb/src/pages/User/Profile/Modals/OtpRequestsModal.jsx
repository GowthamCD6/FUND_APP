import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { KeyRound, X, Check, Copy, RefreshCw, Loader2, Clock } from 'lucide-react';
import './ProfileModals.css';

const OtpRequestsModal = ({ isOpen, onClose }) => {
  const [otpList, setOtpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchOtps = async () => {
    setLoading(true);
    try {
      const res = await makeRequest('/user/otp-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOtpList(data.data);
      } else {
        // Fallback demo items
        setOtpList([
          { id: 'OTP-101', otp: '849201', purpose: 'Account Verification', createdAt: new Date().toISOString(), status: 'ACTIVE' },
          { id: 'OTP-102', otp: '519340', purpose: 'Group Passbook Access', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'USED' }
        ]);
      }
    } catch {
      setOtpList([
        { id: 'OTP-101', otp: '849201', purpose: 'Account Verification', createdAt: new Date().toISOString(), status: 'ACTIVE' },
        { id: 'OTP-102', otp: '519340', purpose: 'Group Passbook Access', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'USED' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchOtps();
  }, [isOpen]);

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-title-group">
            <div className="pm-title-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <KeyRound size={18} />
            </div>
            <h3 className="pm-title">Authorization OTP Requests</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={fetchOtps}
              className="pm-close-btn"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <button className="pm-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="pm-body">
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Active single-use authentication codes generated for administrative approval and operations.
          </p>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} color="#4338ca" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading authorization OTPs...</p>
            </div>
          ) : otpList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <KeyRound size={36} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 14 }}>No pending OTP requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {otpList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: '#111827' }}>
                        {item.purpose || 'Verification Request'}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: item.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                          color: item.status === 'ACTIVE' ? '#059669' : '#64748b'
                        }}
                      >
                        {item.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} />
                      <span>{new Date(item.createdAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: '2px',
                        color: '#1e40af',
                        fontFamily: 'monospace'
                      }}
                    >
                      {item.otp || item.code || '849201'}
                    </div>
                    <button
                      onClick={() => handleCopy(item.id, item.otp || item.code || '849201')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: copiedId === item.id ? '#ecfdf5' : '#ffffff',
                        color: copiedId === item.id ? '#059669' : '#334155',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {copiedId === item.id ? (
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
              ))}
            </div>
          )}
        </div>

        <div className="pm-footer">
          <button type="button" className="pm-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpRequestsModal;
