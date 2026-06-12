import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 as RiLoader4Line } from 'lucide-react';
import DefaultSidebar from '../components/Sidebar/DefaultSidebar.jsx';

// ── Admin Pages ──
import AdminTool from '../pages/Admin/AdminTools/AdminTool.jsx';
import AddUser from "../pages/Admin/AdminTools/AddUser/AddUser.jsx";
import CreateGroup from "../pages/Admin/AdminTools/CreateGroup/CreateGroup.jsx";
import Dashboard from '../pages/Admin/Dashboard/Dashboard.jsx';
import Groups from '../pages/Admin/GroupManagement/Groups.jsx';
import ManageGroups from '../pages/Admin/ManageGroup/ManageGroups.jsx';
import ManageUsers from "../pages/Admin/ManageUser/ManageUsers.jsx";
import Reports from '../pages/Admin/Reports/Reports.jsx';
import Settings from '../pages/Admin/Settings/Settings.jsx';
import Chat from '../pages/Admin/Chat/Chat.jsx';

// ── User Pages ──
import UserHome from '../pages/User/Home/Home.jsx';
import Portfolio from '../pages/User/Portfolio/Portfolio.jsx';
import UserProfile from '../pages/User/Profile/Profile.jsx';
import UserChat from '../pages/User/Chat/UserChat.jsx';

// ── Public Pages ──
import Landing from '../pages/Landing/Landing.jsx';
import Login, { NotAuthorized, NotFound } from '../pages/Login/Login.jsx';

/* ── Loading Spinner ── */
const LoadingScreen = () => (
  <div className="page center">
    <div className="panel" style={{ textAlign: 'center' }}>
      <RiLoader4Line size={40} color="#059669" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
      <p style={{ color: 'var(--muted)' }}>Loading session...</p>
    </div>
  </div>
);

/* ── Admin Protected Route ── */
const AdminRoute = ({ children }) => {
  const { status, user, isAdminRole } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'authed') return <Navigate to="/login" replace />;
  if (!isAdminRole(user?.role)) return <Navigate to="/user/home" replace />;
  return children;
};

/* ── User Protected Route ── */
const UserRoute = ({ children }) => {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'authed') return <Navigate to="/login" replace />;
  return children;
};

/* ── Smart Redirect after Login ── */
const SmartRedirect = () => {
  const { status, user, isAdminRole } = useAuth();

  if (status === 'authed') {
    if (isAdminRole(user?.role)) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/user/home" replace />;
  }

  // Render Landing page instantly while loading or if unauthenticated
  return <Landing />;
};

const AppNavigation = () => {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<NotAuthorized />} />

      {/* ── Admin ── */}
      <Route
        path="/admin"
        element={<AdminRoute><DefaultSidebar /></AdminRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="chat" element={<Chat />} />
        <Route path="groups" element={<Groups />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="manage-groups" element={<ManageGroups />} />
        <Route path="manage-users" element={<ManageUsers />} />
        <Route path="admintool" element={<AdminTool />} />
        <Route path="admintool/create-group" element={<CreateGroup />} />
        <Route path="admintool/add-user" element={<AddUser />} />
        <Route path="admintool/manage-groups" element={<Navigate to="/admin/manage-groups" replace />} />
        <Route path="admintool/manage-users" element={<Navigate to="/admin/manage-users" replace />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ── User ── */}
      <Route
        path="/user"
        element={<UserRoute><DefaultSidebar /></UserRoute>}
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<UserHome />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="chat" element={<UserChat />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppNavigation;