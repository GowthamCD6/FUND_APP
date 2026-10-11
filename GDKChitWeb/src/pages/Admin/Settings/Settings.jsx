import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  User,
  KeyRound,
  Lock,
  Bell,
  Download,
  Gavel,
  ShieldCheck,
  Languages,
  MapPin,
  HelpCircle,
  Share2,
  Star,
  Users,
  Compass,
  FileText,
  Key,
  Ban,
  ChevronRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  LogOut,
  Sparkles,
  RefreshCw,
  ExternalLink
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

  // ── Quick Shortcuts Dashboard (Application Preferences & Settings) ──
  const SHORTCUTS = [
    {
      id: 'profile',
      title: 'Admin Profile',
      sub: 'HQ Info & Avatar',
      icon: User,
      color: '#7c3aed',
      bg: '#f5f3ff',
      onClick: () => setShowProfileModal(true),
    },
    {
      id: 'security-pin',
      title: 'Web Lock PIN',
      sub: 'Passcode & Screen',
      icon: Lock,
      color: '#dc2626',
      bg: '#fef2f2',
      onClick: () => setShowSecurityModal(true),
    },
    {
      id: 'language',
      title: 'Language',
      sub: currentLang === 'ta' ? 'தமிழ்' : 'English',
      icon: Languages,
      color: '#059669',
      bg: '#ecfdf5',
      onClick: () => setShowLanguageModal(true),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      sub: 'System Alerts',
      icon: Bell,
      color: '#d97706',
      bg: '#fffbeb',
      onClick: () => setShowNotificationModal(true),
    },
    {
      id: 'chit-rules',
      title: 'Compliance Rules',
      sub: 'Act Directives',
      icon: FileText,
      color: '#475569',
      bg: '#f1f5f9',
      onClick: () => setShowRulesModal(true),
    },
    {
      id: 'help',
      title: 'Help & Desk',
      sub: 'Contact Hotline',
      icon: HelpCircle,
      color: '#2563eb',
      bg: '#eff6ff',
      onClick: () => setShowHelpModal(true),
    },
    {
      id: 'admin-tools-link',
      title: 'Admin Tools',
      sub: 'All Operations',
      icon: Zap,
      color: '#059669',
      bg: '#ecfdf5',
      onClick: () => navigate('/admin/admintool'),
    },
    {
      id: 'share',
      title: 'Share Portal',
      sub: 'Copy Web Link',
      icon: Share2,
      color: '#0891b2',
      bg: '#ecfeff',
      onClick: () => setShowShareModal(true),
    },
  ];

  // ── Administrative Sections ──
  const ACCOUNT_GROUP = [
    {
      icon: User,
      label: 'Administrator Profile Details',
      sub: 'Update administrator identity, contact phone, and avatar',
      color: '#7c3aed',
      badge: 'Profile',
      onClick: () => setShowProfileModal(true),
    },
    {
      icon: Lock,
      label: 'Web Session Passcode Lock',
      sub: 'Configure 4-digit PIN lock screen and session auto-lock',
      color: '#dc2626',
      badge: 'PIN Security',
      onClick: () => setShowSecurityModal(true),
    },
  ];

  const PREFERENCES_GROUP = [
    {
      icon: Languages,
      label: 'Regional Interface Language',
      sub: 'Switch between English and தமிழ் (Tamil)',
      color: '#059669',
      badge: currentLang === 'ta' ? 'தமிழ்' : 'English',
      onClick: () => setShowLanguageModal(true),
    },
    {
      icon: Bell,
      label: 'System Notification Announcements',
      sub: 'Broadcast administrative notices and collection reminders',
      color: '#d97706',
      badge: 'Alerts',
      onClick: () => setShowNotificationModal(true),
    },
  ];

  const COMPLIANCE_GROUP = [
    {
      icon: FileText,
      label: 'Chit Funds Act 1982 Compliance Rules',
      sub: 'Statutory rules, bye-laws, and dispute arbitration framework',
      color: '#475569',
      badge: 'Compliance',
      onClick: () => setShowRulesModal(true),
    },
    {
      icon: HelpCircle,
      label: 'Technical Operations Help Desk',
      sub: 'Hotline, support contacts, and system status audit',
      color: '#2563eb',
      badge: 'Support',
      onClick: () => setShowHelpModal(true),
    },
    {
      icon: Share2,
      label: 'Share Platform Access URL',
      sub: 'Copy official web portal domain for subscribers and staff',
      color: '#0891b2',
      badge: 'Share',
      onClick: () => setShowShareModal(true),
    },
    {
      icon: Star,
      label: 'Platform Performance Feedback',
      sub: 'Submit administrative operational feedback and rating',
      color: '#d97706',
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
      <div className="set-page" style={{ maxWidth: 1020, margin: '0 auto', paddingBottom: 40 }}>
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

        {/* Shortcuts Grid Skeleton */}
        <div className="adm-shortcuts-section skeleton-pulse">
          <div style={{ width: 180, height: 18, background: '#e2e8f0', borderRadius: 4, marginBottom: 16 }} />
          <div className="adm-shortcuts-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e2e8f0' }} />
                <div style={{ width: 70, height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                <div style={{ width: 50, height: 9, background: '#e2e8f0', borderRadius: 4 }} />
              </div>
            ))}
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
    <div className="set-page" style={{ maxWidth: 1020, margin: '0 auto', paddingBottom: 40 }}>
      {/* ── 1. Executive Admin Profile Card ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: '#2563eb',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 700,
            boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
          }}>
            {initial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {displayName}
              </h2>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '2px 8px',
                borderRadius: 12,
                border: '1px solid #bfdbfe'
              }}>
                SUPER ADMIN
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {displayPhone} • Periyanayagi Amman Chit Funds Headquarters
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowProfileModal(true)}
            className="adm-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <User size={14} />
            Edit Profile
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="adm-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            Export Data
          </button>
        </div>
      </div>

      {/* ── 2. Quick Shortcuts Grid ── */}
      <div className="adm-shortcuts-section">
        <div className="adm-shortcuts-header">
          <h3 className="adm-shortcuts-title">
            <Sparkles size={16} color="#7c3aed" />
            Executive Quick Shortcuts
          </h3>
          <span className="adm-shortcuts-subtitle">
            One-click modal access to administrative actions, exports, and security parameters
          </span>
        </div>

        <div className="adm-shortcuts-grid">
          {SHORTCUTS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="adm-shortcut-card"
                onClick={item.onClick}
                type="button"
              >
                <div className="adm-shortcut-icon" style={{ background: item.bg, color: item.color }}>
                  <Icon size={20} />
                </div>
                <span className="adm-shortcut-label">{item.title}</span>
                <span className="adm-shortcut-sub">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Administrative Operational Sections (Dual Columns) ── */}
      <div className="adm-sections-grid">
        {/* Left Column: Account & Security + Operational Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="adm-section-box">
            <h3 className="adm-section-title">
              <ShieldAlert size={16} color="#dc2626" />
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
              <Languages size={16} color="#059669" />
              Application Preferences & Alerts
            </h3>
            <div className="adm-menu-list">
              {PREFERENCES_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Operational Workbench Callout */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: 14,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Zap size={16} color="#2563eb" />
                <strong style={{ fontSize: 14, color: '#1e3a8a' }}>Administrative Operations Workbench</strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.45 }}>
                Data Export, 2FA OTP Stream, Reverse Auction Config, Member Vault, and GPS Location are partitioned in Admin Tools.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/admintool')}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Open Tools <ChevronRight size={14} />
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
