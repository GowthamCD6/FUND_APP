import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';
import {
  User,
  Landmark,
  ShieldCheck,
  Users,
  KeyRound,
  Lock,
  MapPin,
  Building2,
  Languages,
  BookOpen,
  FileText,
  HelpCircle,
  Share2,
  Star,
  ChevronRight,
  LogOut,
  Camera,
  Play,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

// ── All 14 Web Dialog Modals ──
import AccountDetailsModal from './Modals/AccountDetailsModal.jsx';
import BankModal from './Modals/BankModal.jsx';
import NomineeModal from './Modals/NomineeModal.jsx';
import VerificationModal from './Modals/VerificationModal.jsx';
import SecurityModal from './Modals/SecurityModal.jsx';
import OtpRequestsModal from './Modals/OtpRequestsModal.jsx';
import MyLocationModal from './Modals/MyLocationModal.jsx';
import AdminLocationModal from './Modals/AdminLocationModal.jsx';
import LanguageModal from './Modals/LanguageModal.jsx';
import PrivacyPolicyModal from './Modals/PrivacyPolicyModal.jsx';
import HelpSupportModal from './Modals/HelpSupportModal.jsx';
import UserManualModal from './Modals/UserManualModal.jsx';
import ShareModal from './Modals/ShareModal.jsx';
import RateModal from './Modals/RateModal.jsx';
import { useLanguage } from '../../../context/LanguageContext.jsx';

import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const currentLang = language;
  const location = useLocation();

  const [profileData, setProfileData] = useState(null);
  const [profileImage, setProfileImage] = useState('');


  // ── Modal State Toggles ──
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showNomineeModal, setShowNomineeModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showMyLocationModal, setShowMyLocationModal] = useState(false);
  const [showAdminLocationModal, setShowAdminLocationModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await makeRequest('/auth/profile');
      const data = await res.json();
      if (data.success) {
        setProfileData(data.data?.user || data.data);
        setProfileImage(data.data?.profile?.userImage || '');
      }
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle URL query param trigger e.g. /user/profile?modal=bank
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const m = params.get('modal');
    if (!m) return;
    if (m === 'account') setShowAccountModal(true);
    else if (m === 'bank') setShowBankModal(true);
    else if (m === 'nominee') setShowNomineeModal(true);
    else if (m === 'kyc' || m === 'verification') setShowVerificationModal(true);
    else if (m === 'security') setShowSecurityModal(true);
    else if (m === 'otp') setShowOtpModal(true);
    else if (m === 'my-location') setShowMyLocationModal(true);
    else if (m === 'admin-location') setShowAdminLocationModal(true);
    else if (m === 'language') setShowLanguageModal(true);
    else if (m === 'privacy') setShowPrivacyModal(true);
    else if (m === 'help') setShowHelpModal(true);
    else if (m === 'manual') setShowManualModal(true);
    else if (m === 'share') setShowShareModal(true);
    else if (m === 'rate') setShowRateModal(true);
  }, [location.search]);

  const displayName = profileData?.username || profileData?.name || user?.name || 'Subscriber';
  const displayPhone = profileData?.phone || user?.phone || 'No phone number linked';
  const initial = displayName.charAt(0).toUpperCase();

  // ── Quick Shortcuts Data ──
  const SHORTCUTS = [
    {
      id: 'account',
      title: 'Account',
      sub: 'Personal Info',
      icon: User,
      color: '#7c3aed',
      bg: '#f5f3ff',
      onClick: () => setShowAccountModal(true),
    },
    {
      id: 'bank',
      title: 'Bank Account',
      sub: 'Disbursements',
      icon: Landmark,
      color: '#2563eb',
      bg: '#eff6ff',
      onClick: () => setShowBankModal(true),
    },
    {
      id: 'kyc',
      title: 'KYC & ID',
      sub: 'Aadhaar / PAN',
      icon: ShieldCheck,
      color: '#059669',
      bg: '#ecfdf5',
      onClick: () => setShowVerificationModal(true),
    },
    {
      id: 'nominee',
      title: 'Nominee',
      sub: 'Beneficiary',
      icon: Users,
      color: '#d97706',
      bg: '#fffbeb',
      onClick: () => setShowNomineeModal(true),
    },
    {
      id: 'security',
      title: 'PIN Security',
      sub: 'Lock Screen',
      icon: Lock,
      color: '#dc2626',
      bg: '#fef2f2',
      onClick: () => setShowSecurityModal(true),
    },
    {
      id: 'otp',
      title: 'Auth OTPs',
      sub: 'Approvals',
      icon: KeyRound,
      color: '#4f46e5',
      bg: '#eef2ff',
      onClick: () => setShowOtpModal(true),
    },
    {
      id: 'my-location',
      title: 'My Location',
      sub: 'Browser GPS',
      icon: MapPin,
      color: '#0891b2',
      bg: '#ecfeff',
      onClick: () => setShowMyLocationModal(true),
    },
    {
      id: 'admin-location',
      title: 'HQ & Branches',
      sub: 'Registered Maps',
      icon: Building2,
      color: '#4338ca',
      bg: '#e0e7ff',
      onClick: () => setShowAdminLocationModal(true),
    },
    {
      id: 'language',
      title: t('Language'),
      sub: language === 'ta' ? 'தமிழ்' : 'English',
      icon: Languages,
      color: '#059669',
      bg: '#ecfdf5',
      onClick: () => setShowLanguageModal(true),
    },
    {
      id: 'manual',
      title: 'App Guide',
      sub: 'Feature Tour',
      icon: BookOpen,
      color: '#7c3aed',
      bg: '#f5f3ff',
      onClick: () => setShowManualModal(true),
    },
    {
      id: 'rules',
      title: 'Chit Rules',
      sub: '12 Directives',
      icon: FileText,
      color: '#475569',
      bg: '#f1f5f9',
      onClick: () => setShowPrivacyModal(true),
    },
    {
      id: 'help',
      title: 'Helpline & FAQ',
      sub: '24/7 Desk',
      icon: HelpCircle,
      color: '#2563eb',
      bg: '#eff6ff',
      onClick: () => setShowHelpModal(true),
    },
  ];

  // ── Menu List Groups ──
  const SETTINGS_GROUP = [
    {
      icon: User,
      label: 'Personal Account Details',
      color: '#7c3aed',
      badge: 'Profile',
      onClick: () => setShowAccountModal(true),
    },
    {
      icon: Landmark,
      label: 'Linked Bank Account',
      color: '#2563eb',
      badge: 'IFSC & UPI',
      onClick: () => setShowBankModal(true),
    },
    {
      icon: ShieldCheck,
      label: 'Identity Verification & KYC',
      color: '#059669',
      badge: 'Verified',
      onClick: () => setShowVerificationModal(true),
    },
    {
      icon: Users,
      label: 'Nominee Beneficiary Details',
      color: '#d97706',
      badge: 'Nominee',
      onClick: () => setShowNomineeModal(true),
    },
    {
      icon: KeyRound,
      label: 'Authorization OTP Requests',
      color: '#4f46e5',
      badge: 'Live Codes',
      onClick: () => setShowOtpModal(true),
    },
  ];

  const ADVANCED_GROUP = [
    {
      icon: Lock,
      label: 'Security & Web Session Lock',
      color: '#dc2626',
      badge: 'PIN Passcode',
      onClick: () => setShowSecurityModal(true),
    },
    {
      icon: MapPin,
      label: 'My Registered Location',
      color: '#0891b2',
      badge: 'GPS Coordinates',
      onClick: () => setShowMyLocationModal(true),
    },
    {
      icon: Building2,
      label: 'Headquarters & Branch Offices',
      color: '#4338ca',
      badge: 'Google Maps',
      onClick: () => setShowAdminLocationModal(true),
    },
    {
      icon: Languages,
      label: 'Language Settings',
      color: '#059669',
      badge: currentLang === 'ta' ? 'தமிழ்' : 'English',
      onClick: () => setShowLanguageModal(true),
    },
    {
      icon: BookOpen,
      label: 'Interactive User Manual & Guide',
      color: '#7c3aed',
      badge: 'Step-by-step',
      onClick: () => setShowManualModal(true),
    },
  ];

  const GENERAL_GROUP = [
    {
      icon: FileText,
      label: 'Privacy Policy & Chit Fund Guidelines',
      color: '#475569',
      badge: '12 Rules',
      onClick: () => setShowPrivacyModal(true),
    },
    {
      icon: HelpCircle,
      label: 'Help & Customer Support Desk',
      color: '#2563eb',
      badge: 'Helpline',
      onClick: () => setShowHelpModal(true),
    },
    {
      icon: Share2,
      label: 'Share GDK Chit Fund Portal',
      color: '#059669',
      badge: 'Invite Link',
      onClick: () => setShowShareModal(true),
    },
    {
      icon: Star,
      label: 'Rate & Review Chit Platform',
      color: '#d97706',
      badge: 'Feedback',
      onClick: () => setShowRateModal(true),
    },
  ];

  const MenuItem = ({ icon: Icon, label, color, badge, onClick }) => (
    <button className="prof-menu-item" onClick={onClick}>
      <div className="prof-menu-left">
        <div className="prof-menu-icon" style={{ background: `${color}15`, color }}>
          <Icon size={18} />
        </div>
        <div>
          <span className="prof-menu-label">{label}</span>
          {badge && <span className="prof-menu-badge">{badge}</span>}
        </div>
      </div>
      <ChevronRight size={18} color="#94a3b8" />
    </button>
  );

  return (
    <div className="prof-page">
      {/* ── 1. Profile Hero Card ── */}
      <div className="prof-card">
        <div className="prof-card-top-bg" />
        <div className="prof-card-content">
          <div className="prof-avatar-wrap">
            {profileImage ? (
              <img src={profileImage} alt="avatar" className="prof-avatar-img" />
            ) : (
              <div className="prof-avatar">{initial}</div>
            )}
          </div>
          <h2 className="prof-name">{displayName}</h2>
          <p className="prof-phone">{displayPhone}</p>

          <div className="prof-badge-row">
            <span className="prof-status-badge">
              <CheckCircle2 size={13} />
              Periyanayagi Amman Chit Subscriber
            </span>
            <span className="prof-kyc-badge">
              <ShieldCheck size={13} />
              Verified Member
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Shortcuts Grid (One-Click Modals) ── */}
      <div className="prof-shortcuts-section">
        <div className="prof-shortcuts-header">
          <div>
            <h3 className="prof-shortcuts-title">
              <Sparkles size={16} color="#7c3aed" />
              Quick Shortcuts
            </h3>
            <span className="prof-shortcuts-subtitle">Instant modal access to all subscriber services</span>
          </div>
        </div>

        <div className="prof-shortcuts-grid">
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="prof-shortcut-card"
                onClick={item.onClick}
                type="button"
              >
                <div className="prof-shortcut-icon" style={{ background: item.bg, color: item.color }}>
                  <Icon size={20} />
                </div>
                <span className="prof-shortcut-label">{item.title}</span>
                <span className="prof-shortcut-sub">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Detailed Setting Lists (Web Responsive Dual-Column) ── */}
      <div className="prof-columns-grid">
        {/* Left Column: Profile & Financial Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="prof-section">
            <h3 className="prof-section-title">
              <User size={16} color="#7c3aed" />
              Profile & Financial Settings
            </h3>
            <div className="prof-menu-group">
              {SETTINGS_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          <div className="prof-section">
            <h3 className="prof-section-title">
              <ShieldAlert size={16} color="#dc2626" />
              Security & Environment
            </h3>
            <div className="prof-menu-group">
              {ADVANCED_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Policies, Support & Outreach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="prof-section">
            <h3 className="prof-section-title">
              <FileText size={16} color="#475569" />
              Guidelines, Support & Ratings
            </h3>
            <div className="prof-menu-group">
              {GENERAL_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Quick Help Callout Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>Need Assistance?</h4>
                <span style={{ fontSize: 12, color: '#64748b' }}>Customer desk available Mon-Sat 9 AM - 6 PM</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setShowHelpModal(true)}
                style={{
                  flex: 1,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Open Help Desk
              </button>
              <button
                onClick={() => setShowManualModal(true)}
                style={{
                  flex: 1,
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                App Feature Tour
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Social Links, Sign Out & Version ── */}
      <div className="prof-footer">
        <p className="prof-follow-text">Follow GDK Chit Funds on official media channels</p>
        <div className="prof-socials">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn"
            title="Instagram"
          >
            <Camera size={18} />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn"
            title="YouTube"
          >
            <Play size={18} />
          </a>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn"
            title="WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        </div>

        <div>
          <button className="prof-logout" onClick={logout}>
            <LogOut size={16} />
            Secure Sign Out
          </button>
        </div>

        <div>
          <span className="prof-version">
            GDK Chit Funds Web Portal • v2.4.0 Production Build
          </span>
        </div>
      </div>

      {/* ── 5. All 14 Modals Connected ── */}
      <AccountDetailsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onUpdated={fetchProfile}
      />

      <BankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
      />

      <NomineeModal
        isOpen={showNomineeModal}
        onClose={() => setShowNomineeModal(false)}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />

      <SecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <OtpRequestsModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
      />

      <MyLocationModal
        isOpen={showMyLocationModal}
        onClose={() => setShowMyLocationModal(false)}
      />

      <AdminLocationModal
        isOpen={showAdminLocationModal}
        onClose={() => setShowAdminLocationModal(false)}
      />

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onLanguageChanged={(lang) => setCurrentLang(lang)}
      />

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <HelpSupportModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <UserManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <RateModal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
      />
    </div>
  );
};

export default Profile;
