import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupDetails from './GroupDetails.jsx';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  ArrowLeft as RiArrowLeftLine,
  Users as RiGroupLine,
  Clock as RiTimeLine,
  ChevronRight as RiArrowRightSLine,
  Check as RiCheckLine,
  Trash2 as RiDeleteBinLine,
  X as RiCloseLine,
  Info as RiInformationLine,
  UserPlus as RiUserAddLine,
  Loader2 as RiLoader4Line,
  AlertTriangle as RiAlertLine,
  Search as RiSearchLine,
  Phone as RiPhoneLine
} from 'lucide-react';

const Groups = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [longPressedGroup, setLongPressedGroup] = useState(null);

  // View state for side panel: null | 'details' | 'members' | 'addmembers'
  const [viewMode, setViewMode] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchMembers, setSearchMembers] = useState('');

  useEffect(() => {
    loadGroups();
    loadAllUsers();
  }, []);

  const loadGroups = async () => {
    setRefreshing(true);
    try {
      const response = await makeRequest('/admin/groups/getGroups', { method: 'GET' });
      const result = await safeJson(response);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to fetch groups');
      }

      const mapped = (result.data || []).map(g => ({
        id: g.id,
        name: g.name || g.group_name || 'Untitled',
        status: g.status === 'not started' ? 'Not Started' : (g.status?.charAt(0).toUpperCase() + g.status?.slice(1) || 'Not Started'),
        totalMembers: g.totalMembers || g.total_members || 0,
        currentMembers: g.currentMembers || g.totalMembers || 0,
        completedCycles: g.completedCycles || 0,
        duration: g.duration || 20,
        totalCycles: g.duration || 20,
        monthlyAmount: g.monthly_amount || Math.round((g.group_amount || 0) / (g.duration || 20)),
        groupAmount: g.groupAmount || g.group_amount || 0,
        startDate: g.startDate || g.start_date,
        endDate: g.endDate || g.end_date,
        nextDueDate: g.nextDueDate || g.next_due_date,
        collectedAmount: g.collectedAmount || 0,
        remainingAmount: g.remainingAmount || 0,
        groupCode: g.groupCode || g.group_code,
        createdDate: g.createdDate || g.created_at,
      }));
      setGroups(mapped);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await makeRequest('/admin/users/getAllUsers');
      const data = await safeJson(res);
      if (res.ok && data?.success) setAllUsers(data.data || []);
    } catch { /* silent */ }
  };

  const onRefresh = () => {
    loadGroups();
  };

  const getFilteredGroups = () => {
    return groups.filter(group => group.status === activeTab);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Not Started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // ── Long press actions (Status + Delete API) ──

  const handleLongPress = (group) => {
    if (group.status === 'Not Started') {
      setLongPressedGroup(group);
      setShowActionModal(true);
    }
  };

  const handleActivateGroup = async () => {
    setShowActionModal(false);
    if (!window.confirm(`Are you sure you want to activate "${longPressedGroup.name}"?`)) {
      setLongPressedGroup(null);
      return;
    }

    try {
      const response = await makeRequest('/admin/groups/activate', {
        method: 'POST',
        body: JSON.stringify({ groupId: longPressedGroup.id }),
      });
      const result = await safeJson(response);
      
      if (!response.ok || !result.success) throw new Error(result.message || 'Activation failed');
      
      setGroups(prevGroups =>
        prevGroups.map(g => g.id === longPressedGroup.id ? { ...g, status: 'Active' } : g)
      );
      alert('Group activated successfully');
    } catch (error) {
      console.error('Error activating group:', error);
      alert('Failed to activate group');
    } finally {
       setLongPressedGroup(null);
    }
  };

  const handleDeleteGroup = async () => {
    setShowActionModal(false);
    if (!window.confirm(`Are you sure you want to delete "${longPressedGroup.name}"? This action cannot be undone.`)) {
      setLongPressedGroup(null);
      return;
    }

    try {
      const response = await makeRequest('/admin/groups/delete', {
        method: 'POST', // or DELETE based on your setup
        body: JSON.stringify({ groupId: longPressedGroup.id }),
      });
      const result = await safeJson(response);
      
      if (!response.ok || !result.success) throw new Error(result.message || 'Deletion failed');

      setGroups(prevGroups => prevGroups.filter(g => g.id !== longPressedGroup.id));
      alert('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    } finally {
      setLongPressedGroup(null);
    }
  };

  // ── Open Details / Members Panel ──

  const openMembers = async (group, mode = 'members') => {
    setSelectedGroup(group);
    setViewMode(mode);
    setGroupMembers([]);
    setMembersLoading(true);
    setNotice(null);
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) setGroupMembers(data.data || []);
    } catch { /* silent */ }
    finally { setMembersLoading(false); }
  };

  // ── Add / Remove Members API ──

  const addMember = async (user) => {
    setAddingUser(user.id);
    try {
      const res = await makeRequest('/admin/groups/addMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId: selectedGroup.id, members: [user.id] }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to add member');
      
      setGroupMembers(prev => [...prev, { userId: user.id, name: user.name || user.nickname, phone: user.phone, nickname: user.nickname }]);
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, totalMembers: g.totalMembers + 1 } : g));
      setNotice({ text: `${user.name || user.nickname} added successfully`, success: true });
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to add member', success: false });
    }
    setAddingUser(null);
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this group?`)) return;
    try {
      const res = await makeRequest('/admin/groups/removeMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId: selectedGroup.id, members: [member.userId || member.id] }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to remove');
      
      setGroupMembers(prev => prev.filter(m => m.userId !== member.userId));
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, totalMembers: Math.max(0, g.totalMembers - 1) } : g));
      setNotice({ text: `${member.name} removed from group`, success: true });
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to remove', success: false });
    }
  };

  // ── Utils ──

  const formatDate = dateString => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getProgressPercentage = (completed, total) => {
    if (!total || total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const tabCounts = {
    active: groups.filter(g => g.status === 'Active').length,
    notStarted: groups.filter(g => g.status === 'Not Started').length,
  };

  // ── Filters for users ──
  const usersNotInGroup = useMemo(() => {
    const existing = new Set(groupMembers.map(m => m.userId));
    return allUsers.filter(u => !existing.has(u.id));
  }, [allUsers, groupMembers]);

  const filteredAvailableUsers = useMemo(() => {
    if (!searchMembers.trim()) return usersNotInGroup;
    const q = searchMembers.trim().toLowerCase();
    return usersNotInGroup.filter(u =>
      String(u.name || u.nickname || '').toLowerCase().includes(q) ||
      String(u.phone || '').includes(q)
    );
  }, [usersNotInGroup, searchMembers]);


  return (
    <div className="rn-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .mg-tab-container { display: flex; gap: 10px; padding: 16px 24px 0; background: var(--bg); }
        .mg-tab { padding: 12px 16px; border-bottom: 3px solid transparent; color: var(--muted); cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.2s; }
        .mg-tab.active { border-bottom-color: var(--primary); color: var(--primary); }
        .mg-list { padding: 0 24px; margin-top: 16px; display: flex; flexDirection: column; gap: 16px; flex: 1; overflow-y: auto; }
        
        .mg-card { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; user-select: none; }
        .mg-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
        
        .mg-card-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
        .mg-group-name { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
        .mg-status-badge { display: inline-flex; alignItems: center; gap: 4px; padding: 4px 10px; border-radius: 100px; }
        .mg-status-text { font-size: 10px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; }
        .mg-arrow-btn { background: var(--surface2); width: 32px; height: 32px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; }
        
        .mg-card-content { padding: 16px; }
        .mg-info-row { display: flex; gap: 24px; margin-bottom: 16px; }
        .mg-info-item { display: flex; alignItems: center; gap: 8px; }
        .mg-info-text { font-size: 14px; font-weight: 500; color: #374151; }
        
        .mg-progress-container { margin-bottom: 16px; }
        .mg-progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .mg-progress-text { font-size: 13px; color: #6B7280; font-weight: 500; }
        .mg-progress-pct { font-size: 13px; color: #111827; font-weight: 700; }
        .mg-progress-bar { height: 6px; background: #E5E7EB; border-radius: 100px; overflow: hidden; }
        .mg-progress-fill { height: 100%; background: #10B981; border-radius: 100px; }
        
        .mg-card-footer { display: flex; justify-content: space-between; alignItems: center; padding-top: 16px; border-top: 1px dashed var(--border); }
        .mg-date-text { font-size: 13px; color: #6B7280; font-weight: 500; }
        .mg-amount-text { font-size: 14px; color: #111827; font-weight: 700; }

        .mg-empty { text-align: center; padding: 60px 20px; color: var(--muted); }
        
        /* Modal Context Menu Overlay */
        .mg-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
        .mg-modal-content { background: #fff; width: 100%; max-width: 400px; border-radius: 20px 20px 0 0; padding: 24px; animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .mg-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: #111827; }
        .mg-modal-subtitle { font-size: 14px; color: #6B7280; margin: 0 0 20px 0; }
        .mg-action-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; border: none; background: #f9fafb; border-radius: 12px; margin-bottom: 12px; cursor: pointer; font-size: 15px; font-weight: 600; text-align: left; transition: background 0.15s; }
        .mg-action-btn:hover { background: #f3f4f6; }

        /* Slide Panel for Members & Details */
        .mg2-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:stretch; justify-content:flex-end; }
        .mg2-panel { background:var(--surface); width:100%; max-width:500px; display:flex; flex-direction:column; padding:24px 20px; overflow:hidden; animation:slideRight 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes slideRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
        .mg2-panel-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid var(--border); }
        .mg2-panel-tabs { display:flex; gap:6px; margin-bottom:14px; }
        .mg2-panel-tab { flex:1; padding:9px; border:1.5px solid var(--border); border-radius:var(--radius-sm); background:transparent; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; transition:all 0.15s; }
        .mg2-panel-tab.active { background:var(--primary); border-color:var(--primary); color:#fff; }
        .mg2-mem-row { display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--border); }
        .mg2-mem-row:last-child { border-bottom:none; }
        .mg2-mem-avatar { width:38px; height:38px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0; }
        .mg2-mem-name { margin:0 0 2px; font-size:14px; font-weight:600; color:var(--text); }
        .mg2-mem-phone { margin:0; font-size:12px; color:var(--muted); }
        .mg2-add-btn { border:none; border-radius:var(--radius-sm); padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; background:var(--success); color:#fff; transition:background 0.15s; white-space:nowrap; flex-shrink:0; }
        .mg2-add-btn:hover { background:#059669; }
        .mg2-add-btn:disabled { opacity:0.5; cursor:wait; }
        .mg2-rem-btn { border:none; border-radius:var(--radius-sm); padding:7px 12px; font-size:12px; font-weight:700; cursor:pointer; background:var(--danger-bg); color:var(--danger); transition:background 0.15s; white-space:nowrap; flex-shrink:0; }
        .mg2-rem-btn:hover { background:var(--danger); color:#fff; }
      `}</style>

      {selectedGroup && (viewMode === 'details' || viewMode === 'members' || viewMode === 'addmembers') ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GroupDetails 
            group={selectedGroup} 
            memberMappings={groupMembers}
            onBack={() => { setSelectedGroup(null); setViewMode(null); }}
            setShowMemberRegistration={(visible) => setViewMode(visible ? 'members' : 'details')}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="rn-header" style={{ margin: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="rn-back" onClick={() => navigate('/admin')}>
            <RiArrowLeftLine size={18} />
          </button>
          <div>
            <h2 className="rn-title">Manage Groups</h2>
            <p className="rn-subtitle">Right-click on pending groups for actions</p>
          </div>
        </div>
        <button 
          className="rn-primary" 
          onClick={onRefresh}
          disabled={refreshing}
          style={{ padding: '8px 16px', fontSize: 13, height: 36, display: 'flex', alignItems: 'center' }}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mg-tab-container">
        <div className={`mg-tab ${activeTab === 'Active' ? 'active' : ''}`} onClick={() => setActiveTab('Active')}>
          Active Groups ({tabCounts.active})
        </div>
        <div className={`mg-tab ${activeTab === 'Not Started' ? 'active' : ''}`} onClick={() => setActiveTab('Not Started')}>
          Not Started ({tabCounts.notStarted})
        </div>
      </div>

      {/* List */}
      <div className="mg-list">
        {getFilteredGroups().length === 0 ? (
          <div className="mg-empty">
            <RiGroupLine size={60} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No {activeTab} groups found</h3>
            <p style={{ margin: 0 }}>{activeTab === 'Active' ? 'Create a new group to get started' : 'Groups will appear here once created'}</p>
          </div>
        ) : (
          getFilteredGroups().map(item => (
            <div 
              key={item.id} 
              className="mg-card"
              onClick={() => openMembers(item, 'details')}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(item);
              }}
            >
              <div className="mg-card-header">
                <div>
                  <h3 className="mg-group-name">{item.name}</h3>
                  <div className="mg-status-badge" style={{ backgroundColor: getStatusColor(item.status) }}>
                    <RiTimeLine size={10} color="#fff" />
                    <span className="mg-status-text">
                      {item.status === 'Not Started' ? 'NOT STARTED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div className="mg-arrow-btn">
                  <RiArrowRightSLine size={20} color="#9CA3AF" />
                </div>
              </div>

              <div className="mg-card-content">
                <div className="mg-info-row">
                  <div className="mg-info-item">
                    <RiGroupLine size={16} color="#6B7280" />
                    <span className="mg-info-text">{item.totalMembers} Members</span>
                  </div>
                  <div className="mg-info-item">
                    <span style={{ fontSize: 16, color: '#6B7280', fontWeight: 'bold' }}>₹</span>
                    <span className="mg-info-text">{formatCurrency(item.monthlyAmount)}/month</span>
                  </div>
                </div>

                {item.status === 'Active' && (
                  <div className="mg-progress-container">
                    <div className="mg-progress-header">
                      <span className="mg-progress-text">{item.completedCycles}/{item.totalCycles} Cycles</span>
                      <span className="mg-progress-pct">{getProgressPercentage(item.completedCycles, item.totalCycles)}%</span>
                    </div>
                    <div className="mg-progress-bar">
                      <div className="mg-progress-fill" style={{ width: `${getProgressPercentage(item.completedCycles, item.totalCycles)}%` }} />
                    </div>
                  </div>
                )}

                <div className="mg-card-footer">
                  <span className="mg-date-text">
                    {item.status === 'Active' ? `Next Due: ${formatDate(item.nextDueDate)}` : `Start Date: ${formatDate(item.startDate)}`}
                  </span>
                  <span className="mg-amount-text">
                    {item.status === 'Active' ? `${formatCurrency(item.collectedAmount)} collected` : `${formatCurrency(item.groupAmount)} total`}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}

      {/* Slide Panel for Group Details & Members */}
      {selectedGroup && (viewMode === 'members' || viewMode === 'addmembers') && (
        <div className="mg2-panel-overlay" onClick={() => { setViewMode('details'); setNotice(null); }}>
          <div className="mg2-panel" onClick={e => e.stopPropagation()}>
            <div className="mg2-panel-head">
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>{selectedGroup.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  {formatCurrency(selectedGroup.groupAmount)}/month · {selectedGroup.totalMembers} members
                </p>
              </div>
              <button 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }} 
                onClick={() => { setSelectedGroup(null); setViewMode(null); setNotice(null); }}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="mg2-panel-tabs">
              <button className={`mg2-panel-tab${viewMode === 'members' ? ' active' : ''}`} onClick={() => { if (groupMembers.length === 0) openMembers(selectedGroup, 'members'); else setViewMode('members'); }}>
                <RiGroupLine size={14} style={{ marginRight: 5 }} /> Members
              </button>
              <button className={`mg2-panel-tab${viewMode === 'addmembers' ? ' active' : ''}`} onClick={() => setViewMode('addmembers')}>
                <RiUserAddLine size={14} style={{ marginRight: 5 }} /> Add
              </button>
            </div>

            {notice && (
              <div style={{ background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                {notice.success ? <RiCheckLine size={15} /> : <RiAlertLine size={15} />}
                {notice.text}
              </div>
            )}

            {/* Content: Details Removed */}

            {/* Content: Members */}
            {viewMode === 'members' && (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                  {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''} in this group
                </p>
                {membersLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
                    <RiLoader4Line size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                    <RiGroupLine size={32} color="var(--border)" style={{ marginBottom: 8 }} />
                    <p>No members yet.</p>
                    <button className="mg2-add-btn" onClick={() => setViewMode('addmembers')}>
                      <RiUserAddLine size={13} style={{ marginRight: 4 }} /> Add Members
                    </button>
                  </div>
                ) : (
                  groupMembers.map(m => (
                    <div key={m.userId || m.id} className="mg2-mem-row">
                      <div className="mg2-mem-avatar">{String(m.name || m.nickname || '?').charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="mg2-mem-name">{m.name || m.nickname || 'Unnamed'}</p>
                        <p className="mg2-mem-phone" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiPhoneLine size={11} /> {m.phone || '--'}</p>
                      </div>
                      <button className="mg2-rem-btn" onClick={() => removeMember(m)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Content: Add Members */}
            {viewMode === 'addmembers' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: 10 }}>
                <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <RiSearchLine size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                  <input placeholder="Search users by name or phone..." value={searchMembers} onChange={e => setSearchMembers(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 38px', border: 'none', fontSize: 14, outline: 'none' }} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                  {filteredAvailableUsers.length} available user{filteredAvailableUsers.length !== 1 ? 's' : ''}
                </p>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredAvailableUsers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>All users are already in this group.</p>
                  ) : (
                    filteredAvailableUsers.map(u => (
                      <div key={u.id} className="mg2-mem-row">
                        <div className="mg2-mem-avatar" style={{ background: '#dbeafe', color: '#3b82f6' }}>{String(u.name || u.nickname || '?').charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="mg2-mem-name">{u.name || u.nickname || 'Unnamed'}</p>
                          <p className="mg2-mem-phone" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiPhoneLine size={11} /> {u.phone || '--'}</p>
                        </div>
                        <button className="mg2-add-btn" disabled={addingUser === u.id} onClick={() => addMember(u)}>
                          {addingUser === u.id ? <RiLoader4Line size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><RiUserAddLine size={13} style={{ marginRight: 4 }} /> Add</>}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal (Right Click context menu) */}
      {showActionModal && (
        <div className="mg-modal-backdrop" onClick={() => setShowActionModal(false)}>
          <div className="mg-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <h3 className="mg-modal-title">Group Actions</h3>
              <p className="mg-modal-subtitle">{longPressedGroup?.name}</p>
            </div>

            <button className="mg-action-btn" onClick={handleActivateGroup} style={{ color: '#10B981' }}>
              <RiCheckLine size={20} /> Activate Group
            </button>
            <button className="mg-action-btn" onClick={handleDeleteGroup} style={{ color: '#EF4444' }}>
              <RiDeleteBinLine size={20} /> Delete Group
            </button>
            
            <button 
              className="mg-action-btn" 
              onClick={() => setShowActionModal(false)}
              style={{ justifyContent: 'center', color: '#6B7280', marginTop: 12, border: '1px solid var(--border)', background: 'transparent' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
