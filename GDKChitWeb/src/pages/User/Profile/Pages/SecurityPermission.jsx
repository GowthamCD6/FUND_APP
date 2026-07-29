import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, Shield as RiShieldLine, Key as RiKeyLine, Lock as RiLockLine } from 'lucide-react';
import './ProfilePages.css';

const SecurityPermission = () => {
  const navigate = useNavigate();
  const [pinEnabled, setPinEnabled] = useState(localStorage.getItem('webPasscodeEnabled') === 'true');

  const togglePin = () => {
    const newState = !pinEnabled;
    setPinEnabled(newState);
    if (newState) {
      localStorage.setItem('webPasscodeEnabled', 'true');
      localStorage.setItem('webPasscodePIN', '1234'); // Default PIN for demo
      alert("App Lock Enabled. Default PIN is 1234.");
    } else {
      localStorage.removeItem('webPasscodeEnabled');
      localStorage.removeItem('webPasscodePIN');
    }
  };

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Security & Permissions</h2>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title"><RiShieldLine size={20} color="#EF4444"/> App Security</h3>
        <div className="prof-detail-row" style={{ alignItems: 'center' }}>
          <div>
            <div className="prof-detail-label" style={{ color: '#0f172a', fontWeight: 700, fontSize: 15 }}>Enable PIN Lock</div>
            <div className="prof-detail-val" style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginTop: 4 }}>Require PIN to open the web portal</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 24 }}>
            <input type="checkbox" checked={pinEnabled} onChange={togglePin} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: pinEnabled ? '#10B981' : '#cbd5e1', borderRadius: 24, transition: '.4s'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: 18, width: 18, left: pinEnabled ? 26 : 3, bottom: 3,
                backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
              }}></span>
            </span>
          </label>
        </div>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title"><RiKeyLine size={20} color="#6B46C1"/> Change Password</h3>
        <div className="prof-input-group">
          <label>Current Password</label>
          <input type="password" placeholder="Enter current password" className="prof-input" />
        </div>
        <div className="prof-input-group">
          <label>New Password</label>
          <input type="password" placeholder="Enter new password" className="prof-input" />
        </div>
        <div className="prof-input-group">
          <label>Confirm New Password</label>
          <input type="password" placeholder="Confirm new password" className="prof-input" />
        </div>
        <button className="prof-btn-primary" style={{ marginTop: 24, background: '#6B46C1' }}>
          <RiLockLine size={18} /> Update Password
        </button>
      </div>
    </div>
  );
};

export default SecurityPermission;
