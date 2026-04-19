import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <button type="button" className="menu-button" onClick={onMenuClick} aria-label="Open menu">
        <span className="icon-dot" aria-hidden="true" />
      </button>
      <div className="topbar-title">
        <p className="topbar-kicker">Admin Workspace</p>
        <h1>Welcome back, {user?.name || 'Admin'}.</h1>
      </div>
      <button type="button" className="ghost-button" onClick={logout}>
        <span className="icon-dot" aria-hidden="true" />
        Sign out
      </button>
    </header>
  );
};

export default Topbar;
