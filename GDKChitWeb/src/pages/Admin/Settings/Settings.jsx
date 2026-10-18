import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  User,
  Lock,
  Bell,
  Download,
  ShieldCheck,
  Languages,
  HelpCircle,
  Share2,
  Star,
  FileText,
  ChevronRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

import AdminProfileModal from './Modals/AdminProfileModal.jsx';
import DataExportModal from './Modals/DataExportModal.jsx';
import AdminNotificationModal from './Modals/AdminNotificationModal.jsx';
import AdminOtpModal from './Modals/AdminOtpModal.jsx';
import AuctionSettingsModal from './Modals/AuctionSettingsModal.jsx';
import AdminSecurityModal from './Modals/AdminSecurityModal.jsx';
import AdminMyLocationModal from './Modals/AdminMyLocationModal.jsx';
import AdminLanguageModal from './Modals/AdminLanguageModal.jsx';
import AdminRulesModal from './Modals/AdminRulesModal.jsx';
import AdminHelpModal from './Modals/AdminHelpModal.jsx';
import AdminShareModal from './Modals/AdminShareModal.jsx';
import AdminRateModal from './Modals/AdminRateModal.jsx';

import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [adminProfile, setAdminProfile] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('app_language') || 'en');

  // ── Modal State Toggles ──
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await makeRequest('/auth/profile');
      const data = await safeJson(res);
      if (data.success) {
        setAdminProfile(data.data?.user || data.data);
        setProfileImage(data.data?.profile?.userImage || '');
      }
    } catch (e) {
      console.warn('Admin profile fetch error:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle URL query param deep linking
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const m = params.get('modal');
    if (!m) return;
    if (m === 'profile' || m === 'edit-profile') setShowProfileModal(true);
    else if (m === 'export') setShowExportModal(true);
    else if (m === 'notifications') setShowNotificationModal(true);
    else if (m === 'otp') setShowOtpModal(true);
    else if (m === 'auction') setShowAuctionModal(true);
    else if (m === 'security') setShowSecurityModal(true);
    else if (m === 'location' || m === 'my-location') setShowLocationModal(true);
    else if (m === 'language') setShowLanguageModal(true);
    else if (m === 'rules' || m === 'privacy') setShowRulesModal(true);
    else if (m === 'help') setShowHelpModal(true);
    else if (m === 'share') setShowShareModal(true);
    else if (m === 'rate') setShowRateModal(true);
  }, [location.search]);

  const displayName = adminProfile?.name || adminProfile?.username || user?.name || 'Administrator';
  const displayPhone = adminProfile?.phone || user?.phone || '+91 98422 12345';
  const initial = displayName.charAt(0).toUpperCase();


  // ── Administrative Sections ──
  const ACCOUNT_GROUP = [
    {
      icon: User,
      label: 'Administrator Profile Details',
      sub: 'Update administrator identity, contact phone, and avatar',
      color: '#1B3322',
      badge: 'Profile',
      onClick: () => setShowProfileModal(true),
    },
    {
      icon: Lock,
      label: 'Web Session Passcode Lock',
      sub: 'Configure 4-digit PIN lock screen and session auto-lock',
      color: '#D32F2F',
      badge: 'PIN Security',
      onClick: () => setShowSecurityModal(true),
    },
  ];

  const PREFERENCES_GROUP = [
    {
      icon: Languages,
      label: 'Regional Interface Language',
      sub: 'Switch between English and தமிழ் (Tamil)',
      color: '#2E7D32',
      badge: currentLang === 'ta' ? 'தமிழ்' : 'English',
      onClick: () => setShowLanguageModal(true),
    },
    {
      icon: Bell,
      label: 'System Notification Announcements',
      sub: 'Broadcast administrative notices and collection reminders',
      color: '#A3704C',
      badge: 'Alerts',
      onClick: () => setShowNotificationModal(true),
    },
  ];

  const COMPLIANCE_GROUP = [
    {
      icon: FileText,
      label: 'Chit Funds Act 1982 Compliance Rules',
      sub: 'Statutory rules, bye-laws, and dispute arbitration framework',
      color: '#1B3322',
      badge: 'Compliance',
      onClick: () => setShowRulesModal(true),
    },
    {
      icon: HelpCircle,
      label: 'Technical Operations Help Desk',
      sub: 'Hotline, support contacts, and system status audit',
      color: '#2E7D32',
      badge: 'Support',
      onClick: () => setShowHelpModal(true),
    },
    {
      icon: Share2,
      label: 'Share Platform Access URL',
      sub: 'Copy official web portal domain for subscribers and staff',
      color: '#A3704C',
      badge: 'Share',
      onClick: () => setShowShareModal(true),
    },
    {
      icon: Star,
      label: 'Platform Performance Feedback',
      sub: 'Submit administrative operational feedback and rating',
      color: '#2E7D32',
      badge: 'Rating',
      onClick: () => setShowRateModal(true),
    },
  ];

  const MenuItem = ({ icon: Icon, label, sub, color, badge, onClick }) => (
    <button className="adm-menu-item" onClick={onClick} type="button">
      <div className="adm-menu-left">
        <div className="adm-menu-icon" style={{ background: `${color}15`, color }}>
          <Icon size={18} />
        </div>
        <div>
          <span className="adm-menu-label">{label}</span>
          <span className="adm-menu-sub">{sub}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge && <span className="adm-menu-badge">{badge}</span>}
        <ChevronRight size={16} color="#94a3b8" />
      </div>
    </button>
  );

  if (loadingProfile) {
    return (
      <div className="set-page">
        {/* Profile Card Skeleton */}
        <div className="skeleton-pulse" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#e2e8f0' }} />
            <div>
              <div style={{ width: 160, height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 220, height: 12, background: '#e2e8f0', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 100, height: 36, background: '#e2e8f0', borderRadius: 8 }} />
            <div style={{ width: 100, height: 36, background: '#e2e8f0', borderRadius: 8 }} />
          </div>
        </div>

        {/* Dual Columns Skeleton */}
        <div className="adm-sections-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="adm-section-box skeleton-pulse">
              <div style={{ width: 180, height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 16 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} style={{ height: 48, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="set-page">
      {/* ── 1. Executive Admin Profile Card ── */}
      <div className="adm-profile-banner">
        <div className="adm-profile-left">
          <div className="adm-profile-avatar">
            {initial}
          </div>
          <div className="adm-profile-text">
            <div className="adm-profile-name-row">
              <h2 className="adm-profile-name">
                {displayName}
              </h2>
              <span className="adm-profile-badge">
                SUPER ADMIN
              </span>
            </div>
            <p className="adm-profile-sub">
              {displayPhone} • Periyanayagi Amman Chit Funds Headquarters
            </p>
          </div>
        </div>

        <div className="adm-profile-actions">
          <button
            onClick={() => setShowProfileModal(true)}
            className="adm-btn-secondary"
            type="button"
          >
            <User size={15} />
            Edit Profile
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="adm-btn-primary"
            type="button"
          >
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* ── 3. Administrative Operational Sections (Dual Columns) ── */}
      <div className="adm-sections-grid">
        {/* Left Column: Account & Security + Operational Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="adm-section-box">
            <h3 className="adm-section-title">
              <ShieldAlert size={16} color="#D32F2F" />
              Account & Credentials Management
            </h3>
            <div className="adm-menu-list">
              {ACCOUNT_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          <div className="adm-section-box">
            <h3 className="adm-section-title">
              <Languages size={16} color="#2E7D32" />
              Application Preferences & Alerts
            </h3>
            <div className="adm-menu-list">
              {PREFERENCES_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Operational Workbench Callout */}
          <div className="adm-workbench-callout">
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <Zap size={16} color="#2E7D32" />
                <strong style={{ fontSize: 14.5, color: '#1B3322' }}>Administrative Operations Workbench</strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#4A564C', lineHeight: 1.5 }}>
                Data Export, 2FA OTP Stream, Reverse Auction Config, Member Vault, and GPS Location are partitioned in Admin Tools.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/admintool')}
              className="adm-btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Open Tools <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Policies, Compliance & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="adm-section-box">
            <h3 className="adm-section-title">
              <ShieldCheck size={16} color="#059669" />
              Compliance, Directives & Support
            </h3>
            <div className="adm-menu-list">
              {COMPLIANCE_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Uptime Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <strong style={{ fontSize: 13, color: '#1e293b' }}>
                System Status: Operational
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              Central Chit Fund ledger integrity verified. All automated auctions, SMS alerts, and collections active.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. All Administrative Modals ── */}
      <AdminProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdated={fetchProfile}
      />

      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <AdminNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <AdminOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
      />

      <AuctionSettingsModal
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
      />

      <AdminSecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <AdminMyLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      <AdminLanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onLanguageChanged={(l) => setCurrentLang(l)}
      />

      <AdminRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      <AdminHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <AdminShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <AdminRateModal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
      />
    </div>
  );
};

export default Settings;
