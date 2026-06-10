import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus as RiAddLine, Settings as RiSettings3Line, UserPlus as RiUserAddLine, UserCog as RiUserSettingsLine,
  ChevronRight as RiArrowRightSLine, Zap as RiZapLine
} from 'lucide-react';

const ACTION_GROUPS = [
  {
    title: 'Group Management',
    actions: [
      { id: 'create-group', Icon: RiAddLine, title: 'Create Groups', desc: 'Set up a new chit fund group with a plan', route: '/admin/actions/create-group', color: '#10B981', bg: '#ecfdf5' },
      { id: 'manage-groups', Icon: RiSettings3Line, title: 'Manage Groups', desc: 'View, edit, and monitor existing groups', route: '/admin/actions/manage-groups', color: '#2842C4', bg: '#eff6ff' },
    ]
  },
  {
    title: 'User Management',
    actions: [
      { id: 'add-user', Icon: RiUserAddLine, title: 'Add User', desc: 'Add a new member or admin account', route: '/admin/actions/add-user', color: '#8B5CF6', bg: '#f5f3ff' },
      { id: 'manage-users', Icon: RiUserSettingsLine, title: 'Manage Members', desc: 'View, edit, or remove existing members', route: '/admin/actions/manage-users', color: '#F59E0B', bg: '#fffbeb' },
      { id: 'block-members', Icon: RiZapLine, title: 'Block Members', desc: 'Restrict access for specific members', route: '/admin/actions/manage-users', color: '#EF4444', bg: '#fef2f2' },
    ]
  }
];

const Actions = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-tools-page">
      <style>{`
        .admin-tools-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 8px 0;
        }
        .at-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .at-section-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
        }
        .at-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .at-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          text-align: left;
          width: 100%;
        }
        .at-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: translateY(-2px);
          border-color: #e5e7eb;
        }
        .at-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .at-content {
          flex: 1;
          min-width: 0;
        }
        .at-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
        .at-desc {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .at-arrow {
          color: #9ca3af;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .at-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {ACTION_GROUPS.map((group, idx) => (
        <div key={idx} className="at-section">
          <h3 className="at-section-title">{group.title}</h3>
          <div className="at-grid">
            {group.actions.map(action => (
              <button key={action.id} className="at-card" onClick={() => navigate(action.route)}>
                <div className="at-icon-wrap" style={{ background: action.bg }}>
                  <action.Icon size={20} color={action.color} />
                </div>
                <div className="at-content">
                  <p className="at-title">{action.title}</p>
                  <p className="at-desc">{action.desc}</p>
                </div>
                <div className="at-arrow">
                  <RiArrowRightSLine size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Actions;
