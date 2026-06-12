import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Users as RiGroupLine, Plus as RiAddLine, UserPlus as RiUserAddLine,
  Settings as RiSettings3Line, UserCog as RiUserSettingsLine, BarChart3 as RiBarChartLine,
  CircleDollarSign as RiMoneyDollarCircleLine, Check as RiCheckLine, Clock as RiTimeLine,
  AlertTriangle as RiAlertLine, ChevronRight as RiArrowRightSLine, ShieldCheck as RiShieldUserLine,
  User as RiUserLine, Calendar as RiCalendarLine, Zap as RiZapLine,
} from 'lucide-react';
import './Dashboard.css';

const deriveStats = (groups, users) => {
  const activeGroups    = groups.filter(g => {
    const s = String(g.status || '').toLowerCase();
    return s === 'active' || s === 'ongoing';
  }).length;
  const completedGroups = groups.filter(g => String(g.status || '').toLowerCase() === 'completed').length;
  const notStarted      = groups.filter(g => {
    const s = String(g.status || '').toLowerCase();
    return s.includes('not') || s === 'not started';
  }).length;
  const totalMembers    = users.length;
  const admins          = users.filter(u => String(u.type || '').toLowerCase() === 'admin').length;
  const regularUsers    = totalMembers - admins;
  const totalPool       = groups.reduce((s, g) => s + Number(g.groupAmount || g.group_amount || 0), 0);
  const totalMonthly    = groups.filter(g => {
    const s = String(g.status || '').toLowerCase();
    return s === 'active' || s === 'ongoing';
  }).reduce((s, g) => s + Number(g.groupAmount || g.group_amount || 0), 0);
  return { activeGroups, completedGroups, notStarted, totalMembers, admins, regularUsers, totalPool, totalMonthly, totalGroups: groups.length };
};

const StatCard = ({ Icon, value, label, color }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-icon-wrapper" style={{ background: `${color}15` }}>
      <Icon size={20} color={color} />
    </div>
    <div className="dash-stat-val">{value}</div>
    <div className="dash-stat-lbl">{label}</div>
  </div>
);

