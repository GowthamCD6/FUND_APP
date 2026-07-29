import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, MapPin as RiMapPinLine, Home as RiHomeLine } from 'lucide-react';
import './ProfilePages.css';

const MyLocation = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>My Location</h2>
      </div>

      <div className="prof-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 250, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiMapPinLine size={48} color="#94a3b8" />
          <span style={{ color: '#64748b', marginLeft: 12, fontWeight: 600 }}>Map Integration Placeholder</span>
        </div>
        <div style={{ padding: 24 }}>
          <h3 className="prof-card-title"><RiHomeLine size={20} color="#6B46C1"/> Residential Address</h3>
          <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
            <strong>Door No:</strong> 123, Main Street<br />
            <strong>Area:</strong> Anna Nagar<br />
            <strong>City:</strong> Chennai<br />
            <strong>State:</strong> Tamil Nadu<br />
            <strong>Pincode:</strong> 600040
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyLocation;
