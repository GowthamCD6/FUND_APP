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
  Clock as RiTimeLine, CircleDollarSign as RiMoneyDollarCircleLine, Calendar as RiCalendarLine,
  Phone as RiPhoneLine, CheckCircle2 as RiCheckCircle2, ArrowRight as RiArrowRightLine
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
  const [pageNotice, setPageNotice] = useState({ text: '', type: 'error', title: '' });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((notice) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (!notice || !notice.text) {
      setPageNotice({ text: '', type: 'error', title: '' });
      return;
    }
    const duration = notice.duration || 4200;
    setPageNotice({
      text: notice.text,
      type: notice.type || 'error',
      title: notice.title || (notice.type === 'success' ? 'Success' : notice.type === 'warning' ? 'Attention' : 'Notice')
    });
    toastTimerRef.current = setTimeout(() => {
      setPageNotice({ text: '', type: 'error', title: '' });
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setPageNotice({ text: '', type: 'error', title: '' });
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
  const [drawMode, setDrawMode] = useState('random'); // 'random' | 'manual'
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);
  const [auctionCycleMonth, setAuctionCycleMonth] = useState(1);
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [loadingCompletedAuctions, setLoadingCompletedAuctions] = useState(false);
  const [isOverridingCompletedMonth, setIsOverridingCompletedMonth] = useState(false);

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

  const fetchCompletedAuctions = useCallback(async (groupId) => {
    if (!groupId) {
      setCompletedAuctions([]);
      return;
    }
    try {
      setLoadingCompletedAuctions(true);
      const res = await makeRequest(`/admin/groups/getCompletedAuctions?groupId=${groupId}`);
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.data)) {
        setCompletedAuctions(data.data);
      } else {
        setCompletedAuctions([]);
      }
    } catch (err) {
      console.error('Error fetching completed auctions:', err);
      setCompletedAuctions([]);
    } finally {
      setLoadingCompletedAuctions(false);
    }
  }, []);

  // Chronologically sorted completed auctions with strictly 1-to-1 cycle assignment
  const sortedCompletedAuctions = useMemo(() => {
    if (!completedAuctions || completedAuctions.length === 0) return [];
    return [...completedAuctions].sort((a, b) => {
      const dateA = new Date(a.auction_date || a.collection_period || 0).getTime();
      const dateB = new Date(b.auction_date || b.collection_period || 0).getTime();
      return dateA - dateB;
    });
  }, [completedAuctions]);

  const getWinnerForCycle = useCallback((cycleNum) => {
    if (!sortedCompletedAuctions || sortedCompletedAuctions.length === 0) return null;

    const num = Number(cycleNum);
    if (!num || num < 1 || num > sortedCompletedAuctions.length) {
      return null;
    }

    // Direct cycle_month match if explicitly given by backend and in range
    const byExplicitCycle = sortedCompletedAuctions.find(ca => Number(ca.cycle_month) === num);
    if (byExplicitCycle) return byExplicitCycle;

    // Strict 1-to-1 sequential mapping:
    // Cycle 1 -> sortedCompletedAuctions[0]
    // Cycle 2 -> sortedCompletedAuctions[1]
    // Cycle N -> sortedCompletedAuctions[N - 1]
    return sortedCompletedAuctions[num - 1] || null;
  }, [sortedCompletedAuctions]);

  const firstPendingMonth = useMemo(() => {
    const duration = Number(selectedGroup?.duration || 20);
    for (let c = 1; c <= duration; c++) {
      if (!getWinnerForCycle(c)) return c;
    }
    return duration;
  }, [selectedGroup?.duration, getWinnerForCycle]);

  const currentCycleWinner = useMemo(() => {
    return getWinnerForCycle(auctionCycleMonth);
  }, [getWinnerForCycle, auctionCycleMonth]);

  const handleSelectCycleMonth = (cycleNum) => {
    setAuctionCycleMonth(cycleNum);
    setIsOverridingCompletedMonth(false);
    setPageNotice({ text: '', type: 'error' });
  };

  // Load members and auction records for selected group
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    setSelectedMembers([]);
    setIsOverridingCompletedMonth(false);
    const initialCycle = group?.completedCycles ? Number(group.completedCycles) + 1 : 1;
    setAuctionCycleMonth(initialCycle);
    setPoolAmount(group?.groupAmount ? String(group.groupAmount) : '');

    fetchCompletedAuctions(group.id);

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
    if (member.hasWonAuction) {
      const amtStr = member.amountTaken ? ` (₹${Number(member.amountTaken).toLocaleString('en-IN')})` : '';
      showToast({
        title: 'Member Ineligible',
        text: `${member.name} has already received the auction prize${amtStr} and is NOT ELIGIBLE to participate in the auction.`,
        type: 'error',
        duration: 4500
      });
      return;
    }
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m.userId === member.userId);
      return isSelected ? prev.filter(m => m.userId !== member.userId) : [...prev, member];
    });
  };

  const eligibleMembers = useMemo(() => {
    return members.filter(m => !m.hasWonAuction);
  }, [members]);

  const isLastSingleMember = eligibleMembers.length === 1;

  useEffect(() => {
    if (isLastSingleMember && selectedMembers.length === 0 && eligibleMembers[0]) {
      setSelectedMembers(eligibleMembers);
    }
  }, [isLastSingleMember, selectedMembers.length, eligibleMembers]);

  const toggleSelectAllMembers = () => {
    setSelectedMembers(prev => prev.length === eligibleMembers.length ? [] : [...eligibleMembers]);
  };

  // ──── START AUCTION SETUP (both modes) ────
  const startAuctionSetup = () => {
    if (isLastSingleMember) {
      if (selectedMembers.length !== 1) {
        showToast({
          title: 'Selection Required',
          text: 'Please select the remaining member to confirm default winner.',
          type: 'warning'
        });
        return;
      }
      const defaultWinner = selectedMembers[0];
      setAuctionResult({
        type: auctionType || 'random',
        isDefaultWinner: true,
        winner: defaultWinner,
        amountTaken: parseFloat(poolAmount) || Number(selectedGroup?.groupAmount) || 0,
        dividend: 0,
        diceValue: null,
      });
      setShowResultModal(true);
      return;
    }

    if (selectedMembers.length < 2) {
      showToast({ title: 'Selection Required', text: 'Please select at least 2 members for the auction.', type: 'warning' });
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
    const pAmt = parseFloat(poolAmount);
    if (Number.isNaN(pAmt) || pAmt <= 0) {
      showToast({ title: 'Invalid Pool Amount', text: 'Please enter a valid pool amount before starting.', type: 'error' });
      return;
    }
    const amt = parseFloat(initialAmount);
    if (!amt || amt <= 0) {
      showToast({ title: 'Invalid Bid Amount', text: 'Please enter a valid initial bidding amount before starting.', type: 'error' });
      return;
    }
    if (!selectedGroup?.id) {
      showToast({ title: 'No Group Selected', text: 'No group selected.', type: 'error' });
      return;
    }

    const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)));
    if (!allJoined) {
      showToast({ title: 'Waiting for Participants', text: 'Please wait until all selected members have applied and joined the auction before starting.', type: 'warning' });
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
    if (isRolling) return;
    if (participants.length === 0) {
      showToast({ title: 'No Participants', text: 'No participants available for the random draw.', type: 'error' });
      return;
    }

    const amt = parseFloat(poolAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      showToast({ title: 'Invalid Pool Amount', text: 'Please enter a valid pool prize amount for the draw.', type: 'error' });
      return;
    }

    const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)));
    if (!allJoined) {
      showToast({ title: 'Waiting for Participants', text: 'Please wait until all selected participants have applied and joined the draw.', type: 'warning' });
      return;
    }

    const maxDiceValue = Math.min(participants.length, 6);
    let winner = null;
    let finalValue = 1;

    if (drawMode === 'manual') {
      if (!selectedWinnerId) {
        showToast({ title: 'Designated Winner Required', text: 'Please select a participant from the list below as designated winner before starting.', type: 'warning' });
        return;
      }
      const winnerIdx = participants.findIndex(p => String(p.userId || p.id) === String(selectedWinnerId));
      if (winnerIdx === -1) {
        showToast({ title: 'Participant Not Found', text: 'Selected participant not found in list.', type: 'error' });
        return;
      }
      winner = participants[winnerIdx];
      finalValue = (winnerIdx % maxDiceValue) + 1;
    } else {
      finalValue = Math.floor(Math.random() * maxDiceValue) + 1;
      winner = participants[finalValue - 1] || participants[0];
    }

    const ROLL_DURATION_MS = 30000;
    const ROLL_DURATION_SEC = 30;

    if (selectedGroup?.id && wsConnected) {
      AuctionWS.rollDice(selectedGroup.id, ROLL_DURATION_MS, finalValue, winner, parseFloat(poolAmount));
    }

    setIsRolling(true);
    setShowDiceResult(false);
    setRollTimer(ROLL_DURATION_SEC);

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
    }, ROLL_DURATION_MS);
  };

  // ──── Save Winner ────
  const saveWinner = async () => {
    if (!auctionResult) return;

    if (auctionResult.winner?.hasWonAuction) {
      showToast({
        title: 'Cannot Save Winner',
        text: `${auctionResult.winner.name} has already taken or won an auction prize for this group.`,
        type: 'error'
      });
      return;
    }

    setSavingWinner(true);
    try {
      const startDt = selectedGroup?.startDate ? new Date(selectedGroup.startDate) : new Date();
      const targetDate = !isNaN(startDt.getTime())
        ? new Date(startDt.getFullYear(), startDt.getMonth() + (auctionCycleMonth - 1), 1)
        : new Date();

      const payload = {
        groupId: selectedGroup.id,
        month: targetDate.getMonth(), // 0-11 for backend
        year: targetDate.getFullYear(),
        chitWinnerName: auctionResult.winner.name,
        chitWinnerMemberId: String(auctionResult.winner.userId || auctionResult.winner.id || ''),
        amountTaken: auctionResult.amountTaken,
        datePicked: new Date().toISOString(),
        winnerUserId: auctionResult.winner.userId || auctionResult.winner.id,
        cycleMonth: auctionCycleMonth,
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

        showToast({
          title: 'Auction Completed!',
          text: `${auctionResult.winner.name} successfully registered as winner!`,
          type: 'success',
          duration: 4000
        });
        setSuccessMessage(`${auctionResult.winner.name} successfully registered as winner!`);
        if (selectedGroup?.id) {
          fetchCompletedAuctions(selectedGroup.id);
        }
        setTimeout(() => {
          setSuccessMessage('');
          setShowResultModal(false);
          resetAuction();
          fetchGroups();
        }, 2000);
      } else {
        showToast({
          title: 'Save Failed',
          text: data.message || 'Failed to save winner',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error saving auction winner:', err);
      showToast({
        title: 'Connection Error',
        text: 'Connection failed. Could not save winner details.',
        type: 'error'
      });
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
      {/* ── Page Header & Action Bar Container (Shown only on setup overview screen) ── */}
      {currentStep === 'setup' && (
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
      )}

      {/* ── Fixed Floating Top-Right Toast Notification Card ── */}
      {pageNotice.text && (
        <div className="auc-toast-container">
          <div className={`auc-toast toast-${pageNotice.type || 'error'}`}>
            <div className="auc-toast-icon-box">
              {pageNotice.type === 'success' ? (
                <RiCheckLine size={20} />
              ) : (
                <RiAlertLine size={20} />
              )}
            </div>
            <div className="auc-toast-content">
              <h5 className="auc-toast-title">
                {pageNotice.title || (pageNotice.type === 'success' ? 'Success' : pageNotice.type === 'warning' ? 'Attention' : 'Notice')}
              </h5>
              <p className="auc-toast-desc">{pageNotice.text}</p>
            </div>
            <button
              type="button"
              className="auc-toast-close"
              onClick={hideToast}
              aria-label="Close notification"
            >
              <RiCloseLine size={16} />
            </button>
            <div className="auc-toast-progress" />
          </div>
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
                        showToast({
                          title: 'Group Completed',
                          text: 'This group has completed all monthly cycles. You cannot run new auctions for it.',
                          type: 'warning'
                        });
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h4 style={{ margin: 0 }}>{selectedGroup?.name || 'Group'}</h4>
                  {selectedGroup?.groupCode && (
                    <span className="mg-code-chip">{selectedGroup.groupCode}</span>
                  )}
                  <span className="gc-badge" style={{ background: '#2E7D32', color: '#ffffff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Live Session
                  </span>
                </div>
                <p>
                  Pool Amount:{' '}
                  <strong style={{ color: '#0B140E', fontSize: '14.5px' }}>
                    {formatCurrency(parseFloat(poolAmount) || selectedGroup?.groupAmount || 0)}
                  </strong>
                  {' · Installment: '}
                  <strong style={{ color: '#1B3322' }}>
                    {formatCurrency((selectedGroup?.groupAmount || 0) / (selectedGroup?.duration || 20))}/mo
                  </strong>
                  {' · Total Members: '}
                  <strong>{participants.length}</strong>
                </p>
              </div>
              <button 
                className="auc-btn-cancel" 
                onClick={resetAuction}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #DCE3DC',
                  background: '#ffffff',
                  color: '#D32F2F',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
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
              drawMode={drawMode}
              setDrawMode={setDrawMode}
              selectedWinnerId={selectedWinnerId}
              setSelectedWinnerId={setSelectedWinnerId}
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

            {/* Month Cycle Selector (1, 2, 3...) */}
            <div style={{ marginBottom: 16, background: '#faf5ff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6b46c1', letterSpacing: '0.4px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <RiCalendarLine size={14} />
                  AUCTION CYCLE: MONTH {auctionCycleMonth} OF {selectedGroup.duration || 20}
                </span>
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: '#6b46c1', 
                  background: '#f3e8ff', 
                  border: '1px solid #d8b4fe',
                  padding: '2px 8px', 
                  borderRadius: 12, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4 
                }}>
                  <RiTrophyLine size={12} color="#7c3aed" />
                  {completedAuctions.length} of {selectedGroup.duration || 20} Completed
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {Array.from({ length: Number(selectedGroup.duration || 20) }, (_, i) => i + 1).map(cycleNum => {
                  const isSelected = auctionCycleMonth === cycleNum;
                  const cycleWinner = getWinnerForCycle(cycleNum);
                  const isDone = Boolean(cycleWinner);
                  return (
                    <button
                      key={cycleNum}
                      type="button"
                      onClick={() => handleSelectCycleMonth(cycleNum)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: isSelected 
                          ? '1.5px solid #5b21b6' 
                          : isDone 
                            ? '1.5px solid #86efac' 
                            : '1px solid #e2e8f0',
                        background: isSelected 
                          ? '#6b46c1' 
                          : isDone 
                            ? '#f0fdf4' 
                            : '#ffffff',
                        color: isSelected 
                          ? '#ffffff' 
                          : isDone 
                            ? '#15803d' 
                            : '#475569',
                        boxShadow: isSelected ? '0 1px 4px rgba(107, 70, 193, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>Month {cycleNum}</span>
                      {isDone && (
                        <RiCheckLine 
                          size={13} 
                          color={isSelected ? '#ffffff' : '#16a34a'} 
                          strokeWidth={3} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ VIEW 1: MONTH AUCTION ALREADY COMPLETED (FETCHED DATA) ═══ */}
            {currentCycleWinner && !isOverridingCompletedMonth ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
                {/* Completed Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 16,
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#15803d',
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      padding: '3px 10px',
                      borderRadius: 20,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      <RiCheckCircle2 size={13} color="#16a34a" />
                      Auction Completed • Month {auctionCycleMonth}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
                      Winner Registered
                    </span>
                  </div>

                  {/* Winner Spotlight Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #d1fae5',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 14
                  }}>
                    <div style={{
                      position: 'relative',
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      flexShrink: 0
                    }}>
                      {(currentCycleWinner.winner_name || 'W').substring(0, 2).toUpperCase()}
                      <span style={{
                        position: 'absolute',
                        bottom: -3,
                        right: -3,
                        background: '#fef08a',
                        border: '1px solid #ca8a04',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <RiCrownLine size={11} color="#a16207" />
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentCycleWinner.winner_name}
                      </h3>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RiPhoneLine size={13} color="#94a3b8" />
                        {currentCycleWinner.winner_member_phone || 'Registered Subscriber'}
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 3 }}>
                        Prize Taken
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 800, color: '#059669' }}>
                        {formatCurrency(currentCycleWinner.amount_taken || 0)}
                      </span>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 3 }}>
                        Auction Date
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                        {currentCycleWinner.auction_date ? formatDate(currentCycleWinner.auction_date) : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {currentCycleWinner.auction_type && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ color: '#059669' }}>●</span>
                      <span>Method: <strong>{currentCycleWinner.auction_type === 'betting' ? 'Reverse Betting Auction' : 'Random Lucky Draw'}</strong></span>
                    </div>
                  )}

                  {/* Informational callout */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    ℹ️ The auction prize for <strong>Month {auctionCycleMonth}</strong> has already been awarded to <strong>{currentCycleWinner.winner_name}</strong>. Members who have won in past months are marked ineligible for future draws.
                  </div>
                </div>

                {/* Quick Action Navigation */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {firstPendingMonth && firstPendingMonth !== auctionCycleMonth && (
                    <button
                      type="button"
                      onClick={() => handleSelectCycleMonth(firstPendingMonth)}
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        background: 'linear-gradient(135deg, #6b46c1 0%, #4c1d95 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 2px 4px rgba(107, 70, 193, 0.25)'
                      }}
                    >
                      <span>Jump to Next Pending: Month {firstPendingMonth}</span>
                      <RiArrowRightLine size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOverridingCompletedMonth(true)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: 'transparent',
                      color: '#b91c1c',
                      border: '1px dashed #fca5a5',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <RiResetLine size={14} />
                    <span>Re-run / Overwrite Month {auctionCycleMonth} Auction</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ═══ VIEW 2: ACTIVE DRAW CONFIGURATION & MEMBER PICKER ═══ */
              <>
                {/* Re-run Notice Banner if in override mode */}
                {isOverridingCompletedMonth && currentCycleWinner && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10
                  }}>
                    <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.4 }}>
                      <strong>Re-run Mode:</strong> Overwriting Month {auctionCycleMonth} (previous: {currentCycleWinner.winner_name}).
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOverridingCompletedMonth(false)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #fca5a5',
                        borderRadius: 5,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel Re-run
                    </button>
                  </div>
                )}

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
                <div className="mg2-picker-select-all-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {(() => {
                    const allSelected = eligibleMembers.length > 0 && eligibleMembers.every(em => selectedMembers.some(sm => sm.userId === em.userId));
                    return (
                      <>
                        <button className="mg2-picker-select-all-btn" onClick={toggleSelectAllMembers}>
                          <RiUserCheckLine size={14} /> 
                          {allSelected 
                            ? 'Deselect All' 
                            : (isLastSingleMember ? 'Select Default Winner' : `Select All Eligible (${eligibleMembers.length})`)}
                        </button>
                        {members.some(m => m.hasWonAuction) && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                            {members.filter(m => m.hasWonAuction).length} prize claimed (ineligible)
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {isLastSingleMember && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      fontSize: 18,
                      flexShrink: 0
                    }}>
                      👑
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#065f46' }}>
                        Final Cycle (Month {auctionCycleMonth}) • Default Winner
                      </div>
                      <div style={{ fontSize: 12.5, color: '#047857', marginTop: 2 }}>
                        Only 1 eligible member remains ({eligibleMembers[0]?.name}). In this final cycle, this member is automatically awarded as the default winner.
                      </div>
                    </div>
                  </div>
                )}

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
                        const isIneligible = Boolean(m.hasWonAuction);
                        return (
                          <div 
                            key={m.userId}
                            className={`mg2-picker-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleMemberSelection(m)}
                            style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #f1f5f9',
                              background: isIneligible ? '#fff1f2' : undefined,
                              borderColor: isIneligible ? '#fecdd3' : undefined,
                              cursor: isIneligible ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <div className="mg2-picker-checkbox" style={{
                              background: isIneligible ? '#fee2e2' : undefined,
                              borderColor: isIneligible ? '#f87171' : undefined
                            }}>
                              {isIneligible ? (
                                <RiCloseLine size={12} color="#dc2626" />
                              ) : isSelected ? (
                                <RiCheckLine size={12} color="#ffffff" />
                              ) : null}
                            </div>
                            <div className="mg2-mem-avatar" style={{ 
                              width: 34, 
                              height: 34, 
                              fontSize: 12,
                              background: isIneligible ? '#fee2e2' : undefined,
                              color: isIneligible ? '#b91c1c' : undefined
                            }}>
                              {(m.name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <p className="mg2-mem-name" style={{ color: isIneligible ? '#991b1b' : undefined }}>{m.name}</p>
                                {isIneligible && (
                                  <span style={{ 
                                    fontSize: 10, 
                                    fontWeight: 800, 
                                    color: '#b91c1c', 
                                    background: '#fee2e2', 
                                    border: '1px solid #fca5a5', 
                                    borderRadius: 4, 
                                    padding: '1px 6px',
                                    letterSpacing: '0.4px'
                                  }}>
                                    NOT ELIGIBLE
                                  </span>
                                )}
                              </div>
                              <p className="mg2-mem-phone">
                                {m.phone}
                                {isIneligible && (
                                  <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 8 }}>
                                    • Prize Taken: {m.amountTaken ? `₹${Number(m.amountTaken).toLocaleString('en-IN')}` : 'Claimed'}
                                  </span>
                                )}
                              </p>
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
                    {isLastSingleMember ? (
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        1 remaining member ({eligibleMembers[0]?.name}) ready to confirm
                      </span>
                    ) : (
                      <>
                        {selectedMembers.length} of {eligibleMembers.length} eligible selected
                        {members.some(m => m.hasWonAuction) ? ` (${members.filter(m => m.hasWonAuction).length} ineligible)` : ''}
                      </>
                    )}
                  </div>
                  <button 
                    className="mg2-modal-save-btn" 
                    style={{ 
                      flex: 'none', 
                      padding: '10px 24px',
                      backgroundColor: isLastSingleMember ? '#059669' : undefined
                    }}
                    disabled={isLastSingleMember ? selectedMembers.length !== 1 : selectedMembers.length < 2}
                    onClick={startAuctionSetup}
                  >
                    <span>
                      {isLastSingleMember 
                        ? 'Confirm Default Winner' 
                        : `Start ${auctionType === 'betting' ? 'Bidding' : 'Draw'}`}
                    </span>
                    <RiChevronRightLine size={16} />
                  </button>
                </div>
              </>
            )}

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
                    {auctionResult.isDefaultWinner
                      ? `👑 Month ${auctionCycleMonth} Final Cycle Winner!`
                      : (auctionResult.type === 'betting' ? `Auction Result - Month ${auctionCycleMonth}` : `🎉 Month ${auctionCycleMonth} Lucky Winner!`)}
                  </h3>
                  <button className="auc-modal-close" onClick={() => setShowResultModal(false)}>
                    <RiCloseLine size={20} />
                  </button>
                </div>
                <div className="auc-modal-body">
                  <div className="auc-winner-hero" style={auctionResult.winner?.hasWonAuction ? { background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '16px' } : undefined}>
                    <div className="auc-w-avatar" style={auctionResult.winner?.hasWonAuction ? { background: '#fee2e2', color: '#b91c1c' } : undefined}>
                      {(auctionResult.winner.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <h4 style={{ color: auctionResult.winner?.hasWonAuction ? '#991b1b' : undefined }}>{auctionResult.winner.name}</h4>
                    <p>{auctionResult.winner.phone}</p>
                    {auctionResult.winner?.hasWonAuction && (
                      <div style={{ marginTop: 8, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                        ⛔ NOT ELIGIBLE - AUCTION PRIZE ALREADY TAKEN
                      </div>
                    )}
                    {auctionResult.isDefaultWinner && (
                      <div style={{ marginTop: 8, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                        👑 DEFAULT WINNER (FINAL CYCLE)
                      </div>
                    )}
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
                    {auctionResult.isDefaultWinner && (
                      <div className="auc-res-row">
                        <span>Selection Method:</span>
                        <strong style={{ color: '#059669' }}>Final Cycle Default Winner</strong>
                      </div>
                    )}
                    {auctionResult.type === 'betting' && auctionResult.dividend > 0 && (
                      <div className="auc-res-row">
                        <span>Dividend Collected:</span>
                        <strong style={{ color: '#10b981' }}>+ {formatCurrency(auctionResult.dividend)}</strong>
                      </div>
                    )}
                    {!auctionResult.isDefaultWinner && auctionResult.type === 'random' && auctionResult.diceValue && (
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
                    style={{ 
                      flex: 1, 
                      margin: 0, 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      fontWeight: 700,
                      background: auctionResult.winner?.hasWonAuction ? '#94a3b8' : undefined,
                      cursor: auctionResult.winner?.hasWonAuction ? 'not-allowed' : undefined
                    }}
                    onClick={saveWinner}
                    disabled={savingWinner || auctionResult.winner?.hasWonAuction}
                  >
                    {savingWinner ? (
                      <RiLoader4Line size={16} className="spin-anim" />
                    ) : (
                      `Confirm Month ${auctionCycleMonth} Winner`
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
