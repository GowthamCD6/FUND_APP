import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, ShieldCheck as RiShieldCheckLine, CreditCard as RiIdCardLine, FileText as RiFileTextLine } from 'lucide-react';
import './ProfilePages.css';

const IdentityVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Identity Verification</h2>
      </div>

      <div className="prof-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ background: '#d1fae5', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <RiShieldCheckLine size={40} color="#059669" />
        </div>
        <h3 style={{ fontSize: 20, color: '#0f172a', marginBottom: 8 }}>KYC Verified</h3>
        <p style={{ color: '#64748b', marginBottom: 0 }}>Your identity has been successfully verified.</p>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title">Submitted Documents</h3>
        <div className="prof-detail-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RiIdCardLine size={20} color="#64748b" />
            <span className="prof-detail-val">Aadhaar Card</span>
          </div>
          <span className="prof-badge success">Verified</span>
        </div>
        <div className="prof-detail-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RiFileTextLine size={20} color="#64748b" />
            <span className="prof-detail-val">PAN Card</span>
          </div>
          <span className="prof-badge success">Verified</span>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification;
