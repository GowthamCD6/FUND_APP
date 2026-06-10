import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, BarChart3, Users, Zap, Settings,
  UserCog, UserPlus, X, LogOut, MessageSquare,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: '',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/admin/users', label: 'Members', Icon: UserCog },
      { to: '/admin/groups', label: 'Groups', Icon: Users },
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { to: '/admin/reports', label: 'Reports', Icon: BarChart3 },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { to: '/admin/actions', label: 'Admin Tools', Icon: Zap },
      { to: '/admin/chat', label: 'Chat', Icon: MessageSquare },
      { to: '/admin/settings', label: 'Settings', Icon: Settings },
    ]
  }
];

const NavItem = ({ item, onClose }) => {
  const { Icon, to, label, end } = item;
  return (
    <NavLink
      to={to}
      end={end || false}
      onClick={onClose}
      className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className="sb-nav-icon">
            <Icon size={20} color={isActive ? '#2563eb' : '#6b7280'} />
          </span>
          <span className="sb-nav-label" style={{ color: isActive ? '#2563eb' : '#6b7280', fontWeight: isActive ? 600 : 500 }}>{label}</span>
        </>
      )}
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sb-overlay" onClick={onClose} />}

      <aside className={`sidebar2 ${isOpen ? 'is-open' : ''}`}>

        {/* ── Logo / Brand ── */}
        <div className="sb-brand">
          <div className="sb-logo-ring">
            <div className="sb-logo-inner">
              <span className="sb-logo-g">G</span>
            </div>
          </div>
          <div className="sb-brand-text">
            <span className="sb-brand-name">GDK Chit Fund</span>
          </div>
          <button className="sb-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="sb-divider" />

        {/* ── Main Nav ── */}
        <div className="sb-nav-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, i) => (
            <div key={i} className="sb-nav-group">
              {group.title && <p className="sb-section-label" style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, paddingLeft: 12, letterSpacing: '0.05em' }}>{group.title}</p>}
              <nav>
                {group.items.map(item => <NavItem key={item.to} item={item} onClose={onClose} />)}
              </nav>
            </div>
          ))}
        </div>

        {/* ── Footer: Logout ── */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={logout} style={{ color: '#ef4444', background: 'transparent', paddingLeft: 12 }}>
            <LogOut size={20} color="#ef4444" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;