import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, HelpCircle as RiQuestionLine, MessageSquare as RiMessageLine, Mail as RiMailLine, Phone as RiPhoneLine } from 'lucide-react';
import './ProfilePages.css';

const HelpSupport = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Help & Support</h2>
      </div>

      <div className="prof-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ background: '#f8fafc', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <RiQuestionLine size={32} color="#3b82f6" />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 20, color: '#0f172a' }}>How can we help you?</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Our support team is available from 9 AM to 6 PM to assist you with any questions.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/user/chat')}>
            <RiMessageLine size={24} color="#10B981" style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Live Chat</span>
            <span style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Chat with Admin</span>
          </div>
          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.href='mailto:Gowthamnaveen124@gmail.com'}>
            <RiMailLine size={24} color="#6B46C1" style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Email Us</span>
            <span style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Get a response in 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
