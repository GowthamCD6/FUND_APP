import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import joinAnimation from '../../../animation/join a group.json';
import {
  KeyRound, Users, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Loader2, Info, Landmark, Layers, Building2, Coins, Search,
  X, Check, Eye, ChevronRight, HelpCircle, ArrowUpRight
} from 'lucide-react';
import './JoinGroup.css';

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt) || 0);

const JoinGroup = () => {
  const navigate = useNavigate();
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [userPortfolio, setUserPortfolio] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Directory Filter & Search
  const [filterTier, setFilterTier] = useState('all'); // 'all' | '50k' | '100k' | '200k'
  const [searchQuery, setSearchQuery] = useState('');

  // Result / Certificate Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error'
    title: '',
    message: '',
    data: null,
    errorType: null,
  });

  // Fetch active/available chit groups & current user portfolio
  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingAvailable(true);
      try {
        const [groupsRes, portfolioRes] = await Promise.allSettled([
          makeRequest('/user/groups'),
          makeRequest('/user/portfolio'),
        ]);

        if (groupsRes.status === 'fulfilled') {
          const gData = await safeJson(groupsRes.value);
          if (gData.success && Array.isArray(gData.data)) {
            setAvailableGroups(
              gData.data.filter((g) => g.status !== 'completed' && g.status !== 'Completed')
            );
          }
        }

        if (portfolioRes.status === 'fulfilled') {
          const pData = await safeJson(portfolioRes.value);
          if (pData.success && Array.isArray(pData.data)) {
            setUserPortfolio(pData.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load available groups:', err);
      } finally {
        setLoadingAvailable(false);
      }
    };
    fetchAllData();
  }, []);

  // Set of enrolled group IDs for quick membership detection
  const enrolledGroupIds = useMemo(() => {
    const set = new Set();
    userPortfolio.forEach((p) => {
      if (p.id) set.add(String(p.id));
      if (p.groupId) set.add(String(p.groupId).replace('GRP-', ''));
    });
    return set;
  }, [userPortfolio]);

  // Filtered available groups
  const filteredGroups = useMemo(() => {
    return availableGroups.filter((grp) => {
      const amount = Number(grp.group_amount || grp.groupAmount || grp.total_amount || 0);

      if (filterTier === '50k' && amount > 60000) return false;
      if (filterTier === '100k' && (amount < 60000 || amount > 150000)) return false;
      if (filterTier === '200k' && amount < 150000) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (grp.group_name || grp.name || '').toLowerCase();
        const code = (grp.groupCode || grp.group_code || '').toLowerCase();
        const amtStr = String(amount);
        return name.includes(q) || code.includes(q) || amtStr.includes(q);
      }

      return true;
    });
  }, [availableGroups, filterTier, searchQuery]);

  const handleJoin = async (codeToJoin = null) => {
    const code = (codeToJoin || groupCode).trim().toUpperCase();
    if (!code) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Group Code Required',
        message: 'Please enter a valid scheme access code issued by your administrator.',
        errorType: 'MISSING_CODE',
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
          title: 'Scheme Enrollment Confirmed',
          message: result.message || 'You have successfully joined the chit fund group.',
          data: result.data,
          errorType: null,
        });
        setGroupCode('');

        // Refresh portfolio in background
        makeRequest('/user/portfolio')
          .then((r) => safeJson(r))
          .then((d) => {
            if (d.success && Array.isArray(d.data)) setUserPortfolio(d.data);
          })
          .catch(() => {});
      } else {
        const errorTitle =
          result.errorType === 'GROUP_FULL'
            ? 'Group at Full Capacity'
            : result.errorType === 'ALREADY_MEMBER'
            ? 'Already an Active Member'
            : result.errorType === 'GROUP_COMPLETED'
            ? 'Scheme Already Concluded'
            : result.errorType === 'INVALID_CODE'
            ? 'Invalid Scheme Code'
            : 'Enrollment Unsuccessful';

        setModalState({
          isOpen: true,
          type: 'error',
          title: errorTitle,
          message: result.message || 'Could not join scheme with provided authorization code.',
          errorType: result.errorType,
        });
      }
    } catch (err) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Network Communication Error',
        message: err.message || 'Unable to connect to the central chit ledger server. Please try again.',
        errorType: 'NETWORK_ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = (redirectToPassbook = false) => {
    const wasSuccess = modalState.type === 'success';
    setModalState({ ...modalState, isOpen: false });
    if (redirectToPassbook || wasSuccess) {
      navigate('/user/group-card');
    }
  };

  return (
    <div className="jg-container">
      {/* ══════════════════════════════════════════════════════════
          MAIN 2-COLUMN ENROLLMENT WORKSPACE
         ══════════════════════════════════════════════════════════ */}
      <div className="jg-main-grid">
        {/* LEFT COLUMN: Interactive Code Verification Portal */}
        <div className="jg-portal-card">
          <div className="jg-portal-top centered">
            <h2 className="jg-portal-title">Enter Scheme Access Code</h2>
            <p className="jg-portal-desc">
              Enter your official administrative group code below to join.
            </p>
          </div>

          <div className="jg-hero-visual">
            <div className="jg-hero-lottie">
              {React.createElement(Lottie.default || Lottie, {
                animationData: joinAnimation,
                loop: true,
                style: { width: '100%', height: '100%', margin: '0 auto' },
              })}
            </div>
          </div>

          <form
            className="jg-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
          >
            <div className="jg-input-group">
              <div className="jg-label-row">
                <label className="jg-input-label" htmlFor="groupCodeInput">
                  OFFICIAL CHIT GROUP CODE
                </label>
                {groupCode && (
                  <span className="jg-char-badge">{groupCode.length} CHARS</span>
                )}
              </div>

              <div className="jg-input-wrap">
                <KeyRound size={18} className="jg-input-icon" />
                <input
                  id="groupCodeInput"
                  type="text"
                  className="jg-input"
                  placeholder="e.g. GDK50K or GRP1"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  maxLength={20}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck="false"
                />
                {groupCode && (
                  <button
                    type="button"
                    className="jg-clear-btn"
                    onClick={() => setGroupCode('')}
                    title="Clear Code"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="jg-btn-submit"
              disabled={loading || !groupCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="jg-spin" />
                  <span>Verifying Code & Provisioning Passbook...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Verify Code & Join Scheme</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="jg-info-banner">
            <Info size={18} color="#15803d" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="jg-info-text">
              <strong>Need an exclusive group code?</strong> Group invitation codes are authorized by Sri Periyanayagi Amman Chit Funds upon member identity verification. Contact your branch administrator if you need enrollment assistance.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Scheme Directory & Instant Auto-Enroll */}
        <div className="jg-directory-card">
          <div className="jg-directory-header">
            <div>
              <div className="jg-dir-pretitle">Live Central Ledger</div>
              <h2 className="jg-directory-title">
                <Layers size={19} color="#2E7D32" />
                Active Chit Schemes
              </h2>
            </div>
            <span className="jg-directory-count-badge">
              {availableGroups.length} Enrolling Plans
            </span>
          </div>

          {/* Directory Filter Pills & Search */}
          <div className="jg-directory-toolbar">
            <div className="jg-dir-filter-pills">
              <button
                type="button"
                className={`jg-dir-pill ${filterTier === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTier('all')}
              >
                All Schemes
              </button>
              <button
                type="button"
                className={`jg-dir-pill ${filterTier === '50k' ? 'active' : ''}`}
                onClick={() => setFilterTier('50k')}
              >
                ₹50K Plans
              </button>
              <button
                type="button"
                className={`jg-dir-pill ${filterTier === '100k' ? 'active' : ''}`}
                onClick={() => setFilterTier('100k')}
              >
                ₹1 Lakh Plans
              </button>
              <button
                type="button"
                className={`jg-dir-pill ${filterTier === '200k' ? 'active' : ''}`}
                onClick={() => setFilterTier('200k')}
              >
                ₹2 Lakh+
              </button>
            </div>

            <div className="jg-dir-search">
              <Search size={14} className="jg-dir-search-icon" />
              <input
                type="text"
                placeholder="Search scheme name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="jg-dir-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Scheme Cards List */}
          {loadingAvailable ? (
            <div className="jg-loading-state">
              <Loader2 size={32} className="jg-spin" color="#2E7D32" />
              <p>Fetching active registered chit schemes...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="jg-empty-directory">
              <Users size={40} color="#94a3b8" />
              <h4>No matching chit schemes found</h4>
              <p>
                {searchQuery || filterTier !== 'all'
                  ? 'Try clearing your search query or filter tier above.'
                  : 'Enter your exclusive administrative code on the left to enroll.'}
              </p>
            </div>
          ) : (
            <div className="jg-schemes-list">
              {filteredGroups.map((grp) => {
                const pool = Number(grp.group_amount || grp.groupAmount || grp.total_amount || 50000);
                const duration = Number(grp.duration || grp.total_months || grp.totalMonths || 20);
                const monthly = Number(grp.monthly_amount || grp.monthlyAmount) || Math.round(pool / duration);
                const totalMembers = Number(grp.total_members || grp.totalMembers || 20);
                const currentMembers = Number(grp.current_members || grp.currentMembers || 1);
                const remainingSlots = Math.max(0, totalMembers - currentMembers);
                const percentFull = Math.min(100, Math.round((currentMembers / totalMembers) * 100));
                const code = grp.groupCode || grp.group_code || `GRP${grp.id}`;
                const isMember = enrolledGroupIds.has(String(grp.id));
                const isFull = remainingSlots === 0;

                return (
                  <div key={grp.id} className={`jg-scheme-card ${isMember ? 'enrolled' : ''}`}>
                    {/* Card Top */}
                    <div className="jg-scheme-head">
                      <div className="jg-scheme-identity">
                        <div className="jg-scheme-icon">
                          <Building2 size={16} color="#ffffff" />
                        </div>
                        <div>
                          <h3 className="jg-scheme-name">
                            {grp.group_name || grp.name}
                          </h3>
                          <span className="jg-scheme-id-tag">
                            Code: <strong>{code}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="jg-scheme-status-wrap">
                        {isMember ? (
                          <span className="jg-badge-status enrolled">
                            <CheckCircle2 size={12} color="#059669" />
                            Already Enrolled
                          </span>
                        ) : isFull ? (
                          <span className="jg-badge-status full">
                            Group Full
                          </span>
                        ) : (
                          <span className="jg-badge-status open">
                            <span className="jg-micro-pulse" />
                            {remainingSlots} Slots Open
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2×2 Metric Grid */}
                    <div className="jg-scheme-metrics-grid">
                      <div className="jg-metric-box">
                        <span className="jg-metric-label">Scheme Target</span>
                        <strong className="jg-metric-value">{formatINR(pool)}</strong>
                      </div>
                      <div className="jg-metric-box">
                        <span className="jg-metric-label">Monthly Share</span>
                        <strong className="jg-metric-value text-blue">{formatINR(monthly)}/mo</strong>
                      </div>
                      <div className="jg-metric-box">
                        <span className="jg-metric-label">Tenure Duration</span>
                        <strong className="jg-metric-value">{duration} Months</strong>
                      </div>
                      <div className="jg-metric-box">
                        <span className="jg-metric-label">Member Capacity</span>
                        <strong className="jg-metric-value text-emerald">
                          {currentMembers} / {totalMembers} Slots
                        </strong>
                      </div>
                    </div>

                    {/* Occupancy Progress Bar */}
                    <div className="jg-scheme-progress-section">
                      <div className="jg-progress-meta">
                        <span>Enrollment Capacity</span>
                        <strong>{percentFull}% Filled</strong>
                      </div>
                      <div className="jg-progress-track">
                        <div
                          className="jg-progress-bar"
                          style={{
                            width: `${percentFull}%`,
                            background: isMember
                              ? '#10b981'
                              : percentFull > 85
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : 'linear-gradient(90deg, #1B3322, #2E7D32)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="jg-scheme-footer">
                      {isMember ? (
                        <button
                          type="button"
                          className="jg-btn-action enrolled"
                          onClick={() => navigate('/user/group-card')}
                        >
                          <Eye size={14} />
                          <span>View Scheme Passbook</span>
                        </button>
                      ) : isFull ? (
                        <button
                          type="button"
                          className="jg-btn-action full"
                          disabled
                        >
                          <span>Full • Waitlist Only</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="jg-btn-action join"
                          onClick={() => handleJoin(code)}
                          disabled={loading}
                        >
                          <span>Auto-fill & Join</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CONFIRMATION / CERTIFICATE MODAL
         ══════════════════════════════════════════════════════════ */}
      {modalState.isOpen && (
        <div className="jg-modal-overlay" onClick={() => handleModalClose(false)}>
          <div className="jg-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Icon Seal */}
            <div className={`jg-modal-seal ${modalState.type}`}>
              {modalState.type === 'success' ? (
                <CheckCircle2 size={36} />
              ) : (
                <AlertCircle size={36} />
              )}
            </div>

            <div className="jg-modal-org-label">PERIYANAYAGI AMMAN CHIT FUNDS</div>
            <h3 className="jg-modal-title">{modalState.title}</h3>
            <p className="jg-modal-desc">{modalState.message}</p>

            {/* Official Confirmation Certificate Box */}
            {modalState.type === 'success' && modalState.data && (
              <div className="jg-modal-certificate">
                <div className="jg-cert-badge">
                  <ShieldCheck size={14} color="#059669" />
                  <span>OFFICIAL ENROLLMENT CERTIFICATE</span>
                </div>

                <div className="jg-cert-grid">
                  {modalState.data.groupName && (
                    <div className="jg-cert-row">
                      <span>Chit Scheme</span>
                      <strong>{modalState.data.groupName}</strong>
                    </div>
                  )}
                  {modalState.data.groupAmount && (
                    <div className="jg-cert-row">
                      <span>Scheme Target</span>
                      <strong className="text-emerald">
                        {formatINR(modalState.data.groupAmount)}
                      </strong>
                    </div>
                  )}
                  {modalState.data.duration && (
                    <div className="jg-cert-row">
                      <span>Duration</span>
                      <strong>{modalState.data.duration} Months</strong>
                    </div>
                  )}
                  {modalState.data.totalMembers && (
                    <div className="jg-cert-row">
                      <span>Allocated Slot</span>
                      <strong>Slot #{modalState.data.currentMembers || 1} of {modalState.data.totalMembers}</strong>
                    </div>
                  )}
                </div>

                <div className="jg-cert-footer">
                  <Check size={13} color="#059669" />
                  <span>Digital Passbook Ledger issued to your account</span>
                </div>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="jg-modal-actions">
              {modalState.type === 'success' ? (
                <>
                  <button
                    type="button"
                    className="jg-modal-btn primary"
                    onClick={() => handleModalClose(true)}
                  >
                    <Eye size={16} />
                    <span>Open My Digital Passbook</span>
                  </button>
                  <button
                    type="button"
                    className="jg-modal-btn secondary"
                    onClick={() => handleModalClose(false)}
                  >
                    Close & Stay Here
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="jg-modal-btn error"
                  onClick={() => handleModalClose(false)}
                >
                  Close & Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;
