import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import AuctionWebSocketService from '../../../services/AuctionWebSocketService.js';
import {
  Gavel, Clock, Users, Trophy, Sparkles, Send,
  ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2,
  ChevronRight, ArrowLeft, Crown, Bot, Zap, Calendar,
  Coins, Building2, Info, X, History, Award, Check
} from 'lucide-react';
import './UserAuction.css';

const formatINR = (amt) => {
  if (amt == null || amt === '' || isNaN(Number(amt))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amt));
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 3D Dice Dots Subcomponent
const DiceDots = ({ value }) => {
  const dotPositions = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
  };

  return (
    <div className={`ua-dice-face-dots ua-dots-${value}`}>
      {(dotPositions[value] || ['center']).map((pos, idx) => (
        <span key={idx} className={`ua-dot ua-dot-${pos}`} />
      ))}
    </div>
  );
};

const UserAuction = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || localStorage.getItem('userId');

  // Groups and selection state
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [targetGroupForModal, setTargetGroupForModal] = useState(null);
  const [showNotActiveModal, setShowNotActiveModal] = useState(false);

  // Auction Room States
  const [activeMode, setActiveMode] = useState('betting'); // 'betting' | 'random'
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [liveAmount, setLiveAmount] = useState(null);
  const [myBid, setMyBid] = useState(0);
  const [bidInput, setBidInput] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Bids and participants
  const [allBids, setAllBids] = useState([]); // Unique per-user lowest bids
  const [bidHistory, setBidHistory] = useState([]); // Chronological order
  const [participants, setParticipants] = useState([]);
  const [activeParticipantsList, setActiveParticipantsList] = useState([]);

  // Sub-tabs in Betting: 'leaderboard' | 'history' | 'members'
  const [bettingTab, setBettingTab] = useState('leaderboard');

  // Anti-sniping notification
  const [antiSnipingAlert, setAntiSnipingAlert] = useState(null);

  // Eligibility
  const [eligibility, setEligibility] = useState({
    checked: false,
    isEligible: true,
    reason: '',
  });

  // Auto-bid
  const [showAutoBidModal, setShowAutoBidModal] = useState(false);
  const [autoBidFloor, setAutoBidFloor] = useState('');
  const [autoBidActive, setAutoBidActive] = useState(false);
  const [activeAutoBidFloor, setActiveAutoBidFloor] = useState(null);

  // Concluded Summary Modal
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [auctionWinner, setAuctionWinner] = useState(null);
  const [auctionSummary, setAuctionSummary] = useState(null);

  // Random Auction (Lucky Draw) States
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [rollTimer, setRollTimer] = useState(30);
  const [hasJoinedLuckyDraw, setHasJoinedLuckyDraw] = useState(false);
  const [luckyDrawWinner, setLuckyDrawWinner] = useState(null);

  // 1. Fetch User Portfolio Groups
  const fetchUserGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await makeRequest('/user/portfolio');
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data)) {
        const transformed = data.data.map((grp) => {
          const totalMonths = Number(grp.totalMonths) || 20;
          const investmentAmount = Number(grp.investmentAmount) || 100000;
          const currentMonth = Number(grp.currentMonth) || 1;
          const monthlyShare = Number(grp.monthlyContribution) || Math.round(investmentAmount / totalMonths);
          const totalPaid = Number(grp.totalPaid) || 0;
          const status = grp.paymentStatus || 'active';

          return {
            id: String(grp.id),
            name: grp.groupName || grp.group_name || `Group ${grp.id}`,
            totalMembers: grp.totalMembers || totalMonths,
            currentMembers: grp.currentMembers || grp.totalMembers || totalMonths,
            monthlyAmount: monthlyShare,
            completedCycles: grp.groupCompletedCycles !== undefined ? grp.groupCompletedCycles : currentMonth,
            totalCycles: totalMonths,
            collectedAmount: grp.groupCollectedAmount !== undefined ? grp.groupCollectedAmount : totalPaid,
            nextDueDate: grp.startDate || grp.estimatedPayDate || grp.endDate,
            groupAmount: investmentAmount,
            status: status,
          };
        });
        setUserGroups(transformed);
      } else {
        setUserGroups([]);
      }
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  // Initial chit value / starting amount
  const initialPoolAmount = selectedGroup?.groupAmount || 100000;

  // Memoized sorted bids (lowest bid first for reverse auction)
  const sortedBids = useMemo(() => {
    return [...allBids].sort((a, b) => a.bid - b.bid);
  }, [allBids]);

  const getCurrentLowestBid = useCallback(() => {
    const bids = allBids.map((b) => b.bid);
    return bids.length > 0 ? Math.min(...bids) : initialPoolAmount;
  }, [allBids, initialPoolAmount]);

  // 2. Click handler when user selects a group card
  const handleGroupSelect = async (group) => {
    setTargetGroupForModal(group);
    setLiveAmount(group.groupAmount || null);

    const cleanGroupId = encodeURIComponent(String(group.id).trim());

    // Fetch members in background
    try {
      const resp = await makeRequest(`/user/groups/getMembers?groupId=${cleanGroupId}`);
      const data = await safeJson(resp);
      if (data && data.success && Array.isArray(data.members)) {
        const transformedMembers = data.members.map((m) => ({
          id: String(m.id || m.userId),
          name: m.name || m.user_name || 'Member',
          phone: m.phone || '',
          avatar: (m.name || m.user_name || 'MB').substring(0, 2).toUpperCase(),
        }));
        setParticipants(transformedMembers);
      } else {
        setParticipants([]);
      }
    } catch (e) {
      console.error('Error loading members:', e);
      setParticipants([]);
    }

    // Check if auction is actively running on backend
    let active = false;
    try {
      const res = await makeRequest(`/user/auctions/active?groupId=${cleanGroupId}`);
      const auctionData = await safeJson(res);
      if (auctionData && auctionData.success && auctionData.active) {
        active = true;
        if (auctionData.currentBid) {
          setLiveAmount(auctionData.currentBid);
        }
        if (auctionData.timeLeft) {
          setTimeRemaining(auctionData.timeLeft);
        }
        if (auctionData.auctionType) {
          setActiveMode(auctionData.auctionType);
        }
      }
    } catch (e) {
      active = false;
    }

    if (active) {
      setIsAuctionActive(true);
      setSelectedGroup(group);
      setShowNotActiveModal(false);
    } else {
      setIsAuctionActive(false);
      setSelectedGroup(null); // Keep user on the group list screen
      setShowNotActiveModal(true); // Show "Auction Not Active" modal
    }
  };

  // 3. WebSocket Realtime Engine
  useEffect(() => {
    const activeTarget = selectedGroup || targetGroupForModal;
    if (!activeTarget) return;

    let cleanupFns = [];
    const token = localStorage.getItem('accessToken');
    const userId = currentUserId;

    if (!token || !userId) return;

    AuctionWebSocketService.connect(token, userId, 'user')
      .then(() => {
        // Request eligibility check
        if (activeTarget.id) {
          AuctionWebSocketService.checkEligibility(activeTarget.id);
        }

        // Live auction started
        const unsubStart = AuctionWebSocketService.on('auction_started', (data) => {
          if (!data.groupId || String(data.groupId) === String(activeTarget.id)) {
            setIsAuctionActive(true);
            setShowNotActiveModal(false);
            setSelectedGroup(activeTarget); // Automatically enter live room!
            if (data.initialAmount) setLiveAmount(data.initialAmount);
            if (data.remainingTime !== undefined) setTimeRemaining(data.remainingTime);
            else if (data.duration) setTimeRemaining(data.duration);

            if (Array.isArray(data.bids)) {
              const formattedBids = data.bids.map((b) => ({
                id: b.userId,
                name: b.userName || `Member #${b.userId}`,
                bid: Number(b.amount || b.bidAmount),
                bidTime: new Date(b.timestamp || Date.now()),
                avatar: (b.userName || 'MB').substring(0, 2).toUpperCase(),
                isMe: String(b.userId) === String(userId),
              }));
              setAllBids(formattedBids);
              setBidHistory(formattedBids);
              const myPrebid = formattedBids.find((b) => b.isMe);
              if (myPrebid) setMyBid(myPrebid.bid);
            }
          }
        });

        // Live bid placed
        const unsubBid = AuctionWebSocketService.on('bid_placed', (data) => {
          const { userId: bUserId, userName, amount, timestamp, antiSnipingExtended, newRemainingTime } = data;
          const bidVal = Number(amount || data.bidAmount);

          if (antiSnipingExtended) {
            setAntiSnipingAlert('+30s Anti-Sniping Extension Activated!');
            setTimeout(() => setAntiSnipingAlert(null), 6000);
            if (newRemainingTime !== undefined) {
              setTimeRemaining(newRemainingTime);
            }
          }

          const newBidItem = {
            id: bUserId,
            name: userName || `Member #${bUserId}`,
            bid: bidVal,
            bidTime: new Date(timestamp || Date.now()),
            avatar: (userName || 'MB').substring(0, 2).toUpperCase(),
            isMe: String(bUserId) === String(userId),
          };

          setActiveParticipantsList((prev) => {
            if (!prev.some((p) => String(p.id) === String(bUserId))) {
              return [...prev, { id: bUserId, name: newBidItem.name, avatar: newBidItem.avatar }];
            }
            return prev;
          });

          setBidHistory((prev) => [newBidItem, ...prev]);

          setAllBids((prev) => {
            const filtered = prev.filter((b) => String(b.id) !== String(bUserId));
            return [...filtered, newBidItem];
          });

          setLiveAmount(bidVal);

          if (String(bUserId) === String(userId)) {
            setMyBid(bidVal);
          }
        });

        // Time updates
        const unsubTime = AuctionWebSocketService.on('time_update', (data) => {
          if (data.remainingTime !== undefined) {
            setTimeRemaining(data.remainingTime);
          }
        });

        // Dice rolling (Random Auction)
        const unsubDice = AuctionWebSocketService.on('dice_rolling', (data) => {
          if (!data.groupId || String(data.groupId) === String(activeTarget.id)) {
            setActiveMode('random');
            setIsAuctionActive(true);
            setIsDiceRolling(true);
            const durationSec = Math.floor((Number(data.duration) || 30000) / 1000);
            setRollTimer(durationSec);
            if (data.initialAmount) setLiveAmount(data.initialAmount);

            const diceInterval = setInterval(() => {
              setDiceFace(Math.floor(Math.random() * 6) + 1);
            }, 150);

            const timerCountdown = setInterval(() => {
              setRollTimer((prev) => {
                if (prev <= 1) {
                  clearInterval(timerCountdown);
                  clearInterval(diceInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            setTimeout(() => {
              clearInterval(diceInterval);
              clearInterval(timerCountdown);
              setIsDiceRolling(false);
              const finalVal = data.finalValue || 1;
              setDiceValue(finalVal);
              setLuckyDrawWinner(data.winner || { name: `Lucky Winner #${finalVal}` });
            }, Number(data.duration) || 30000);
          }
        });

        // Auction ended
        const unsubEnd = AuctionWebSocketService.on('auction_ended', (data) => {
          setIsAuctionActive(false);
          setIsDiceRolling(false);
          const { winner: winData, summary } = data;
          if (summary) setAuctionSummary(summary);
          if (winData) {
            setAuctionWinner({
              id: winData.userId,
              name: winData.userName || winData.name || 'Winning Member',
              bid: winData.amount || winData.bid || getCurrentLowestBid(),
              avatar: (winData.userName || winData.name || 'WN').substring(0, 2).toUpperCase(),
            });
          }
          setShowWinnerModal(true);
        });

        // Eligibility response
        const unsubElig = AuctionWebSocketService.on('eligibility_status', (data) => {
          setEligibility({
            checked: true,
            isEligible: Boolean(data.isEligible),
            reason: data.reason || '',
          });
        });

        // Auto-bid status response
        const unsubAutoBid = AuctionWebSocketService.on('auto_bid_status', (data) => {
          setAutoBidActive(Boolean(data.enabled));
          if (data.enabled) {
            setActiveAutoBidFloor(data.floorAmount);
          } else {
            setActiveAutoBidFloor(null);
          }
        });

        // Participants list update
        const unsubParts = AuctionWebSocketService.on('participants_updated', (data) => {
          if (Array.isArray(data.participants)) {
            setActiveParticipantsList(
              data.participants.map((p) => ({
                id: p.userId,
                name: p.userName || 'Member',
                avatar: (p.userName || 'MB').substring(0, 2).toUpperCase(),
              }))
            );
          }
        });

        cleanupFns = [unsubStart, unsubBid, unsubTime, unsubDice, unsubEnd, unsubElig, unsubAutoBid, unsubParts];
      })
      .catch((err) => console.log('Auction WS error:', err));

    return () => {
      cleanupFns.forEach((fn) => typeof fn === 'function' && fn());
    };
  }, [selectedGroup, targetGroupForModal, currentUserId, getCurrentLowestBid]);

  // Submit Bid Handler
  const handlePlaceBid = async (customAmount = null) => {
    if (isSubmittingBid) return;

    if (!eligibility.isEligible && eligibility.checked) {
      alert(`Not Eligible: ${eligibility.reason || 'You cannot place bids in this group.'}`);
      return;
    }

    const targetBid = Number(customAmount !== null ? customAmount : bidInput);
    if (!targetBid || isNaN(targetBid) || targetBid <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    const currentLowest = getCurrentLowestBid();
    if (targetBid > currentLowest - 500) {
      alert(`Your bid must be at least ₹500 lower than current lowest bid of ${formatINR(currentLowest)} (Max: ${formatINR(currentLowest - 500)}).`);
      return;
    }

    if (targetBid % 100 !== 0) {
      alert('Bid amount must be in multiples of ₹100.');
      return;
    }

    setIsSubmittingBid(true);
    try {
      const idempotencyKey = `${currentUserId || 'u'}-${selectedGroup?.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 1. WebSocket send
      AuctionWebSocketService.placeBid(selectedGroup.id, targetBid, idempotencyKey);

      // 2. REST fallback
      makeRequest('/user/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          bidAmount: targetBid,
          idempotencyKey,
        }),
      }).catch(() => {});

      setBidInput('');
    } catch (err) {
      alert('Failed to place bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleQuickDecrement = (decrement) => {
    const currentLowest = getCurrentLowestBid();
    const newBid = Math.max(0, currentLowest - decrement);
    setBidInput(String(newBid));
    handlePlaceBid(newBid);
  };

  // Auto-bid toggle & save
  const handleToggleAutoBid = () => {
    if (!eligibility.isEligible && eligibility.checked) {
      alert(eligibility.reason || 'You are not eligible to set up auto-bid.');
      return;
    }
    if (autoBidActive) {
      AuctionWebSocketService.setAutoBid(selectedGroup.id, 0, false);
      setAutoBidActive(false);
      setActiveAutoBidFloor(null);
    } else {
      setShowAutoBidModal(true);
    }
  };

  const handleSaveAutoBid = () => {
    const floor = parseFloat(autoBidFloor);
    if (isNaN(floor) || floor <= 0) {
      alert('Please enter a valid floor amount.');
      return;
    }
    const currentLowest = getCurrentLowestBid();
    if (floor >= currentLowest) {
      alert(`Floor amount must be lower than the current lowest bid (${formatINR(currentLowest)}).`);
      return;
    }
    AuctionWebSocketService.setAutoBid(selectedGroup.id, floor, true);
    setShowAutoBidModal(false);
    setAutoBidFloor('');
  };

  // Lucky Draw Join Handler
  const handleJoinLuckyDraw = () => {
    if (hasJoinedLuckyDraw || isDiceRolling) return;
    try {
      AuctionWebSocketService.joinAuction(selectedGroup.id, currentUserId);
      setHasJoinedLuckyDraw(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackToGroupList = () => {
    setSelectedGroup(null);
    setActiveMode('betting');
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER VIEW 1: SELECT GROUP LIST SCREEN
  // ══════════════════════════════════════════════════════════════
  if (!selectedGroup) {
    return (
      <div className="ua-page-wrapper">
        {/* Header (Matching User Mobile App Header) */}
        <div className="ua-nav-header">
          <div className="ua-nav-header-left">
            <h1 className="ua-nav-title">Select Group</h1>
            <p className="ua-nav-sub">
              Choose an active chit fund scheme to enter the live auction floor
            </p>
          </div>
          <div className="ua-nav-icon-badge">
            <Gavel size={22} color="#6B46C1" />
          </div>
        </div>

        {/* Content Body */}
        {loadingGroups ? (
          <div className="ua-skeleton-list">
            {[1, 2, 3].map((n) => (
              <div key={n} className="ua-card-skeleton">
                <div className="ua-sk-top">
                  <div className="ua-sk-box title" />
                  <div className="ua-sk-box badge" />
                </div>
                <div className="ua-sk-box line" />
                <div className="ua-sk-row">
                  <div className="ua-sk-box half" />
                  <div className="ua-sk-box half" />
                </div>
              </div>
            ))}
          </div>
        ) : userGroups.length === 0 ? (
          <div className="ua-empty-groups-state">
            <div className="ua-empty-icon-wrap">
              <Gavel size={42} color="#9CA3AF" />
            </div>
            <h3>No Chit Groups Enrolled</h3>
            <p>You need to join or subscribe to an active chit scheme to participate in monthly auctions.</p>
            <a href="/user/join-group" className="ua-btn-join-scheme">
              Join a Chit Group
            </a>
          </div>
        ) : (
          <div className="ua-groups-grid">
            {userGroups.map((group) => {
              const isCompleted = ['completed', 'paid'].includes(String(group.status || '').toLowerCase());
              const statusColor = isCompleted ? '#10B981' : '#6B46C1';
              const progressPct = Math.min(100, Math.max(0, Math.round((group.completedCycles / group.totalCycles) * 100)));

              return (
                <div
                  key={group.id}
                  className="ua-group-card"
                  onClick={() => handleGroupSelect(group)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ua-gc-header">
                    <div className="ua-gc-title-block">
                      <h3 className="ua-gc-name">{group.name}</h3>
                      <div className="ua-gc-pills-row">
                        <span
                          className="ua-gc-status-pill"
                          style={{
                            background: isCompleted ? '#ECFDF5' : '#F3E8FF',
                            color: isCompleted ? '#059669' : '#6B46C1',
                            borderColor: isCompleted ? '#A7F3D0' : '#DDD6FE',
                          }}
                        >
                          <span
                            className="ua-gc-status-dot"
                            style={{ background: statusColor }}
                          />
                          {String(group.status).toUpperCase()}
                        </span>

                        <span className="ua-gc-cycle-pill">
                          <Calendar size={11} />
                          Cycle {group.completedCycles} of {group.totalCycles}
                        </span>
                      </div>
                    </div>

                    <button type="button" className="ua-gc-arrow-btn" aria-label="Enter Auction">
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="ua-gc-info-row">
                    <div className="ua-gc-info-item">
                      <Users size={15} color="#6B7280" />
                      <span>
                        {group.currentMembers} / {group.totalMembers} Members
                      </span>
                    </div>

                    <div className="ua-gc-info-item">
                      <Coins size={15} color="#6B7280" />
                      <span>{formatINR(group.monthlyAmount)}/mo</span>
                    </div>
                  </div>

                  <div className="ua-gc-progress-block">
                    <div className="ua-gc-progress-labels">
                      <span>{group.completedCycles}/{group.totalCycles} Cycles</span>
                      <strong>{progressPct}%</strong>
                    </div>
                    <div className="ua-gc-progress-track">
                      <div
                        className="ua-gc-progress-fill"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="ua-gc-footer">
                    <span className="ua-gc-due-text">
                      {isCompleted ? 'Completed' : `Next Due: ${group.nextDueDate || 'Standard Schedule'}`}
                    </span>
                    <strong className="ua-gc-collected-val">
                      {formatINR(group.collectedAmount)} collected
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            AUCTION NOT ACTIVE / NOT HELD MODAL (Matching User App)
           ══════════════════════════════════════════════════════════ */}
        {showNotActiveModal && targetGroupForModal && !isAuctionActive && (
          <div
            className="ua-modal-overlay"
            onClick={() => {
              setShowNotActiveModal(false);
              setTargetGroupForModal(null);
            }}
          >
            <div className="ua-modal-not-active" onClick={(e) => e.stopPropagation()}>
              <div className="ua-na-icon-wrapper">
                <div className="ua-na-icon-circle">
                  <Gavel size={38} color="#7C3AED" />
                </div>
              </div>

              <div className="ua-na-badge-pill">
                <span className="ua-na-dot" />
                <span>Auction Not Held</span>
              </div>

              <h2 className="ua-na-title">Auction Not Active</h2>

              <p className="ua-na-desc">
                The auction for <strong>{targetGroupForModal?.name}</strong> is currently not held or in progress.
              </p>

              <p className="ua-na-subtext">
                You are not permitted to enter the auction room right now. Please try again when the auction is officially started.
              </p>

              <button
                type="button"
                className="ua-btn-na-ok"
                onClick={() => {
                  setShowNotActiveModal(false);
                  setTargetGroupForModal(null);
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER VIEW 2: ACTIVE AUCTION ROOM (User App Mobile Structure)
  // ══════════════════════════════════════════════════════════════
  const effectiveLivePool = liveAmount !== null ? liveAmount : selectedGroup.groupAmount;

  return (
    <div className="ua-page-wrapper">
      {/* Auction Room Header Bar */}
      <div className="ua-room-header">
        <button
          type="button"
          className="ua-btn-back"
          onClick={handleBackToGroupList}
          title="Back to Group Selection"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="ua-room-title-center">
          <h2 className="ua-room-title">{selectedGroup.name}</h2>
          <span className="ua-room-tag">
            <span className="ua-live-pulse-dot" />
            Live Auction Room
          </span>
        </div>

        <div className="ua-room-cash-badge">
          <Coins size={18} color="#6B46C1" />
          <span>{formatINR(effectiveLivePool)}</span>
        </div>
      </div>

      {/* Mode Switcher Tabs (Betting Auction vs Random Auction) */}
      <div className="ua-mode-tabs-container">
        <button
          type="button"
          className={`ua-mode-tab ${activeMode === 'betting' ? 'active' : ''}`}
          onClick={() => setActiveMode('betting')}
        >
          <Gavel size={17} />
          <span>Betting Auction</span>
        </button>

        <button
          type="button"
          className={`ua-mode-tab ${activeMode === 'random' ? 'active' : ''}`}
          onClick={() => setActiveMode('random')}
        >
          <Sparkles size={17} />
          <span>Random Auction</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB 1: BETTING AUCTION INTERFACE
         ────────────────────────────────────────────────────────── */}
      {activeMode === 'betting' ? (
        <div className="ua-betting-layout">
          {/* Anti-Sniping Alert Banner */}
          {antiSnipingAlert && (
            <div className="ua-anti-sniping-banner">
              <Zap size={18} color="#FFFFFF" />
              <span>{antiSnipingAlert}</span>
            </div>
          )}

          {/* Member Eligibility Pill Banner */}
          {eligibility.checked && (
            <div
              className={`ua-eligibility-card ${eligibility.isEligible ? 'eligible' : 'ineligible'}`}
              onClick={() => {
                alert(
                  eligibility.isEligible
                    ? 'Eligible Member: You have full clearance to place live bids.'
                    : `Ineligible: ${eligibility.reason || 'Bidding is restricted for this group.'}`
                );
              }}
            >
              <div className="ua-elig-left">
                {eligibility.isEligible ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <AlertCircle size={16} color="#DC2626" />
                )}
                <span>{eligibility.isEligible ? 'Eligible to Bid' : 'Ineligible to Bid'}</span>
              </div>
              <Info size={15} />
            </div>
          )}

          {/* Top Metrics Row: Timer & Current Lowest Bid */}
          <div className="ua-metrics-two-col">
            {/* 1. Timer Card */}
            <div className="ua-timer-card">
              <Clock
                size={32}
                color={timeRemaining < 60 ? '#EF4444' : '#6B46C1'}
              />
              <div className={`ua-timer-digits ${timeRemaining < 60 ? 'warning' : ''}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="ua-timer-sub-row">
                <span className="ua-clock-dot" />
                <span>Server-Synced Clock</span>
              </div>
              {timeRemaining <= 30 && (
                <div className="ua-sniping-notice-badge">
                  <ShieldCheck size={12} color="#B45309" />
                  <span>Anti-sniping active: bids under 30s add +30s</span>
                </div>
              )}
            </div>

            {/* 2. Current Lowest Bid Card */}
            <div className="ua-lowest-bid-card">
              <div className="ua-lb-header">
                <Trophy size={18} color="#F59E0B" />
                <span>Current Lowest Prize Bid</span>
              </div>
              <div className="ua-lb-amount">{formatINR(getCurrentLowestBid())}</div>
              <div className="ua-lb-meta">
                {myBid > 0 ? (
                  <span className="ua-my-bid-text">
                    Your best bid: <strong>{formatINR(myBid)}</strong>
                  </span>
                ) : (
                  <span className="ua-my-bid-text subtle">You haven't bid yet</span>
                )}
                {activeAutoBidFloor && (
                  <span className="ua-autobid-floor-badge">
                    <Bot size={12} />
                    Floor: {formatINR(activeAutoBidFloor)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Place Your Bid Card */}
          <div className="ua-bidding-card">
            <div className="ua-bidding-top">
              <span className="ua-bidding-title">Place Your Bid</span>
              <button
                type="button"
                className={`ua-btn-autobid-toggle ${autoBidActive ? 'active' : ''}`}
                onClick={handleToggleAutoBid}
              >
                <Bot size={15} />
                <span>{autoBidActive ? 'Auto-Bid ON' : 'Setup Auto-Bid'}</span>
              </button>
            </div>

            {/* Input wrap */}
            <div className="ua-bid-input-container">
              <span className="ua-currency-sym">₹</span>
              <input
                type="number"
                className="ua-bid-text-input"
                placeholder={`Max ${formatINR(getCurrentLowestBid() - 500)}`}
                value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
                disabled={isSubmittingBid || !eligibility.isEligible}
              />
            </div>

            {/* Quick Bid Reductions */}
            <div className="ua-quick-bid-buttons">
              <button
                type="button"
                className="ua-quick-btn"
                onClick={() => handleQuickDecrement(1000)}
                disabled={isSubmittingBid || !eligibility.isEligible}
              >
                -₹1,000
              </button>
              <button
                type="button"
                className="ua-quick-btn"
                onClick={() => handleQuickDecrement(5000)}
                disabled={isSubmittingBid || !eligibility.isEligible}
              >
                -₹5,000
              </button>
              <button
                type="button"
                className="ua-quick-btn"
                onClick={() => handleQuickDecrement(10000)}
                disabled={isSubmittingBid || !eligibility.isEligible}
              >
                -₹10,000
              </button>
            </div>

            {/* Submit Bid Button */}
            <button
              type="button"
              className="ua-btn-submit-bid"
              onClick={() => handlePlaceBid()}
              disabled={isSubmittingBid || !eligibility.isEligible || !bidInput}
            >
              {isSubmittingBid ? (
                <>
                  <Loader2 size={18} className="ua-spin" />
                  <span>Placing Bid...</span>
                </>
              ) : (
                <>
                  <Gavel size={18} />
                  <span>Place Bid</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Tabs: Leaderboard | Live History | Members */}
          <div className="ua-subtabs-card">
            <div className="ua-subtabs-nav">
              <button
                type="button"
                className={`ua-subtab-btn ${bettingTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setBettingTab('leaderboard')}
              >
                <Trophy size={14} />
                <span>Leaderboard ({allBids.length})</span>
              </button>

              <button
                type="button"
                className={`ua-subtab-btn ${bettingTab === 'history' ? 'active' : ''}`}
                onClick={() => setBettingTab('history')}
              >
                <History size={14} />
                <span>Live History ({bidHistory.length})</span>
              </button>

              <button
                type="button"
                className={`ua-subtab-btn ${bettingTab === 'members' ? 'active' : ''}`}
                onClick={() => setBettingTab('members')}
              >
                <Users size={14} />
                <span>Members ({activeParticipantsList.length || participants.length})</span>
              </button>
            </div>

            <div className="ua-subtabs-content">
              {/* TAB 1: LEADERBOARD */}
              {bettingTab === 'leaderboard' && (
                <>
                  {sortedBids.length === 0 ? (
                    <div className="ua-subtab-empty">
                      <Gavel size={32} color="#CBD5E1" />
                      <p>No bids placed yet in this session</p>
                    </div>
                  ) : (
                    <div className="ua-leaderboard-list">
                      {sortedBids.map((item, idx) => (
                        <div
                          key={item.id ? `${item.id}-${idx}` : idx}
                          className={`ua-leader-row ${idx === 0 ? 'top-rank' : ''}`}
                        >
                          <div className="ua-lr-left">
                            <span className={`ua-rank-circle ${idx === 0 ? 'top' : ''}`}>
                              #{idx + 1}
                            </span>
                            <div className="ua-avatar-circle">{item.avatar}</div>
                            <div className="ua-lr-info">
                              <span className="ua-lr-name">{item.name}</span>
                              {item.isMe && <span className="ua-lr-me-tag">Your bid</span>}
                            </div>
                          </div>

                          <div className="ua-lr-right">
                            <strong className="ua-lr-bid">{formatINR(item.bid)}</strong>
                            {idx === 0 && <Crown size={17} color="#F59E0B" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: LIVE HISTORY */}
              {bettingTab === 'history' && (
                <>
                  {bidHistory.length === 0 ? (
                    <div className="ua-subtab-empty">
                      <Clock size={32} color="#CBD5E1" />
                      <p>No bid history recorded yet</p>
                    </div>
                  ) : (
                    <div className="ua-history-list">
                      {bidHistory.map((item, idx) => {
                        const timeStr = item.bidTime
                          ? new Date(item.bidTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '';
                        return (
                          <div key={idx} className="ua-history-row">
                            <div className="ua-hist-left">
                              <div className="ua-hist-chevron">
                                <ChevronRight size={14} color="#059669" />
                              </div>
                              <div>
                                <div className="ua-hist-name">
                                  {item.name} {item.isMe && '(You)'}
                                </div>
                                <div className="ua-hist-time">{timeStr}</div>
                              </div>
                            </div>
                            <strong className="ua-hist-val">{formatINR(item.bid)}</strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: MEMBERS */}
              {bettingTab === 'members' && (
                <>
                  {(activeParticipantsList.length > 0 ? activeParticipantsList : participants).length === 0 ? (
                    <div className="ua-subtab-empty">
                      <Users size={32} color="#CBD5E1" />
                      <p>No participants enrolled in this session</p>
                    </div>
                  ) : (
                    <div className="ua-members-list">
                      {(activeParticipantsList.length > 0 ? activeParticipantsList : participants).map((m, idx) => {
                        const name = m.name || m.userName || `Member #${idx + 1}`;
                        const avatar = (name).substring(0, 2).toUpperCase();
                        const hasBid = allBids.some((b) => String(b.id) === String(m.id || m.userId));

                        return (
                          <div key={m.id || idx} className="ua-member-row">
                            <div className="ua-mem-left">
                              <div className="ua-avatar-circle">{avatar}</div>
                              <div>
                                <div className="ua-mem-name">{name}</div>
                                <div className="ua-mem-role">Registered Chit Subscriber</div>
                              </div>
                            </div>

                            <span className={`ua-mem-badge ${hasBid ? 'active' : ''}`}>
                              {hasBid ? 'Bid Placed' : 'Observing'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────
            TAB 2: RANDOM AUCTION (LUCKY DRAW) INTERFACE
           ────────────────────────────────────────────────────────── */
        <div className="ua-random-layout">
          {/* Main 3D Lucky Draw Card */}
          <div className="ua-dice-arena-card">
            <div className="ua-dice-top-bar">
              <h2 className="ua-dice-title">Lucky Draw</h2>
              <span className="ua-dice-count-badge">
                <Users size={13} />
                {participants.length} Participants
              </span>
            </div>

            {!isDiceRolling && !luckyDrawWinner && (
              <div className="ua-dice-waiting-badge">
                <Clock size={16} />
                <span>Waiting for Admin to start the draw...</span>
              </div>
            )}

            {isDiceRolling && (
              <div className="ua-dice-rolling-badge">
                <Clock size={16} className="ua-spin" />
                <span>Rolling in progress ({rollTimer}s)...</span>
              </div>
            )}

            {/* 3D Dice Graphic Container */}
            <div className="ua-dice-stage">
              <div className={`ua-cube ${isDiceRolling ? 'rolling' : ''} show-${diceValue}`}>
                <div className="ua-face ua-face-1"><DiceDots value={1} /></div>
                <div className="ua-face ua-face-2"><DiceDots value={2} /></div>
                <div className="ua-face ua-face-3"><DiceDots value={3} /></div>
                <div className="ua-face ua-face-4"><DiceDots value={4} /></div>
                <div className="ua-face ua-face-5"><DiceDots value={5} /></div>
                <div className="ua-face ua-face-6"><DiceDots value={6} /></div>
              </div>
            </div>

            {luckyDrawWinner && (
              <div className="ua-lucky-winner-reveal">
                <span className="ua-lw-label">Winner Rolled:</span>
                <div className="ua-lw-box">
                  <span className="ua-lw-num">{diceValue}</span>
                </div>
                <span className="ua-lw-name">
                  Winner: {luckyDrawWinner?.name || 'Lucky Participant'}
                </span>
              </div>
            )}

            {!hasJoinedLuckyDraw && !isDiceRolling && !luckyDrawWinner && (
              <button
                type="button"
                className="ua-btn-join-draw"
                onClick={handleJoinLuckyDraw}
              >
                <Sparkles size={18} />
                <span>Join Lucky Draw</span>
              </button>
            )}

            {hasJoinedLuckyDraw && !isDiceRolling && !luckyDrawWinner && (
              <div className="ua-joined-confirmed-chip">
                <Check size={15} color="#059669" />
                <span>Joined Successfully! Waiting for Admin Roll</span>
              </div>
            )}
          </div>

          {/* Participants Grid */}
          <div className="ua-draw-participants-card">
            <h3 className="ua-dp-title">Draw Participants</h3>
            <div className="ua-dp-grid">
              {(participants.length > 0 ? participants : Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Member ${i + 1}` }))).map((p, idx) => {
                const name = p.name || `Member ${idx + 1}`;
                const avatar = (name).substring(0, 2).toUpperCase();
                return (
                  <div key={p.id || idx} className="ua-dp-item">
                    <span className="ua-dp-num-pill">{idx + 1}</span>
                    <div className="ua-avatar-circle">{avatar}</div>
                    <span className="ua-dp-name">{name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AUTO-BID CONFIGURATION MODAL (User Mobile App Style)
         ══════════════════════════════════════════════════════════ */}
      {showAutoBidModal && (
        <div className="ua-modal-overlay" onClick={() => setShowAutoBidModal(false)}>
          <div className="ua-autobid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ua-ab-header">
              <Bot size={24} color="#6B46C1" />
              <h3 className="ua-ab-title">Configure Auto-Bid</h3>
            </div>

            <p className="ua-ab-desc">
              Our automated proxy bidding system will place bids on your behalf whenever another member bids, reducing the price by ₹500 down to your floor limit.
            </p>

            <div className="ua-ab-field">
              <label>Floor Prize Money (Minimum you accept):</label>
              <div className="ua-ab-input-wrap">
                <span className="ua-currency-sym">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={autoBidFloor}
                  onChange={(e) => setAutoBidFloor(e.target.value)}
                />
              </div>
              <span className="ua-ab-help">
                Current lowest bid: {formatINR(getCurrentLowestBid())}
              </span>
            </div>

            <div className="ua-ab-actions">
              <button
                type="button"
                className="ua-btn-ab-cancel"
                onClick={() => setShowAutoBidModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ua-btn-ab-save"
                onClick={handleSaveAutoBid}
              >
                Activate Auto-Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AUCTION CONCLUDED / FINANCIAL SETTLEMENT SUMMARY MODAL
         ══════════════════════════════════════════════════════════ */}
      {showWinnerModal && (
        <div className="ua-modal-overlay" onClick={() => setShowWinnerModal(false)}>
          <div className="ua-winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ua-wm-header">
              <Trophy size={48} color="#F59E0B" />
              <h2>Auction Concluded</h2>
              <p className="ua-wm-winner-name">
                Winner: {auctionWinner?.name || luckyDrawWinner?.name || 'Declared Member'}
              </p>
            </div>

            {/* Financial Breakdown Table */}
            {(() => {
              const summary = auctionSummary || {
                chitValue: initialPoolAmount,
                winningBid: auctionWinner?.bid || initialPoolAmount,
                discountAmount: Math.max(0, initialPoolAmount - (auctionWinner?.bid || initialPoolAmount)),
                commission: Math.round(initialPoolAmount * 0.05),
                netDividendPool: Math.max(0, initialPoolAmount - (auctionWinner?.bid || initialPoolAmount) - Math.round(initialPoolAmount * 0.05)),
                totalMembers: selectedGroup?.totalMembers || 20,
                dividendPerMember: Math.round(Math.max(0, initialPoolAmount - (auctionWinner?.bid || initialPoolAmount) - Math.round(initialPoolAmount * 0.05)) / (selectedGroup?.totalMembers || 20)),
                nextInstallmentAmount: Math.max(0, Math.round(initialPoolAmount / (selectedGroup?.totalMembers || 20)) - Math.round(Math.max(0, initialPoolAmount - (auctionWinner?.bid || auctionWinner?.amount || initialPoolAmount) - Math.round(initialPoolAmount * 0.05)) / (selectedGroup?.totalMembers || 20))),
              };

              return (
                <div className="ua-wm-table-card">
                  <h4 className="ua-wm-table-title">Financial Settlement Breakdown</h4>
                  <div className="ua-wm-row">
                    <span>Total Chit Value</span>
                    <strong>{formatINR(summary.chitValue)}</strong>
                  </div>
                  <div className="ua-wm-row highlight-green">
                    <span>Winning Prize Disbursal</span>
                    <strong>{formatINR(summary.winningBid)}</strong>
                  </div>
                  <div className="ua-wm-row">
                    <span>Gross Dividend (Discount)</span>
                    <span>{formatINR(summary.discountAmount)}</span>
                  </div>
                  <div className="ua-wm-row">
                    <span>Foreman Commission (5%)</span>
                    <span>{formatINR(summary.commission)}</span>
                  </div>
                  <div className="ua-wm-row highlight-purple">
                    <span>Net Dividend Distributed</span>
                    <strong>{formatINR(summary.netDividendPool)}</strong>
                  </div>
                  <div className="ua-wm-row">
                    <span>Dividend Per Subscriber</span>
                    <strong className="text-emerald">{formatINR(summary.dividendPerMember)}</strong>
                  </div>
                  <div className="ua-wm-row total">
                    <span>Next Month Installment</span>
                    <strong>{formatINR(summary.nextInstallmentAmount)}</strong>
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              className="ua-btn-wm-close"
              onClick={() => {
                setShowWinnerModal(false);
                handleBackToGroupList();
              }}
            >
              Close & Return to Groups
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuction;
