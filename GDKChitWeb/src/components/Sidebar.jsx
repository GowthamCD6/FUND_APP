import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  RiDashboardLine, RiBarChartLine, RiMoneyDollarCircleLine,
  RiGroupLine, RiZapLine, RiAddLine, RiSettings3Line,
  RiUserSettingsLine, RiUserAddLine, RiCloseLine,
  RiArrowRightSLine, RiLogoutBoxLine,
} from '../icons.jsx';

const MAIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: RiDashboardLine, end: true },
  { to: '/admin/reports', label: 'Reports', Icon: RiBarChartLine },
  { to: '/admin/groups', label: 'Group Management', Icon: RiGroupLine },
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
          <span className="sb-nav-label">{label}</span>
        </>
      )}
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const initials = String(user?.name || user?.username || 'A')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="sb-divider" />

        {/* ── Main Nav ── */}
        <div className="sb-section">
          <p className="sb-section-label">MENU</p>
          <nav>
            {MAIN_NAV.map(item => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </nav>
        </div>

        {/* ── Footer: Logout ── */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={logout}>
            <RiLogoutBoxLine size={20} color="#ef4444" />
            <span style={{ fontWeight: 600 }}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;