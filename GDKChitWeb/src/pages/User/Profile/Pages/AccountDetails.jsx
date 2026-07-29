import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, User as RiUserLine, Edit2 as RiEditLine } from 'lucide-react';
import './ProfilePages.css';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { makeRequest } from '../../../../api/apiClient.js';

const AccountDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await makeRequest('/auth/profile');
        const data = await res.json();
        if (data.success) {
          setProfileData(data.data?.user || data.data);
        }
      } catch (e) { /* silent */ }
    };
    loadProfile();
  }, []);

  const data = profileData || user || {};

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Account Details</h2>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title"><RiUserLine size={20} color="var(--primary)"/> Personal Information</h3>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Full Name</span>
          <span className="prof-detail-val">{data.name || data.username || 'Not Provided'}</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Email Address</span>
          <span className="prof-detail-val">{data.email || 'Not Provided'}</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Phone Number</span>
          <span className="prof-detail-val">{data.phone || 'Not Provided'}</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Member ID</span>
          <span className="prof-detail-val">#{data.id || 'N/A'}</span>
        </div>
        <div className="prof-detail-row">
          <span className="prof-detail-label">Role</span>
          <span className="prof-detail-val" style={{ textTransform: 'capitalize' }}>{data.role || 'Member'}</span>
        </div>
      </div>

      <button className="prof-btn-primary">
        <RiEditLine size={18} /> Update Details
      </button>
    </div>
  );
};

export default AccountDetails;
