import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X as RiCloseLine,
  Search as RiSearchLine,
  Check as RiCheckLine,
  Users as RiGroupLine,
  UserPlus as RiUserAddLine,
  Trash2 as RiDeleteBinLine,
  Loader2 as RiLoader4Line,
  Phone as RiPhoneLine,
  AlertTriangle as RiAlertLine,
  Trophy as RiTrophyLine,
  CheckCircle2 as RiCheckCircleLine
} from 'lucide-react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import { formatCurrency } from '../../../../utils/formatters.js';

const MAX_MEMBERS = 20;

const MemberRegistration = ({ isOpen, onClose, group, onMembersUpdate, inline = false }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [updatingPrizeUserId, setUpdatingPrizeUserId] = useState(null);
  
  // Member picker modal states
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchMembers, setSearchMembers] = useState('');
  
  // Notification notice
  const [notice, setNotice] = useState(null); // { text, success }

  // Load all users on mount
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await makeRequest('/admin/users/getAllUsers');
        const data = await safeJson(res);
        if (res.ok && data?.success) {
          setAllUsers(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadAllUsers();
  }, []);

  // Load group members when modal opens or group changes
  const loadGroupMembers = useCallback(async () => {
    if (!group?.id) return;
    setMembersLoading(true);
    setNotice(null);
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (res.ok && data?.success) {
        const mems = data.members || data.data || [];
        setGroupMembers(mems);
        if (typeof onMembersUpdate === 'function') {
          onMembersUpdate(group.id, mems.length, mems);
        }
      } else {
        setGroupMembers([]);
      }
    } catch (err) {
      console.error('Failed to load group members', err);
      setGroupMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [group?.id]);

  useEffect(() => {
    if (isOpen && group?.id) {
      loadGroupMembers();
    } else {
      setGroupMembers([]);
      setNotice(null);
    }
  }, [isOpen, group?.id, loadGroupMembers]);

  // Handle member addition
  const confirmAddMembers = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member to add.');
      return;
    }
    try {
      setNotice(null);
      const res = await makeRequest('/admin/groups/addMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId: group.id, members: selectedMembers.map(m => m.id) }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to add members');

      const newMembers = selectedMembers.map(u => ({
        userId: u.id,
        name: u.name || u.nickname || 'Unnamed',
        phone: u.phone || '--',
        nickname: u.nickname,
      }));

      const updatedMembers = [...groupMembers, ...newMembers];
      setGroupMembers(updatedMembers);
      
      if (typeof onMembersUpdate === 'function') {
        onMembersUpdate(group.id, updatedMembers.length, updatedMembers);
      }

      setShowMemberPicker(false);
      setSelectedMembers([]);
      setNotice({ text: 'Members added successfully', success: true });
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to add members', success: false });
    }
  };

  // Handle member removal
  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name || member.nickname || 'Unnamed'} from this group?`)) return;
    try {
      setNotice(null);
      const res = await makeRequest('/admin/groups/removeMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId: group.id, members: [member.userId || member.id] }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to remove');
      
      const updatedMembers = groupMembers.filter(m => m.userId !== (member.userId || member.id));
      setGroupMembers(updatedMembers);
      
      if (typeof onMembersUpdate === 'function') {
        onMembersUpdate(group.id, updatedMembers.length, updatedMembers);
      }

      setNotice({ text: `${member.name || member.nickname || 'Unnamed'} removed from group`, success: true });
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to remove', success: false });
    }
  };

  // Handle toggling whether this member received the auction amount
  const handleToggleAuctionPrize = async (member) => {
    const isCurrentlyWon = Boolean(member.hasWonAuction);
    const targetState = !isCurrentlyWon;
    let prizeAmount = member.amountTaken || group?.groupAmount || 100000;

    if (targetState) {
      const promptVal = window.prompt(
        `Enter the auction amount received by ${member.name || 'this member'} (₹):`,
        String(prizeAmount)
      );
      if (promptVal === null) return; // Cancelled
      prizeAmount = Number(promptVal) || prizeAmount;
    } else {
      if (!window.confirm(`Are you sure you want to remove the Auction Prize Taken flag for ${member.name || 'this member'}?`)) {
        return;
      }
    }

    setUpdatingPrizeUserId(member.userId || member.id);
    setNotice(null);
    try {
      const res = await makeRequest('/admin/groups/toggleMemberAuctionPrize', {
        method: 'POST',
        body: JSON.stringify({
          groupId: group.id,
          userId: member.userId || member.id,
          hasWon: targetState,
          amountTaken: prizeAmount,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update auction prize status');
      }

      const updated = groupMembers.map(m => {
        if (String(m.userId || m.id) === String(member.userId || member.id)) {
          return {
            ...m,
            hasWonAuction: targetState,
            amountTaken: targetState ? prizeAmount : null,
          };
        }
        return m;
      });
      setGroupMembers(updated);
      if (typeof onMembersUpdate === 'function') {
        onMembersUpdate(group.id, updated.length, updated);
      }

      setNotice({ text: data.message || 'Auction prize status updated successfully', success: true });
    } catch (err) {
      setNotice({ text: err.message || 'Error updating auction prize status', success: false });
    } finally {
      setUpdatingPrizeUserId(null);
    }
  };

  // Memoized lists of available users
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

  if (!inline && !isOpen) return null;

  const innerContent = (
    <>
      {/* Notice alert */}
      {notice && (
        <div style={{ background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', padding: '10px 12px', borderRadius: '6px', fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          {notice.success ? <RiCheckLine size={15} /> : <RiAlertLine size={15} />}
          {notice.text}
        </div>
      )}

      {/* Stats view */}
      <div className="mg2-stats-container">
        <div className="mg2-stat-card total-members">
          <div className="mg2-stat-content">
            <RiGroupLine size={18} color="#10B981" />
            <span className="mg2-stat-count">{groupMembers.length}</span>
          </div>
          <span className="mg2-stat-label">Total Members</span>
        </div>
        <div className="mg2-stat-card available-slots">
          <div className="mg2-stat-content">
            <RiUserAddLine size={18} color="#F59E0B" />
            <span className="mg2-stat-count">{Math.max(0, MAX_MEMBERS - groupMembers.length)}</span>
          </div>
          <span className="mg2-stat-label">Available Slots</span>
        </div>
      </div>

      {/* Members list */}
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, marginBottom: 16 }}>
        {membersLoading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
            <RiLoader4Line size={28} className="spin-anim" />
          </div>
        ) : groupMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
            <RiGroupLine size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No members registered in this group yet.</p>
          </div>
        ) : (
          groupMembers.map(m => (
            <div key={m.userId || m.id} className="mg2-mem-row" style={{ alignItems: 'flex-start', padding: '12px 14px' }}>
              <div className="mg2-mem-avatar">{String(m.name || m.nickname || '?').charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p className="mg2-mem-name" style={{ margin: 0 }}>{m.name || m.nickname || 'Unnamed'}</p>
                  {m.hasWonAuction ? (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      background: '#fef3c7', 
                      color: '#b45309', 
                      border: '1px solid #fde68a', 
                      padding: '2px 8px', 
                      borderRadius: 100, 
                      fontSize: 11, 
                      fontWeight: 700 
                    }}>
                      <RiTrophyLine size={12} color="#d97706" /> Prize Received: {formatCurrency(m.amountTaken || group?.groupAmount || 0)}
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      background: '#f1f5f9', 
                      color: '#475569', 
                      border: '1px solid #e2e8f0', 
                      padding: '2px 8px', 
                      borderRadius: 100, 
                      fontSize: 11, 
                      fontWeight: 600 
                    }}>
                      Eligible for Auction
                    </span>
                  )}
                </div>
                <p className="mg2-mem-phone" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 0 }}>
                  <RiPhoneLine size={11} /> {m.phone || '--'}
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleToggleAuctionPrize(m)}
                  disabled={updatingPrizeUserId === (m.userId || m.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: m.hasWonAuction ? '1px solid #fde68a' : '1px solid #cbd5e1',
                    background: m.hasWonAuction ? '#fffbeb' : '#ffffff',
                    color: m.hasWonAuction ? '#b45309' : '#0f172a',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                  title={m.hasWonAuction ? 'Click to revoke prize flag' : 'Mark that this user received auction prize'}
                >
                  {updatingPrizeUserId === (m.userId || m.id) ? (
                    <RiLoader4Line size={12} className="spin-anim" />
                  ) : m.hasWonAuction ? (
                    <>
                      <RiCheckCircleLine size={12} color="#10b981" />
                      <span>Prize Claimed</span>
                    </>
                  ) : (
                    <>
                      <RiTrophyLine size={12} color="#64748b" />
                      <span>Set Prize Taken</span>
                    </>
                  )}
                </button>
                <button className="mg2-rem-btn" onClick={() => removeMember(m)} title="Remove Member">
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div style={{ paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="mg2-dashed-add-btn"
          disabled={groupMembers.length >= MAX_MEMBERS}
          onClick={() => {
            setSearchMembers('');
            setSelectedMembers([]);
            setShowMemberPicker(true);
          }}
        >
          <RiUserAddLine size={16} />
          <span>Add Members</span>
        </button>
        
        {groupMembers.length >= MAX_MEMBERS && (
          <p className="mg2-limit-reached-txt">
            This group has reached its maximum of {MAX_MEMBERS} members.
          </p>
        )}

        {!inline && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="mg2-modal-cancel-btn" onClick={onClose} style={{ maxWidth: 100 }}>Close</button>
          </div>
        )}
      </div>

      {/* Multi-Select Member Picker Popup Overlay */}
      {showMemberPicker && (
        <div className="rn-modal-backdrop" onClick={() => setShowMemberPicker(false)} style={{ zIndex: 20000 }}>
          <div className="rn-modal mg2-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="mg2-picker-head">
              <div className="mg2-picker-title-row">
                <h3 className="mg2-picker-title">Select Members</h3>
                {selectedMembers.length > 0 && (
                  <span className="mg2-picker-badge">{selectedMembers.length}</span>
                )}
              </div>
              <div className="mg2-picker-actions-right">
                {selectedMembers.length > 0 && (
                  <button className="mg2-picker-clear-btn" onClick={() => setSelectedMembers([])}>
                    Clear
                  </button>
                )}
                <button className="mg2-picker-close-btn" onClick={() => setShowMemberPicker(false)} title="Close">
                  <RiCloseLine size={20} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mg2-picker-search-container">
              <RiSearchLine size={16} className="mg2-picker-search-icon" />
              <input
                type="text"
                className="mg2-picker-search-input"
                placeholder="Search by name or phone..."
                value={searchMembers}
                onChange={e => setSearchMembers(e.target.value)}
                autoFocus
              />
              {searchMembers && (
                <button className="mg2-picker-search-clear" onClick={() => setSearchMembers('')} title="Clear search">
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>

            {/* Select All Button */}
            {filteredAvailableUsers.length > 0 && (
              <div className="mg2-picker-select-all-row">
                <button
                  className="mg2-picker-select-all-btn"
                  onClick={() => {
                    const currentCount = groupMembers.length;
                    const slots = MAX_MEMBERS - currentCount;
                    if (filteredAvailableUsers.length > slots) {
                      alert(`Limit Reached: You can only add ${slots} more member(s). Only the first ${slots} members will be selected.`);
                      setSelectedMembers(filteredAvailableUsers.slice(0, slots));
                    } else {
                      setSelectedMembers(filteredAvailableUsers);
                    }
                  }}
                >
                  <RiCheckLine size={14} style={{ marginRight: 4 }} /> Select All
                </button>
              </div>
            )}

            {/* Scrollable list of available users */}
            <div className="mg2-picker-list">
              {filteredAvailableUsers.length === 0 ? (
                <div className="mg2-picker-empty">
                  <RiGroupLine size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>{searchMembers ? 'No members match search' : 'No available members to add'}</p>
                </div>
              ) : (
                filteredAvailableUsers.map(u => {
                  const isSelected = selectedMembers.some(m => m.id === u.id);
                  return (
                    <div
                      key={u.id}
                      className={`mg2-picker-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMembers(prev => prev.filter(m => m.id !== u.id));
                        } else {
                          const currentCount = groupMembers.length;
                          const totalAfterAdd = currentCount + selectedMembers.length + 1;
                          if (totalAfterAdd > MAX_MEMBERS) {
                            alert(`Limit Reached: You can only add ${MAX_MEMBERS - currentCount} more member(s).`);
                            return;
                          }
                          setSelectedMembers(prev => [...prev, u]);
                        }
                      }}
                    >
                      <div className="mg2-picker-checkbox">
                        {isSelected && <RiCheckLine size={14} color="#ffffff" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="mg2-mem-name">{u.name || u.nickname || 'Unnamed'}</p>
                        <p className="mg2-mem-phone" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RiPhoneLine size={11} /> {u.phone || '--'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Add Button */}
            <div className="mg2-picker-footer">
              <button
                className="mg2-picker-add-btn"
                disabled={selectedMembers.length === 0}
                onClick={confirmAddMembers}
              >
                Add {selectedMembers.length > 0 ? `${selectedMembers.length} ` : ''} Member{selectedMembers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {innerContent}
      </div>
    );
  }

  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        {/* Modal Header */}
        <div className="mg2-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Group Members</h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{group?.groupName || group?.name || 'Group Name'}</p>
          </div>
          <button className="rp-close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        {innerContent}
      </div>
    </div>
  );
};

export default MemberRegistration;
