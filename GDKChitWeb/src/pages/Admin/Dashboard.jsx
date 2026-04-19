import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency } from '../../utils/formatters.js';
import {
  RiGroupLine, RiRefreshLine, RiAddLine, RiUserAddLine,
  RiSettings3Line, RiUserSettingsLine, RiBarChartLine,
  RiMoneyDollarCircleLine, RiCheckLine, RiTimeLine,
  RiAlertLine, RiArrowRightSLine, RiShieldUserLine,
  RiUserLine, RiCalendarLine, RiLoader4Line, RiZapLine,
} from '../../icons.jsx';

const deriveStats = (groups, users) => {
  const activeGroups    = groups.filter(g => String(g.status || '').toLowerCase() === 'active').length;
  const completedGroups = groups.filter(g => String(g.status || '').toLowerCase() === 'completed').length;
  const notStarted      = groups.filter(g => String(g.status || '').toLowerCase().includes('not')).length;
  const totalMembers    = users.length;
  const admins          = users.filter(u => String(u.type || '').toLowerCase() === 'admin').length;
  const regularUsers    = totalMembers - admins;
  const totalPool       = groups.reduce((s, g) => s + Number(g.groupAmount || g.group_amount || 0), 0);
  const totalMonthly    = groups.filter(g => String(g.status || '').toLowerCase() === 'active')
    .reduce((s, g) => s + Number(g.groupAmount || g.group_amount || 0), 0);
  return { activeGroups, completedGroups, notStarted, totalMembers, admins, regularUsers, totalPool, totalMonthly, totalGroups: groups.length };
};

