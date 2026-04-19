import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  RiArrowLeftLine, RiAddLine, RiInformationLine, RiGroupLine,
  RiUserAddLine, RiDeleteBinLine, RiCloseLine, RiLoader4Line,
  RiCheckLine, RiAlertLine, RiSearchLine, RiRefreshLine, RiPhoneLine,
} from '../../icons.jsx';

const STATUS_COLOR = {
  active: 'var(--success)', completed: 'var(--primary)',
  'not started': 'var(--warning)', pending: 'var(--warning)',
};

const ManageGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups]           = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [status, setStatus]           = useState('loading');
  const [activeTab, setActiveTab]     = useState('all');
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [groupMembers, setGroupMembers]     = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [viewMode, setViewMode]       = useState(null); // 'details' | 'members' | 'addmembers'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [delTarget, setDelTarget]     = useState(null);
  const [addingUser, setAddingUser]   = useState(null);
  const [notice, setNotice]           = useState(null); // {text, success}
  const [searchMembers, setSearchMembers] = useState('');

  // ── Load groups ──────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    try {
      setStatus('loading');
      const res  = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error();
      const mapped = (data.data || []).map(g => ({
        id:           g.id,
        name:         g.name || g.group_name || 'Untitled',
        status:       String(g.status || 'Not Started').toLowerCase(),
        totalMembers: g.totalMembers || g.total_members || 0,
        duration:     g.duration || 20,
        groupAmount:  g.groupAmount || g.group_amount || 0,
        startDate:    g.startDate || g.start_date,
        endDate:      g.endDate || g.end_date,
        createdDate:  g.createdDate || g.created_at,
        groupCode:    g.groupCode || '',
        completedCycles: g.completedCycles || 0,
      }));
      setGroups(mapped);
      setStatus('ready');
    } catch {
      setGroups([]);
      setStatus('error');
    }
  }, []);

  // ── Load all users for add-member ─────────────────────────
  const loadAllUsers = useCallback(async () => {
    try {
      const res  = await makeRequest('/admin/users/getAllUsers');
      const data = await safeJson(res);
      if (res.ok && data?.success) setAllUsers(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadGroups(); loadAllUsers(); }, [loadGroups, loadAllUsers]);

  // ── Open group members ───────────────────────────────────
  const openMembers = useCallback(async (group, mode = 'details') => {
    setSelectedGroup(group);
    setViewMode(mode);
    setGroupMembers([]);
    setMembersLoading(true);
    setNotice(null);
    try {
      const res  = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) setGroupMembers(data.data || []);
    } catch { /* silent */ }
    finally { setMembersLoading(false); }
  }, []);

  // ── Add member to group ──────────────────────────────────
  const addMember = async (user) => {
    setAddingUser(user.id);
    try {
      const res  = await makeRequest('/admin/groups/addMembers', {
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

  // ── Remove member from group ─────────────────────────────
  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this group?`)) return;
    try {
      const res  = await makeRequest('/admin/groups/removeMembers', {
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

  // ── Delete group (local only; add API if available) ──────
  const confirmDelete = (g) => { setDelTarget(g); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    setGroups(prev => prev.filter(g => g.id !== delTarget.id));
    setShowDeleteConfirm(false);
    setDelTarget(null);
    if (selectedGroup?.id === delTarget?.id) { setSelectedGroup(null); setViewMode(null); }
  };

  // ── Filters & counts ─────────────────────────────────────
  const counts = useMemo(() => ({
    all:       groups.length,
    active:    groups.filter(g => g.status === 'active').length,
    completed: groups.filter(g => g.status === 'completed').length,
    other:     groups.filter(g => g.status !== 'active' && g.status !== 'completed').length,
  }), [groups]);

  const filtered = useMemo(() => {
    if (activeTab === 'all')       return groups;
    if (activeTab === 'active')    return groups.filter(g => g.status === 'active');
    if (activeTab === 'completed') return groups.filter(g => g.status === 'completed');
    return groups.filter(g => g.status !== 'active' && g.status !== 'completed');
  }, [groups, activeTab]);

  // Users not yet in group (for add members panel)
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
    <div className="rn-page">
      <style>{`
        .mg2-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:18px; box-shadow:var(--shadow-sm); transition:box-shadow 0.18s,transform 0.18s; }
        .mg2-card:hover { box-shadow:var(--shadow); transform:translateY(-2px); }
        .mg2-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px; }
        .mg2-name { margin:0 0 6px; font-size:16px; font-weight:700; color:var(--text); }
        .mg2-badge { display:inline-flex; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; color:#fff; }
        .mg2-btn-row { display:flex; gap:6px; flex-wrap:wrap; }
        .mg2-btn { border:none; border-radius:var(--radius-sm); padding:7px 12px; font-size:12px; font-weight:600; cursor:pointer; transition:background 0.15s; }
        .mg2-btn-view { background:var(--primary-light); color:var(--primary); }
        .mg2-btn-view:hover { background:var(--primary); color:#fff; }
        .mg2-btn-members { background:#dbeafe; color:#3b82f6; }
        .mg2-btn-members:hover { background:#3b82f6; color:#fff; }
        .mg2-btn-del { background:var(--danger-bg); color:var(--danger); }
        .mg2-btn-del:hover { background:var(--danger); color:#fff; }
        .mg2-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-top:12px; border-top:1px solid var(--border); }
        .mg2-info-label { font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:2px; }
        .mg2-info-value { font-size:13px; font-weight:700; color:var(--text); }

        /* Side panel */
        .mg2-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:stretch; justify-content:flex-end; }
        .mg2-panel { background:var(--surface); width:100%; max-width:500px; display:flex; flex-direction:column; padding:24px 20px; overflow:hidden; animation:slideRight 0.28s cubic-bezier(0.34,1.56,0.64,1); }
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

      {/* Header */}
      <div className="rn-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="rn-back" onClick={()=>navigate('/admin/actions')}>
            <RiArrowLeftLine size={18}/>
          </button>
          <div>
            <h2 className="rn-title">Manage Groups</h2>
            <p className="rn-subtitle">{groups.length} total groups · Members managed via live API</p>
          </div>
        </div>
        <button className="rn-primary" style={{padding:'10px 18px',fontSize:13,width:'auto',display:'flex',alignItems:'center',gap:6}} onClick={()=>navigate('/admin/actions/create-group')}>
          <RiAddLine size={16}/> New Group
        </button>
      </div>

      {/* Tabs */}
      <div className="rn-tabs">
        {[
          {key:'all',       label:`All (${counts.all})`},
          {key:'active',    label:`Active (${counts.active})`},
          {key:'completed', label:`Completed (${counts.completed})`},
          {key:'other',     label:`Other (${counts.other})`},
        ].map(t => (
          <button key={t.key} className={`rn-tab${activeTab===t.key?' is-active':''}`} onClick={()=>setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {status === 'loading' ? (
        <div className="rn-card" style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
          <RiLoader4Line size={30} color="var(--primary)" style={{animation:'spin 1s linear infinite',marginBottom:8}}/>
          <p style={{margin:0}}>Loading groups...</p>
        </div>
      ) : status === 'error' ? (
        <div className="rn-empty">
          <RiAlertLine size={36} color="var(--danger)" style={{marginBottom:12}}/>
          <h3>Failed to load</h3>
          <p><button className="rn-primary" style={{marginTop:12,display:'flex',alignItems:'center',gap:6,margin:'12px auto 0'}} onClick={loadGroups}>
            <RiRefreshLine size={16}/> Retry
          </button></p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rn-empty"><h3>No groups found</h3><p>No {activeTab} groups yet.</p></div>
      ) : (
        <div className="rn-list">
          {filtered.map(g => {
            const sc  = STATUS_COLOR[g.status] || 'var(--muted)';
            const pct = Math.min(100, Math.round(((g.completedCycles||0) / (g.duration||20)) * 100));
            return (
              <div key={g.id} className="mg2-card">
                <div className="mg2-head">
                  <div style={{flex:1,minWidth:0}}>
                    <h3 className="mg2-name">{g.name}</h3>
                    <span className="mg2-badge" style={{background:sc}}>{g.status.toUpperCase()}</span>
                  </div>
                  <div className="mg2-btn-row">
                    <button className="mg2-btn mg2-btn-view" onClick={()=>openMembers(g,'details')}>
                      <RiInformationLine size={13} style={{marginRight:4}}/> Details
                    </button>
                    <button className="mg2-btn mg2-btn-members" onClick={()=>{if(groupMembers.length===0)openMembers(g,'members');else setViewMode('members');}}>
                      <RiGroupLine size={13} style={{marginRight:4}}/> Members
                    </button>
                    <button className="mg2-btn mg2-btn-del" onClick={()=>confirmDelete(g)}>
                      <RiDeleteBinLine size={13}/>
                    </button>
                  </div>
                </div>
                {/* Progress */}
                <div style={{display:'flex',alignItems:'center',gap:10,margin:'10px 0'}}>
                  <div style={{flex:1,height:6,background:'#EEF0FF',borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:sc,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>{pct}%</span>
                </div>
                {/* Info */}
                <div className="mg2-grid">
                  <div><span className="mg2-info-label">Members</span><span className="mg2-info-value">{g.totalMembers || '--'}</span></div>
                  <div><span className="mg2-info-label">Amount</span><span className="mg2-info-value">{formatCurrency(g.groupAmount)}</span></div>
                  <div><span className="mg2-info-label">Start Date</span><span className="mg2-info-value">{formatDate(g.startDate)}</span></div>
                  <div><span className="mg2-info-label">End Date</span><span className="mg2-info-value">{formatDate(g.endDate)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Side Panel ───────────────────────────────────── */}
      {selectedGroup && viewMode && (
        <div className="mg2-panel-overlay" onClick={()=>{setSelectedGroup(null);setViewMode(null);setNotice('');}}>
          <div className="mg2-panel" onClick={e=>e.stopPropagation()}>
            {/* Panel Header */}
            <div className="mg2-panel-head">
              <div>
                <h3 style={{margin:'0 0 4px',fontSize:17,fontWeight:800}}>{selectedGroup.name}</h3>
                <p style={{margin:0,fontSize:13,color:'var(--muted)'}}>{formatCurrency(selectedGroup.groupAmount)}/month · {selectedGroup.totalMembers} members</p>
              </div>
              <button className="rp-close-btn" onClick={()=>{setSelectedGroup(null);setViewMode(null);setNotice('');}}>
                <RiCloseLine size={16}/>
              </button>
            </div>

            {/* Panel Tabs */}
            <div className="mg2-panel-tabs">
              <button className={`mg2-panel-tab${viewMode==='details'?' active':''}`} onClick={()=>setViewMode('details')}>
                <RiInformationLine size={14} style={{marginRight:5}}/> Details
              </button>
              <button className={`mg2-panel-tab${viewMode==='members'?' active':''}`} onClick={()=>{if(groupMembers.length===0)openMembers(selectedGroup,'members');else setViewMode('members');}}>
                <RiGroupLine size={14} style={{marginRight:5}}/> Members
              </button>
              <button className={`mg2-panel-tab${viewMode==='addmembers'?' active':''}`} onClick={()=>setViewMode('addmembers')}>
                <RiUserAddLine size={14} style={{marginRight:5}}/> Add
              </button>
            </div>

            {notice && (
              <div style={{background:notice.success?'#d1fae5':'#fee2e2',color:notice.success?'#065f46':'#991b1b',padding:'10px 14px',borderRadius:'var(--radius-sm)',fontSize:13,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                {notice.success ? <RiCheckLine size={15}/> : <RiAlertLine size={15}/>}
                {notice.text}
              </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && (
              <div style={{overflowY:'auto',flex:1}}>
                {[
                  {label:'Group Name',   value:selectedGroup.name},
                  {label:'Status',       value:selectedGroup.status.toUpperCase()},
                  {label:'Total Members',value:selectedGroup.totalMembers||'--'},
                  {label:'Group Amount', value:formatCurrency(selectedGroup.groupAmount)},
                  {label:'Duration',     value:`${selectedGroup.duration} months`},
                  {label:'Start Date',   value:formatDate(selectedGroup.startDate)},
                  {label:'End Date',     value:formatDate(selectedGroup.endDate)},
                  {label:'Group Code',   value:selectedGroup.groupCode||'--'},
                  {label:'Created',      value:formatDate(selectedGroup.createdDate)},
                ].map(r => (
                  <div key={r.label} className="rn-detail-row">
                    <span>{r.label}</span>
                    <strong>{r.value||'--'}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Current Members View */}
            {viewMode === 'members' && (
              <div style={{overflowY:'auto',flex:1}}>
                <p style={{margin:'0 0 10px',fontSize:13,color:'var(--muted)',fontWeight:600}}>
                  {groupMembers.length} member{groupMembers.length!==1?'s':''} in this group
                </p>
                {membersLoading ? (
                <div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)'}}>
                  <RiLoader4Line size={28} color="var(--primary)" style={{animation:'spin 1s linear infinite'}}/>
                </div>
              ) : groupMembers.length === 0 ? (
                  <div style={{textAlign:'center',padding:'24px 0',color:'var(--muted)'}}>
                    <RiGroupLine size={32} color="var(--border)" style={{marginBottom:8}}/>
                    <p>No members yet.</p>
                    <button className="mg2-add-btn" onClick={()=>setViewMode('addmembers')}>
                      <RiUserAddLine size={13} style={{marginRight:4}}/> Add Members
                    </button>
                  </div>
                ) : (
                  groupMembers.map(m => (
                    <div key={m.userId||m.id} className="mg2-mem-row">
                      <div className="mg2-mem-avatar">{String(m.name||m.nickname||'?').charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p className="mg2-mem-name">{m.name||m.nickname||'Unnamed'}</p>
                        <p className="mg2-mem-phone" style={{display:'flex',alignItems:'center',gap:4}}><RiPhoneLine size={11}/> {m.phone||'--'}</p>
                      </div>
                      <button className="mg2-rem-btn" onClick={()=>removeMember(m)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add Members View */}
            {viewMode === 'addmembers' && (
              <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',gap:10}}>
                <div className="rn-search" style={{position:'relative'}}>
                  <RiSearchLine size={15} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}/>
                  <input placeholder="Search users..." value={searchMembers} onChange={e=>setSearchMembers(e.target.value)} style={{paddingLeft:38}}/>
                </div>
                <p style={{margin:0,fontSize:13,color:'var(--muted)',fontWeight:600}}>
                  {filteredAvailableUsers.length} available user{filteredAvailableUsers.length!==1?'s':''}
                </p>
                <div style={{overflowY:'auto',flex:1}}>
                  {filteredAvailableUsers.length === 0 ? (
                    <p style={{textAlign:'center',color:'var(--muted)',padding:'24px 0'}}>All users are already in this group.</p>
                  ) : (
                    filteredAvailableUsers.map(u => (
                      <div key={u.id} className="mg2-mem-row">
                        <div className="mg2-mem-avatar" style={{background:'#dbeafe',color:'#3b82f6'}}>{String(u.name||u.nickname||'?').charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p className="mg2-mem-name">{u.name||u.nickname||'Unnamed'}</p>
                          <p className="mg2-mem-phone" style={{display:'flex',alignItems:'center',gap:4}}><RiPhoneLine size={11}/> {u.phone||'--'}</p>
                        </div>
                        <button className="mg2-add-btn" disabled={addingUser===u.id} onClick={()=>addMember(u)}>
                          {addingUser===u.id ? <RiLoader4Line size={14} style={{animation:'spin 1s linear infinite'}}/> : <><RiUserAddLine size={13} style={{marginRight:4}}/> Add</>}
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

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="rn-modal-backdrop" onClick={()=>setShowDeleteConfirm(false)}>
          <div className="rn-modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{display:'flex',alignItems:'center',gap:8}}>
              <RiDeleteBinLine size={20} color="var(--danger)"/> Delete Group?
            </h3>
            <p style={{color:'var(--muted)',fontSize:14}}>Are you sure you want to delete <strong>{delTarget?.name}</strong>?</p>
            <div className="rn-form-row" style={{marginTop:16}}>
              <button style={{padding:12,borderRadius:'var(--radius)',border:'1px solid var(--border)',background:'var(--surface2)',fontWeight:700,cursor:'pointer',flex:1}} onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
              <button className="rn-primary rn-danger" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6}} onClick={doDelete}>
                <RiDeleteBinLine size={15}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGroups;
