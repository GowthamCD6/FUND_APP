import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../../../../services/AuctionWebSocketService';
import ApiService from '../../../../../../services/ApiService';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const BettingAuction = ({
  participants,
  setParticipants,
  selectedGroup,
  selectedMembers,
  onAuctionComplete,
  onAuctionStatusChange,
  onAmountChange,
}) => {
  const { t, language } = useLanguage();
  // All useState hooks MUST come first, before any other code
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [myBid, setMyBid] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [auctionSummary, setAuctionSummary] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [allBids, setAllBids] = useState([]);
  const [bidHistory, setBidHistory] = useState([]); // Chronological order
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('connected');
  
  // Anti-sniping notification state
  const [antiSnipingAlert, setAntiSnipingAlert] = useState(null);
  
  // Eligibility state
  const [eligibility, setEligibility] = useState({
    checked: false,
    isEligible: true,
    reason: '',
    alreadyWon: false,
    isOverdue: false,
  });

  // Auto-bid state
  const [showAutoBidModal, setShowAutoBidModal] = useState(false);
  const [autoBidFloor, setAutoBidFloor] = useState('');
  const [autoBidActive, setAutoBidActive] = useState(false);
  const [activeAutoBidFloor, setActiveAutoBidFloor] = useState(null);

  // Active view tab: 'leaderboard' | 'history' | 'participants'
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [activeParticipantsList, setActiveParticipantsList] = useState([]);

  const unsubscribeRef = useRef([]);

  const initialAmount = selectedGroup?.groupAmount || 90000;

  // Memoized sorted bids to prevent sorting on every render
  const sortedBids = useMemo(() => 
    [...allBids].sort((a, b) => a.bid - b.bid), // Lowest bid first
    [allBids]
  );

  // Helper functions
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (amount == null || amount === '' || isNaN(Number(amount))) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  }, []);

  const getCurrentLowestBid = useCallback(() => {
    const bids = allBids.map(b => b.bid);
    return bids.length > 0 ? Math.min(...bids) : initialAmount;
  }, [allBids, initialAmount]);

  // Load user data on mount
  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      if (id) setCurrentUserId(id);
    });
  }, []);

  // Connect to WebSocket on mount
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = await ApiService.getAccessToken();
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'user');
          setWsConnected(true);

          // Request eligibility verification for this group
          if (selectedGroup?.id) {
            AuctionWebSocketService.checkEligibility(selectedGroup.id);
          }

          const unsubConn = AuctionWebSocketService.on('connection_state_change', (data) => {
            setConnectionState(data.state);
            setWsConnected(data.state === 'connected');
          });

          const unsub1 = AuctionWebSocketService.on('auction_started', handleAuctionStartedEvent);
          const unsub2 = AuctionWebSocketService.on('bid_placed', handleBidPlacedEvent);
          const unsub3 = AuctionWebSocketService.on('time_update', handleTimeUpdateEvent);
          const unsub4 = AuctionWebSocketService.on('auction_ended', handleAuctionEndedEvent);
          const unsub5 = AuctionWebSocketService.on('participants_updated', handleParticipantsUpdatedEvent);
          const unsub6 = AuctionWebSocketService.on('eligibility_status', handleEligibilityStatusEvent);
          const unsub7 = AuctionWebSocketService.on('auto_bid_status', handleAutoBidStatusEvent);
          const unsub8 = AuctionWebSocketService.on('error', handleWebSocketError);

          unsubscribeRef.current = [unsubConn, unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7, unsub8];
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    initWebSocket();

    return () => {
      unsubscribeRef.current.forEach(unsub => unsub?.());
      AuctionWebSocketService.disconnect();
    };
  }, [selectedGroup?.id]);

  // WebSocket event handlers
  const handleAuctionStartedEvent = (data) => {
    setAuctionStatus('active');
    if (onAuctionStatusChange) onAuctionStatusChange(true);
    if (data.initialAmount && onAmountChange) {
      onAmountChange(data.initialAmount);
    }
    setTimeRemaining(data.remainingTime !== undefined ? data.remainingTime : (data.duration || 300));
    
    if (Array.isArray(data.bids)) {
      const formattedBids = data.bids.map(b => ({
        id: b.userId,
        name: b.userName,
        bid: b.amount,
        bidTime: new Date(b.timestamp),
        avatar: (b.userName || 'MB').substring(0, 2).toUpperCase(),
        isMe: b.userId === currentUserId,
      }));
      setAllBids(formattedBids);
      setBidHistory(formattedBids);
      const myPrebid = formattedBids.find(b => b.isMe);
      if (myPrebid) {
        setMyBid(myPrebid.bid);
      }
    } else {
      setAllBids([]);
      setBidHistory([]);
    }
  };

  const handleBidPlacedEvent = (data) => {
    const { userId, userName, amount, timestamp, antiSnipingExtended, newRemainingTime } = data;
    const bidTime = new Date(timestamp);
    
    // 1. Anti-sniping notification
    if (antiSnipingExtended) {
      setAntiSnipingAlert('+30s Anti-Sniping Extension Activated!');
      setTimeout(() => setAntiSnipingAlert(null), 6000);
      if (newRemainingTime !== undefined) {
        setTimeRemaining(newRemainingTime);
      }
    }

    const newBidItem = {
      id: userId,
      name: userName,
      bid: amount,
      bidTime,
      avatar: (userName || 'MB').substring(0, 2).toUpperCase(),
      isMe: userId === currentUserId || userId.toString() === currentUserId?.toString(),
    };

    // Update active participants
    setActiveParticipantsList(prev => {
      if (!prev.some(p => p.id === userId)) {
        return [...prev, { id: userId, name: userName, avatar: newBidItem.avatar }];
      }
      return prev;
    });

    // Chronological bid history (latest first)
    setBidHistory(prev => [newBidItem, ...prev]);

    // Unique per-user lowest bid set
    setAllBids(prev => {
      const filtered = prev.filter(b => b.id !== userId);
      return [...filtered, newBidItem];
    });

    if (userId === currentUserId || userId.toString() === currentUserId?.toString()) {
      setMyBid(amount);
    }
  };

  const handleTimeUpdateEvent = (data) => {
    setTimeRemaining(data.remainingTime);
  };

  const handleAuctionEndedEvent = (data) => {
    setAuctionStatus('ended');
    if (onAuctionStatusChange) onAuctionStatusChange(false);
    const { winner: winnerData, summary } = data;
    if (summary) {
      setAuctionSummary(summary);
    }
    if (winnerData) {
      const winnerObj = {
        id: winnerData.userId,
        name: winnerData.userName,
        bid: winnerData.amount,
        avatar: (winnerData.userName || 'WN').substring(0, 2).toUpperCase(),
      };
      setWinner(winnerObj);
      setShowWinnerModal(true);
      if (onAuctionComplete) {
        onAuctionComplete({
          type: 'betting',
          winner: winnerObj,
          amount: winnerData.amount,
          summary,
        });
      }
    } else {
      setShowWinnerModal(true);
    }
  };

  const handleEligibilityStatusEvent = (data) => {
    setEligibility({
      checked: true,
      isEligible: Boolean(data.isEligible),
      reason: data.reason || '',
      alreadyWon: Boolean(data.alreadyWon),
      isOverdue: Boolean(data.isOverdue),
    });
  };

  const handleAutoBidStatusEvent = (data) => {
    setAutoBidActive(Boolean(data.enabled));
    if (data.enabled) {
      setActiveAutoBidFloor(data.floorAmount);
      Alert.alert(t('Auto-Bid Activated'), `${t('Automated proxy bidding active down to floor:')} ${formatCurrency(data.floorAmount)}`);
    } else {
      setActiveAutoBidFloor(null);
      Alert.alert(t('Auto-Bid Deactivated'), t('Automated bidding has been turned off.'));
    }
  };

  const handleParticipantsUpdatedEvent = (data) => {
    if (Array.isArray(data.participants)) {
      setActiveParticipantsList(data.participants.map(p => ({
        id: p.userId,
        name: p.userName || 'Member',
        avatar: (p.userName || 'MB').substring(0, 2).toUpperCase(),
      })));
    }
  };

  const submitBid = useCallback(async () => {
    if (isSubmittingBid) return;

    if (!eligibility.isEligible && eligibility.checked) {
      Alert.alert(t('Not Eligible to Bid'), eligibility.reason || t('You cannot place a bid in this auction.'));
      return;
    }

    if (auctionStatus !== 'active') {
      Alert.alert(t('Auction Ended'), t('This auction has already concluded.'));
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert(t('Invalid Bid'), t('Please enter a valid bid amount'));
      return;
    }

    const newBid = parseFloat(bidAmount);
    const currentLowest = getCurrentLowestBid();

    if (newBid > currentLowest - 500) {
      Alert.alert(
        t('Bid Too High'),
        `${t('Your bid must be at least ₹500 lower than the current lowest bid')} (${formatCurrency(currentLowest - 500)})`
      );
      return;
    }

    if (newBid % 100 !== 0) {
      Alert.alert(t('Error'), t('Bid amount must be in multiples of ₹100'));
      return;
    }

    setIsSubmittingBid(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const idempotencyKey = `${userId || 'u'}-${selectedGroup?.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      AuctionWebSocketService.placeBid(
        selectedGroup.id,
        newBid,
        idempotencyKey
      );
      setBidAmount('');
    } catch (error) {
      console.error('Failed to submit bid:', error);
      Alert.alert(t('Error'), t('Failed to place bid. Please try again.'));
    } finally {
      setIsSubmittingBid(false);
    }
  }, [auctionStatus, bidAmount, getCurrentLowestBid, formatCurrency, selectedGroup, isSubmittingBid, eligibility, t]);

  const quickBid = useCallback((decrement) => {
    const newAmount = getCurrentLowestBid() - decrement;
    if (newAmount > 0) {
      setBidAmount(newAmount.toString());
    }
  }, [getCurrentLowestBid]);

  const handleToggleAutoBid = () => {
    if (!eligibility.isEligible && eligibility.checked) {
      Alert.alert(t('Not Eligible'), eligibility.reason || t('You cannot enable auto-bid.'));
      return;
    }
    if (autoBidActive) {
      // Turn off
      AuctionWebSocketService.setAutoBid(selectedGroup.id, 0, false);
    } else {
      setShowAutoBidModal(true);
    }
  };

  const handleSaveAutoBid = () => {
    const floor = parseFloat(autoBidFloor);
    if (isNaN(floor) || floor <= 0) {
      Alert.alert(t('Invalid Amount'), t('Please enter a valid floor amount.'));
      return;
    }
    const currentLowest = getCurrentLowestBid();
    if (floor >= currentLowest) {
      Alert.alert(
        t('Floor Too High'),
        `${t('Floor amount must be lower than current lowest bid')} (${formatCurrency(currentLowest)})`
      );
      return;
    }
    AuctionWebSocketService.setAutoBid(selectedGroup.id, floor, true);
    setShowAutoBidModal(false);
    setAutoBidFloor('');
  };

  // Render Anti-Sniping Alert Banner
  const renderAntiSnipingAlert = () => {
    if (!antiSnipingAlert) return null;
    return (
      <View style={styles.antiSnipingBanner}>
        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
        <Text style={styles.antiSnipingText}>{antiSnipingAlert}</Text>
      </View>
    );
  };

  // Render Eligibility Pill Banner
  const renderEligibilityBanner = () => {
    if (!eligibility.checked) return null;
    return (
      <TouchableOpacity
        style={[
          styles.eligibilityCard,
          eligibility.isEligible ? styles.eligibleCard : styles.ineligibleCard
        ]}
        onPress={() => {
          Alert.alert(
            eligibility.isEligible ? t('Eligible Member') : t('Ineligible to Bid'),
            eligibility.reason || (eligibility.isEligible ? t('You have full clearance to place live bids.') : t('Bidding is restricted for this group.'))
          );
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={eligibility.isEligible ? "check-decagram" : "alert-decagram"}
          size={18}
          color={eligibility.isEligible ? "#059669" : "#DC2626"}
        />
        <Text style={[
          styles.eligibilityText,
          eligibility.isEligible ? styles.eligibleText : styles.ineligibleText
        ]}>
          {eligibility.isEligible ? t('Eligible to Bid') : t('Ineligible to Bid')}
        </Text>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={eligibility.isEligible ? "#059669" : "#DC2626"}
        />
      </TouchableOpacity>
    );
  };

  const renderTimer = () => (
    <View style={styles.timerCard}>
      <MaterialCommunityIcons 
        name="timer-outline" 
        size={36} 
        color={timeRemaining < 60 ? '#EF4444' : '#6B46C1'} 
      />
      <Text style={[styles.timerText, timeRemaining < 60 && styles.timerTextWarning]}>
        {formatTime(timeRemaining)}
      </Text>
      <View style={styles.timerSubRow}>
        <View style={[styles.statusDot, { backgroundColor: auctionStatus === 'active' ? '#10B981' : '#6B7280' }]} />
        <Text style={styles.timerLabel}>
          {auctionStatus === 'active' ? 'Server-Synced Clock' : 'Auction Ended'}
        </Text>
      </View>
      {auctionStatus === 'active' && timeRemaining <= 30 && (
        <View style={styles.snipingNoticeBadge}>
          <MaterialCommunityIcons name="shield-clock" size={14} color="#B45309" />
          <Text style={styles.snipingNoticeText}>Anti-sniping active: bids under 30s add +30s</Text>
        </View>
      )}
    </View>
  );

  const renderHighestBid = () => (
    <View style={styles.highestBidCard}>
      <View style={styles.highestBidHeader}>
        <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
        <Text style={styles.highestBidLabel}>Current Lowest Prize Bid</Text>
      </View>
      <Text style={styles.highestBidAmount}>{formatCurrency(getCurrentLowestBid())}</Text>
      <View style={styles.bidMetaRow}>
        {myBid > 0 ? (
          <Text style={styles.yourBidText}>Your best bid: <Text style={{ fontWeight: '700' }}>{formatCurrency(myBid)}</Text></Text>
        ) : (
          <Text style={styles.yourBidText}>You haven't bid yet</Text>
        )}
        {activeAutoBidFloor && (
          <View style={styles.autoBidActivePill}>
            <MaterialCommunityIcons name="robot" size={13} color="#4338CA" />
            <Text style={styles.autoBidActivePillText}>Floor: {formatCurrency(activeAutoBidFloor)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderBiddingInput = () => (
    <View style={styles.biddingCard}>
      <View style={styles.biddingHeaderRow}>
        <Text style={styles.biddingLabel}>Place Your Bid</Text>
        <TouchableOpacity 
          style={[styles.autoBidToggleBtn, autoBidActive && styles.autoBidToggleBtnActive]}
          onPress={handleToggleAutoBid}
        >
          <MaterialCommunityIcons 
            name={autoBidActive ? "robot" : "robot-outline"} 
            size={16} 
            color={autoBidActive ? "#FFFFFF" : "#6B46C1"} 
          />
          <Text style={[styles.autoBidToggleText, autoBidActive && styles.autoBidToggleTextActive]}>
            {autoBidActive ? 'Auto-Bid ON' : 'Setup Auto-Bid'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.inputContainer, !eligibility.isEligible && styles.inputDisabled]}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.bidInput}
          value={bidAmount}
          onChangeText={setBidAmount}
          placeholder={`Max ${formatCurrency(getCurrentLowestBid() - 500)}`}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
          editable={auctionStatus === 'active' && !isSubmittingBid && eligibility.isEligible}
        />
      </View>

      <View style={styles.quickBidButtons}>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(1000)}
          disabled={auctionStatus !== 'active' || !eligibility.isEligible}
        >
          <Text style={styles.quickBidText}>-₹1,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(5000)}
          disabled={auctionStatus !== 'active' || !eligibility.isEligible}
        >
          <Text style={styles.quickBidText}>-₹5,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(10000)}
          disabled={auctionStatus !== 'active' || !eligibility.isEligible}
        >
          <Text style={styles.quickBidText}>-₹10,000</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.submitBidBtn, 
          (isSubmittingBid || auctionStatus !== 'active' || !eligibility.isEligible) && styles.submitBidBtnDisabled
        ]}
        onPress={submitBid}
        disabled={isSubmittingBid || auctionStatus !== 'active' || !eligibility.isEligible}
      >
        <MaterialCommunityIcons name="gavel" size={20} color="#FFFFFF" />
        <Text style={styles.submitBidBtnText}>
          {isSubmittingBid ? 'Placing Bid...' : (!eligibility.isEligible && eligibility.checked ? 'Ineligible to Bid' : 'Place Bid')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tabs Header
  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabButtonActive]}
        onPress={() => setActiveTab('leaderboard')}
      >
        <MaterialCommunityIcons 
          name="podium" 
          size={16} 
          color={activeTab === 'leaderboard' ? '#6B46C1' : '#6B7280'} 
        />
        <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
          Leaderboard ({allBids.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
        onPress={() => setActiveTab('history')}
      >
        <MaterialCommunityIcons 
          name="history" 
          size={16} 
          color={activeTab === 'history' ? '#6B46C1' : '#6B7280'} 
        />
        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
          Live History ({bidHistory.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'participants' && styles.tabButtonActive]}
        onPress={() => setActiveTab('participants')}
      >
        <MaterialCommunityIcons 
          name="account-group" 
          size={16} 
          color={activeTab === 'participants' ? '#6B46C1' : '#6B7280'} 
        />
        <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
          Members ({activeParticipantsList.length || (participants?.length || 0)})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tab 1: Leaderboard
  const renderLeaderboardTab = () => {
    if (allBids.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="gavel-outline" size={38} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bids placed yet</Text>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {sortedBids.map((item, index) => (
          <View key={item.id ? `${item.id}-${index}` : index.toString()} style={[styles.bidRow, index === 0 && styles.topBidRow]}>
            <View style={styles.bidRankInfo}>
              <View style={[styles.rankCircle, index === 0 && styles.topRankCircle]}>
                <Text style={[styles.rankText, index === 0 && styles.topRankText]}>#{index + 1}</Text>
              </View>
              <View style={[styles.bidAvatar, index === 0 && styles.topBidAvatar]}>
                <Text style={styles.avatarText}>{item.avatar}</Text>
              </View>
              <View style={styles.bidderInfo}>
                <Text style={styles.bidderName}>{item.name}</Text>
                {item.isMe && <Text style={styles.myBidBadge}>Your bid</Text>}
              </View>
            </View>
            <View style={styles.bidAmountContainer}>
              <Text style={[styles.bidAmount, index === 0 && styles.topBidAmount]}>
                {formatCurrency(item.bid)}
              </Text>
              {index === 0 && (
                <MaterialCommunityIcons name="crown" size={16} color="#FFD700" style={styles.crownIcon} />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Tab 2: Live History
  const renderHistoryTab = () => {
    if (bidHistory.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clock-time-four-outline" size={38} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bid history yet</Text>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {bidHistory.map((item, index) => {
          const timeStr = item.bidTime ? new Date(item.bidTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
          return (
            <View key={item.id ? `hist-${item.id}-${index}` : index.toString()} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#10B981" />
                <View>
                  <Text style={styles.historyName}>{item.name} {item.isMe && '(You)'}</Text>
                  <Text style={styles.historyTime}>{timeStr}</Text>
                </View>
              </View>
              <Text style={styles.historyAmount}>{formatCurrency(item.bid)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Tab 3: Active Participants
  const renderParticipantsTab = () => {
    const list = activeParticipantsList.length > 0 ? activeParticipantsList : (participants || []);
    if (list.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-off-outline" size={38} color="#D1D5DB" />
          <Text style={styles.emptyText}>No participants joined yet</Text>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {list.map((item, index) => {
          const name = item.name || item.userName || `Member #${index + 1}`;
          const avatar = (name).substring(0, 2).toUpperCase();
          const hasBid = allBids.some(b => b.id === (item.id || item.userId));
          return (
            <View key={item.id ? `part-${item.id}` : index.toString()} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>{avatar}</Text>
                </View>
                <View>
                  <Text style={styles.participantName}>{name}</Text>
                  <Text style={styles.participantRole}>Registered Chit Subscriber</Text>
                </View>
              </View>
              <View style={[styles.participantStatusPill, hasBid && styles.participantStatusPillActive]}>
                <Text style={[styles.participantStatusText, hasBid && styles.participantStatusTextActive]}>
                  {hasBid ? 'Bid Placed' : 'Observing'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Auto-Bid Setup Modal
  const renderAutoBidModal = () => (
    <Modal
      visible={showAutoBidModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAutoBidModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.autoBidModalContent}>
          <View style={styles.autoBidModalHeader}>
            <MaterialCommunityIcons name="robot" size={26} color="#6B46C1" />
            <Text style={styles.autoBidModalTitle}>Configure Auto-Bid</Text>
          </View>
          
          <Text style={styles.autoBidModalSubtitle}>
            Our automated proxy bidding system will place bids on your behalf whenever another member bids, reducing the price by ₹500 down to your floor limit.
          </Text>

          <View style={styles.autoBidInputContainer}>
            <Text style={styles.autoBidInputLabel}>Floor Prize Money (Minimum you accept):</Text>
            <View style={styles.autoBidInputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.autoBidTextInput}
                value={autoBidFloor}
                onChangeText={setAutoBidFloor}
                placeholder="e.g. 75000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <Text style={styles.autoBidInputHelp}>
              Current lowest bid: {formatCurrency(getCurrentLowestBid())}
            </Text>
          </View>

          <View style={styles.autoBidActions}>
            <TouchableOpacity 
              style={styles.autoBidCancelBtn} 
              onPress={() => setShowAutoBidModal(false)}
            >
              <Text style={styles.autoBidCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.autoBidSaveBtn} 
              onPress={handleSaveAutoBid}
            >
              <Text style={styles.autoBidSaveText}>Activate Auto-Bid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Post-Auction Comprehensive Financial Summary Modal
  const renderSummaryModal = () => {
    const summary = auctionSummary || {
      chitValue: initialAmount,
      winningBid: winner?.bid || initialAmount,
      discountAmount: Math.max(0, initialAmount - (winner?.bid || initialAmount)),
      commission: Math.round(initialAmount * 0.05),
      netDividendPool: Math.max(0, initialAmount - (winner?.bid || initialAmount) - Math.round(initialAmount * 0.05)),
      totalMembers: 20,
      dividendPerMember: Math.round(Math.max(0, initialAmount - (winner?.bid || initialAmount) - Math.round(initialAmount * 0.05)) / 20),
      nextInstallmentAmount: Math.max(0, Math.round(initialAmount / 20) - Math.round(Math.max(0, initialAmount - (winner?.bid || initialAmount) - Math.round(initialAmount * 0.05)) / 20)),
    };

    return (
      <Modal
        visible={showWinnerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWinnerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <View style={styles.summaryHeaderBadge}>
                <MaterialCommunityIcons name="trophy-award" size={44} color="#FFD700" />
                <Text style={styles.summaryModalTitle}>Auction Concluded</Text>
                <Text style={styles.summaryWinnerName}>
                  Winner: {winner?.name || 'Chit Pool'}
                </Text>
              </View>

              {/* Financial Breakdown Table */}
              <View style={styles.summaryTableCard}>
                <Text style={styles.summaryCardTitle}>Financial Settlement Breakdown</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Total Chit Value</Text>
                  <Text style={styles.summaryRowValue}>{formatCurrency(summary.chitValue)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Winning Prize Bid</Text>
                  <Text style={[styles.summaryRowValue, { color: '#059669', fontWeight: '800' }]}>
                    {formatCurrency(summary.winningBid)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Auction Discount</Text>
                  <Text style={styles.summaryRowValue}>{formatCurrency(summary.discountAmount)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Foreman Commission (5%)</Text>
                  <Text style={styles.summaryRowValue}>{formatCurrency(summary.commission)}</Text>
                </View>

                <View style={[styles.summaryRow, styles.summaryHighlightRow]}>
                  <Text style={styles.summaryHighlightLabel}>Net Dividend Pool</Text>
                  <Text style={styles.summaryHighlightValue}>{formatCurrency(summary.netDividendPool)}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Dividend Per Member ({summary.totalMembers} Members)</Text>
                  <Text style={[styles.summaryRowValue, { color: '#6B46C1', fontWeight: '800' }]}>
                    +{formatCurrency(summary.dividendPerMember)}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.summaryFinalRow]}>
                  <View>
                    <Text style={styles.summaryFinalLabel}>Next Month Installment</Text>
                    <Text style={styles.summaryFinalSub}>Base minus dividend credit</Text>
                  </View>
                  <Text style={styles.summaryFinalValue}>{formatCurrency(summary.nextInstallmentAmount)}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.summaryDoneButton}
                onPress={() => setShowWinnerModal(false)}
              >
                <Text style={styles.summaryDoneButtonText}>Close & Return to Group</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {connectionState === 'reconnecting' && (
        <View style={styles.reconnectingBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.reconnectingText}>{t('Reconnecting to live auction...')}</Text>
        </View>
      )}

      {renderAntiSnipingAlert()}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderEligibilityBanner()}
        {renderTimer()}
        {renderHighestBid()}
        {auctionStatus === 'active' && renderBiddingInput()}

        {/* Tab Controls and Dynamic Content */}
        <View style={styles.tabContentCard}>
          {renderTabHeader()}
          {activeTab === 'leaderboard' && renderLeaderboardTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'participants' && renderParticipantsTab()}
        </View>
      </ScrollView>

      {renderAutoBidModal()}
      {renderSummaryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  reconnectingBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  reconnectingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  antiSnipingBanner: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  antiSnipingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  eligibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  eligibleCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  ineligibleCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  eligibilityText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: 8,
  },
  eligibleText: {
    color: '#065F46',
  },
  ineligibleText: {
    color: '#991B1B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // Timer Card
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  timerText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#6B46C1',
    marginVertical: 4,
    letterSpacing: 2,
  },
  timerTextWarning: {
    color: '#EF4444',
  },
  timerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  snipingNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  snipingNoticeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },

  // Lowest Bid Card
  highestBidCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  highestBidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  highestBidLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highestBidAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#B45309',
    marginBottom: 4,
  },
  bidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  yourBidText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '500',
  },
  autoBidActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  autoBidActivePillText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '700',
  },

  // Bidding Input
  biddingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  biddingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  biddingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  autoBidToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  autoBidToggleBtnActive: {
    backgroundColor: '#7C3AED',
  },
  autoBidToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B46C1',
  },
  autoBidToggleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B46C1',
    marginRight: 6,
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  quickBidButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickBidBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickBidText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  submitBidBtn: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitBidBtnDisabled: {
    opacity: 0.5,
  },
  submitBidBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Tabs
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#6B46C1',
    fontWeight: '800',
  },
  listContainer: {
    paddingTop: 4,
  },

  // Leaderboard Rows
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBidRow: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  bidRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankCircle: {
    backgroundColor: '#F59E0B',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  topRankText: {
    color: '#FFFFFF',
  },
  bidAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBidAvatar: {
    backgroundColor: '#F59E0B',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  myBidBadge: {
    fontSize: 10,
    color: '#6B46C1',
    fontWeight: '700',
  },
  bidAmountContainer: {
    alignItems: 'flex-end',
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B46C1',
  },
  topBidAmount: {
    color: '#B45309',
    fontSize: 15,
  },
  crownIcon: {
    marginTop: 2,
  },

  // Live History Rows
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  // Participants Rows
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  participantName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  participantRole: {
    fontSize: 11,
    color: '#94A3B8',
  },
  participantStatusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  participantStatusPillActive: {
    backgroundColor: '#ECFDF5',
  },
  participantStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  participantStatusTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '600',
  },

  // Auto-Bid Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  autoBidModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  autoBidModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  autoBidModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  autoBidModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  autoBidInputContainer: {
    marginBottom: 20,
  },
  autoBidInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  autoBidInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#6B46C1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  autoBidTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  autoBidInputHelp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  autoBidActions: {
    flexDirection: 'row',
    gap: 10,
  },
  autoBidCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  autoBidCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  autoBidSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
  },
  autoBidSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Post Auction Summary Modal
  summaryModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  summaryHeaderBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  summaryWinnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B46C1',
    marginTop: 2,
  },
  summaryTableCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  summaryRowLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  summaryRowValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  summaryHighlightRow: {
    backgroundColor: '#EDE9FE',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  summaryHighlightLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },
  summaryHighlightValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5B21B6',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryFinalRow: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  summaryFinalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  summaryFinalSub: {
    fontSize: 10,
    color: '#047857',
  },
  summaryFinalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
  },
  summaryDoneButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default React.memo(BettingAuction);
