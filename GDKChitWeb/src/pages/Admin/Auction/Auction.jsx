import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { makeRequest, safeJson, tokenStore } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import AuctionWS from '../../../services/AuctionWebSocketService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  Gavel as RiGavelLine, Users as RiGroupLine, Check as RiCheckLine, X as RiCloseLine,
  Loader2 as RiLoader4Line, AlertTriangle as RiAlertLine, Search as RiSearchLine,
  RefreshCw as RiRefreshLine, ChevronRight as RiChevronRightLine, Dice5 as RiDiceLine,
  Play as RiPlayLine, Pause as RiPauseLine, RotateCcw as RiResetLine, Timer as RiTimerLine,
  Trophy as RiTrophyLine, Crown as RiCrownLine, History as RiHistoryLine, Zap as RiZapLine,
  Wifi as RiWifiLine, WifiOff as RiWifiOffLine, UserCheck as RiUserCheckLine,
  Clock as RiTimeLine, CircleDollarSign as RiMoneyDollarCircleLine
} from 'lucide-react';
import './Auction.css';
import BettingAuction from './components/BettingAuction.jsx';
import RandomAuction from './components/RandomAuction.jsx';

const SC = {
  active: '#10B981',
  ongoing: '#10B981',
  completed: '#6B46C1',
  'not started': '#6B7280',
};
const scOf = (s) => SC[String(s).toLowerCase()] || '#6B7280';

const StatusIcon = ({ status, size = 11 }) => {
  const s = String(status).toLowerCase();
  const Icon = s === 'completed' || s === 'active' || s === 'ongoing' ? RiCheckLine : RiTimeLine;
  return <Icon size={size} color={scOf(s)} style={{ verticalAlign: 'middle', marginRight: 4 }} />;
};

