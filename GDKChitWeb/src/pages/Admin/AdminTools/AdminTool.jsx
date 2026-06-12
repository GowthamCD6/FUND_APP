import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Settings, UserPlus, UserCog,
  Zap, ArrowRight
} from 'lucide-react';

const ACTION_GROUPS = [
  {
    title: 'Group Management',
    actions: [
      { id: 'create-group', Icon: Plus, title: 'Create Groups', desc: 'Set up a new chit fund group with a plan', route: '/admin/admintool/create-group', color: '#10b981', bg: '#ecfdf5' },
      { id: 'manage-groups', Icon: Settings, title: 'Manage Groups', desc: 'View, edit, and monitor existing groups', route: '/admin/admintool/manage-groups', color: '#3b82f6', bg: '#eff6ff' },
    ]
  },
  {
    title: 'User Management',
    actions: [
      { id: 'add-user', Icon: UserPlus, title: 'Add User', desc: 'Add a new member or admin account', route: '/admin/admintool/add-user', color: '#8b5cf6', bg: '#f5f3ff' },
      { id: 'manage-users', Icon: UserCog, title: 'Manage Members', desc: 'View, edit, or remove existing members', route: '/admin/admintool/manage-users', color: '#f59e0b', bg: '#fffbeb' },
      { id: 'block-members', Icon: Zap, title: 'Block Members', desc: 'Restrict access for specific members', route: '/admin/admintool/manage-users', color: '#ef4444', bg: '#fef2f2' },
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
          gap: 40px;
          padding: 8px 0;
        }
        .at-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .at-section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .at-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
        .at-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }
        .at-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transform: translateY(-1px);
          border-color: #e2e8f0;
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
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .at-desc {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .at-arrow {
          color: #cbd5e1;
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
                  <action.Icon size={20} color={action.color} strokeWidth={2} />
                </div>
                <div className="at-content">
                  <p className="at-title">{action.title}</p>
                  <p className="at-desc">{action.desc}</p>
                </div>
                <div className="at-arrow">
                  <ArrowRight size={18} strokeWidth={2} />
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