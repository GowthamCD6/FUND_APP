import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  Check,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import './AdminModals.css';

const AdminSecurityModal = ({ isOpen, onClose }) => {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [currentPin, setCurrentPin] = useState('1234');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    if (!isOpen) return;
    const isEnabled = localStorage.getItem('webPasscodeEnabled') === 'true';
    const savedPin = localStorage.getItem('webPasscodePIN') || '1234';
    setLockEnabled(isEnabled);
    setCurrentPin(savedPin);
    setNewPin('');
    setConfirmPin('');
    setMsg({ text: '', isError: false });
  }, [isOpen]);

  const handleToggleLock = () => {
    const next = !lockEnabled;
    setLockEnabled(next);
    localStorage.setItem('webPasscodeEnabled', String(next));
    setMsg({ text: `Web lock ${next ? 'enabled' : 'disabled'}.`, isError: false });
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setMsg({ text: 'PIN must be exactly 4 numeric digits.', isError: true });
      return;
    }
    if (newPin !== confirmPin) {
      setMsg({ text: 'New PIN and confirm PIN do not match.', isError: true });
      return;
    }

    localStorage.setItem('webPasscodePIN', newPin);
    localStorage.setItem('webPasscodeEnabled', 'true');
    setLockEnabled(true);
    setCurrentPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setMsg({ text: 'PIN updated successfully! Active for all sessions.', isError: false });
    setTimeout(() => {
      setMsg({ text: '', isError: false });
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Lock size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Security & Session Lock</h2>
              <p className="adm-modal-subtitle">Configure 4-digit PIN lock for administrative web session</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          {msg.text && (
            <div className={`adm-alert ${msg.isError ? 'adm-alert-error' : 'adm-alert-success'}`}>
              <Check size={16} />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Toggle Screen Lock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            marginBottom: 16
          }}>
            <div>
              <strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
                Web Session Passcode Lock
              </strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Requires PIN prompt on browser startup and inactivity
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleLock}
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                background: lockEnabled ? '#059669' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: lockEnabled ? 25 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>

          {/* Current PIN preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 8,
            background: '#f1f5f9',
            marginBottom: 16,
            fontSize: 13
          }}>
            <span style={{ color: '#475569' }}>Active Master PIN:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                {showPin ? currentPin : '••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Form to change PIN */}
          <form onSubmit={handleChangePin}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5678"
                  className="adm-form-input"
                  style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: 16 }}
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5678"
                  className="adm-form-input"
                  style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: 16 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="adm-btn-primary"
              disabled={newPin.length !== 4 || confirmPin.length !== 4}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Update Security PIN
            </button>
          </form>
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

export default AdminSecurityModal;