const StatCard = ({ Icon, value, label, color }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

const GroupRow = ({ group, onClick }) => {
  const status = String(group.status || 'active').toLowerCase();
  const sc = status === 'active' ? 'var(--success)' : status === 'completed' ? 'var(--primary)' : 'var(--warning)';
  const pct = group.duration ? Math.min(100, Math.round(((group.completedCycles || 0) / group.duration) * 100)) : 0;
  const StatusIcon = status === 'active' ? RiTimeLine : status === 'completed' ? RiCheckLine : RiAlertLine;

  return (
    <div
      onClick={() => onClick(group)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.14s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <StatusIcon size={18} color={sc} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name || group.group_name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: '#EEF0FF', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: sc, borderRadius: 2, transition: 'width 0.6s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(group.groupAmount || group.group_amount)}</div>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 100, background: `${sc}15`, color: sc, fontSize: 10, fontWeight: 700, marginTop: 2 }}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, uRes] = await Promise.all([makeRequest('/admin/groups/getGroups'), makeRequest('/admin/users/getAllUsers')]);
      const [gData, uData] = await Promise.all([safeJson(gRes), safeJson(uRes)]);
      if (gRes.ok && gData?.success) setGroups(gData.data || []);
      if (uRes.ok && uData?.success) setUsers(uData.data || []);
    } catch {}
    finally { setLoading(false); setLastRefresh(new Date()); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = deriveStats(groups, users);
  const activeGroupList = groups.filter(g => String(g.status || '').toLowerCase() === 'active');

  const quickActions = [
    { title: 'Create Group',   Icon: RiAddLine,          color: '#10B981', route: '/admin/actions/create-group' },
    { title: 'Add Member',     Icon: RiUserAddLine,      color: '#F59E0B', route: '/admin/actions/add-user' },
    { title: 'Manage Groups',  Icon: RiSettings3Line,    color: '#2842C4', route: '/admin/actions/manage-groups' },
    { title: 'Manage Members', Icon: RiUserSettingsLine, color: '#8B5CF6', route: '/admin/actions/manage-users' },
    { title: 'Reports',        Icon: RiBarChartLine,     color: '#06B6D4', route: '/admin/reports' },
    { title: 'Chit Plans',     Icon: RiMoneyDollarCircleLine, color: '#EF4444', route: '/admin/groups' },
  ];

  return (
    <div className="rn-page">
      <style>{`
        .dash-stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
        .dash-qa-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .dash-qa-btn    { display:flex; flex-direction:column; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px 12px; cursor:pointer; transition:all 0.18s; text-align:center; }
        .dash-qa-btn:hover { box-shadow:var(--shadow); transform:translateY(-2px); border-color:var(--primary); }
        .dash-qa-icon   { width:44px; height:44px; border-radius:var(--radius); display:flex; align-items:center; justify-content:center; }
        .dash-qa-label  { font-size:12px; font-weight:700; color:var(--text); line-height:1.3; }
        .dash-user-pill { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); }
        .dash-user-pill:last-child { border-bottom:none; }
        .dash-user-avatar { width:36px; height:36px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0; }
        @media(max-width:640px) { .dash-qa-grid{grid-template-columns:repeat(2,1fr);} .dash-stat-grid{grid-template-columns:repeat(2,1fr);} }
      `}</style>

      {/* Header */}
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Dashboard</h2>
          <p className="rn-subtitle">
            {lastRefresh.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          className="rn-notify"
          onClick={load}
          title="Refresh data"
          style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
        >
          <RiRefreshLine size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <RiLoader4Line size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p>Loading live data from server...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="dash-stat-grid">
            <StatCard Icon={RiGroupLine}             value={stats.totalMembers}    label="Total Members"   color="var(--primary)" />
            <StatCard Icon={RiTimeLine}              value={stats.activeGroups}    label="Active Groups"   color="var(--success)" />
            <StatCard Icon={RiCheckLine}             value={stats.completedGroups} label="Completed"        color="#06B6D4" />
            <StatCard Icon={RiUserLine}              value={stats.regularUsers}    label="Regular Users"   color="var(--warning)" />
            <StatCard Icon={RiShieldUserLine}        value={stats.admins}          label="Admin Users"     color="#8B5CF6" />
            <StatCard Icon={RiBarChartLine}          value={stats.totalGroups}     label="Total Groups"    color="#EF4444" />
          </div>

          {/* Pool totals banner */}
          <div style={{ background: 'linear-gradient(135deg,var(--primary),#1e34b0)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', color: '#fff' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiMoneyDollarCircleLine size={16} /> TOTAL FUND POOL (All Groups)
            </p>
            <h2 style={{ margin: '0 0 16px', fontSize: 34, fontWeight: 900 }}>{formatCurrency(stats.totalPool)}</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'ACTIVE POOL',   val: formatCurrency(stats.totalMonthly) },
                { label: 'ACTIVE GROUPS', val: stats.activeGroups },
                { label: 'MEMBERS',       val: stats.totalMembers },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ margin: 0, fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <RiZapLine size={16} color="var(--primary)" />
              <h3 className="rn-section-title" style={{ margin: 0 }}>Quick Actions</h3>
            </div>
            <div className="dash-qa-grid">
              {quickActions.map(a => (
                <button key={a.title} className="dash-qa-btn" onClick={() => navigate(a.route)}>
                  <div className="dash-qa-icon" style={{ background: `${a.color}15` }}>
                    <a.Icon size={22} color={a.color} />
                  </div>
                  <span className="dash-qa-label">{a.title}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Active Groups */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiTimeLine size={16} color="var(--success)" />
                <h3 className="rn-section-title" style={{ margin: 0 }}>Active Groups ({activeGroupList.length})</h3>
              </div>
              <button onClick={() => navigate('/admin/reports')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <RiArrowRightSLine size={16} />
              </button>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden' }}>
              {activeGroupList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                  No active groups yet.
                  <button onClick={() => navigate('/admin/actions/create-group')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}>
                    Create one <RiArrowRightSLine size={14} style={{ verticalAlign: 'middle' }} />
                  </button>
                </div>
              ) : (
                activeGroupList.slice(0, 5).map(g => (
                  <GroupRow key={g.id} group={g} onClick={() => navigate('/admin/reports')} />
                ))
              )}
            </div>
          </section>

          {/* Recent Members */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiGroupLine size={16} color="var(--primary)" />
                <h3 className="rn-section-title" style={{ margin: 0 }}>Recent Members ({users.length})</h3>
              </div>
              <button onClick={() => navigate('/admin/users')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <RiArrowRightSLine size={16} />
              </button>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden' }}>
              {users.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No members found.</div>
              ) : (
                [...users]
                  .sort((a, b) => new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0))
                  .slice(0, 6)
                  .map(user => (
                    <div key={user.id} className="dash-user-pill">
                      <div className="dash-user-avatar">
                        {String(user.name || user.nickname || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name || user.nickname || 'Unnamed'}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RiCalendarLine size={11} /> {user.phone || '--'}
                        </p>
                      </div>
                      <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: user.type === 'admin' ? 'var(--primary-light)' : '#dbeafe', color: user.type === 'admin' ? 'var(--primary)' : '#3b82f6' }}>
                        {user.type === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Group Status Breakdown */}
          {groups.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RiBarChartLine size={16} color="var(--primary)" />
                <h3 className="rn-section-title" style={{ margin: 0 }}>Group Status Breakdown</h3>
              </div>
              <div className="rn-card">
                {[
                  { label: 'Active',      count: stats.activeGroups,    color: 'var(--success)', Icon: RiTimeLine },
                  { label: 'Completed',   count: stats.completedGroups, color: 'var(--primary)', Icon: RiCheckLine },
                  { label: 'Not Started', count: stats.notStarted,      color: 'var(--warning)', Icon: RiAlertLine },
                ].map(s => {
                  const pct = stats.totalGroups > 0 ? Math.round((s.count / stats.totalGroups) * 100) : 0;
                  return (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <s.Icon size={18} color={s.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count} groups</span>
                        </div>
                        <div style={{ height: 8, background: '#EEF0FF', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.8s' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
