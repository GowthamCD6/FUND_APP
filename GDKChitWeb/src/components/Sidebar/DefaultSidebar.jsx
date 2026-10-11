import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard, BarChart3, Zap, AlertTriangle,
  MessageSquare, Menu, LogOut, User as UserIcon, X, Loader2, Gavel,
  Settings, UserCog, MapPin, Plus, Ban, Key, Layers, Lock, Unlock,
  Landmark, ShieldCheck, Users, ShieldAlert, Map, FileText, HelpCircle
} from 'lucide-react';

/* ── NAV GROUPS ── */
const ADMIN_NAV_GROUPS = [
  {
    title: '',
    items: [
      { id: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true },
    ]
  },
  {
    title: 'ANALYTICS & REPORTS',
    items: [
      { id: 'reports', to: '/admin/reports', label: 'Reports & Analytics', Icon: BarChart3 },
      { id: 'defaulters', to: '/admin/defaulters', label: 'Overdue Tracker', Icon: AlertTriangle },
    ]
  },
  {
    title: 'GROUP MANAGEMENT',
    items: [
      { id: 'manage-groups', to: '/admin/manage-groups', label: 'Manage Groups', Icon: Layers },
      { id: 'create-group', to: '/admin/create-group', label: 'Create New Group', Icon: Plus },
      { id: 'auction', to: '/admin/auction', label: 'Auction Management', Icon: Gavel },
    ]
  },
  {
    title: 'MEMBER MANAGEMENT',
    items: [
      { id: 'manage-users', to: '/admin/manage-users', label: 'Manage Members', Icon: UserCog },
      { id: 'user-locations', to: '/admin/user-locations', label: 'Member Locations', Icon: MapPin },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'chat', to: '/admin/chat', label: 'Messaging', Icon: MessageSquare },
    ]
  },
  {
    title: 'ACCESS CONTROL',
    items: [
      { id: 'block-user', to: '/admin/block-user', label: 'Block / Unblock Users', Icon: Ban },
      { id: 'password-management', to: '/admin/password-management', label: 'Password Management', Icon: Key },
    ]
  },
  {
    title: 'SYSTEM CONFIGURATION',
    items: [
      { id: 'settings', to: '/admin/settings', label: 'Application Settings', Icon: Settings },
      { id: 'actions', to: '/admin/admintool', label: 'Admin Tools', Icon: Zap },
    ]
  }
];

const USER_NAV_GROUPS = [
  {
    title: '',
    items: [
      { id: 'user-home', to: '/user/home', label: 'Home', Icon: LayoutDashboard },
    ]
  },
  {
    title: 'MY PORTFOLIO',
    items: [
      { id: 'portfolio', to: '/user/portfolio', label: 'Investments & Plans', Icon: BarChart3 },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'user-chat', to: '/user/chat', label: 'Messaging', Icon: MessageSquare },
    ]
  },
  {
    title: 'MY ACCOUNT',
    items: [
      { id: 'profile', to: '/user/profile', label: 'Profile Settings', Icon: UserIcon },
    ]
  },
  {
    title: 'CHIT ACTIONS',
    items: [
      { id: 'join-group', to: '/user/join-group', label: 'Join the Group', Icon: Users },
      { id: 'group-card', to: '/user/group-card', label: 'Group Card', Icon: Landmark },
      { id: 'auction', to: '/user/auction', label: 'Auction', Icon: Gavel },
      { id: 'finance', to: '/user/finance', label: 'Finance', Icon: Layers },
    ]
  }
];

/* Page title map */
const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/reports': 'Reports',
  '/admin/defaulters': 'Global Defaulters Tracker',
  '/admin/auction': 'Auction Page',
  '/admin/groups': 'Chit Plans',
  '/admin/users': 'Members',
  '/admin/block-user': 'Block User',
  '/admin/password-management': 'Passwords',
  '/admin/settings': 'Settings',
  '/admin/manage-groups': 'Manage Groups',
  '/admin/manage-users': 'Manage Members',
  '/admin/user-locations': 'User Locations',
  '/admin/create-group': 'Create Group',
  '/admin/admintool': 'Admin Tools',
  '/admin/admintool/create-group': 'Create Group',
  '/admin/admintool/manage-groups': 'Manage Groups',
  '/admin/admintool/manage-users': 'Manage Members',
  '/admin/admintool/add-user': 'Add Member',
  '/admin/chat': 'Chat',
  '/user/home': 'Home',
  '/user/portfolio': 'Portfolio',
  '/user/chat': 'Chat',
  '/user/profile': 'Profile',
  '/user/join-group': 'Join Group',
  '/user/group-card': 'Group Card',
  '/user/auction': 'Auction',
  '/user/finance': 'Finance',
  '/user/profile/otp-requests': 'OTP Requests',
  '/user/profile/language-settings': 'Language Settings',
};

/* ─── LOCK SCREEN OVERLAY ─── */
const LockScreenOverlay = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (error) {
      setError(false);
    }
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
          {error ? 'Incorrect PIN code' : 'Verify passcode to unlock'}
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
          For assistance, contact technical support at <span>+91-8610696889</span> or email <span>Gowthamnaveen124@gmail.com</span>
        </div>
      </div>
    </div>
  );
};

