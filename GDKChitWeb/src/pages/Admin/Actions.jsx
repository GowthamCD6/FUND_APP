import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine, RiSettings3Line, RiUserAddLine, RiUserSettingsLine,
  RiBarChartLine, RiMoneyDollarCircleLine, RiArrowRightSLine,
  RiZapLine, RiLightbulbLine,
} from '../../icons.jsx';

const ACTIONS = [
  { id: 'create-group',  Icon: RiAddLine,               title: 'Create Group',    desc: 'Set up a new chit fund group with a plan',     route: '/admin/actions/create-group',  color: '#10B981' },
  { id: 'manage-groups', Icon: RiSettings3Line,          title: 'Manage Groups',   desc: 'View, edit, and monitor existing groups',       route: '/admin/actions/manage-groups', color: '#2842C4' },
  { id: 'add-user',      Icon: RiUserAddLine,            title: 'Add Member',      desc: 'Add a new member or admin account',             route: '/admin/actions/add-user',      color: '#F59E0B' },
  { id: 'manage-users',  Icon: RiUserSettingsLine,       title: 'Manage Members',  desc: 'View, edit, or remove existing members',        route: '/admin/actions/manage-users',  color: '#8B5CF6' },
  { id: 'chit-plans',   Icon: RiMoneyDollarCircleLine,  title: 'Chit Plans',      desc: 'Explore available plan options (1L–5L)',        route: '/admin/groups',                color: '#EF4444' },
  { id: 'reports',       Icon: RiBarChartLine,           title: 'Reports',         desc: 'View group reports and member status',          route: '/admin/reports',               color: '#06B6D4' },
];

const Actions = () => {
  const navigate = useNavigate();

  return (
    <div className="rn-page">
      <style>{`
        .qa-card { display:flex; align-items:flex-start; gap:16px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:18px; cursor:pointer; transition:box-shadow 0.18s,transform 0.18s,border-color 0.18s; text-align:left; width:100%; }
        .qa-card:hover { box-shadow:var(--shadow); transform:translateY(-2px); border-color:var(--primary); }
        .qa-icon { width:48px; height:48px; border-radius:var(--radius); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .qa-title { margin:0 0 4px; font-size:15px; font-weight:700; color:var(--text); }
        .qa-desc { margin:0; font-size:13px; color:var(--muted); line-height:1.4; }
        .qa-arrow { margin-left:auto; align-self:center; flex-shrink:0; color:var(--muted); }
        .qa-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        @media(max-width:640px) { .qa-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="rn-header">
        <div>
          <h2 className="rn-title">Quick Actions</h2>
          <p className="rn-subtitle">Create and manage admin operations</p>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Create Group', color: '#10B981', Icon: RiAddLine },
          { label: 'Add Member',   color: '#F59E0B', Icon: RiUserAddLine },
          { label: 'View Reports', color: '#2842C4', Icon: RiBarChartLine },
        ].map(p => (
          <div key={p.label} style={{ background: `${p.color}15`, border: `1px solid ${p.color}30`, borderRadius: 100, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: p.color }}>
            <p.Icon size={14} /> {p.label}
          </div>
        ))}
      </div>

      {/* Action grid */}
      <div className="qa-grid">
        {ACTIONS.map(action => (
          <button key={action.id} className="qa-card" onClick={() => navigate(action.route)}>
            <div className="qa-icon" style={{ background: `${action.color}15` }}>
              <action.Icon size={22} color={action.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="qa-title">{action.title}</p>
              <p className="qa-desc">{action.desc}</p>
            </div>
            <span className="qa-arrow"><RiArrowRightSLine size={20} /></span>
          </button>
        ))}
      </div>

      {/* Tips */}
      <div style={{ background: 'linear-gradient(135deg,var(--surface),#F0F3FF)', border: '1px solid rgba(40,66,196,0.15)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 700, color: 'var(--text)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiLightbulbLine size={17} color="var(--warning)" /> Admin Tips
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: 13, lineHeight: 2 }}>
          <li>Use <strong>Create Group</strong> to set up a new chit fund with a plan preset</li>
          <li>Use <strong>Add Member</strong> to create web admin access for a user</li>
          <li>Check <strong>Reports</strong> regularly for overdue payment alerts</li>
          <li>Regular members (mobile app users) are managed via <strong>Manage Members</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default Actions;
