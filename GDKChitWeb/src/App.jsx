import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';

import Actions from './pages/Admin/Actions.jsx';
import AddUser from './pages/Admin/AddUser.jsx';
import CreateGroup from './pages/Admin/CreateGroup.jsx';
import Dashboard from './pages/Admin/Dashboard.jsx';
import Groups from './pages/Admin/Groups.jsx';
import Login from './pages/Login/Login.jsx';
import ManageGroups from './pages/Admin/ManageGroups.jsx';
import ManageUsers from './pages/Admin/ManageUsers.jsx';
import NotAuthorized from './pages/Login/NotAuthorized.jsx';
import NotFound from './pages/Login/NotFound.jsx';
import Reports from './pages/Admin/ReportsCard/Reports.jsx';
import Settings from './pages/Admin/Settings.jsx';



function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<NotAuthorized />} />
      <Route
        path="/admin"
        element={<AppLayout />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="groups" element={<Groups />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="actions" element={<Actions />} />
        <Route path="actions/create-group" element={<CreateGroup />} />
        <Route path="actions/add-user" element={<AddUser />} />
        <Route path="actions/manage-groups" element={<ManageGroups />} />
        <Route path="actions/manage-users" element={<ManageUsers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
