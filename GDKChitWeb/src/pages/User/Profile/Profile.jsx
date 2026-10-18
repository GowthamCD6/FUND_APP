import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useLanguage } from '../../../context/LanguageContext.jsx';
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
  ShieldAlert,
  CheckCircle2,
  Phone,
  Clock,
  Sparkles,
  Edit3,
  BadgeCheck,
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

import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
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
      if (data.success && data.data) {
        setProfileData(data.data?.user || data.data);
        setProfileImage(
          data.data?.profile?.userImage ||
          data.data?.profile?.avatar ||
          data.data?.user?.avatar ||
          ''
        );
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
  const displayEmail = profileData?.email || user?.email || 'subscriber@gdkchitfunds.com';
  const initial = displayName.charAt(0).toUpperCase();

  // ── Menu List Groups ──
  const SETTINGS_GROUP = [
    {
      icon: User,
      label: 'Personal Account Details',
      subtitle: 'Name, email, registered mobile & residential address',
      color: '#1B3322',
      badge: 'Profile',
      onClick: () => setShowAccountModal(true),
    },
    {
      icon: Landmark,
      label: 'Linked Bank Account',
      subtitle: 'Primary savings bank account & UPI ID for chit payouts',
      color: '#059669',
      badge: 'IFSC & UPI',
      onClick: () => setShowBankModal(true),
    },
    {
      icon: ShieldCheck,
      label: 'Identity Verification & KYC',
      subtitle: 'Aadhaar, PAN & government identity documentation',
      color: '#10b981',
      badge: 'Verified',
      onClick: () => setShowVerificationModal(true),
    },
    {
      icon: Users,
      label: 'Nominee Beneficiary Details',
      subtitle: 'Designated legal beneficiaries, relationship & contacts',
      color: '#d97706',
      badge: 'Nominee',
      onClick: () => setShowNomineeModal(true),
    },
    {
      icon: KeyRound,
      label: 'Authorization OTP Requests',
      subtitle: 'Active verification codes & session authorization tokens',
      color: '#4f46e5',
      badge: 'Live Codes',
      onClick: () => setShowOtpModal(true),
    },
  ];

  const ADVANCED_GROUP = [
    {
      icon: Lock,
      label: 'Security & Web Session Lock',
      subtitle: 'PIN passcode protection, session timeout & lock',
      color: '#dc2626',
      badge: 'PIN Lock',
      onClick: () => setShowSecurityModal(true),
    },
    {
      icon: MapPin,
      label: 'My Registered Location',
      subtitle: 'Registered GPS coordinates & home service area',
      color: '#0284c7',
      badge: 'GPS Location',
      onClick: () => setShowMyLocationModal(true),
    },
    {
      icon: Building2,
      label: 'Headquarters & Branch Offices',
      subtitle: 'Sri Periyanayagi Amman Chit branches & navigation',
      color: '#4338ca',
      badge: 'Google Maps',
      onClick: () => setShowAdminLocationModal(true),
    },
    {
      icon: Languages,
      label: 'Language Settings',
      subtitle: 'Switch application interface between English and தமிழ்',
      color: '#16a34a',
      badge: language === 'ta' ? 'தமிழ் (Tamil)' : 'English',
      onClick: () => setShowLanguageModal(true),
    },
  ];

  const GENERAL_GROUP = [
    {
      icon: BookOpen,
      label: 'Interactive User Manual & Guide',
      subtitle: 'Step-by-step visual tutorial and platform feature guide',
      color: '#7c3aed',
      badge: 'Tutorial',
      onClick: () => setShowManualModal(true),
    },
    {
      icon: FileText,
      label: 'Privacy Policy & Chit Fund Guidelines',
      subtitle: 'Central Chit Funds Act compliance & 12 golden operational rules',
      color: '#475569',
      badge: '12 Rules',
      onClick: () => setShowPrivacyModal(true),
    },
    {
      icon: HelpCircle,
      label: 'Help & Customer Support Desk',
      subtitle: '24/7 dedicated support desk, executive hotline & inquiries',
      color: '#2563eb',
      badge: 'Helpline',
      onClick: () => setShowHelpModal(true),
    },
    {
      icon: Share2,
      label: 'Share GDK Chit Fund Portal',
      subtitle: 'Invite relatives and acquaintances to secure chit schemes',
      color: '#059669',
      badge: 'Invite Link',
      onClick: () => setShowShareModal(true),
    },
    {
      icon: Star,
      label: 'Rate & Review Chit Platform',
      subtitle: 'Submit customer feedback and review your chit experience',
      color: '#d97706',
      badge: 'Feedback',
      onClick: () => setShowRateModal(true),
    },
  ];

  const MenuItem = ({ icon: Icon, label, subtitle, color, badge, onClick }) => (
    <button className="prof-menu-item" onClick={onClick} type="button">
      <div className="prof-menu-left">
        <div
          className="prof-menu-icon"
          style={{
            backgroundColor: `${color}14`,
            color: color,
            borderColor: `${color}28`
          }}
        >
          <Icon size={19} />
        </div>
        <div className="prof-menu-text">
          <div className="prof-menu-title-row">
            <span className="prof-menu-label">{label}</span>
            {badge && <span className="prof-menu-badge">{badge}</span>}
          </div>
          {subtitle && <p className="prof-menu-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="prof-menu-right">
        <ChevronRight size={18} className="prof-chevron" />
      </div>
    </button>
  );

  return (
    <div className="prof-page">
      {/* ── 1. Profile Hero Card (Forest Green Aesthetic) ── */}
      <div className="prof-card">
        <div className="prof-card-top-bg">
          <div className="prof-card-pattern" />
        </div>
        <div className="prof-card-content">
          <div className="prof-avatar-wrap">
            {profileImage ? (
              <img src={profileImage} alt="avatar" className="prof-avatar-img" />
            ) : (
              <div className="prof-avatar">{initial}</div>
            )}
            <button
              className="prof-avatar-edit-btn"
              onClick={() => setShowAccountModal(true)}
              title="Edit Profile & Photo"
              type="button"
            >
              <Camera size={15} />
            </button>
          </div>

          <h2 className="prof-name">{displayName}</h2>
          <p className="prof-phone">
            <span>{displayPhone}</span>
            <span className="prof-meta-dot">•</span>
            <span>{displayEmail}</span>
          </p>

          <div className="prof-badge-row">
            <span className="prof-status-badge">
              <CheckCircle2 size={13} />
              Periyanayagi Amman Chit Subscriber
            </span>
            <span className="prof-kyc-badge">
              <ShieldCheck size={13} />
              KYC Verified Member
            </span>
          </div>

          {/* Quick Hero Action Chips */}
          <div className="prof-hero-chips">
            <button
              className="prof-hero-chip"
              onClick={() => setShowAccountModal(true)}
              type="button"
            >
              <Edit3 size={13} />
              <span>Edit Account</span>
            </button>
            <button
              className="prof-hero-chip"
              onClick={() => setShowLanguageModal(true)}
              type="button"
            >
              <Languages size={13} />
              <span>{language === 'ta' ? 'தமிழ்' : 'English'}</span>
            </button>
            <button
              className="prof-hero-chip"
              onClick={() => setShowSecurityModal(true)}
              type="button"
            >
              <Lock size={13} />
              <span>PIN Passcode</span>
            </button>
            <button
              className="prof-hero-chip"
              onClick={() => setShowBankModal(true)}
              type="button"
            >
              <Landmark size={13} />
              <span>Bank & UPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Settings Grid (Dual Column Corporate Fintech) ── */}
      <div className="prof-columns-grid">
        {/* Left Column: Account, Banking & Security Settings */}
        <div className="prof-column-stack">
          {/* Section: Profile & Financial Settings */}
          <div className="prof-section-card">
            <div className="prof-section-header">
              <div className="prof-section-header-left">
                <div className="prof-section-icon-badge" style={{ background: '#EBF3ED', color: '#1B3322' }}>
                  <User size={18} />
                </div>
                <div>
                  <h3 className="prof-section-title">Profile & Financial Settings</h3>
                  <p className="prof-section-desc">Manage account identity, bank linking & beneficiaries</p>
                </div>
              </div>
              <span className="prof-section-count">5 Items</span>
            </div>
            <div className="prof-menu-group">
              {SETTINGS_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Section: Security & Regional */}
          <div className="prof-section-card">
            <div className="prof-section-header">
              <div className="prof-section-header-left">
                <div className="prof-section-icon-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="prof-section-title">Security & Environment</h3>
                  <p className="prof-section-desc">PIN authentication, branch locations & localization</p>
                </div>
              </div>
              <span className="prof-section-count">4 Items</span>
            </div>
            <div className="prof-menu-group">
              {ADVANCED_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Policies, Support & Outreach */}
        <div className="prof-column-stack">
          {/* Section: Guidelines & Support */}
          <div className="prof-section-card">
            <div className="prof-section-header">
              <div className="prof-section-header-left">
                <div className="prof-section-icon-badge" style={{ background: '#f8fafc', color: '#475569' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="prof-section-title">Guidelines, Support & Ratings</h3>
                  <p className="prof-section-desc">Legal chit rules, user manual & customer care</p>
                </div>
              </div>
              <span className="prof-section-count">5 Items</span>
            </div>
            <div className="prof-menu-group">
              {GENERAL_GROUP.map((item, i) => (
                <MenuItem key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Enhanced Customer Assistance Box */}
          <div className="prof-support-card">
            <div className="prof-support-top">
              <div className="prof-support-icon-wrap">
                <HelpCircle size={22} />
              </div>
              <div className="prof-support-info">
                <h4 className="prof-support-title">Need Subscriber Assistance?</h4>
                <p className="prof-support-desc">
                  Our customer desk is active Monday to Saturday from 9:00 AM to 6:30 PM.
                </p>
              </div>
            </div>

            <div className="prof-support-meta-row">
              <div className="prof-support-pill">
                <Phone size={13} />
                <span>+91 98765 43210</span>
              </div>
              <div className="prof-support-pill">
                <Clock size={13} />
                <span>Mon - Sat: 9 AM - 6:30 PM</span>
              </div>
            </div>

            <div className="prof-support-actions">
              <button
                className="prof-support-primary-btn"
                onClick={() => setShowHelpModal(true)}
                type="button"
              >
                <HelpCircle size={15} />
                <span>Open Help Desk</span>
              </button>
              <button
                className="prof-support-secondary-btn"
                onClick={() => setShowManualModal(true)}
                type="button"
              >
                <BookOpen size={15} />
                <span>Interactive Manual</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Social Links, Sign Out & Version ── */}
      <div className="prof-footer">
        <p className="prof-follow-text">
          Sri Periyanayagi Amman Chit Funds Official Communication Channels
        </p>
        <div className="prof-socials">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn whatsapp"
            title="WhatsApp Support"
          >
            <MessageCircle size={18} />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn youtube"
            title="YouTube Channel"
          >
            <Play size={18} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="prof-social-btn instagram"
            title="Instagram"
          >
            <Camera size={18} />
          </a>
        </div>

        <div className="prof-logout-container">
          <button className="prof-logout" onClick={logout} type="button">
            <LogOut size={16} />
            <span>Secure Sign Out</span>
          </button>
        </div>

        <div className="prof-version-container">
          <span className="prof-version">
            Sri Periyanayagi Amman Chit Funds Web Portal • v2.4.0 Production Build
          </span>
        </div>
      </div>

      {/* ── 4. All 14 Modals Connected ── */}
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
        onLanguageChanged={(lang) => changeLanguage(lang)}
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

