import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { 
  Ban as RiBanLine, 
  Check as RiCheckLine, 
  X as RiCloseLine, 
  Loader2 as RiLoader4Line, 
  AlertTriangle as RiAlertLine, 
  Search as RiSearchLine, 
  UserCheck as RiUserCheckLine, 
  UserX as RiUserXLine,
  Phone as RiPhoneLine,
  ArrowLeft
} from 'lucide-react';
import './BlockUser.css';
import Lottie from 'lottie-react';
import noUserFoundAnimation from '../../../animation/no-user-found.json';

const LottieComponent = Lottie.default || Lottie;


const BlockUserSkeleton = () => (
  <div className="bu-list skeleton-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bu-card-skeleton">
        <div className="bu-card-left">
          <div className="bu-avatar-skeleton" />
          <div className="bu-text-skeleton">
            <div className="bu-line-title" />
            <div className="bu-line-sub" />
          </div>
        </div>
        <div className="bu-btn-skeleton" />
      </div>
    ))}
  </div>
);

const BlockUser = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blocked'); // 'blocked' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await makeRequest('/admin/users/getAllUsers');
      const data = await safeJson(res);
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnblock = async (userId) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;
    setUpdatingId(userId);
    try {
      const res = await makeRequest('/admin/users/unblock', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      const data = await safeJson(res);
      if (data.success) {
        alert('User has been unblocked.');
        fetchUsers();
      } else {
        alert(data.message || 'Failed to unblock user');
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Connection failed. Could not unblock.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockReason('');
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking.');
      return;
    }
    setUpdatingId(selectedUser.id);
    try {
      const res = await makeRequest('/admin/users/block', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: blockReason,
        }),
      });
      const data = await safeJson(res);
      if (data.success) {
        alert('User has been blocked.');
        setShowBlockModal(false);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to block user');
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Connection failed. Could not block.');
    } finally {
      setUpdatingId(null);
      setSelectedUser(null);
    }
  };

  const blockedUsers = useMemo(() => users.filter(u => u.isActive === 0), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.isActive === 1), [users]);

  const filteredUsers = useMemo(() => {
    const list = activeTab === 'blocked' ? blockedUsers : activeUsers;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
    );
  }, [activeTab, blockedUsers, activeUsers, searchQuery]);

  return (
    <div className={`bu-page ${activeTab === 'blocked' ? 'tab-blocked' : 'tab-active'}`}>
      <div className="bu-header-container">
        <div className="bu-toolbar-row">
          <div className="bu-toolbar-left">
            <button
              type="button"
              className="bu-back-btn"
              onClick={() => navigate('/admin/admintool')}
              title="Back to Admin Tools"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Tab Bar */}
            <div className="bu-tabs-wrapper">
              <button 
                className={`bu-tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('blocked');
                  setSearchQuery('');
                }}
              >
                Blocked Members ({blockedUsers.length})
              </button>
            <button 
              className={`bu-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
            >
              Active Members ({activeUsers.length})
            </button>
          </div>
        </div>

        {/* Search Bar (Refresh Button Removed) */}
          <div className="bu-filters-wrapper">
            <div className="bu-search-container">
              <RiSearchLine size={16} className="bu-search-icon" />
              <input
                type="text"
                className="bu-search-input"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="bu-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bu-content">
        {loading ? (
          <BlockUserSkeleton />
        ) : filteredUsers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 260px)', padding: '40px 0', textAlign: 'center' }}>
            <LottieComponent 
              animationData={noUserFoundAnimation} 
              loop={true} 
              style={{ width: 220, height: 220 }} 
            />
            <h3 style={{ margin: '12px 0 6px', fontSize: '16px', fontWeight: 700, color: '#030712' }}>
              {searchQuery ? 'No members found' : activeTab === 'blocked' ? 'No blocked members' : 'No active members'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 550 }}>
              {searchQuery ? 'Try adjusting your search query' : activeTab === 'blocked' ? 'No blocked users currently.' : 'No active users found.'}
            </p>
          </div>
        ) : (
          <div className="bu-list">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bu-card">
                <div className="bu-card-left">
                  <div className="bu-avatar">
                    {user.profile_image || user.avatar ? (
                      <img 
                        src={user.profile_image || user.avatar} 
                        alt={user.name} 
                        className="bu-avatar-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    {(!user.profile_image && !user.avatar) && (user.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="bu-info">
                    <h4 className="bu-name">{user.name}</h4>
                    <span className="bu-phone">
                      <RiPhoneLine size={13} style={{ marginRight: 4 }} />
                      {user.phone || 'No phone'}
                    </span>
                    {user.blockReason && activeTab === 'blocked' && (
                      <p className="bu-reason">Reason: <strong>{user.blockReason}</strong></p>
                    )}
                  </div>
                </div>

                <div className="bu-card-right">
                  {activeTab === 'blocked' ? (
                    <button 
                      className="bu-action-btn unblock"
                      onClick={() => handleUnblock(user.id)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id ? (
                        <RiLoader4Line size={14} className="spin-anim" />
                      ) : (
                        <RiUserCheckLine size={14} style={{ marginRight: 6 }} />
                      )}
                      Unblock
                    </button>
                  ) : (
                    <button 
                      className="bu-action-btn block"
                      onClick={() => handleBlockClick(user)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id ? (
                        <RiLoader4Line size={14} className="spin-anim" />
                      ) : (
                        <RiUserXLine size={14} style={{ marginRight: 6 }} />
                      )}
                      Block
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal && selectedUser && (
        <div className="bu-modal-backdrop">
          <div className="bu-modal">
            <div className="bu-modal-header">
              <h3>Block User Restriction</h3>
              <button className="bu-modal-close" onClick={() => setShowBlockModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <div className="bu-modal-body">
              <div className="bu-modal-user">
                <div className="bu-avatar">
                  {selectedUser.profile_image || selectedUser.avatar ? (
                    <img 
                      src={selectedUser.profile_image || selectedUser.avatar} 
                      alt={selectedUser.name} 
                      className="bu-avatar-img"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  {(!selectedUser.profile_image && !selectedUser.avatar) && (selectedUser.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4>{selectedUser.name}</h4>
                  <p>{selectedUser.phone}</p>
                </div>
              </div>

              <div className="bu-form-group">
                <label className="bu-form-label">
                  Reason for restricting user <span className="req">*</span>
                </label>
                <textarea 
                  className="bu-textarea"
                  placeholder="Provide details on why this member access is being blocked..."
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="bu-modal-footer">
              <button 
                type="button"
                className="bu-btn-cancel" 
                onClick={() => setShowBlockModal(false)}
                disabled={updatingId === selectedUser.id}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="bu-btn-confirm" 
                onClick={confirmBlock}
                disabled={updatingId === selectedUser.id}
              >
                {updatingId === selectedUser.id ? (
                  <RiLoader4Line size={16} className="spin-anim" />
                ) : (
                  'Block User Access'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockUser;