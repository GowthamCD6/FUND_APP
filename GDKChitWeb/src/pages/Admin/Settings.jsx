import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const Settings = () => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Account',
      items: ['Edit Profile', 'Security'],
    },
    {
      title: 'App Settings',
      items: ['Notifications', 'Language'],
    },
    {
      title: 'Group Management',
      items: ['Default Group Rules', 'Auction Settings'],
    },
    {
      title: 'Data & Privacy',
      items: ['Data Export', 'Block User'],
    },
  ];

  return (
    <div className="rn-page">
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Settings</h2>
          <p className="rn-subtitle">Admin preferences and security</p>
        </div>
      </div>

      <div className="rn-card rn-profile">
        <div>
          <p>Name</p>
          <strong>{user?.name || 'Admin'}</strong>
        </div>
        <div>
          <p>Role</p>
          <strong>{user?.role || 'admin'}</strong>
        </div>
        <div>
          <p>Phone</p>
          <strong>{user?.phone || '--'}</strong>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="rn-section">
          <h3 className="rn-section-title">{section.title}</h3>
          <div className="rn-sheet">
            {section.items.map((item) => (
              <div key={item} className="rn-setting-item">
                <span>{item}</span>
                <span className="rn-chevron">›</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="rn-primary rn-danger" onClick={logout}>
        Sign out
      </button>
    </div>
  );
};

export default Settings;
