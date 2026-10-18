import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 as RiLoader4Line } from 'lucide-react';
import DefaultSidebar from '../components/Sidebar/DefaultSidebar.jsx';

// ── Admin Pages ──
import AdminTool from '../pages/Admin/AdminTools/AdminTool.jsx';
import AddUser from "../pages/Admin/AdminTools/AddUser/AddUser.jsx";
import CreateGroup from "../pages/Admin/CreateGroup/CreateGroup.jsx";
import Dashboard from '../pages/Admin/Dashboard/Dashboard.jsx';
import ManageGroups from '../pages/Admin/ManageGroup/ManageGroups.jsx';
import ManageUsers from "../pages/Admin/ManageUser/ManageUsers.jsx";
import Reports from '../pages/Admin/Reports/Reports.jsx';
import Chat from '../pages/Admin/Chat/Chat.jsx';
import UserLocation from '../pages/Admin/UserLocation/UserLocation.jsx';
import Auction from '../pages/Admin/Auction/Auction.jsx';
import BlockUser from '../pages/Admin/BlockUser/BlockUser.jsx';
import PasswordManagement from '../pages/Admin/PasswordManagement/PasswordManagement.jsx';
import Settings from '../pages/Admin/Settings/Settings.jsx';
import Defaulters from '../pages/Admin/Defaulters/Defaulters.jsx';
import DataExportPage from '../pages/Admin/AdminTools/DataExport/DataExportPage.jsx';
import OtpRequestsPage from '../pages/Admin/AdminTools/OtpRequests/OtpRequestsPage.jsx';
import AuctionSettingsPage from '../pages/Admin/AdminTools/AuctionSettings/AuctionSettingsPage.jsx';
import OfficeLocationPage from '../pages/Admin/AdminTools/OfficeLocation/OfficeLocationPage.jsx';
import DeviceRevocationPage from '../pages/Admin/AdminTools/DeviceRevocation/DeviceRevocationPage.jsx';
import MonthlyCollections from '../pages/Admin/MonthlyCollections/MonthlyCollections.jsx';

// ── User Pages ──
import UserHome from '../pages/User/Home/Home.jsx';
import Portfolio from '../pages/User/Portfolio/Portfolio.jsx';
import UserProfile from '../pages/User/Profile/Profile.jsx';
import UserChat from '../pages/User/Chat/UserChat.jsx';
import UserTool from '../pages/User/UserTool/UserTool.jsx';
import UserNotifications from '../pages/User/Notifications/Notifications.jsx';

// ── User Chit Pages ──
import JoinGroup from '../pages/User/JoinGroup/JoinGroup.jsx';
import GroupCard from '../pages/User/GroupCard/GroupCard.jsx';
import UserAuction from '../pages/User/Auction/Auction.jsx';
import Finance from '../pages/User/Finance/Finance.jsx';

// ── User Profile Sub-Pages ──
import AccountDetails from '../pages/User/Profile/Pages/AccountDetails.jsx';
import LinkBankAccount from '../pages/User/Profile/Pages/LinkBankAccount.jsx';
import IdentityVerification from '../pages/User/Profile/Pages/IdentityVerification.jsx';
import NomineeDetails from '../pages/User/Profile/Pages/NomineeDetails.jsx';
import SecurityPermission from '../pages/User/Profile/Pages/SecurityPermission.jsx';
import MyLocation from '../pages/User/Profile/Pages/MyLocation.jsx';
import AdminLocation from '../pages/User/Profile/Pages/AdminLocation.jsx';
import PrivacyPolicy from '../pages/User/Profile/Pages/PrivacyPolicy.jsx';
import HelpSupport from '../pages/User/Profile/Pages/HelpSupport.jsx';
import OTPRequests from '../pages/User/Profile/Pages/OTPRequests.jsx';
import LanguageSettings from '../pages/User/Profile/Pages/LanguageSettings.jsx';

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
        <Route path="monthly-collections" element={<MonthlyCollections />} />
        <Route path="chat" element={<Chat />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="manage-groups" element={<ManageGroups />} />
        <Route path="defaulters" element={<Defaulters />} />
        <Route path="manage-users" element={<ManageUsers />} />
        <Route path="user-locations" element={<UserLocation />} />
        <Route path="create-group" element={<CreateGroup />} />
        <Route path="auction" element={<Auction />} />
        <Route path="groups" element={<Navigate to="/admin/auction" replace />} />
        <Route path="block-user" element={<BlockUser />} />
        <Route path="password-management" element={<PasswordManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admintool" element={<AdminTool />} />
        <Route path="admintool/create-group" element={<Navigate to="/admin/create-group" replace />} />
        <Route path="admintool/add-user" element={<AddUser />} />
        <Route path="add-user" element={<Navigate to="/admin/admintool/add-user" replace />} />
        <Route path="admintool/data-export" element={<DataExportPage />} />
        <Route path="admintool/otp-requests" element={<OtpRequestsPage />} />
        <Route path="admintool/auction-settings" element={<AuctionSettingsPage />} />
        <Route path="admintool/office-location" element={<OfficeLocationPage />} />
        <Route path="admintool/device-revocation" element={<DeviceRevocationPage />} />
        <Route path="device-revocation" element={<Navigate to="/admin/admintool/device-revocation" replace />} />
        <Route path="admintool/monthly-collections" element={<Navigate to="/admin/monthly-collections" replace />} />
        <Route path="admintool/manage-groups" element={<Navigate to="/admin/manage-groups" replace />} />
        <Route path="admintool/manage-users" element={<Navigate to="/admin/manage-users" replace />} />
        <Route path="admintool/block-user" element={<Navigate to="/admin/block-user" replace />} />
        <Route path="admintool/password-management" element={<Navigate to="/admin/password-management" replace />} />
        <Route path="admintool/user-locations" element={<Navigate to="/admin/user-locations" replace />} />
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
        <Route path="notifications" element={<UserNotifications />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="tools" element={<UserTool />} />

        {/* Chit Actions */}
        <Route path="join-group" element={<JoinGroup />} />
        <Route path="group-card" element={<GroupCard />} />
        <Route path="auction" element={<UserAuction />} />
        <Route path="finance" element={<Finance />} />
        
        {/* Profile Sub-Pages */}
        <Route path="profile/account-details" element={<AccountDetails />} />
        <Route path="profile/link-bank-account" element={<LinkBankAccount />} />
        <Route path="profile/identity-verification" element={<IdentityVerification />} />
        <Route path="profile/nominee-details" element={<NomineeDetails />} />
        <Route path="profile/security-permission" element={<SecurityPermission />} />
        <Route path="profile/my-location" element={<MyLocation />} />
        <Route path="profile/admin-location" element={<AdminLocation />} />
        <Route path="profile/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="profile/help-support" element={<HelpSupport />} />
        <Route path="profile/otp-requests" element={<OTPRequests />} />
        <Route path="profile/language-settings" element={<LanguageSettings />} />
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppNavigation;