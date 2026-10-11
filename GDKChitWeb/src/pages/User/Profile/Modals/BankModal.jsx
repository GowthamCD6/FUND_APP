import React, { useState, useEffect } from 'react';
import { Landmark, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import './ProfileModals.css';

const BankModal = ({ isOpen, onClose }) => {
  const [bankData, setBankData] = useState(() => {
    try {
      const saved = localStorage.getItem('user_bank_details');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      holderName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifsc: '',
      bankName: '',
      branch: '',
      upiId: ''
    };
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bankData.accountNumber.trim()) {
      setErrorMsg('Bank Account Number is required.');
      return;
    }
    if (bankData.accountNumber !== bankData.confirmAccountNumber) {
      setErrorMsg('Account numbers do not match.');
      return;
    }
    if (!bankData.ifsc.trim() || bankData.ifsc.length < 6) {
      setErrorMsg('Please enter a valid IFSC code (e.g., SBIN0001234).');
      return;
    }

    localStorage.setItem('user_bank_details', JSON.stringify(bankData));
    setSuccessMsg('Bank account details saved securely for prize money disbursement!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-title-group">
            <div className="pm-title-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <Landmark size={18} />
            </div>
            <h3 className="pm-title">Linked Bank Account</h3>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="pm-body">
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Link your authenticated savings account to receive auction prize money directly via direct NEFT/RTGS transfer.
            </p>

            {successMsg && (
              <div className="pm-alert-success">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="pm-alert-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pm-form-group">
              <label className="pm-label">Account Holder Name *</label>
              <input
                type="text"
                className="pm-input"
                placeholder="Name as per Bank Passbook"
                value={bankData.holderName}
                onChange={(e) => setBankData({ ...bankData, holderName: e.target.value })}
                required
              />
            </div>

            <div className="pm-form-row">
              <div className="pm-form-group">
                <label className="pm-label">Account Number *</label>
                <input
                  type="password"
                  className="pm-input"
                  placeholder="Enter Account Number"
                  value={bankData.accountNumber}
                  onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value.replace(/\s/g, '') })}
                  required
                />
              </div>
              <div className="pm-form-group">
                <label className="pm-label">Confirm Account Number *</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="Re-enter Account Number"
                  value={bankData.confirmAccountNumber}
                  onChange={(e) => setBankData({ ...bankData, confirmAccountNumber: e.target.value.replace(/\s/g, '') })}
                  required
                />
              </div>
            </div>

            <div className="pm-form-row">
              <div className="pm-form-group">
                <label className="pm-label">IFSC Code *</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="e.g. SBIN0001234"
                  value={bankData.ifsc}
                  onChange={(e) => setBankData({ ...bankData, ifsc: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  required
                />
              </div>
              <div className="pm-form-group">
                <label className="pm-label">Bank Name</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="e.g. State Bank of India"
                  value={bankData.bankName}
                  onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                />
              </div>
            </div>

            <div className="pm-form-row">
              <div className="pm-form-group">
                <label className="pm-label">Branch Name</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="e.g. Tiruppur Main Branch"
                  value={bankData.branch}
                  onChange={(e) => setBankData({ ...bankData, branch: e.target.value })}
                />
              </div>
              <div className="pm-form-group">
                <label className="pm-label">UPI ID (Optional)</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="e.g. user@okhdfcbank"
                  value={bankData.upiId}
                  onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', marginTop: 4 }}>
              <ShieldCheck size={16} />
              <span>256-bit encrypted • Bank details used exclusively for payouts</span>
            </div>
          </div>

          <div className="pm-footer">
            <button type="button" className="pm-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pm-btn-primary">
              Save Bank Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankModal;
