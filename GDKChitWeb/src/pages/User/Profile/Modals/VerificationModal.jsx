import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertCircle, Upload, Check } from 'lucide-react';
import './ProfileModals.css';

const VerificationModal = ({ isOpen, onClose }) => {
  const [kycData, setKycData] = useState(() => {
    try {
      const saved = localStorage.getItem('user_kyc_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      docType: 'Aadhaar Card',
      idNumber: 'XXXX-XXXX-4812',
      panNumber: 'ABCDE1234F',
      status: 'Verified',
      verifiedDate: '12 Jan 2024'
    };
  });

  const [panInput, setPanInput] = useState(kycData.panNumber || '');
  const [aadhaarInput, setAadhaarInput] = useState(kycData.idNumber || '');
  const [toastMsg, setToastMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...kycData,
      idNumber: aadhaarInput,
      panNumber: panInput.toUpperCase(),
      status: 'Verified',
      verifiedDate: new Date().toLocaleDateString('en-GB')
    };
    setKycData(updated);
    localStorage.setItem('user_kyc_data', JSON.stringify(updated));
    setToastMsg('KYC identification details updated and authenticated!');
    setTimeout(() => {
      setToastMsg('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-title-group">
            <div className="pm-title-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
            <h3 className="pm-title">Identity Verification & KYC</h3>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="pm-body">
            {/* Status card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#065f46', fontWeight: 700, fontSize: 15 }}>
                  <CheckCircle2 size={18} />
                  <span>KYC Status: {kycData.status}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#047857', marginTop: 2 }}>
                  Verified on {kycData.verifiedDate} under Reserve Bank compliance
                </div>
              </div>
              <span
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase'
                }}
              >
                LEVEL 2 APPROVED
              </span>
            </div>

            {toastMsg && (
              <div className="pm-alert-success">
                <Check size={16} />
                <span>{toastMsg}</span>
              </div>
            )}

            <div className="pm-form-group">
              <label className="pm-label">Government Photo ID Type</label>
              <select
                className="pm-input"
                value={kycData.docType}
                onChange={(e) => setKycData({ ...kycData, docType: e.target.value })}
              >
                <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                <option value="Passport">Indian Passport</option>
                <option value="Voter ID">Voter Identity Card</option>
                <option value="Driving Licence">Driving Licence</option>
              </select>
            </div>

            <div className="pm-form-group">
              <label className="pm-label">Aadhaar / ID Card Number *</label>
              <input
                type="text"
                className="pm-input"
                placeholder="12-digit UIDAI number"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                required
              />
            </div>

            <div className="pm-form-group">
              <label className="pm-label">Income Tax Permanent Account Number (PAN) *</label>
              <input
                type="text"
                className="pm-input"
                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                maxLength={10}
                value={panInput}
                onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 'var(--radius)',
                border: '1px dashed #cbd5e1',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <Upload size={22} color="#64748b" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                Upload Updated ID Document (PDF / JPEG)
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                Max file size: 5MB • Bank-grade secure storage
              </div>
            </div>
          </div>

          <div className="pm-footer">
            <button type="button" className="pm-btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="pm-btn-primary">
              Update KYC Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationModal;
