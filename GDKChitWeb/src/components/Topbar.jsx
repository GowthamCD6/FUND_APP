import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  RiMenu2Line, RiLogoutBoxLine, RiUserLine,
  RiNotificationLine, RiSearchLine, RiSettings3Line,
  RiShieldUserLine, RiArrowLeftLine,
} from '../icons.jsx';

/* Page title map */
const PAGE_TITLES = {
  '/admin/dashboard':              { title: 'Dashboard',      sub: 'Welcome back, manage everything from here' },
  '/admin/reports':                { title: 'Reports',        sub: 'Live group monitoring & payment tracking' },
  '/admin/groups':                 { title: 'Chit Plans',     sub: 'Explore available investment plans' },
  '/admin/users':                  { title: 'Members',        sub: 'Manage all registered members' },
  '/admin/actions':                { title: 'Quick Actions',  sub: 'All administrative actions' },
  '/admin/actions/create-group':   { title: 'Create Group',   sub: 'Set up a new chit fund group' },
  '/admin/actions/manage-groups':  { title: 'Manage Groups',  sub: 'View, edit and monitor existing groups' },
  '/admin/actions/manage-users':   { title: 'Manage Members', sub: 'Edit member roles and details' },
  '/admin/actions/add-user':       { title: 'Add Member',     sub: 'Add a new member or admin account' },
  '/admin/settings':               { title: 'Settings',       sub: 'Manage your account and preferences' },
};

const NOW = () => {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(NOW());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(NOW()), 60000);
    return () => clearInterval(t);
  }, []);

  const page = PAGE_TITLES[location.pathname] || { title: 'GDK Admin', sub: '' };
  const initials = String(user?.name || user?.username || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const canGoBack = location.pathname !== '/admin/dashboard';

  return (
    <header className="topbar2">
      {/* ── Left: hamburger + breadcrumb ── */}
      <div className="tb-left">
        <button className="tb-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <RiMenu2Line size={20} />
        </button>

        {canGoBack && (
          <button className="tb-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <RiArrowLeftLine size={16} />
          </button>
        )}

        <div className="tb-breadcrumb">
          <h1 className="tb-page-title">{page.title}</h1>
          {page.sub && <p className="tb-page-sub">{page.sub}</p>}
        </div>
      </div>

      {/* ── Right: user profile ── */}
      <div className="tb-right">

        {/* User pill */}
        <div className="tb-user-wrap">
          <button className="tb-user-pill" style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => setShowUserMenu(v => !v)}>
            <div className="tb-user-info" style={{ textAlign: 'right' }}>
              <div className="tb-user-name">{user?.name || user?.username || 'Gowtham CD'}</div>
              <div className="tb-role-badge">{user?.role || 'Admin'}</div>
            </div>
            <div className="tb-user-avatar" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>
              {initials}
            </div>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div className="tb-dropdown-backdrop" onClick={() => setShowUserMenu(false)} />
              <div className="tb-dropdown">
                <div className="tb-dropdown-head">
                  <div className="tb-dd-avatar">{initials}</div>
                  <div>
                    <p className="tb-dd-name">{user?.name || user?.username || 'Admin'}</p>
                    <p className="tb-dd-role"><RiShieldUserLine size={11} /> {user?.role || 'admin'}</p>
                  </div>
                </div>
                <div className="tb-dropdown-divider" />
                <button className="tb-dd-item" onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}>
                  <RiSettings3Line size={15} /> Settings
                </button>
                <button className="tb-dd-item tb-dd-logout" onClick={logout}>
                  <RiLogoutBoxLine size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;