import React, { useState } from 'react';
import { Lock, Unlock, X, Check, Shield, Key } from 'lucide-react';
import './ProfileModals.css';

const SecurityModal = ({ isOpen, onClose }) => {
  const [passcodeEnabled, setPasscodeEnabled] = useState(
    localStorage.getItem('webPasscodeEnabled') === 'true'
  );
  const [pinCode, setPinCode] = useState(
    localStorage.getItem('webPasscodePIN') || '1234'
  );
  const [confirmPin, setConfirmPin] = useState(
    localStorage.getItem('webPasscodePIN') || '1234'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (passcodeEnabled) {
      if (pinCode.length !== 4) {
        setErrorMsg('PIN code must be exactly 4 digits.');
        return;
      }
      if (pinCode !== confirmPin) {
        setErrorMsg('PIN codes do not match.');
        return;
      }
    }
    localStorage.setItem('webPasscodeEnabled', String(passcodeEnabled));
    localStorage.setItem('webPasscodePIN', pinCode);
    setSuccessMsg('Security permissions & session PIN updated!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-title-group">
            <div className="pm-title-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Shield size={18} />
            </div>
            <h3 className="pm-title">Security & Permissions</h3>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="pm-body">
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Protect your portal session with local 4-digit PIN authentication to prevent unauthorized physical access.
            </p>

            {successMsg && (
              <div className="pm-alert-success">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="pm-alert-error">
                <span>{errorMsg}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111827' }}>
                  Enable Session PIN Lock
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  Requires 4-digit PIN verification on tab wake-up
                </div>
              </div>
              <input
                type="checkbox"
                checked={passcodeEnabled}
                onChange={(e) => setPasscodeEnabled(e.target.checked)}
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#1e40af' }}
              />
            </div>

            {passcodeEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="pm-form-group">
                  <label className="pm-label">New 4-Digit Passcode PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="pm-input"
                    style={{ fontSize: 18, letterSpacing: '8px', textAlign: 'center', fontWeight: 700 }}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">Confirm 4-Digit Passcode PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="pm-input"
                    style={{ fontSize: 18, letterSpacing: '8px', textAlign: 'center', fontWeight: 700 }}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pm-footer">
            <button type="button" className="pm-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pm-btn-primary">
              Save Security Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecurityModal;
