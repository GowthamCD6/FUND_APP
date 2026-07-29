import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, Building as RiBuildingLine, Phone as RiPhoneLine, Mail as RiMailLine } from 'lucide-react';
import './ProfilePages.css';

const AdminLocation = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Admin Location</h2>
      </div>

      <div className="prof-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 250, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiBuildingLine size={48} color="#94a3b8" />
          <span style={{ color: '#64748b', marginLeft: 12, fontWeight: 600 }}>Office Map Placeholder</span>
        </div>
        <div style={{ padding: 24 }}>
          <h3 className="prof-card-title" style={{ color: '#2842C4' }}><RiBuildingLine size={20} color="#2842C4"/> GDK Chit Fund Main Office</h3>
          <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15, marginBottom: 20 }}>
            Periyanayagi Amman ChitFunds<br />
            No. 45, Commercial Complex,<br />
            Coimbatore, Tamil Nadu 641001
          </p>

          <div className="prof-detail-row" style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, color: '#3b82f6' }}><RiPhoneLine size={18} /></div>
              <span className="prof-detail-val">+91-8610696889</span>
            </div>
          </div>
          <div className="prof-detail-row" style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, color: '#3b82f6' }}><RiMailLine size={18} /></div>
              <span className="prof-detail-val">Gowthamnaveen124@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocation;
