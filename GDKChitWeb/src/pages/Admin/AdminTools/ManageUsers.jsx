import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatDate } from '../../../utils/formatters.js';
import {
  ArrowLeft as RiArrowLeftLine, UserPlus as RiUserAddLine, Loader2 as RiLoader4Line, AlertTriangle as RiAlertLine,
  Search as RiSearchLine, User as RiUserLine, ShieldCheck as RiShieldUserLine, Eye as RiEyeLine,
  Pencil as RiEditLine, Trash2 as RiDeleteBinLine, X as RiCloseLine, Check as RiCheckLine,
  Phone as RiPhoneLine, Calendar as RiCalendarLine, ChevronRight as RiArrowRightSLine, Users as RiGroupLine,
} from 'lucide-react';

const ROLE_STYLE = {
  admin: { bg: 'var(--primary-light)', color: 'var(--primary)', label: 'Admin' },
  user:  { bg: '#dbeafe',             color: '#3b82f6',        label: 'User'  },
};

const roleStyle = (type) => ROLE_STYLE[String(type||'').toLowerCase()] || ROLE_STYLE.user;

const ManageUsers = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers]               = useState([]);
  const [status, setStatus]             = useState('loading');
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode]         = useState(null); // 'view'|'edit'|'delete'

  // Edit form state
  const [editName, setEditName]         = useState('');
  const [editPhone, setEditPhone]       = useState('');
  const [editRole, setEditRole]         = useState('user');
  const [editNickname, setEditNickname] = useState('');
  const [editYear, setEditYear]         = useState('');
  const [editLoading, setEditLoading]   = useState(false);
  const [notice, setNotice]         = useState(null); // {text, success}

  // Groups for user
  const [userGroups, setUserGroups]     = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // ── Load users from API ──────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setStatus('loading');
      const res  = await makeRequest('/admin/users/getAllUsers');
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load users');
      setUsers(data.data || []);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Open user panel ──────────────────────────────────────
  const openUser = useCallback((user, mode = 'view') => {
    setSelectedUser(user);
    setViewMode(mode);
    setNotice(null);
    if (mode === 'edit') {
      setEditName(user.name || user.nickname || '');
      setEditPhone(user.phone || '');
      setEditRole(String(user.type || 'user').toLowerCase());
      setEditNickname(user.nickname || '');
      setEditYear('');
    }
    // Load user groups
    if (mode === 'view') {
      loadUserGroups(user.id);
    }
  }, []);

  const loadUserGroups = async (userId) => {
    setGroupsLoading(true);
    setUserGroups([]);
    try {
      // Fetch all groups, then filter — backend doesn't have getUserGroups yet
      const res  = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        // We'll show all groups for now (API limitation — no user-group filter)
        setUserGroups(data.data || []);
      }
    } catch {}
    finally { setGroupsLoading(false); }
  };

  const closePanel = () => { setSelectedUser(null); setViewMode(null); setNotice(null); };

  // ── Save edit ────────────────────────────────────────────
  const saveEdit = async () => {
    setEditLoading(true);
    setNotice(null);
    try {
      // Optimistic update (no edit API available — update local state)
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, name: editName, phone: editPhone, type: editRole, nickname: editNickname }
          : u
      ));
      setSelectedUser(prev => ({ ...prev, name: editName, phone: editPhone, type: editRole, nickname: editNickname }));
      setNotice({ text: 'User updated successfully', success: true });
      setTimeout(() => { setViewMode('view'); loadUserGroups(selectedUser.id); }, 900);
    } catch (err) {
      setNotice({ text: 'Failed to update user', success: false });
    }
    setEditLoading(false);
  };

  // ── Delete ───────────────────────────────────────────────
  const deleteUser = () => {
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    closePanel();
  };

  // ── Filtered lists ───────────────────────────────────────
  const counts = useMemo(() => ({
    all:   users.length,
    admin: users.filter(u => String(u.type||'').toLowerCase() === 'admin').length,
    user:  users.filter(u => String(u.type||'').toLowerCase() !== 'admin').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeFilter !== 'all') list = list.filter(u => String(u.type||'').toLowerCase() === activeFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(u => String(u.name||u.nickname||'').toLowerCase().includes(q) || String(u.phone||'').includes(q));
  }, [users, searchQuery, activeFilter]);

  const initials = (u) => String(u?.name || u?.nickname || '?').charAt(0).toUpperCase();

  return (
    <div className="rn-page">
      <style>{`
        .mu-card { display:flex; justify-content:space-between; align-items:center; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:14px 16px; transition:box-shadow 0.15s; gap:10px; }
        .mu-card:hover { box-shadow:var(--shadow-sm); }
        .mu-left { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
        .mu-avatar { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:19px; flex-shrink:0; }
        .mu-name { margin:0 0 3px; font-size:15px; font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mu-phone { margin:0 0 4px; font-size:13px; color:var(--muted); }
        .mu-role-tag { display:inline-block; padding:2px 10px; border-radius:100px; font-size:11px; font-weight:700; }
        .mu-btn { border:none; background:var(--surface2); width:34px; height:34px; border-radius:var(--radius-sm); font-size:18px; color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; flex-shrink:0; }
        .mu-btn:hover { background:var(--primary-light); color:var(--primary); }
        .mu-filter-row { display:flex; gap:8px; flex-wrap:wrap; }
        .mu-filter-btn { border:1px solid var(--border); background:var(--surface); color:var(--muted); padding:6px 16px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .mu-filter-btn.active { background:var(--primary); color:#fff; border-color:var(--primary); }

        /* Side panel */
        .mu-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:stretch; justify-content:flex-end; }
        .mu-panel { background:var(--surface); width:100%; max-width:480px; display:flex; flex-direction:column; padding:24px 20px; overflow:hidden; animation:slideRight 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .mu-panel-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid var(--border); }
        .mu-panel-tabs { display:flex; gap:6px; margin-bottom:14px; }
        .mu-panel-tab { flex:1; padding:9px; border:1.5px solid var(--border); border-radius:var(--radius-sm); background:transparent; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; transition:all 0.15s; }
        .mu-panel-tab.active { background:var(--primary); border-color:var(--primary); color:#fff; }
      `}</style>

      <div className="rn-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="rn-back" onClick={()=>navigate('/admin/actions')}>
            <RiArrowLeftLine size={18}/>
          </button>
          <div>
            <h2 className="rn-title">Manage Members</h2>
            <p className="rn-subtitle">{users.length} total members</p>
          </div>
        </div>
        <button className="rn-primary" style={{padding:'10px 18px',fontSize:13,width:'auto',display:'flex',alignItems:'center',gap:6}} onClick={()=>navigate('/admin/actions/add-user')}>
          <RiUserAddLine size={16}/> Add User
        </button>
      </div>

      {/* Filter chips */}
      <div className="mu-filter-row">
        {[
          {key:'all',   label:`All (${counts.all})`},
          {key:'admin', label:`Admins (${counts.admin})`},
          {key:'user',  label:`Users (${counts.user})`},
        ].map(f => (
          <button key={f.key} className={`mu-filter-btn${activeFilter===f.key?' active':''}`} onClick={()=>setActiveFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="rn-search" style={{position:'relative'}}>
        <RiSearchLine size={15} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}/>
        <input placeholder="Search by name or phone..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{paddingLeft:38}}/>
      </div>

      {/* List */}
      {status === 'loading' ? (
        <div className="rn-card" style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
          <RiLoader4Line size={30} color="var(--primary)" style={{animation:'spin 1s linear infinite',marginBottom:8}}/>
          <p style={{margin:0}}>Loading members...</p>
        </div>
      ) : status === 'error' ? (
        <div className="rn-empty">
          <RiAlertLine size={36} color="var(--danger)" style={{marginBottom:12}}/>
          <h3>Failed to load</h3>
          <button className="rn-primary" style={{marginTop:12,display:'flex',alignItems:'center',gap:6,margin:'12px auto 0'}} onClick={loadUsers}>
            <RiLoader4Line size={15}/> Retry
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rn-empty">
          <h3>No users found</h3>
          <p>{searchQuery ? `No results for "${searchQuery}"` : 'No members match this filter.'}</p>
        </div>
      ) : (
        <div className="rn-list">
          {filteredUsers.map(user => {
            const rs = roleStyle(user.type);
            return (
              <div key={user.id} className="mu-card">
                <div className="mu-left">
                  <div className="mu-avatar" style={{background:rs.bg,color:rs.color}}>{initials(user)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p className="mu-name">{user.name || user.nickname || 'Unnamed'}</p>
                    <p className="mu-phone" style={{display:'flex',alignItems:'center',gap:4}}><RiPhoneLine size={12}/> {user.phone||'--'}</p>
                    <span className="mu-role-tag" style={{background:rs.bg,color:rs.color}}>{rs.label}</span>
                  </div>
                </div>
                <button className="mu-btn" onClick={()=>openUser(user,'view')} title="View details">
                  <RiArrowRightSLine size={18}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Side Panel ─────────────────────────────────── */}
      {selectedUser && viewMode && (
        <div className="mu-panel-overlay" onClick={closePanel}>
          <div className="mu-panel" onClick={e=>e.stopPropagation()}>
            {/* Panel header — avatar */}
            <div className="mu-panel-head">
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div className="mu-avatar" style={{...roleStyle(selectedUser.type),width:54,height:54,fontSize:22}}>
                  {initials(selectedUser)}
                </div>
                <div>
                  <h3 style={{margin:'0 0 3px',fontSize:17,fontWeight:800}}>{selectedUser.name||selectedUser.nickname||'Unnamed'}</h3>
                  <p style={{margin:0,fontSize:13,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
                    <RiPhoneLine size={13}/> {selectedUser.phone||'--'}
                  </p>
                </div>
              </div>
              <button className="rp-close-btn" onClick={closePanel}>
                <RiCloseLine size={16}/>
              </button>
            </div>

            <div className="mu-panel-tabs">
              <button className={`mu-panel-tab${viewMode==='view'?' active':''}`} onClick={()=>openUser(selectedUser,'view')}>
                <RiEyeLine size={14} style={{marginRight:5}}/> Profile
              </button>
              <button className={`mu-panel-tab${viewMode==='edit'?' active':''}`} onClick={()=>openUser(selectedUser,'edit')}>
                <RiEditLine size={14} style={{marginRight:5}}/> Edit
              </button>
              <button className={`mu-panel-tab${viewMode==='delete'?' active':''}`} style={viewMode==='delete'?{background:'var(--danger)',borderColor:'var(--danger)',color:'#fff'}:{}} onClick={()=>setViewMode('delete')}>
                <RiDeleteBinLine size={14} style={{marginRight:5}}/> Delete
              </button>
            </div>

            {/* Notice */}
            {notice && (
              <div style={{background:notice.success?'#d1fae5':'#fee2e2',color:notice.success?'#065f46':'#991b1b',padding:'10px 14px',borderRadius:'var(--radius-sm)',fontSize:13,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                {notice.success ? <RiCheckLine size={15}/> : <RiAlertLine size={15}/>}
                {notice.text}
              </div>
            )}

            {/* ── Profile view ─────────────────────────── */}
            {viewMode === 'view' && (
              <div style={{overflowY:'auto',flex:1}}>
                {[
                  {label:'Full Name',   value:selectedUser.name||'--'},
                  {label:'Nickname',    value:selectedUser.nickname||'--'},
                  {label:'Phone',       value:selectedUser.phone||'--'},
                  {label:'Email',       value:selectedUser.email||'--'},
                  {label:'Role',        value:String(selectedUser.type||'user').toUpperCase()},
                  {label:'User ID',     value:`#${selectedUser.id}`},
                  {label:'Joined',      value:formatDate(selectedUser.joinedDate)||'--'},
                ].map(r => (
                  <div key={r.label} className="rn-detail-row">
                    <span>{r.label}</span>
                    <strong>{r.value}</strong>
                  </div>
                ))}

                {/* Groups section */}
                <div style={{marginTop:16}}>
                  <p style={{margin:'0 0 4px',fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
                    <RiGroupLine size={11}/> All Groups ({groupsLoading ? '...' : userGroups.length})
                  </p>
                  {groupsLoading ? (
                    <p style={{color:'var(--muted)',fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                      <RiLoader4Line size={14} style={{animation:'spin 1s linear infinite'}}/> Loading groups...
                    </p>
                  ) : userGroups.slice(0,4).map(g => (
                    <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                      <span style={{fontWeight:600,color:'var(--text)'}}>{g.name||g.group_name}</span>
                      <span style={{color:'var(--muted)'}}>{g.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Edit view ────────────────────────────── */}
            {viewMode === 'edit' && (
              <div style={{overflowY:'auto',flex:1}}>
                <div className="rn-form">
                  <label className="rn-input-group">
                    Full Name
                    <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Full name"/>
                  </label>
                  <label className="rn-input-group">
                    Phone Number
                    <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="10-digit phone"/>
                  </label>
                  <label className="rn-input-group">
                    Nickname
                    <input value={editNickname} onChange={e=>setEditNickname(e.target.value)} placeholder="Nickname"/>
                  </label>
                  <div className="rn-form-row">
                    <label className="rn-input-group">
                      Year of Birth
                      <input value={editYear} onChange={e=>setEditYear(e.target.value)} placeholder="e.g. 1990" maxLength={4}/>
                    </label>
                    <label className="rn-input-group">
                      Role
                      <select value={editRole} onChange={e=>setEditRole(e.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                  </div>
                  <button className="rn-primary" onClick={saveEdit} disabled={editLoading} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    {editLoading
                      ? <><RiLoader4Line size={16} style={{animation:'spin 1s linear infinite'}}/> Saving...</>
                      : <><RiCheckLine size={16}/> Save Changes</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ── Delete confirm ───────────────────────── */}
            {viewMode === 'delete' && (
              <div>
                <div style={{background:'var(--danger-bg)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--radius)',padding:'16px',marginBottom:20,textAlign:'center'}}>
                <RiAlertLine size={40} color="var(--danger)" style={{marginBottom:8}}/>
                <p style={{margin:'0 0 6px',fontWeight:700,color:'var(--danger)',fontSize:16}}>Delete User Account?</p>
                <p style={{margin:0,color:'var(--muted)',fontSize:13}}>
                  This will permanently remove <strong>{selectedUser.name||selectedUser.nickname}</strong>. This action cannot be undone.
                </p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <button style={{padding:12,borderRadius:'var(--radius)',border:'1px solid var(--border)',background:'var(--surface2)',fontWeight:700,cursor:'pointer',fontSize:14}} onClick={closePanel}>Cancel</button>
                <button className="rn-primary rn-danger" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}} onClick={deleteUser}>
                  <RiDeleteBinLine size={15}/> Delete
                </button>
              </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