const GroupRow = ({ group, onClick }) => {
  const status = String(group.status || 'active').toLowerCase();
  const sc = status === 'active' || status === 'ongoing' ? '#10B981' : status === 'completed' ? '#6B46C1' : '#6B7280';
  const pct = group.duration ? Math.min(100, Math.round(((group.completedCycles || 0) / group.duration) * 100)) : 0;
  const StatusIcon = status === 'active' || status === 'ongoing' ? RiTimeLine : status === 'completed' ? RiCheckLine : RiAlertLine;

  return (
    <div onClick={() => onClick(group)} className="dash-group-row">
      <div className="dash-group-icon-wrapper" style={{ background: `${sc}15` }}>
        <StatusIcon size={18} color={sc} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 className="dash-group-name" style={{ margin: 0 }}>{group.name || group.group_name}</h4>
          <span className="dash-group-pct-txt">{pct}%</span>
        </div>
        <div className="dash-group-pct-bar">
          <div className="dash-group-pct-fill" style={{ width: `${pct}%`, background: sc }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
        <div className="dash-group-amount">{formatCurrency(group.groupAmount || group.group_amount)}</div>
        <span className="dash-group-badge" style={{ background: `${sc}15`, color: sc }}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

/* ─── Skeleton Loaders ─── */
const StatCardSkeleton = () => (
  <div className="dash-stat-card skeleton-pulse">
    <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: 8 }} />
    <div className="skeleton-box" style={{ width: '40%', height: 20, margin: '4px 0' }} />
    <div className="skeleton-box" style={{ width: '60%', height: 11 }} />
  </div>
);

const GroupRowSkeleton = () => (
  <div className="dash-group-row skeleton-pulse" style={{ pointerEvents: 'none' }}>
    <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div className="skeleton-box" style={{ width: '50%', height: 14, marginBottom: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skeleton-box" style={{ flex: 1, height: 4 }} />
        <div className="skeleton-box" style={{ width: 20, height: 11 }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 4, marginLeft: 16 }}>
      <div className="skeleton-box" style={{ width: 60, height: 14 }} />
      <div className="skeleton-box" style={{ width: 50, height: 14 }} />
    </div>
  </div>
);

const UserPillSkeleton = () => (
  <div className="dash-user-pill skeleton-pulse" style={{ pointerEvents: 'none' }}>
    <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div className="skeleton-box" style={{ width: '40%', height: 14, marginBottom: 6 }} />
      <div className="skeleton-box" style={{ width: '30%', height: 12 }} />
    </div>
    <div className="skeleton-box" style={{ width: 45, height: 14 }} />
  </div>
);

const PoolBannerSkeleton = () => (
  <div className="dash-pool-banner skeleton-pulse">
    <div className="skeleton-box" style={{ width: '30%', height: 14, marginBottom: 8 }} />
    <div className="skeleton-box" style={{ width: '50%', height: 32, marginBottom: 16 }} />
    <div style={{ display: 'flex', gap: 32 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton-box" style={{ width: 60, height: 11, marginBottom: 6 }} />
          <div className="skeleton-box" style={{ width: 40, height: 16 }} />
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, uRes] = await Promise.all([makeRequest('/admin/groups/getGroups'), makeRequest('/admin/users/getAllUsers')]);
      const [gData, uData] = await Promise.all([safeJson(gRes), safeJson(uRes)]);
      if (gRes.ok && gData?.success) setGroups(gData.data || []);
      if (uRes.ok && uData?.success) setUsers(uData.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = deriveStats(groups, users);
  const activeGroupList = groups.filter(g => {
    const s = String(g.status || '').toLowerCase();
    return s === 'active' || s === 'ongoing';
  });

  const quickActions = [
    { title: 'Create Group',   Icon: RiAddLine,          color: '#10B981', route: '/admin/admintool/create-group' },
    { title: 'Add Member',     Icon: RiUserAddLine,      color: '#F59E0B', route: '/admin/admintool/add-user' },
    { title: 'Manage Groups',  Icon: RiSettings3Line,    color: '#2842C4', route: '/admin/manage-groups' },
    { title: 'Manage Members', Icon: RiUserSettingsLine, color: '#8B5CF6', route: '/admin/manage-users' },
    { title: 'Reports',        Icon: RiBarChartLine,     color: '#06B6D4', route: '/admin/reports' },
    { title: 'Chit Plans',     Icon: RiMoneyDollarCircleLine, color: '#EF4444', route: '/admin/groups' },
  ];

  return (
    <div className="rn-page">

      {loading ? (
        <>
          {/* Stats Skeletons */}
          <div className="dash-stat-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Pool Banner Skeleton */}
          <PoolBannerSkeleton />

          {/* Group List Skeleton */}
          <section>
            <div className="dash-section-header">
              <div className="dash-section-title-group">
                <RiTimeLine size={16} color="#10B981" />
                <h3 className="dash-section-title">Active Groups</h3>
              </div>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <GroupRowSkeleton key={i} />
              ))}
            </div>
          </section>

          {/* Users List Skeleton */}
          <section>
            <div className="dash-section-header">
              <div className="dash-section-title-group">
                <RiGroupLine size={16} color="var(--primary)" />
                <h3 className="dash-section-title">Recent Members</h3>
              </div>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <UserPillSkeleton key={i} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Stats */}
          <div className="dash-stat-grid">
            <StatCard Icon={RiGroupLine}             value={stats.totalMembers}    label="Total Members"   color="var(--primary)" />
            <StatCard Icon={RiTimeLine}              value={stats.activeGroups}    label="Active Groups"   color="#10B981" />
            <StatCard Icon={RiCheckLine}             value={stats.completedGroups} label="Completed"        color="#6B46C1" />
            <StatCard Icon={RiUserLine}              value={stats.regularUsers}    label="Regular Users"   color="#F59E0B" />
            <StatCard Icon={RiShieldUserLine}        value={stats.admins}          label="Admin Users"     color="#8B5CF6" />
            <StatCard Icon={RiBarChartLine}          value={stats.totalGroups}     label="Total Groups"    color="#EF4444" />
          </div>

          {/* Pool totals banner */}
          <div className="dash-pool-banner">
            <p className="dash-pool-lbl">
              <RiMoneyDollarCircleLine size={16} /> TOTAL FUND POOL (All Groups)
            </p>
            <h2 className="dash-pool-val">{formatCurrency(stats.totalPool)}</h2>
            <div className="dash-pool-stats">
              {[
                { label: 'ACTIVE POOL',   val: formatCurrency(stats.totalMonthly) },
                { label: 'ACTIVE GROUPS', val: stats.activeGroups },
                { label: 'MEMBERS',       val: stats.totalMembers },
              ].map(s => (
                <div key={s.label}>
                  <p className="dash-pool-stat-lbl">{s.label}</p>
                  <p className="dash-pool-stat-val">{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <section>
            <div className="dash-section-header">
              <div className="dash-section-title-group">
                <RiZapLine size={16} color="var(--primary)" />
                <h3 className="dash-section-title">Quick Actions</h3>
              </div>
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
            <div className="dash-section-header">
              <div className="dash-section-title-group">
                <RiTimeLine size={16} color="#10B981" />
                <h3 className="dash-section-title">Active Groups ({activeGroupList.length})</h3>
              </div>
              <button onClick={() => navigate('/admin/reports')} className="dash-section-link">
                View All <RiArrowRightSLine size={16} />
              </button>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }}>
              {activeGroupList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                  No active groups yet.
                  <button onClick={() => navigate('/admin/admintool/create-group')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}>
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
            <div className="dash-section-header">
              <div className="dash-section-title-group">
                <RiGroupLine size={16} color="var(--primary)" />
                <h3 className="dash-section-title">Recent Members ({users.length})</h3>
              </div>
              <button onClick={() => navigate('/admin/users')} className="dash-section-link">
                View All <RiArrowRightSLine size={16} />
              </button>
            </div>
            <div className="rn-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }}>
              {users.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>No members found.</div>
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
                        <h4 className="dash-user-name" style={{ margin: 0 }}>{user.name || user.nickname || 'Unnamed'}</h4>
                        <p className="dash-user-meta">
                          <RiCalendarLine size={11} /> {user.phone || '--'}
                        </p>
                      </div>
                      <span className="dash-user-badge" style={{ background: user.type === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: user.type === 'admin' ? '#8B5CF6' : '#3b82f6' }}>
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
              <div className="dash-section-header">
                <div className="dash-section-title-group">
                  <RiBarChartLine size={16} color="var(--primary)" />
                  <h3 className="dash-section-title">Group Status Breakdown</h3>
                </div>
              </div>
              <div className="rn-card" style={{ border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: 'none' }}>
                {[
                  { label: 'Active',      count: stats.activeGroups,    color: '#10B981', Icon: RiTimeLine },
                  { label: 'Completed',   count: stats.completedGroups, color: '#6B46C1', Icon: RiCheckLine },
                  { label: 'Not Started', count: stats.notStarted,      color: '#6B7280', Icon: RiAlertLine },
                ].map(s => {
                  const pct = stats.totalGroups > 0 ? Math.round((s.count / stats.totalGroups) * 100) : 0;
                  return (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <s.Icon size={18} color={s.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#030712' }}>{s.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count} groups</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 3, transition: 'width 0.8s' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
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
