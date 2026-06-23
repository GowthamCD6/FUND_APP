import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';
import {
  User as RiUserLine, Phone as RiPhoneLine, ShieldCheck as RiShieldUserLine, Landmark as RiBankLine,
  FileLock as RiFileShieldLine, ChevronRight as RiArrowRightSLine, MapPin as RiMapPinLine, Map as RiMap2Line,
  Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine, LogOut as RiLogoutBoxLine,
  Star as RiStarLine, Share2 as RiShareLine, HelpCircle as RiQuestionLine, Link as RiLinkLine,
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await makeRequest('/auth/profile');
        const data = await res.json();
        if (data.success) {
          setProfileData(data.data?.user || data.data);
          setProfileImage(data.data?.profile?.userImage || '');
        }
      } catch (e) { /* silent */ }
    };
    loadProfile();
  }, []);

  const displayName = profileData?.username || user?.name || 'User';
  const displayPhone = profileData?.phone || user?.phone || 'No phone number';
  const initial = displayName.charAt(0).toUpperCase();

  const navigate = useNavigate();

  const SETTINGS = [
    { icon: RiUserLine, label: 'Account Details', color: '#6B46C1', path: '/user/profile/account-details' },
    { icon: RiBankLine, label: 'Linked Bank Account', color: '#2842C4', path: '/user/profile/link-bank-account' },
    { icon: RiShieldUserLine, label: 'Identity Verification', color: '#10B981', path: '/user/profile/identity-verification' },
    { icon: RiUserLine, label: 'Nominee Details', color: '#F59E0B', path: '/user/profile/nominee-details' },
  ];

  const ADVANCED = [
    { icon: RiFileShieldLine, label: 'Security & Permission', color: '#EF4444', path: '/user/profile/security-permission' },
    { icon: RiMapPinLine, label: 'My Location', color: '#6B46C1', path: '/user/profile/my-location' },
    { icon: RiMap2Line, label: 'Admin Location', color: '#2842C4', path: '/user/profile/admin-location' },
  ];

  const GENERAL = [
    { icon: RiFileShieldLine, label: 'Privacy Policy', color: '#6B7280', path: '/user/profile/privacy-policy' },
    { icon: RiQuestionLine, label: 'Help & Support', color: '#6B7280', path: '/user/profile/help-support' },
    { icon: RiShareLine, label: 'Share GDK Chit Fund', color: '#6B7280', onClick: () => alert('Share functionality coming soon!') },
    { icon: RiStarLine, label: 'Rate GDK Chit Fund', color: '#F59E0B', onClick: () => alert('Rating functionality coming soon!') },
  ];

  const MenuItem = ({ icon: Icon, label, color, path, onClick }) => (
    <button className="prof-menu-item" onClick={() => path ? navigate(path) : onClick && onClick()}>
      <div className="prof-menu-left">
        <div className="prof-menu-icon" style={{ background: `${color}15`, color }}><Icon size={18} /></div>
        <span className="prof-menu-label">{label}</span>
      </div>
      <RiArrowRightSLine size={18} color="#d1d5db" />
    </button>
  );

  return (
    <div className="prof-page">
      {/* Profile Card */}
      <div className="prof-card">
        <div className="prof-avatar-wrap">
          {profileImage ? (
            <img src={profileImage} alt="avatar" className="prof-avatar-img" />
          ) : (
            <div className="prof-avatar">{initial}</div>
          )}
        </div>
        <h2 className="prof-name">{displayName}</h2>
        <p className="prof-phone">{displayPhone}</p>
        <p className="prof-status">Periyanayagi Amman ChitFund Member</p>
      </div>

      {/* Profile Settings */}
      <div className="prof-section">
        <h3 className="prof-section-title">Profile Settings</h3>
        <div className="prof-menu-group">
          {SETTINGS.map((item, i) => <MenuItem key={i} {...item} />)}
        </div>
      </div>

      {/* Advanced */}
      <div className="prof-section">
        <h3 className="prof-section-title">Advanced Features</h3>
        <div className="prof-menu-group">
          {ADVANCED.map((item, i) => <MenuItem key={i} {...item} />)}
        </div>
      </div>

      {/* General */}
      <div className="prof-section">
        <h3 className="prof-section-title">General</h3>
        <div className="prof-menu-group">
          {GENERAL.map((item, i) => <MenuItem key={i} {...item} />)}
        </div>
      </div>

      {/* Social + Logout */}
      <div className="prof-footer">
        <p className="prof-follow-text">Follow us, to stay updated</p>
        <div className="prof-socials">
          <button className="prof-social-btn"><RiInstagramLine size={20} /></button>
          <button className="prof-social-btn"><RiYoutubeLine size={20} /></button>
          <button className="prof-social-btn"><RiWhatsappLine size={20} /></button>
        </div>
        <button className="prof-logout" onClick={logout}>
          <RiLogoutBoxLine size={18} /> Logout
        </button>
        <p className="prof-version">Version 3.1.4</p>
      </div>
    </div>
  );
};

export default Profile;
