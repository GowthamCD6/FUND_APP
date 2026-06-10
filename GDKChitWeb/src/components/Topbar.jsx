import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Menu, LogOut, User, ShieldCheck, Settings, ArrowLeft,
} from 'lucide-react';

/* Page title map */
const PAGE_TITLES = {
  '/admin/dashboard':              { title: 'Dashboard',      sub: 'Welcome back, manage everything from here' },
  '/admin/reports':                { title: 'Reports',        sub: 'Live group monitoring & payment tracking' },
  '/admin/groups':                 { title: 'Chit Plans',     sub: 'Explore available investment plans' },
  '/admin/users':                  { title: 'Members',        sub: 'Manage all registered members' },
  '/admin/actions':                { title: 'Admin Tools',    sub: 'All administrative actions' },
  '/admin/actions/create-group':   { title: 'Create Group',   sub: 'Set up a new chit fund group' },
  '/admin/actions/manage-groups':  { title: 'Manage Groups',  sub: 'View, edit and monitor existing groups' },
  '/admin/actions/manage-users':   { title: 'Manage Members', sub: 'Edit member roles and details' },
  '/admin/actions/add-user':       { title: 'Add Member',     sub: 'Add a new member or admin account' },
  '/admin/settings':               { title: 'Settings',       sub: 'Manage your account and preferences' },
  '/admin/chat':                   { title: 'Chat',           sub: 'Communicate with members' },
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const page = PAGE_TITLES[location.pathname] || { title: 'GDK Admin', sub: '' };
  const initials = String(user?.name || user?.username || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <header className="topbar2">
      {/* ── Left: hamburger + Title ── */}
      <div className="tb-left">
        <button className="tb-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>

        <h1 className="tb-page-title" style={{ color: '#111827', fontSize: 20, fontWeight: 700, margin: 0, paddingLeft: 8 }}>{page.title}</h1>
      </div>

      {/* ── Right: user profile ── */}
      <div className="tb-right">

        {/* User pill */}
        <div className="tb-user-wrap">
          <button className="tb-user-pill" style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => setShowUserMenu(v => !v)}>
            <div className="tb-user-info" style={{ textAlign: 'right' }}>
              <div className="tb-user-name" style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || user?.username || 'Admin'}</div>
            </div>
            <div className="tb-user-avatar" style={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
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
                    <p className="tb-dd-role"><ShieldCheck size={11} /> {user?.role || 'admin'}</p>
                  </div>
                </div>
                <div className="tb-dropdown-divider" />
                <button className="tb-dd-item" onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}>
                  <Settings size={15} /> Settings
                </button>
                <button className="tb-dd-item tb-dd-logout" onClick={logout}>
                  <LogOut size={15} /> Sign Out
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