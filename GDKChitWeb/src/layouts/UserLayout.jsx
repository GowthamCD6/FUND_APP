import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard as RiDashboardLine, BarChart3 as RiBarChartLine, MessageSquare as RiChat3Line,
  User as RiUserLine, LogOut as RiLogoutBoxLine, Menu as RiMenu2Line, X as RiCloseLine,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/user/home', label: 'Home', Icon: RiDashboardLine },
  { to: '/user/portfolio', label: 'Portfolio', Icon: RiBarChartLine },
  { to: '/user/chat', label: 'Chat', Icon: RiChat3Line },
  { to: '/user/profile', label: 'Profile', Icon: RiUserLine },
];

const UserLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = String(user?.name || user?.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="user-layout">
      <style>{`
        .user-layout { min-height: 100vh; background: var(--bg); }

        .user-topbar {
          height: 64px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; background: #fff; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 100;
        }
        .user-topbar-brand { display: flex; align-items: center; gap: 10px; }
        .user-topbar-logo { width: 32px; height: 32px; border-radius: 8px; background: #0f172a; color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; }
        .user-topbar-name { font-size: 18px; font-weight: 700; color: #111827; }

        .user-topbar-nav { display: flex; gap: 4px; }
        .user-nav-link {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 10px;
          font-size: 14px; font-weight: 600; color: #6b7280; text-decoration: none;
          transition: all 0.15s;
        }
        .user-nav-link:hover { background: var(--surface2); color: #111827; }
        .user-nav-link.active { background: #eff6ff; color: #2563eb; }

        .user-topbar-right { display: flex; align-items: center; gap: 12px; }
        .user-avatar {
          width: 36px; height: 36px; border-radius: 50%; background: #6B46C1; color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;
          cursor: pointer;
        }
        .user-logout-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
          background: transparent; border: 1px solid var(--border); color: #ef4444; font-weight: 600;
          font-size: 13px; cursor: pointer; transition: all 0.15s;
        }
        .user-logout-btn:hover { background: #fef2f2; border-color: #fecaca; }

        .user-content { padding: 24px 32px 48px; max-width: 1200px; margin: 0 auto; width: 100%; }

        .user-mobile-toggle {
          display: none; border: none; background: var(--surface2); width: 36px; height: 36px;
          border-radius: 8px; align-items: center; justify-content: center; cursor: pointer;
        }

        .user-mobile-nav {
          display: none; position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5);
        }
        .user-mobile-nav.open { display: flex; }
        .user-mobile-panel {
          width: 280px; background: #fff; padding: 20px; display: flex; flex-direction: column; gap: 4px;
          animation: slideRight 0.25s ease-out;
        }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .user-mobile-panel .user-nav-link { padding: 14px 16px; font-size: 15px; }

        @media (max-width: 768px) {
          .user-topbar { padding: 0 16px; }
          .user-topbar-nav { display: none; }
          .user-mobile-toggle { display: flex; }
          .user-content { padding: 16px; }
          .user-topbar-name { display: none; }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="user-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="user-mobile-toggle" onClick={() => setMobileOpen(true)}>
            <RiMenu2Line size={18} />
          </button>
          <div className="user-topbar-brand">
            <div className="user-topbar-logo">G</div>
            <span className="user-topbar-name">GDK Chit Fund</span>
          </div>
        </div>

        <nav className="user-topbar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `user-nav-link${isActive ? ' active' : ''}`}>
              <item.Icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="user-topbar-right">
          <div className="user-avatar">{initials}</div>
          <button className="user-logout-btn" onClick={logout}>
            <RiLogoutBoxLine size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="user-mobile-nav open" onClick={() => setMobileOpen(false)}>
          <div className="user-mobile-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Menu</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <RiCloseLine size={20} />
              </button>
            </div>
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `user-nav-link${isActive ? ' active' : ''}`}>
                <item.Icon size={18} /> {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="user-content">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
