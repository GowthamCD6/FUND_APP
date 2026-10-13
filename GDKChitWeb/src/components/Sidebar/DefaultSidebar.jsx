import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import logoImg from '../../assets/logo.png';
import './DefaultSidebar.css';
import {
  LayoutDashboard, BarChart3, Zap, AlertTriangle,
  MessageSquare, Menu, LogOut, User as UserIcon, X, Loader2, Gavel,
  Settings, UserCog, MapPin, Plus, Ban, Key, Layers, Lock, Unlock,
  Landmark, ShieldCheck, Users, ShieldAlert, Map, FileText, HelpCircle,
  Bell, Search, ChevronRight, UserPlus, Info, CheckCircle2, AlertCircle, Globe
} from 'lucide-react';


/* ── NAV GROUPS ── */
const ADMIN_NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true },
    ]
  },
  {
    title: 'CHIT SCHEMES & AUCTIONS',
    items: [
      { id: 'manage-groups', to: '/admin/manage-groups', label: 'Manage Groups', Icon: Layers },
      { id: 'create-group', to: '/admin/create-group', label: 'Create New Plan', Icon: Plus },
      { id: 'auction', to: '/admin/auction', label: 'Live Reverse Auctions', Icon: Gavel },
    ]
  },
  {
    title: 'SUBSCRIBER DIRECTORY',
    items: [
      { id: 'manage-users', to: '/admin/manage-users', label: 'Manage Members', Icon: UserCog },
      { id: 'add-user', to: '/admin/admintool/add-user', label: 'Add Member', Icon: UserPlus },
    ]
  },
  {
    title: 'COLLECTIONS & AUDIT',
    items: [
      { id: 'reports', to: '/admin/reports', label: 'Reports & Collections', Icon: BarChart3 },
      { id: 'defaulters', to: '/admin/defaulters', label: 'Overdue Tracker', Icon: AlertTriangle },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'chat', to: '/admin/chat', label: 'Messaging & Notices', Icon: MessageSquare },
    ]
  },
  {
    title: 'OPERATIONS & TOOLS',
    items: [
      { id: 'actions', to: '/admin/admintool', label: 'Admin Tools & Logs', Icon: Zap },
    ]
  },
  {
    title: 'SYSTEM PREFERENCES',
    items: [
      { id: 'settings', to: '/admin/settings', label: 'Application Settings', Icon: Settings },
    ]
  }
];

const USER_NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'user-home', to: '/user/home', label: 'Home', Icon: LayoutDashboard, end: true },
    ]
  },
  {
    title: 'MY CHIT POOLS',
    items: [
      { id: 'group-card', to: '/user/group-card', label: 'Member Chit Card', Icon: Landmark },
      { id: 'join-group', to: '/user/join-group', label: 'Join Chit Group', Icon: Users },
      { id: 'auction', to: '/user/auction', label: 'Live Reverse Auction', Icon: Gavel },
    ]
  },
  {
    title: 'FINANCIAL STATEMENTS',
    items: [
      { id: 'portfolio', to: '/user/portfolio', label: 'Investments & Plans', Icon: BarChart3 },
      { id: 'finance', to: '/user/finance', label: 'Financial Statements', Icon: Layers },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'user-chat', to: '/user/chat', label: 'Messaging', Icon: MessageSquare },
    ]
  },
  {
    title: 'OPERATIONS & TOOLS',
    items: [
      { id: 'user-tool', to: '/user/tools', label: 'Subscriber Tools', Icon: Zap },
    ]
  },
  {
    title: 'MY ACCOUNT',
    items: [
      { id: 'profile', to: '/user/profile', label: 'Profile Settings', Icon: UserIcon },
    ]
  }
];

/* Page title map */
const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/reports': 'Monthly Collections & Reports',
  '/admin/defaulters': 'Global Defaulters Tracker',
  '/admin/auction': 'Chit Reverse Auctions',
  '/admin/groups': 'Chit Plans & Groups',
  '/admin/users': 'Member Directory',
  '/admin/block-user': 'Subscriber Access Control',
  '/admin/password-management': 'Password Management Vault',
  '/admin/settings': 'Application Settings & Policy',
  '/admin/manage-groups': 'Manage Chit Groups',
  '/admin/manage-users': 'Manage Members',
  '/admin/user-locations': 'Member Geographic Map',
  '/admin/create-group': 'Create New Chit Plan',
  '/admin/admintool': 'Administrative Operations & System Tools',
  '/admin/admintool/create-group': 'Create Chit Plan',
  '/admin/admintool/manage-groups': 'Manage Chit Groups',
  '/admin/admintool/manage-users': 'Manage Members',
  '/admin/admintool/add-user': 'Add Subscriber',
  '/admin/admintool/data-export': 'Corporate Data Export & Audit',
  '/admin/admintool/otp-requests': 'Subscriber Authorization OTP Stream',
  '/admin/admintool/auction-settings': 'Reverse Auction Engine Configuration',
  '/admin/admintool/office-location': 'Headquarters & Branch GPS Location',
  '/admin/chat': 'Communications & Messages',
  '/user/home': 'Dashboard Home',
  '/user/portfolio': 'My Portfolio',
  '/user/chat': 'Messages',
  '/user/profile': 'Profile Settings',
  '/user/tools': 'Subscriber Tools & Services',
  '/user/join-group': 'Join Chit Group',
  '/user/group-card': 'Member Chit Card',
  '/user/auction': 'Live Auction Bidding',
  '/user/finance': 'Financial Statements',
  '/user/profile/account-details': 'Account Details',
  '/user/profile/link-bank-account': 'Linked Bank Account',
  '/user/profile/identity-verification': 'Identity Verification',
  '/user/profile/nominee-details': 'Nominee Details',
  '/user/profile/security-permission': 'Security & Lock PIN',
  '/user/profile/my-location': 'My Location',
  '/user/profile/admin-location': 'Branch & Office Locations',
  '/user/profile/privacy-policy': 'Compliance & Policy Directives',
  '/user/profile/help-support': 'Help & Support Desk',
  '/user/profile/otp-requests': 'OTP Requests',
  '/user/profile/language-settings': 'Language Settings',
};

