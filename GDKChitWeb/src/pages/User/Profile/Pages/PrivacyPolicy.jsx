import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, ShieldCheck as RiShieldCheckLine } from 'lucide-react';
import './ProfilePages.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Privacy Policy</h2>
      </div>

      <div className="prof-card" style={{ padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <RiShieldCheckLine size={48} color="#64748b" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>GDK Chit Fund Privacy Policy</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Last updated: June 2026</p>
        </div>

        <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.8 }}>
          <h4 style={{ color: '#0f172a', fontSize: 16, marginTop: 24, marginBottom: 12 }}>1. Information We Collect</h4>
          <p>We collect personal information that you provide to us such as name, address, contact information, passwords and security data, and payment information.</p>
          
          <h4 style={{ color: '#0f172a', fontSize: 16, marginTop: 24, marginBottom: 12 }}>2. How We Use Your Information</h4>
          <p>We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.</p>
          
          <h4 style={{ color: '#0f172a', fontSize: 16, marginTop: 24, marginBottom: 12 }}>3. Will Your Information Be Shared?</h4>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

          <h4 style={{ color: '#0f172a', fontSize: 16, marginTop: 24, marginBottom: 12 }}>4. How Long Do We Keep Your Information?</h4>
          <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