const Auction = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' (Top Tabs)
  const [auctionType, setAuctionType] = useState('betting'); // 'betting' | 'random'
  const [poolAmount, setPoolAmount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  
  // Simulation Steps & States
  const [currentStep, setCurrentStep] = useState('setup'); // 'setup' | 'run'
  const [participants, setParticipants] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);
  const [savingWinner, setSavingWinner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pageNotice, setPageNotice] = useState({ text: '', type: 'error' }); // Inline feedback instead of browser alert()

  // ──── Betting Auction Live State ────
  const [initialAmount, setInitialAmount] = useState('');
  const [auctionDuration, setAuctionDuration] = useState(300); // seconds
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [auctionStartTime, setAuctionStartTime] = useState(null);
  const [auctionHistory, setAuctionHistory] = useState([]);
  const [activeBidders, setActiveBidders] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // ──── Random Auction State ────
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [rollTimer, setRollTimer] = useState(0);
  const [joinedParticipants, setJoinedParticipants] = useState(new Set());
  const [showDiceResult, setShowDiceResult] = useState(false);

  const unsubscribeRef = useRef([]);
  const timerRef = useRef(null);

  // ──── WebSocket Connection ────
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = tokenStore.getAccessToken();
        const userId = user?.id;
        if (token && userId) {
          await AuctionWS.connect(token, userId, 'admin');
          setWsConnected(true);

          const unsubs = [
            AuctionWS.on('connected', () => setWsConnected(true)),
            AuctionWS.on('disconnected', () => setWsConnected(false)),
            AuctionWS.on('auction_started', handleAuctionStartedEvent),
            AuctionWS.on('bid_placed', handleBidPlacedEvent),
            AuctionWS.on('time_update', handleTimeUpdateEvent),
            AuctionWS.on('auction_ended', handleAuctionEndedEvent),
            AuctionWS.on('auction_paused', () => setIsAuctionActive(false)),
            AuctionWS.on('auction_resumed', () => setIsAuctionActive(true)),
            AuctionWS.on('auction_reset', handleAuctionResetEvent),
            AuctionWS.on('user_joined_auction', handleUserJoinedEvent),
            AuctionWS.on('error', (err) => console.error('WebSocket Error:', err)),
          ];
          unsubscribeRef.current = unsubs;
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setWsConnected(false);
      }
    };

    initWebSocket();

    return () => {
      unsubscribeRef.current.forEach(unsub => unsub?.());
      AuctionWS.disconnect();
    };
  }, [user?.id]);

  // ──── WebSocket Event Handlers ────
  const handleAuctionStartedEvent = useCallback((data) => {
    setAuctionStartTime(data.startTime);
    setAuctionDuration(data.duration || 300);
    setTimeRemaining(data.duration || 300);
    setIsAuctionActive(true);
    setAuctionStarted(true);
    setAuctionHistory([]);
    setActiveBidders([]);
  }, []);

  const handleBidPlacedEvent = useCallback((data) => {
    const { userId, userName, amount, timestamp } = data;

    setParticipants(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(p => String(p.userId) === String(userId));
      if (idx >= 0) updated[idx] = { ...updated[idx], bid: amount, bidTime: timestamp };
      return updated;
    });

    setAuctionHistory(prev => [...prev, {
      userId,
      user: userName,
      bid: amount,
      time: new Date(timestamp).toLocaleTimeString(),
    }]);

    setActiveBidders(prev => {
      const exists = prev.find(b => String(b.userId) === String(userId));
      if (exists) {
        return prev.map(b => String(b.userId) === String(userId) ? { ...b, amount, timestamp } : b);
      }
      return [...prev, { userId, userName, amount, timestamp }];
    });
  }, []);

  const handleTimeUpdateEvent = useCallback((data) => {
    setTimeRemaining(Math.max(0, data.remainingTime));
  }, []);

  const handleAuctionEndedEvent = useCallback((data) => {
    const { winner: winnerData } = data;
    setIsAuctionActive(false);

    if (winnerData) {
      setAuctionResult({
        type: auctionType,
        winner: {
          ...winnerData,
          name: winnerData.userName,
          bid: winnerData.amount,
        },
        amountTaken: winnerData.amount,
        dividend: 0,
      });
      setShowResultModal(true);
    }
  }, [auctionType]);

  const handleAuctionResetEvent = useCallback(() => {
    setIsAuctionActive(false);
    setAuctionStarted(false);
    setTimeRemaining(300);
    setAuctionHistory([]);
    setActiveBidders([]);
  }, []);

  const handleUserJoinedEvent = useCallback((data) => {
    setJoinedParticipants(prev => {
      const newSet = new Set(prev);
      newSet.add(String(data.userId));
      return newSet;
    });
  }, []);

  // ──── Local Timer Sync for Betting ────
  useEffect(() => {
    if (!isAuctionActive || !auctionStartTime) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - auctionStartTime) / 1000);
      const remaining = Math.max(0, auctionDuration - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current);
        if (auctionType === 'betting') handleEndAuction();
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuctionActive, auctionStartTime, auctionDuration, auctionType]);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (data.success) {
        const mapped = (data.data || []).map(g => ({
          id: g.id,
          name: g.name || g.group_name || 'Untitled',
          status: String(g.status || 'Not Started').toLowerCase(),
          totalMembers: g.totalMembers || g.total_members || 0,
          duration: g.duration || 20,
          groupAmount: g.groupAmount || g.group_amount || 0,
          startDate: g.startDate || g.start_date,
          endDate: g.endDate || g.end_date,
          completedCycles: g.completedCycles || 0,
          groupCode: g.groupCode || '',
        }));
        setGroups(mapped);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Load members for selected group
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    setSelectedMembers([]);
    setPoolAmount('');
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (data.success) {
        setMembers(data.data || data.members || []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m.userId === member.userId);
      return isSelected ? prev.filter(m => m.userId !== member.userId) : [...prev, member];
    });
  };

  const toggleSelectAllMembers = () => {
    setSelectedMembers(prev => prev.length === members.length ? [] : [...members]);
  };

  // ──── START AUCTION SETUP (both modes) ────
  const startAuctionSetup = () => {
    setPageNotice({ text: '', type: 'error' });
    if (selectedMembers.length < 2) {
      setPageNotice({ text: 'Please select at least 2 members for the auction.', type: 'error' });
      return;
    }

    const initialParticipants = selectedMembers.map(m => ({ ...m, bid: 0, bidTime: null }));
    setParticipants(initialParticipants);
    setJoinedParticipants(new Set());
    setShowDiceResult(false);
    setDiceValue(1);

    if (wsConnected) {
      AuctionWS.setupAuction(selectedGroup.id, auctionType, selectedMembers.map(m => String(m.userId)));
    }

    setCurrentStep('run');
  };

  // ──── BETTING: Start/Pause/Resume/End/Reset ────
  const handleStartBettingAuction = () => {
    setPageNotice({ text: '', type: 'error' });
    const pAmt = parseFloat(poolAmount);
    if (Number.isNaN(pAmt) || pAmt <= 0) {
      setPageNotice({ text: 'Please enter a valid pool amount before starting.', type: 'error' });
      return;
    }
    const amt = parseFloat(initialAmount);
    if (!amt || amt <= 0) {
      setPageNotice({ text: 'Please enter a valid initial bidding amount before starting.', type: 'error' });
      return;
    }
    if (!selectedGroup?.id) {
      setPageNotice({ text: 'No group selected.', type: 'error' });
      return;
    }

    const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)));
    if (!allJoined) {
      setPageNotice({ text: 'Please wait until all selected members have applied and joined the auction before starting.', type: 'error' });
      return;
    }

    if (isAuctionActive) return;

    if (wsConnected) {
      AuctionWS.startAuction(selectedGroup.id, amt, auctionDuration, participants.map(p => String(p.userId)));
    }
  };

  const handlePauseAuction = () => {
    if (selectedGroup?.id && wsConnected) AuctionWS.pauseAuction(selectedGroup.id);
  };

  const handleResumeAuction = () => {
    if (selectedGroup?.id && timeRemaining > 0 && wsConnected) {
      AuctionWS.resumeAuction(selectedGroup.id);
    }
  };

  const handleEndAuction = () => {
    if (!selectedGroup?.id) return;
    if (wsConnected) {
      AuctionWS.endAuction(selectedGroup.id);
    }

    const validBids = participants.filter(p => p.bid > 0);
    if (validBids.length === 0) {
      setIsAuctionActive(false);
      return;
    }

    const winner = validBids.reduce((prev, current) => prev.bid < current.bid ? prev : current);

    setAuctionResult({
      type: 'betting',
      winner,
      amountTaken: winner.bid,
      dividend: (parseFloat(poolAmount) / selectedGroup.duration) - winner.bid,
    });
    setShowResultModal(true);
    setIsAuctionActive(false);
  };

  const handleResetBettingAuction = () => {
    setPageNotice({ text: '', type: 'error' });
    if (selectedGroup?.id && wsConnected) {
      AuctionWS.resetAuction(selectedGroup.id);
    }
    setParticipants(prev => prev.map(p => ({ ...p, bid: 0, bidTime: null })));
    setIsAuctionActive(false);
    setAuctionStarted(false);
    setTimeRemaining(auctionDuration);
    setAuctionHistory([]);
    setActiveBidders([]);
    setInitialAmount('');
  };

  const getCurrentLowestBid = () => {
    const active = participants.filter(p => p.bid > 0);
    if (active.length === 0) return parseFloat(initialAmount) || (selectedGroup?.groupAmount / selectedGroup?.duration) || 0;
    return Math.min(...active.map(p => p.bid));
  };

  // ──── RANDOM: Roll Dice ────
  const rollDice = () => {
    setPageNotice({ text: '', type: 'error' });
    if (isRolling) return;
    if (participants.length === 0) {
      setPageNotice({ text: 'No participants available for the random draw.', type: 'error' });
      return;
    }

    const amt = parseFloat(poolAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setPageNotice({ text: 'Please enter a valid pool prize amount for the draw.', type: 'error' });
      return;
    }

    const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)));
    if (!allJoined) {
      setPageNotice({ text: 'Please wait until all selected participants have applied and joined the draw.', type: 'error' });
      return;
    }

    const maxDiceValue = Math.min(participants.length, 6);
    const finalValue = Math.floor(Math.random() * maxDiceValue) + 1;
    const winner = participants[Math.floor(Math.random() * participants.length)];

    if (selectedGroup?.id && wsConnected) {
      AuctionWS.rollDice(selectedGroup.id, 4000, finalValue, winner);
    }

    setIsRolling(true);
    setShowDiceResult(false);
    setRollTimer(4);

    const countdownInterval = setInterval(() => {
      setRollTimer(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const faceInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * maxDiceValue) + 1);
    }, 150);

    setTimeout(() => {
      clearInterval(faceInterval);
      clearInterval(countdownInterval);
      setRollTimer(0);
      setDiceValue(finalValue);
      setShowDiceResult(true);

      setTimeout(() => {
        setIsRolling(false);
        setAuctionResult({
          type: 'random',
          winner,
          amountTaken: parseFloat(poolAmount),
          dividend: 0,
          diceValue: finalValue,
        });
        setShowResultModal(true);
      }, 1000);
    }, 4000);
  };

  // ──── Save Winner ────
  const saveWinner = async () => {
    if (!auctionResult) return;
    setSavingWinner(true);
    try {
      const payload = {
        groupId: selectedGroup.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        chitWinnerName: auctionResult.winner.name,
        chitWinnerMemberId: String(auctionResult.winner.userId || auctionResult.winner.id || ''),
        amountTaken: auctionResult.amountTaken,
        datePicked: new Date().toISOString(),
        winnerUserId: auctionResult.winner.userId || auctionResult.winner.id,
      };

      const res = await makeRequest('/admin/groups/saveAuctionWinner', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (data.success) {
        try {
          await makeRequest('/admin/groups/notifyAuctionMembers', {
            method: 'POST',
            body: JSON.stringify({
              groupId: selectedGroup.id,
              winnerName: auctionResult.winner.name,
              amountTaken: auctionResult.amountTaken,
              auctionType: auctionResult.type,
            }),
          });
        } catch (smsErr) {
          console.warn('SMS notification failed (non-blocking):', smsErr);
        }

        setSuccessMessage(`${auctionResult.winner.name} successfully registered as winner!`);
        setTimeout(() => {
          setSuccessMessage('');
          setShowResultModal(false);
          resetAuction();
          fetchGroups();
        }, 2000);
      } else {
        alert(data.message || 'Failed to save winner');
      }
    } catch (err) {
      console.error('Error saving auction winner:', err);
      alert('Connection failed. Could not save winner details.');
    } finally {
      setSavingWinner(false);
    }
  };

  const resetAuction = () => {
    setCurrentStep('setup');
    setSelectedGroup(null);
    setMembers([]);
    setSelectedMembers([]);
    setParticipants([]);
    setAuctionResult(null);
    setIsAuctionActive(false);
    setAuctionStarted(false);
    setAuctionHistory([]);
    setActiveBidders([]);
    setInitialAmount('');
    setTimeRemaining(300);
    setJoinedParticipants(new Set());
    setShowDiceResult(false);
    setDiceValue(1);
    setIsRolling(false);
    setPoolAmount('');
  };

  const counts = useMemo(() => ({
    active: groups.filter(g => String(g.status || '').toLowerCase() !== 'completed').length,
    completed: groups.filter(g => String(g.status || '').toLowerCase() === 'completed').length,
  }), [groups]);

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (activeTab === 'active') {
      list = groups.filter(g => String(g.status || '').toLowerCase() !== 'completed');
    } else if (activeTab === 'completed') {
      list = groups.filter(g => String(g.status || '').toLowerCase() === 'completed');
    }

    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        String(g.id).includes(q) ||
        String(g.groupCode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [groups, activeTab, groupSearchQuery]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return !q ? members : members.filter(m => (m.name || '').toLowerCase().includes(q) || (m.phone || '').includes(q));
  }, [members, searchQuery]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rn-page">
      {/* ── Page Header & Action Bar Container (Exact Match to ManageGroups) ── */}
      <div className="reports-header-container">
        <div className="reports-toolbar-row">
          {/* Tab Bar (Active vs. Completed) */}
          <div className="reports-tabs-wrapper">
            {[
              { key: 'active', label: `Active (${counts.active})` },
              { key: 'completed', label: `Completed (${counts.completed})` },
            ].map(t => (
              <button
                key={t.key}
                className={`reports-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(t.key);
                  setGroupSearchQuery('');
                  setSelectedGroup(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search, Action Buttons */}
          <div className="reports-filters-wrapper">
            <div className={`auc-ws-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: wsConnected ? '#10B981' : '#EF4444', display: 'inline-block' }} />
              <span>{wsConnected ? 'Live' : 'Offline'}</span>
            </div>

            <div className="reports-search-container">
              <RiSearchLine className="reports-search-icon" size={16} />
              <input
                type="text"
                className="reports-search-input"
                placeholder="Search groups..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
              />
              {groupSearchQuery && (
                <button
                  className="reports-search-clear"
                  onClick={() => setGroupSearchQuery('')}
                >
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>

            <button
              className="reports-refresh-btn"
              onClick={fetchGroups}
              disabled={loadingGroups}
            >
              <RiRefreshLine size={16} className={loadingGroups ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Text Alert Notification (No window.alert) */}
      {pageNotice.text && (
        <div style={{
          marginTop: 12,
          padding: '12px 16px',
          borderRadius: '8px',
          background: pageNotice.type === 'error' ? '#FDECEC' : '#EBF3ED',
          border: `1px solid ${pageNotice.type === 'error' ? '#F5C6C6' : '#C8DEC9'}`,
          color: pageNotice.type === 'error' ? '#D32F2F' : '#1B3322',
          fontSize: '13.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pageNotice.type === 'error' ? <RiAlertLine size={18} /> : <RiCheckLine size={18} />}
            <span>{pageNotice.text}</span>
          </div>
          <button
            onClick={() => setPageNotice({ text: '', type: 'error' })}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 2 }}
          >
            <RiCloseLine size={16} />
          </button>
        </div>
      )}

      {currentStep === 'setup' ? (
        /* ════════════════════════════════════════════
           GROUPS CARD GRID
           ════════════════════════════════════════════ */
        <div style={{ marginTop: 14 }}>
          {loadingGroups ? (
            <div className="rn-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="gc-card skeleton-pulse" style={{ pointerEvents: 'none', height: 240 }}>
                  <div className="gc-header" style={{ paddingBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: 16, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: '30%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 34, height: 34, background: '#e2e8f0', borderRadius: 6 }} />
                  </div>
                  <div className="gc-content">
                    <div className="gc-info-row" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ width: '40%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                      <div style={{ width: '40%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                    <div className="gc-progress-wrap" style={{ marginBottom: 16 }}>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }} />
                    </div>
                    <div className="gc-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ width: '35%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                      <div style={{ width: '35%', height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rn-empty">
              <RiGroupLine size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
              <h3 style={{ color: '#030712', fontWeight: 700 }}>No active groups found</h3>
            </div>
          ) : (
            <div className="rn-list">
              {filteredGroups.map(g => {
                const color = scOf(g.status);
                const totalCycles = Number(g.duration) || 20;
                const completed = Number(g.completedCycles) || 0;
                const remainingCycles = Math.max(0, totalCycles - completed);
                const pct = Math.min(100, Math.round((completed / totalCycles) * 100));
                const poolValue = Number(g.groupAmount) || 0;
                const monthlyAmount = g.monthlyAmount || (totalCycles > 0 ? Math.round(poolValue / totalCycles) : 0);

                return (
                  <div
                    key={g.id}
                    className={`gc-card mg-enhanced-card ${selectedGroup?.id === g.id ? 'selected-card-glow' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTab === 'completed') {
                        setPageNotice({ text: 'This group has completed all monthly cycles. You cannot run new auctions for it.', type: 'error' });
                        return;
                      }
                      handleSelectGroup(g);
                    }}
                    style={{ cursor: activeTab === 'completed' ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="gc-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 className="gc-name" style={{ margin: 0 }}>{g.name}</h3>
                          {g.groupCode && (
                            <span className="mg-code-chip">{g.groupCode}</span>
                          )}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="gc-badge" style={{ background: color }}>
                            <StatusIcon status={g.status} size={10} />
                            {g.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button className="gc-arrow-btn" title="Configure Auction">
                        <RiChevronRightLine size={24} color="#9CA3AF" />
                      </button>
                    </div>

                    <div className="gc-content">
                      {/* Financial & Membership Stats Matrix */}
                      <div className="mg-card-metrics-grid">
                        <div className="mg-metric-item">
                          <span className="mg-metric-lbl">
                            <RiGroupLine size={13} color="#64748b" /> Total Members
                          </span>
                          <strong className="mg-metric-val">{g.totalMembers} Members</strong>
                        </div>

                        <div className="mg-metric-item">
                          <span className="mg-metric-lbl">
                            <RiMoneyDollarCircleLine size={13} color="#64748b" /> Monthly Share
                          </span>
                          <strong className="mg-metric-val">{formatCurrency(monthlyAmount)}/mo</strong>
                        </div>

                        <div className="mg-metric-item">
                          <span className="mg-metric-lbl">
                            <RiMoneyDollarCircleLine size={13} color="#10b981" /> Pool Value
                          </span>
                          <strong className="mg-metric-val" style={{ color: '#0f172a' }}>{formatCurrency(poolValue)}</strong>
                        </div>

                        <div className="mg-metric-item">
                          <span className="mg-metric-lbl">
                            <RiTimeLine size={13} color="#64748b" /> Duration
                          </span>
                          <strong className="mg-metric-val">{totalCycles} Months</strong>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="gc-progress-wrap" style={{ marginTop: 14, marginBottom: 14 }}>
                        <div className="gc-progress-hd">
                          <span className="gc-progress-txt">{completed}/{totalCycles} Cycles ({remainingCycles} left)</span>
                          <span className="gc-progress-pct" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="gc-bar">
                          <div
                            className="gc-bar-fill"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>

                      {/* Dates Footer */}
                      <div className="gc-footer" style={{ paddingTop: 12 }}>
                        <span className="gc-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <RiTimeLine size={13} color="#64748b" />
                          Start: {formatDate(g.startDate)}
                        </span>
                        <span className="gc-date" style={{ textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                          End: {formatDate(g.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ════════════════════════════════════════════
           RUNNING SIMULATION SCREENS
           ════════════════════════════════════════════ */
        <div className="auc-run-container" style={{ marginTop: 14 }}>
          <div className="auc-run-header-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>{selectedGroup?.name || 'Group'}</h4>
                <p>
                  Pool Amount:{' '}
                  <strong>
                    {formatCurrency(parseFloat(poolAmount) || 0)}
                  </strong>
                  {auctionType === 'betting' && (
                    <>
                      {' · Installment: '}
                      <strong>{formatCurrency((selectedGroup?.groupAmount || 0) / (selectedGroup?.duration || 20))}</strong>
                    </>
                  )}
                </p>
              </div>
              <button className="auc-btn-cancel" onClick={resetAuction}>
                Exit Auction
              </button>
            </div>
          </div>

          {auctionType === 'betting' ? (
            <BettingAuction
              selectedGroup={selectedGroup}
              participants={participants}
              joinedParticipants={joinedParticipants}
              wsConnected={wsConnected}
              activeBidders={activeBidders}
              auctionHistory={auctionHistory}
              auctionStarted={auctionStarted}
              isAuctionActive={isAuctionActive}
              poolAmount={poolAmount}
              setPoolAmount={setPoolAmount}
              initialAmount={initialAmount}
              setInitialAmount={setInitialAmount}
              auctionDuration={auctionDuration}
              setAuctionDuration={setAuctionDuration}
              timeRemaining={timeRemaining}
              setTimeRemaining={setTimeRemaining}
              handleStartBettingAuction={handleStartBettingAuction}
              handlePauseAuction={handlePauseAuction}
              handleResumeAuction={handleResumeAuction}
              handleResetBettingAuction={handleResetBettingAuction}
              handleEndAuction={handleEndAuction}
              getCurrentLowestBid={getCurrentLowestBid}
              resetAuction={resetAuction}
              formatTime={formatTime}
              formatCurrency={formatCurrency}
              errorMessage={pageNotice.text}
            />
          ) : (
            <RandomAuction
              selectedGroup={selectedGroup}
              participants={participants}
              joinedParticipants={joinedParticipants}
              isRolling={isRolling}
              diceValue={diceValue}
              rollTimer={rollTimer}
              showDiceResult={showDiceResult}
              rollDice={rollDice}
              poolAmount={poolAmount}
              setPoolAmount={setPoolAmount}
            />
          )}
        </div>
      )}

      {/* ── Slide Panel for Auction Setup Configuration (Matches mg2-panel of Manage Group) ── */}
      {selectedGroup && currentStep === 'setup' && (
        <div className="mg2-panel-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="mg2-panel" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Panel Header */}
            <div className="mg2-panel-head">
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#030712' }}>
                  {selectedGroup.name}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Pool Value: {formatCurrency(selectedGroup.groupAmount)} · Cycle: {selectedGroup.completedCycles + 1}/{selectedGroup.duration}
                </p>
              </div>
              <button className="rp-close" onClick={() => setSelectedGroup(null)}>
                <RiCloseLine size={16} />
              </button>
            </div>

            {/* Selection Title */}
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
              Configure Auction
            </h4>

            {/* Auction Type Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1B3322', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Auction Type
              </label>
              <div style={{ display: 'flex', gap: 10, background: '#E8ECE8', padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    backgroundColor: auctionType === 'betting' ? '#ffffff' : 'transparent',
                    color: auctionType === 'betting' ? '#1B3322' : '#4A564C',
                    boxShadow: auctionType === 'betting' ? '0 1px 4px rgba(27, 51, 34, 0.1)' : 'none',
                  }}
                  onClick={() => setAuctionType('betting')}
                >
                  <RiGavelLine size={15} />
                  Betting Auction
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    backgroundColor: auctionType === 'random' ? '#ffffff' : 'transparent',
                    color: auctionType === 'random' ? '#1B3322' : '#4A564C',
                    boxShadow: auctionType === 'random' ? '0 1px 4px rgba(27, 51, 34, 0.1)' : 'none',
                  }}
                  onClick={() => setAuctionType('random')}
                >
                  <RiDiceLine size={15} />
                  Random Draw
                </button>
              </div>
            </div>

            {/* Member Selection Search */}
            <div className="mg2-picker-search-container" style={{ margin: '0 0 12px 0' }}>
              <RiSearchLine className="mg2-picker-search-icon" size={16} />
              <input
                type="text"
                className="mg2-picker-search-input"
                placeholder="Search group members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="mg2-picker-search-clear" onClick={() => setSearchQuery('')}>
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>

            {/* Select All Row */}
            <div className="mg2-picker-select-all-row">
              <button className="mg2-picker-select-all-btn" onClick={toggleSelectAllMembers}>
                <RiUserCheckLine size={14} /> 
                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All Members'}
              </button>
            </div>

            {/* Members Picker Checklist */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
              {loadingMembers ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton-pulse" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: '#e2e8f0' }} />
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '55%', height: 13, background: '#e2e8f0', borderRadius: 4, marginBottom: 5 }} />
                        <div style={{ width: '35%', height: 10, background: '#e2e8f0', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  No members match search query.
                </div>
              ) : (
                <div className="mg2-picker-list" style={{ border: 'none', background: 'transparent', maxHeight: 'none' }}>
                  {filteredMembers.map(m => {
                    const isSelected = selectedMembers.some(sm => sm.userId === m.userId);
                    return (
                      <div 
                        key={m.userId}
                        className={`mg2-picker-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleMemberSelection(m)}
                        style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}
                      >
                        <div className="mg2-picker-checkbox">
                          {isSelected && <RiCheckLine size={12} color="#ffffff" />}
                        </div>
                        <div className="mg2-mem-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                          {(m.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p className="mg2-mem-name">{m.name}</p>
                          <p className="mg2-mem-phone">{m.phone}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
                {selectedMembers.length} of {members.length} selected
              </div>
              <button 
                className="mg2-modal-save-btn" 
                style={{ flex: 'none', padding: '10px 24px' }}
                disabled={selectedMembers.length < 2}
                onClick={startAuctionSetup}
              >
                <span>Start {auctionType === 'betting' ? 'Bidding' : 'Draw'}</span>
                <RiChevronRightLine size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══ RESULTS & WINNER REGISTRATION MODAL ═══ */}
      {showResultModal && auctionResult && (
        <div className="auc-modal-backdrop">
          <div className="auc-modal">
            {successMessage ? (
              <div className="auc-success-view">
                <div className="auc-success-icon">
                  <RiCheckLine size={40} color="#10b981" />
                </div>
                <h3>Winner Registered!</h3>
                <p>{successMessage}</p>
              </div>
            ) : (
              <>
                <div className="auc-modal-header">
                  <h3>
                    {auctionResult.type === 'betting' ? 'Auction Result' : '🎉 Lucky Winner!'}
                  </h3>
                  <button className="auc-modal-close" onClick={() => setShowResultModal(false)}>
                    <RiCloseLine size={20} />
                  </button>
                </div>
                <div className="auc-modal-body">
                  <div className="auc-winner-hero">
                    <div className="auc-w-avatar">
                      {(auctionResult.winner.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <h4>{auctionResult.winner.name}</h4>
                    <p>{auctionResult.winner.phone}</p>
                  </div>

                  <div className="auc-results-box">
                    <div className="auc-res-row">
                      <span>Total Chit Amount:</span>
                      <strong>{formatCurrency(selectedGroup?.groupAmount || 0)}</strong>
                    </div>
                    <div className="auc-res-row">
                      <span>{auctionResult.type === 'betting' ? 'Winner Bid Amount:' : 'Winner Receives:'}</span>
                      <strong style={{ color: '#2563eb' }}>{formatCurrency(auctionResult.amountTaken)}</strong>
                    </div>
                    {auctionResult.type === 'betting' && auctionResult.dividend > 0 && (
                      <div className="auc-res-row">
                        <span>Dividend Collected:</span>
                        <strong style={{ color: '#10b981' }}>+ {formatCurrency(auctionResult.dividend)}</strong>
                      </div>
                    )}
                    {auctionResult.type === 'random' && auctionResult.diceValue && (
                      <div className="auc-res-row">
                        <span>Dice Value:</span>
                        <strong>{auctionResult.diceValue}</strong>
                      </div>
                    )}
                  </div>
                </div>
                <div className="auc-modal-body" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                    Do you want to finalize this winner in the database or restart the auction?
                  </p>
                </div>
                <div className="auc-modal-footer" style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <button 
                    className="auc-btn-cancel" 
                    style={{ flex: 1, margin: 0, padding: '12px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700 }}
                    onClick={() => {
                      setShowResultModal(false);
                      if (activeTab === 'betting') {
                        handleResetBettingAuction();
                      } else {
                        // Reset Random Draw states to allow a retry
                        setShowDiceResult(false);
                        setDiceValue(1);
                        setIsRolling(false);
                        setAuctionResult(null);
                      }
                    }}
                    disabled={savingWinner}
                  >
                    Re-run Auction
                  </button>
                  <button 
                    className="auc-btn-confirm" 
                    style={{ flex: 1, margin: 0, padding: '12px 16px', borderRadius: 8, fontWeight: 700 }}
                    onClick={saveWinner}
                    disabled={savingWinner}
                  >
                    {savingWinner ? (
                      <RiLoader4Line size={16} className="spin-anim" />
                    ) : (
                      'Fix the Auction'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Auction;
