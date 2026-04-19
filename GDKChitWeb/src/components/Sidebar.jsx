import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  RiDashboardLine, RiBarChartLine, RiMoneyDollarCircleLine,
  RiGroupLine, RiZapLine, RiAddLine, RiSettings3Line,
  RiUserSettingsLine, RiUserAddLine, RiCloseLine,
  RiArrowRightSLine, RiLogoutBoxLine,
} from '../icons.jsx';

const NAV_MAIN = [
  { to: '/admin/dashboard', label: 'Dashboard',  Icon: RiDashboardLine,         end: true,  color: '#2842C4' },
  { to: '/admin/reports',   label: 'Reports',     Icon: RiBarChartLine,                      color: '#06B6D4' },
  { to: '/admin/groups',    label: 'Chit Plans',  Icon: RiMoneyDollarCircleLine,             color: '#8B5CF6' },
  { to: '/admin/users',     label: 'Members',     Icon: RiGroupLine,                         color: '#10B981' },
];

const NAV_ACTIONS = [
  { to: '/admin/actions',                   label: 'All Actions',    Icon: RiZapLine,          end: true,  color: '#F59E0B' },
  { to: '/admin/actions/create-group',      label: 'Create Group',   Icon: RiAddLine,          sub: true,  color: '#10B981' },
  { to: '/admin/actions/manage-groups',     label: 'Manage Groups',  Icon: RiSettings3Line,    sub: true,  color: '#2842C4' },
  { to: '/admin/actions/manage-users',      label: 'Manage Members', Icon: RiUserSettingsLine, sub: true,  color: '#8B5CF6' },
  { to: '/admin/actions/add-user',          label: 'Add Member',     Icon: RiUserAddLine,      sub: true,  color: '#F59E0B' },
];

const NAV_SYSTEM = [
  { to: '/admin/settings', label: 'Settings', Icon: RiSettings3Line, color: '#6B7280' },
];

const NavItem = ({ item, onClose }) => {
  const { Icon, to, label, sub, end, color } = item;
  return (
    <NavLink
      to={to}
      end={end || false}
      onClick={onClose}
      className={({ isActive }) => `sb-nav-link${sub ? ' sub' : ''}${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className="sb-nav-icon" style={{ background: isActive ? `${color}18` : 'transparent' }}>
            <Icon size={sub ? 16 : 20} color={isActive ? color : 'var(--muted)'} />
          </span>
          <span className="sb-nav-label">{label}</span>
          {isActive && !sub && <RiArrowRightSLine size={14} color={color} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
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
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="sb-divider" />

        {/* ── Main Nav ── */}
        <div className="sb-section">
          <p className="sb-section-label">Main Menu</p>
          <nav>
            {NAV_MAIN.map(item => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </nav>
        </div>

        <div className="sb-divider" />

        {/* ── Actions ── */}
        <div className="sb-section">
          <p className="sb-section-label">Quick Actions</p>
          <nav>
            {NAV_ACTIONS.map(item => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </nav>
        </div>

        <div className="sb-divider" />

        {/* ── System ── */}
        <div className="sb-section">
          <p className="sb-section-label">System</p>
          <nav>
            {NAV_SYSTEM.map(item => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </nav>
        </div>

        {/* ── Footer: Logout ── */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={logout}>
            <RiLogoutBoxLine size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;