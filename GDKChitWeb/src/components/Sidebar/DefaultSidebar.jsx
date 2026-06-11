import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard, BarChart3, Zap,
  MessageSquare, Menu, LogOut, User as UserIcon, X, Loader2, Gavel
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
    title: 'REPORTS',
    items: [
      { id: 'reports', to: '/admin/reports', label: 'Reports', Icon: BarChart3 },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'auction', to: '/admin/groups', label: 'Auction Page', Icon: Gavel },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { id: 'chat', to: '/admin/chat', label: 'Chat', Icon: MessageSquare },
      { id: 'actions', to: '/admin/actions', label: 'Admin Tools', Icon: Zap },
    ]
  }
];

const USER_NAV_GROUPS = [
  {
    title: 'PERSONAL',
    items: [
      { id: 'user-home', to: '/user/home', label: 'Home', Icon: LayoutDashboard },
      { id: 'portfolio', to: '/user/portfolio', label: 'Portfolio', Icon: BarChart3 },
      { id: 'user-chat', to: '/user/chat', label: 'Chat', Icon: MessageSquare },
      { id: 'profile', to: '/user/profile', label: 'Profile', Icon: UserIcon },
    ]
  }
];

/* Page title map */
const PAGE_TITLES = {
  '/admin/dashboard':              'Dashboard',
  '/admin/reports':                'Reports',
  '/admin/groups':                 'Chit Plans',
  '/admin/users':                  'Members',
  '/admin/actions':                'Admin Tools',
  '/admin/actions/create-group':   'Create Group',
  '/admin/actions/manage-groups':  'Manage Groups',
  '/admin/actions/manage-users':   'Manage Members',
  '/admin/actions/add-user':       'Add Member',
  '/admin/settings':               'Settings',
  '/admin/chat':                   'Chat',
  '/user/home':                    'Home',
  '/user/portfolio':               'Portfolio',
  '/user/chat':                    'Chat',
  '/user/profile':                 'Profile',
};

const DefaultSidebar = () => {
  const { user, status, isAdminRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const SidebarContent = () => (
    <>
      {/* LOGO */}
      <div style={styles.logo}>
        <div style={styles.logoContent}>
          <div style={styles.logoIcon}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 24 }}>G</div>
          </div>
          <span style={styles.logoText}>GDK Chit</span>
        </div>
      </div>

      {/* NAV + SCROLL */}
      <div style={styles.navWrapper}>
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

  return (
    <div style={styles.container}>
      <style>{`
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
        <SidebarContent />
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
            <SidebarContent />
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
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
  },
};

export default DefaultSidebar;