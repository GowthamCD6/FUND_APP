import React, { useState, useEffect, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { 
  Key as RiKeyLine, 
  Check as RiCheckLine, 
  X as RiCloseLine, 
  Loader2 as RiLoader4Line, 
  AlertTriangle as RiAlertLine, 
  Search as RiSearchLine, 
  RefreshCw as RiRefreshLine,
  Lock as RiLockLine,
  Eye as RiEyeLine,
  EyeOff as RiEyeOffLine,
  Phone as RiPhoneLine,
  Mail as RiMailLine,
  Calendar as RiCalendarLine
} from 'lucide-react';
import './PasswordManagement.css';
import Lottie from 'lottie-react';
import noUserFoundAnimation from '../../../animation/no-user-found.json';

const LottieComponent = Lottie.default || Lottie;


const PasswordSkeleton = () => (
  <div className="pm-list skeleton-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="pm-card-skeleton">
        <div className="pm-card-left">
          <div className="pm-avatar-skeleton" />
          <div className="pm-text-skeleton">
            <div className="pm-line-title" />
            <div className="pm-line-sub" />
            <div className="pm-line-sub" />
          </div>
        </div>
        <div className="pm-card-right" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: 'auto', display: 'flex', gap: '8px', width: '100%' }}>
          <div className="pm-btn-skeleton" style={{ flex: 1, height: '38px', borderRadius: '8px', backgroundColor: '#f1f5f9' }} />
          <div className="pm-btn-skeleton" style={{ flex: 1, height: '38px', borderRadius: '8px', backgroundColor: '#f1f5f9' }} />
        </div>
      </div>
    ))}
  </div>
);

const PasswordManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordDetails, setPasswordDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  const fetchPasswordDetails = async (userId) => {
    setLoadingDetails(true);
    setPasswordDetails(null);
    try {
      const res = await makeRequest(`/admin/users/${userId}/passwordDetails`);
      const data = await safeJson(res);
      if (data.success) {
        setPasswordDetails(data.data);
      }
    } catch (err) {
      console.error('Error fetching password details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
    fetchPasswordDetails(user.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setPasswordDetails(null);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (!window.confirm(`Are you sure you want to update the password for ${selectedUser.name}?`)) return;

    setUpdating(true);
    try {
      const res = await makeRequest('/admin/users/updatePassword', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });
      const data = await safeJson(res);
      if (data.success) {
        alert('Password updated successfully.');
        handleCloseModal();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Connection failed. Could not update password.');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset ${user.name}'s password to default (their Year of Birth)?`)) return;

    setUpdating(true);
    try {
      const res = await makeRequest('/admin/users/resetPassword', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      const data = await safeJson(res);
      if (data.success) {
        alert(`Password reset successfully. Default password is: ${data.defaultPassword || 'their birth year'}`);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Connection failed. Could not reset password.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="pm-page">
      <div className="pm-header-container">
        <div className="pm-toolbar-row">
          <div className="pm-search-container">
            <RiSearchLine size={16} className="pm-search-icon" />
            <input
              type="text"
              className="pm-search-input"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="pm-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <RiCloseLine size={14} />
              </button>
            )}
          </div>

          <button 
            className="pm-refresh-btn" 
            onClick={fetchUsers} 
            disabled={loading}
            title="Refresh"
          >
            <RiRefreshLine size={16} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="pm-content">
        {loading ? (
          <PasswordSkeleton />
        ) : filteredUsers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 220px)', padding: '40px 0', textAlign: 'center' }}>
            <LottieComponent 
              animationData={noUserFoundAnimation} 
              loop={true} 
              style={{ width: 220, height: 220 }} 
            />
            <h3 style={{ margin: '12px 0 6px', fontSize: '16px', fontWeight: 700, color: '#030712' }}>
              {searchQuery ? 'No members found' : 'No registered members'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 550 }}>
              {searchQuery ? 'Try adjusting your search query' : 'No registered members available.'}
            </p>
          </div>
        ) : (
          <div className="pm-list">
            {filteredUsers.map((user) => {
              const isAdmin = String(user.type || '').toLowerCase() === 'admin';
              return (
                <div key={user.id} className="pm-card">
                  <div className="pm-card-left">
                    <div className="pm-avatar">
                      {(user.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="pm-info">
                      <div className="pm-name-row">
                        <h4 className="pm-name">{user.name}</h4>
                        <span className={`pm-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                          {isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      <div className="pm-meta-rows">
                        <span className="pm-meta-item">
                          <RiPhoneLine size={12} style={{ marginRight: 4 }} />
                          {user.phone || '--'}
                        </span>
                        {user.email && (
                          <span className="pm-meta-item">
                            <RiMailLine size={12} style={{ marginRight: 4 }} />
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pm-card-right">
                    <button 
                      className="pm-action-btn change"
                      onClick={() => handleOpenModal(user)}
                    >
                      Change Password
                    </button>
                    <button 
                      className="pm-action-btn reset"
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showModal && selectedUser && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <div className="pm-modal-header">
              <h3>Change Password</h3>
              <button className="pm-modal-close" onClick={handleCloseModal}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-modal-user">
                <div className="pm-avatar">
                  {(selectedUser.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4>{selectedUser.name}</h4>
                  <p>{selectedUser.phone}</p>
                </div>
              </div>

              {/* Password Status Details */}
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#6b7280' }}>
                  <RiLoader4Line size={20} className="spin-anim" />
                  <p style={{ fontSize: 13, margin: '6px 0 0 0' }}>Loading password profile...</p>
                </div>
              ) : passwordDetails ? (
                <div className="pm-details-box">
                  <h5>Credential Audit</h5>
                  <div className="pm-detail-item">
                    <RiCalendarLine size={14} color="#3b82f6" />
                    <div>
                      <span>Created On:</span>
                      <strong>{new Date(passwordDetails.createdAt).toLocaleDateString()}</strong>
                    </div>
                  </div>
                  <div className="pm-detail-item">
                    <RiLockLine size={14} color="#f59e0b" />
                    <div>
                      <span>Last Update:</span>
                      <strong>
                        {passwordDetails.lastUpdatedAt 
                          ? new Date(passwordDetails.lastUpdatedAt).toLocaleDateString()
                          : 'Never changed (default)'}
                      </strong>
                    </div>
                  </div>
                  <div className="pm-detail-item">
                    <RiKeyLine size={14} color="#ef4444" />
                    <div>
                      <span>Current Status:</span>
                      <strong>{passwordDetails.currentPassword}</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Input fields */}
              <div className="pm-form-group">
                <label className="pm-form-label">New Password</label>
                <div className="pm-input-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-form-label">Confirm Password</label>
                <div className="pm-input-wrapper">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>

              <div className="pm-reqs">
                <p>Requirements:</p>
                <ul>
                  <li className={newPassword.length >= 4 ? 'done' : ''}>At least 4 characters long</li>
                  <li className={newPassword === confirmPassword && confirmPassword !== '' ? 'done' : ''}>Passwords must match</li>
                </ul>
              </div>
            </div>
            <div className="pm-modal-footer">
              <button 
                className="pm-btn-confirm" 
                onClick={handleUpdatePassword}
                disabled={updating}
              >
                {updating ? (
                  <RiLoader4Line size={16} className="spin-anim" />
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordManagement;
