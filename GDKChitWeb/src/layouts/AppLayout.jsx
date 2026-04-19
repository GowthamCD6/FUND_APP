import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { RiLoader4Line } from '../icons.jsx';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status, user, isAdminRole } = useAuth();

  // If finished loading and not authed -> login
  if (status !== 'loading' && status !== 'authed') {
    return <Navigate to="/login" replace />;
  }

  // If finished loading and authed but not admin -> unauthorized
  if (status !== 'loading' && !isAdminRole(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          {status === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
              <RiLoader4Line size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 15 }}>Loading workspace...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
