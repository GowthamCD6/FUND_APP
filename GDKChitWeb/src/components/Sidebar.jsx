import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  RiDashboardLine,
  RiBarChartLine,
  RiMoneyDollarCircleLine,
  RiGroupLine,
  RiZapLine,
  RiAddLine,
  RiSettings3Line,
  RiUserSettingsLine,
  RiUserAddLine,
  RiCloseLine,
  RiShieldUserLine,
} from '../icons.jsx';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard',      Icon: RiDashboardLine,         end: true },
  { to: '/admin/reports',   label: 'Reports',         Icon: RiBarChartLine },
  { to: '/admin/groups',    label: 'Chit Plans',      Icon: RiMoneyDollarCircleLine },
  { to: '/admin/users',     label: 'Members',         Icon: RiGroupLine },
  { label: 'Quick Actions', header: true },
  { to: '/admin/actions',                   label: 'All Actions',    Icon: RiZapLine,          end: true },
  { to: '/admin/actions/create-group',      label: 'Create Group',   Icon: RiAddLine,          sub: true },
  { to: '/admin/actions/manage-groups',     label: 'Manage Groups',  Icon: RiSettings3Line,    sub: true },
  { to: '/admin/actions/manage-users',      label: 'Manage Members', Icon: RiUserSettingsLine, sub: true },
  { to: '/admin/actions/add-user',          label: 'Add Member',     Icon: RiUserAddLine,      sub: true },
  { label: 'System', header: true },
  { to: '/admin/settings', label: 'Settings',         Icon: RiSettings3Line },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const initials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <p className="sidebar-title">GDK Chit Fund</p>
          <p className="sidebar-subtitle">Admin Panel</p>
          <div className="sidebar-brand-line" />
        </div>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <RiCloseLine size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((item, idx) => {
          if (item.header) {
            return <p key={`h-${idx}`} className="sidebar-section-label">{item.label}</p>;
          }
          const { Icon } = item;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || false}
              className={({ isActive }) =>
                `nav-link${item.sub ? ' sub-link' : ''}${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={item.sub ? 15 : 17} />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials(user?.name || user?.username || 'Admin')}</div>
        <div>
          <p className="sidebar-user">{user?.name || user?.username || 'Admin'}</p>
          <p className="sidebar-role">
            <RiShieldUserLine size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {user?.role || 'admin'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
