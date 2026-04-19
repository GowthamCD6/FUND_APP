import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header">
        <div>
          <p className="sidebar-title">GDK Admin</p>
          <p className="sidebar-subtitle">Chit Fund Control</p>
        </div>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Dashboard
        </NavLink>
        <NavLink to="/admin/reports" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Reports
        </NavLink>
        <NavLink to="/admin/groups" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Groups
        </NavLink>
        <NavLink to="/admin/users" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Users
        </NavLink>
        <NavLink to="/admin/actions" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Quick Actions
        </NavLink>
        <NavLink to="/admin/actions/create-group" className="nav-link sub-link">
          <span className="icon-dot" aria-hidden="true" />
          Create Group
        </NavLink>
        <NavLink to="/admin/actions/manage-groups" className="nav-link sub-link">
          <span className="icon-dot" aria-hidden="true" />
          Manage Groups
        </NavLink>
        <NavLink to="/admin/actions/manage-users" className="nav-link sub-link">
          <span className="icon-dot" aria-hidden="true" />
          Manage Users
        </NavLink>
        <NavLink to="/admin/actions/add-user" className="nav-link sub-link">
          <span className="icon-dot" aria-hidden="true" />
          Add User
        </NavLink>
        <NavLink to="/admin/settings" className="nav-link">
          <span className="icon-dot" aria-hidden="true" />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div>
          <p className="sidebar-user">{user?.name || 'Admin'}</p>
          <p className="sidebar-role">{user?.role || 'admin'}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
