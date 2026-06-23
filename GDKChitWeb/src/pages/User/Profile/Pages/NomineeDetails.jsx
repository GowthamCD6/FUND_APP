import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, Users as RiUsersLine, Edit2 as RiEditLine } from 'lucide-react';
import './ProfilePages.css';

const NomineeDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Nominee Details</h2>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title"><RiUsersLine size={20} color="#F59E0B"/> Primary Nominee</h3>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Nominee Name</span>
          <span className="prof-detail-val">Not Assigned</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Relationship</span>
          <span className="prof-detail-val">--</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Phone Number</span>
          <span className="prof-detail-val">--</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Allocation</span>
          <span className="prof-detail-val">100%</span>
        </div>
      </div>

      <button className="prof-btn-primary" style={{ background: '#F59E0B', color: 'white' }}>
        <RiEditLine size={18} /> Update Nominee
      </button>
    </div>
  );
};

export default NomineeDetails;
