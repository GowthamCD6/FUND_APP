import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Loader2 as RiLoader4Line } from 'lucide-react';

// ── Admin Pages ──
import Actions from './pages/Admin/Actions.jsx';
import AddUser from "./pages/Admin/AdminTools/AddUser/AddUser.jsx";
import CreateGroup from "./pages/Admin/AdminTools/CreateGroup/CreateGroup.jsx";
import Dashboard from './pages/Admin/Dashboard/Dashboard.jsx';
import Groups from './pages/Admin/GroupManagement/Groups.jsx';
import ManageGroups from './pages/Admin/ManageGroups.jsx';
import ManageUsers from "./pages/Admin/AdminTools/ManageUser/ManageUsers.jsx";
import Reports from './pages/Admin/Reports/Reports.jsx';
import Settings from './pages/Admin/Settings/Settings.jsx';
import Chat from './pages/Admin/Chat/Chat.jsx';

// ── User Pages ──
import UserHome from './pages/User/Home/Home.jsx';
import Portfolio from './pages/User/Portfolio/Portfolio.jsx';
import UserProfile from './pages/User/Profile/Profile.jsx';
import UserChat from './pages/User/Chat/UserChat.jsx';

// ── Public Pages ──
import Landing from './pages/Landing/Landing.jsx';
import Login, { NotAuthorized, NotFound } from './pages/Login/Login.jsx';

/* ── Loading Spinner ── */
const LoadingScreen = () => (
  <div className="page">
    <div className="panel" style={{ textAlign: 'center' }}>
      <RiLoader4Line size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
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
  const { status, user, isAdminRole } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'authed') return <Navigate to="/login" replace />;
  // Users can access user pages; admins can too (for testing)
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

function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<NotAuthorized />} />

      {/* ── Admin ── */}
      <Route
        path="/admin"
        element={<AdminRoute><AppLayout /></AdminRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="chat" element={<Chat />} />
        <Route path="groups" element={<Groups />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="actions" element={<Actions />} />
        <Route path="actions/create-group" element={<CreateGroup />} />
        <Route path="actions/add-user" element={<AddUser />} />
        <Route path="actions/manage-groups" element={<ManageGroups />} />
        <Route path="actions/manage-users" element={<ManageUsers />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ── User ── */}
      <Route
        path="/user"
        element={<UserRoute><UserLayout /></UserRoute>}
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
}

export default App;