const DefaultSidebar = () => {
  const { user, status, isAdminRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const isLockEnabled = localStorage.getItem('webPasscodeEnabled') === 'true';
    if (!isLockEnabled) return true;
    return sessionStorage.getItem('webSessionUnlocked') === 'true';
  });

  const isAdmin = isAdminRole(user?.role);
  const navGroups = isAdmin ? ADMIN_NAV_GROUPS : USER_NAV_GROUPS;

  const headerTitle = PAGE_TITLES[location.pathname] || (isAdmin ? 'GDK Admin' : 'GDK User');

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const renderNavItem = (item) => {
    const isActive = location.pathname.startsWith(item.to);
    const Icon = item.Icon;

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={item.end}
        onClick={() => setIsMobileMenuOpen(false)}
        style={{
          ...styles.navItem,
          ...(isActive ? styles.navItemActive : {}),
          textDecoration: 'none'
        }}
      >
        <Icon size={20} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      {/* LOGO */}
      <div style={styles.logo}>
        <div style={styles.logoContent}>
          <div style={styles.logoIcon}>
            <img src={logoImg} alt="GDK Chit Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
          </div>
          <span style={styles.logoText}>GDK Chit</span>
        </div>
      </div>

      {/* NAV + SCROLL */}
      <div style={styles.navWrapper} className="sidebar-scroll-area">
        <nav style={styles.nav}>
          {navGroups.map((group, i) => (
            <div key={i} style={styles.navSection}>
              {group.title && <div style={styles.navSectionTitle}>{group.title}</div>}
              {group.items.map(renderNavItem)}
            </div>
          ))}
        </nav>
      </div>

      {/* LOGOUT FIXED AT BOTTOM */}
      <div style={styles.logoutWrapper}>
        <div
          style={{ ...styles.navItem, color: "#ef4444", textDecoration: 'none', cursor: 'pointer' }}
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </>
  );

  if (!isUnlocked && isAdmin) {
    return <LockScreenOverlay onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div style={styles.container}>
      <style>{`
        /* Custom scrollbar for sidebar */
        .sidebar-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .sidebar-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll-area::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .sidebar-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          
          .hamburger-button {
            display: flex !important;
          }
          
          .header-title {
            font-size: 18px !important;
          }
          
          .user-text-mobile {
            display: none !important;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .close-button:hover,
        .hamburger-button:hover {
          background-color: #f3f4f6 !important;
        }
      `}</style>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside style={styles.sidebar} className="desktop-sidebar">
        {sidebarContent}
      </aside>

      {/* ================= MOBILE MENU OVERLAY ================= */}
      {isMobileMenuOpen && (
        <div
          style={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileMenuHeader}>
              <button
                className="close-button"
                style={styles.closeButton}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <button
                className="hamburger-button"
                style={styles.hamburgerButton}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="header-title" style={styles.headerTitle}>
                {headerTitle}
              </h1>
            </div>

            <div style={styles.headerRight}>
              <div style={styles.userInfo}>
                <div style={styles.userText} className="user-text-mobile">
                  <div style={styles.userName}>{user?.name || user?.username || "User"}</div>
                  <div style={styles.userRole}>
                    {isAdmin ? "Admin" : "Member"}
                  </div>
                </div>
                <div style={styles.userAvatar}>
                  <UserIcon size={18} />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {status === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
              <Loader2 size={40} color="#059669" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ color: '#6b7280', fontWeight: 600, fontSize: 15 }}>Loading workspace...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f9fafb",
    fontFamily:
      '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  /* ================= SIDEBAR ================= */
  sidebar: {
    width: "260px",
    minWidth: "260px",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
  },
  logo: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "69px",
    boxSizing: "border-box",
  },
  logoContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: "10px",
    width: "100%",
  },
  logoIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
    lineHeight: "1",
  },

  // Scrollable menu
  navWrapper: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
  },
  navSection: {
    marginBottom: "10px",
  },
  navSectionTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    padding: "0 16px",
    marginBottom: "12px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "4px",
    transition: "all 0.2s",
    color: "#475569",
    fontWeight: "600",
    fontSize: "16px",
  },
  navItemActive: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },

  logoutWrapper: {
    padding: "5px",
    borderTop: "1px solid #e5e7eb",
  },

  /* ================= MOBILE MENU ================= */
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 2000,
  },

  mobileMenu: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "280px",
    maxWidth: "85%",
    backgroundColor: "#ffffff",
    boxShadow: "2px 0 8px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    animation: "slideIn 0.3s ease-out",
  },

  mobileMenuHeader: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
  },

  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "all 0.2s",
  },

  hamburgerButton: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    color: "#6b7280",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "all 0.2s",
  },

  /* ================= MAIN ================= */
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  /* ================= HEADER ================= */
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    width: "100%",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    padding: "0 32px",
    height: "69px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "650",
    color: "#111827",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userText: {
    textAlign: "right",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },
  userRole: {
    fontSize: "12px",
    color: "#6b7280",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },

  /* ================= CONTENT ================= */
  content: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
    backgroundColor: "#f8fafc",
  },
};

export default DefaultSidebar;