/* ─── LOCK SCREEN OVERLAY ─── */
const LockScreenOverlay = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (error) setError(false);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        const savedPIN = localStorage.getItem('webPasscodePIN') || '1234';
        if (nextPin === savedPIN) {
          sessionStorage.setItem('webSessionUnlocked', 'true');
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="web-lock-overlay">
      <div className="web-lock-container">
        <div className="web-lock-time">{formatTime(time)}</div>
        <div className="web-lock-date">{formatDate(time)}</div>

        <div className={`web-lock-icon-wrap ${error ? 'error' : ''}`}>
          <Lock size={40} />
        </div>

        <div className="web-lock-prompt">
          {error ? 'Incorrect PIN code' : 'Verify admin passcode to unlock'}
        </div>

        <div className="web-lock-dots">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`web-lock-dot ${pin.length > i ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="web-lock-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className="web-lock-key"
              onClick={() => handleKeyPress(String(num))}
            >
              {num}
            </button>
          ))}
          <button
            className="web-lock-key action"
            onClick={() => setPin('')}
          >
            Clear
          </button>
          <button
            className="web-lock-key"
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>
          <button
            className="web-lock-key action"
            onClick={handleBackspace}
          >
            Del
          </button>
        </div>

        <div className="web-lock-support">
          Session locked for administrative security.
        </div>
      </div>
    </div>
  );
};

const DefaultSidebar = () => {
  const { user, status, isAdminRole, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    const isLockEnabled = localStorage.getItem('webPasscodeEnabled') === 'true';
    if (!isLockEnabled) return true;
    return sessionStorage.getItem('webSessionUnlocked') === 'true';
  });

  const isAdmin = isAdminRole(user?.role);
  const rawNavGroups = isAdmin ? ADMIN_NAV_GROUPS : USER_NAV_GROUPS;

  // Filter nav items by search query and translate labels
  const navGroups = useMemo(() => {
    const query = navSearch.toLowerCase().trim();
    return rawNavGroups
      .map(group => {
        const translatedItems = group.items.map(item => ({
          ...item,
          displayLabel: t(item.label),
          displayBadge: item.badge ? t(item.badge) : null
        }));

        const filtered = !query
          ? translatedItems
          : translatedItems.filter(item =>
              item.displayLabel.toLowerCase().includes(query) ||
              item.label.toLowerCase().includes(query) ||
              (item.displayBadge && item.displayBadge.toLowerCase().includes(query))
            );

        return {
          ...group,
          displayTitle: t(group.title),
          items: filtered
        };
      })
      .filter(group => group.items.length > 0);
  }, [rawNavGroups, navSearch, t]);

  const rawHeaderTitle = PAGE_TITLES[location.pathname] || (isAdmin ? 'GDK Administration' : 'GDK Member Portal');
  const headerTitle = t(rawHeaderTitle);


  // Load notifications for admin
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await makeRequest('/admin/notifications');
        const data = await safeJson(res);
        if (isMounted && res.ok && data?.success) {
          setNotifications(data.data || []);
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchNotifs();
    return () => { isMounted = false; };
  }, [isAdmin]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleLockSession = () => {
    sessionStorage.removeItem('webSessionUnlocked');
    setIsUnlocked(false);
  };

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  const renderNavItem = (item) => {
    const isActive = item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
    const Icon = item.Icon;

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={item.end}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
      >
        <div className="sidebar-nav-item-left">
          <div className="sidebar-nav-icon-wrap">
            <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
          </div>
          <span className="sidebar-nav-label">{item.displayLabel || item.label}</span>
        </div>
        {(item.displayBadge || item.badge) && (
          <span className={`sidebar-badge sidebar-badge-${item.badgeType || 'primary'}`}>
            {item.displayBadge || item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      {/* BRAND HEADER */}
      <div className="sidebar-brand-header">
        <NavLink to={isAdmin ? "/admin/dashboard" : "/user/home"} className="sidebar-brand-main">
          <div className="sidebar-brand-logo-wrap">
            <img src={logoImg} alt="GDK Chit Fund" className="sidebar-brand-logo-img" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">GDK CHIT FUNDS</span>
            <span className="sidebar-brand-subtitle">
              {isAdmin ? "EXECUTIVE SUITE" : t("MEMBER PORTAL")}
            </span>
          </div>
        </NavLink>
      </div>

      {/* NAV LINKS */}
      <div className="sidebar-nav-scroll">
        <nav>
          {navGroups.map((group, i) => (
            <div key={i} className="sidebar-nav-group">
              {(group.displayTitle || group.title) && (
                <div className="sidebar-group-title">{group.displayTitle || group.title}</div>
              )}
              {group.items.map(renderNavItem)}
            </div>
          ))}
          {navGroups.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {t('No matches for')} "{navSearch}"
            </div>
          )}
        </nav>
      </div>

      {/* FOOTER USER CARD */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-info-left">
            <div className="sidebar-user-avatar">
              {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {user?.name || user?.username || (isAdmin ? "Admin User" : "Member")}
              </span>
              <span className="sidebar-user-role">
                {isAdmin ? "Super Administrator" : "Active Member"}
              </span>
            </div>
          </div>
          <div className="sidebar-user-actions">
            {isAdmin && (
              <button
                type="button"
                className="sidebar-action-btn"
                title="Lock Session PIN"
                onClick={handleLockSession}
              >
                <Lock size={15} />
              </button>
            )}
            <button
              type="button"
              className="sidebar-action-btn logout"
              title="Sign Out"
              onClick={handleLogout}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (!isUnlocked && isAdmin) {
    return <LockScreenOverlay onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="admin-sidebar-layout">
      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="admin-viewport">
        {/* TOP COMMAND HEADER */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="sidebar-action-btn"
              style={{ display: isMobileMenuOpen ? 'none' : undefined }}
              onClick={() => setIsMobileMenuOpen(true)}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>

            <div className="admin-breadcrumb-area">
              <div className="admin-breadcrumb-trail">
                <span>{isAdmin ? 'ADMINISTRATION' : 'MEMBER PORTAL'}</span>
                <ChevronRight size={12} color="#94a3b8" />
                <span>{location.pathname.split('/').filter(Boolean)[1] || 'OVERVIEW'}</span>
              </div>
              <h1 className="admin-page-heading">{headerTitle}</h1>
            </div>
          </div>

          {/* RIGHT ACTION CONTROLS */}
          <div className="admin-topbar-right">
            {isAdmin && (
              <>
                {/* NOTIFICATIONS DROPDOWN */}
                <div className="admin-notif-wrap" ref={notifRef}>
                  <button
                    type="button"
                    className="admin-notif-btn"
                    onClick={() => setShowNotifications(prev => !prev)}
                    title="Alerts & Reminders"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="admin-notif-badge" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="admin-notif-dropdown">
                      <div className="admin-notif-header">
                        <h4>System Alerts ({notifications.length})</h4>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                          onClick={() => setShowNotifications(false)}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="admin-notif-list">
                        {notifications.length === 0 ? (
                          <div className="admin-notif-empty">
                            <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: 8 }} />
                            <div>All chit cycles and payments are in order!</div>
                          </div>
                        ) : (
                          notifications.map((notif, idx) => (
                            <div
                              key={notif.id || idx}
                              className="admin-notif-item"
                              onClick={() => {
                                setShowNotifications(false);
                                if (notif.title?.toLowerCase().includes('payment')) {
                                  navigate('/admin/reports');
                                } else {
                                  navigate('/admin/auction');
                                }
                              }}
                            >
                              <div
                                className="admin-notif-icon-wrap"
                                style={{
                                  background: notif.type === 'danger' ? '#fef2f2' : '#fffbeb',
                                  color: notif.type === 'danger' ? '#dc2626' : '#d97706'
                                }}
                              >
                                {notif.type === 'danger' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
                              </div>
                              <div className="admin-notif-content">
                                <h5 className="admin-notif-title">{notif.title}</h5>
                                <p className="admin-notif-desc">{notif.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* LANGUAGE SWITCH BUTTON */}
            <button
              type="button"
              className="admin-notif-btn"
              onClick={() => changeLanguage(language === 'en' ? 'ta' : 'en')}
              title={language === 'en' ? 'Switch to தமிழ் (Tamil)' : 'Switch to English'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0 10px',
                width: 'auto',
                fontWeight: 600,
                fontSize: 12.5,
              }}
            >
              <Globe size={15} color="#2563eb" />
              <span>{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
            </button>

            {/* PROFILE CHIP */}
            <div
              className="admin-topbar-profile"
              onClick={() => navigate(isAdmin ? '/admin/settings' : '/user/profile')}
              style={{ cursor: 'pointer' }}
              title={t('Profile Settings')}
            >
              <div className="admin-topbar-avatar">
                {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="admin-topbar-user-name">
                {user?.name || user?.username || (isAdmin ? t("Admin") : t("Member"))}
              </span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE PAGE BODY */}
        <div className="admin-page-scroll">
          {status === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '12px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-pulse" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e2e8f0', marginBottom: 12 }} />
                    <div style={{ width: '45%', height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: '70%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default DefaultSidebar;