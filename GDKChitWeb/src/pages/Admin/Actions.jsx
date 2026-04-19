import React from 'react';
import { useNavigate } from 'react-router-dom';

const Actions = () => {
  const navigate = useNavigate();

  return (
    <div className="rn-page">
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Quick Actions</h2>
          <p className="rn-subtitle">Create and manage admin operations</p>
        </div>
      </div>

      <div className="rn-sheet">
        <button className="rn-menu-item" onClick={() => navigate('/admin/actions/create-group')}>
          <span className="rn-menu-icon" />
          <div>
            <p className="rn-menu-title">Create Group</p>
            <p className="rn-menu-desc">Create a new chit fund group</p>
          </div>
        </button>
        <button className="rn-menu-item" onClick={() => navigate('/admin/actions/manage-groups')}>
          <span className="rn-menu-icon" />
          <div>
            <p className="rn-menu-title">Manage Groups</p>
            <p className="rn-menu-desc">View, edit or manage existing groups</p>
          </div>
        </button>
        <button className="rn-menu-item" onClick={() => navigate('/admin/actions/manage-users')}>
          <span className="rn-menu-icon" />
          <div>
            <p className="rn-menu-title">Manage User</p>
            <p className="rn-menu-desc">View or manage existing users</p>
          </div>
        </button>
        <button className="rn-menu-item" onClick={() => navigate('/admin/actions/add-user')}>
          <span className="rn-menu-icon" />
          <div>
            <p className="rn-menu-title">Add User</p>
            <p className="rn-menu-desc">Add a new user to the system</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Actions;
