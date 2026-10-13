import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import joinAnimation from '../../../animation/join a group.json';
import {
  KeyRound, Users, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Loader2, Info
} from 'lucide-react';
import './JoinGroup.css';

const JoinGroup = () => {
  const navigate = useNavigate();
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error'
    title: '',
    message: '',
    data: null,
  });

  // Fetch active/available chit groups
  useEffect(() => {
    const fetchOpenGroups = async () => {
      setLoadingAvailable(true);
      try {
        const res = await makeRequest('/user/groups');
        const data = await safeJson(res);
        if (data.success && Array.isArray(data.data)) {
          setAvailableGroups(data.data.filter(g => g.status !== 'completed'));
        }
      } catch (err) {
        console.warn('Failed to load available groups:', err);
      } finally {
        setLoadingAvailable(false);
      }
    };
    fetchOpenGroups();
  }, []);

  const handleJoin = async (codeToJoin = null) => {
    const code = (codeToJoin || groupCode).trim().toUpperCase();
    if (!code) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Group Code Required',
        message: 'Please enter a valid group code provided by your administrator.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await makeRequest('/user/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode: code }),
      });
      const result = await res.json();

      if (result.success) {
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Joined Successfully! 🎉',
          message: result.message || 'You have successfully joined the chit fund group.',
          data: result.data,
        });
        setGroupCode('');
      } else {
        const errorTitle =
          result.errorType === 'GROUP_FULL' ? 'Group Full' :
          result.errorType === 'ALREADY_MEMBER' ? 'Already a Member' :
          result.errorType === 'GROUP_COMPLETED' ? 'Group Completed' :
          result.errorType === 'INVALID_CODE' ? 'Invalid Code' :
          'Unable to Join';

        setModalState({
          isOpen: true,
          type: 'error',
          title: errorTitle,
          message: result.message || 'Could not join group with provided code.',
          errorType: result.errorType,
        });
      }
    } catch (err) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: err.message || 'Something went wrong while connecting to the server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    const wasSuccess = modalState.type === 'success';
    setModalState({ ...modalState, isOpen: false });
    if (wasSuccess) {
      navigate('/user/portfolio');
    }
  };

  return (
    <div className="jg-container">
      <div className="jg-header">
        <h1 className="jg-title">Join a Chit Group</h1>
        <p className="jg-subtitle">
          Enter your official group code or browse active chit plans to start saving and investing.
        </p>
      </div>

      <div className="jg-grid">
        {/* Left card: Input Form */}
        <div className="jg-card">
          <div className="jg-hero-visual">
            <div className="jg-hero-lottie">
              {React.createElement(Lottie.default || Lottie, {
                animationData: joinAnimation,
                loop: true,
              })}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
            <div className="jg-input-group">
              <label className="jg-input-label" htmlFor="groupCodeInput">
                CHIT GROUP CODE
              </label>
              <div className="jg-input-wrap">
                <KeyRound size={20} className="jg-input-icon" />
                <input
                  id="groupCodeInput"
                  type="text"
                  className="jg-input"
                  placeholder="e.g. GDK100K"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  maxLength={16}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              type="submit"
              className="jg-btn-submit"
              disabled={loading || !groupCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Verifying Code...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Join Group Now
                </>
              )}
            </button>
          </form>

          <div className="jg-info-banner">
            <Info size={20} color="#166534" style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="jg-info-text">
              <strong>Need a group code?</strong> Group codes are issued by Sri Periyanayagi Amman Chit Fund administration upon enrollment verification. Contact support if you need assistance.
            </p>
          </div>
        </div>

        {/* Right card: Available Groups list */}
        <div className="jg-card">
          <h2 className="jg-browse-title">
            <Users size={20} color="var(--primary)" />
            Active Chit Groups
          </h2>

          {loadingAvailable ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Loading groups...</p>
            </div>
          ) : availableGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
              <Users size={36} color="var(--subtle)" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No open groups found currently</p>
              <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>Enter your exclusive invitation code on the left</p>
            </div>
          ) : (
            <div className="jg-open-list">
              {availableGroups.slice(0, 5).map((grp) => (
                <div key={grp.id} className="jg-open-item">
                  <div className="jg-open-item-head">
                    <h3 className="jg-open-name">{grp.group_name || grp.groupName}</h3>
                    <span className="jg-open-badge">{grp.group_code || grp.groupCode || 'ACTIVE'}</span>
                  </div>

                  <div className="jg-open-meta">
                    <div className="jg-open-meta-col">
                      <span className="jg-open-meta-label">Pool</span>
                      <span className="jg-open-meta-val">
                        ₹{Number(grp.total_amount || grp.investmentAmount || 100000).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="jg-open-meta-col">
                      <span className="jg-open-meta-label">Duration</span>
                      <span className="jg-open-meta-val">
                        {grp.total_months || grp.totalMonths || 20} Mos
                      </span>
                    </div>
                    <div className="jg-open-meta-col">
                      <span className="jg-open-meta-label">Members</span>
                      <span className="jg-open-meta-val">
                        {grp.current_members || grp.currentMembers || 1}/{grp.total_members || grp.totalMembers || 20}
                      </span>
                    </div>
                  </div>

                  <button
                    className="jg-open-btn"
                    onClick={() => handleJoin(grp.group_code || grp.groupCode)}
                    disabled={loading}
                  >
                    <span>Use Code {grp.group_code || grp.groupCode}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {modalState.isOpen && (
        <div className="jg-modal-overlay" onClick={handleModalClose}>
          <div className="jg-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className={`jg-modal-icon ${modalState.type}`}>
              {modalState.type === 'success' ? (
                <CheckCircle2 size={40} />
              ) : (
                <AlertCircle size={40} />
              )}
            </div>

            <h3 className="jg-modal-title">{modalState.title}</h3>
            <p className="jg-modal-desc">{modalState.message}</p>

            {modalState.type === 'success' && modalState.data && (
              <div className="jg-modal-details">
                {modalState.data.groupName && (
                  <div className="jg-modal-detail-row">
                    <span>Group Name</span>
                    <span>{modalState.data.groupName}</span>
                  </div>
                )}
                {modalState.data.groupAmount && (
                  <div className="jg-modal-detail-row">
                    <span>Total Fund</span>
                    <span>₹{Number(modalState.data.groupAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {modalState.data.totalMembers && (
                  <div className="jg-modal-detail-row">
                    <span>Slots</span>
                    <span>{modalState.data.currentMembers || 1} / {modalState.data.totalMembers}</span>
                  </div>
                )}
                {modalState.data.duration && (
                  <div className="jg-modal-detail-row">
                    <span>Tenure</span>
                    <span>{modalState.data.duration} Months</span>
                  </div>
                )}
              </div>
            )}

            <button
              className="jg-modal-btn"
              style={{
                background: modalState.type === 'success' ? 'var(--primary)' : 'var(--danger)',
                color: '#fff',
              }}
              onClick={handleModalClose}
            >
              {modalState.type === 'success' ? 'Go to Portfolio' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;
