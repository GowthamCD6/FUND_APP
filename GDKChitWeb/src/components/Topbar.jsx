import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { RiMenu2Line, RiLogoutBoxLine, RiUserLine } from '../icons.jsx';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <RiMenu2Line size={20} />
      </button>
      <span className="topbar-title">GDK Chit Fund</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RiUserLine size={15} color="var(--muted)" />
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
            {user?.name || user?.username || 'Admin'}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            border: 'none',
            background: 'var(--surface2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RiLogoutBoxLine size={15} />
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Topbar;
