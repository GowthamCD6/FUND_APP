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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../../../../services/AuctionWebSocketService';
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
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [allBids, setAllBids] = useState([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
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
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'user');
          setWsConnected(true);

          const unsub1 = AuctionWebSocketService.on('auction_started', handleAuctionStartedEvent);
          const unsub2 = AuctionWebSocketService.on('bid_placed', handleBidPlacedEvent);
          const unsub3 = AuctionWebSocketService.on('time_update', handleTimeUpdateEvent);
          const unsub4 = AuctionWebSocketService.on('auction_ended', handleAuctionEndedEvent);
          const unsub5 = AuctionWebSocketService.on('participants_updated', handleParticipantsUpdatedEvent);
          const unsub6 = AuctionWebSocketService.on('error', handleWebSocketError);

          unsubscribeRef.current = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6];
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
  }, []);

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
        avatar: b.userName.substring(0, 2).toUpperCase(),
        isMe: b.userId === currentUserId,
      }));
      setAllBids(formattedBids);
      const myPrebid = formattedBids.find(b => b.isMe);
      if (myPrebid) {
        setMyBid(myPrebid.bid);
      }
    } else {
      setAllBids([]);
    }
  };

  const handleBidPlacedEvent = (data) => {
    const { userId, userName, amount, timestamp } = data;
    const bidTime = new Date(timestamp);
    
    setAllBids(prev => {
      const filtered = prev.filter(b => b.id !== userId);
      return [...filtered, {
        id: userId,
        name: userName,
        bid: amount,
        bidTime,
        avatar: userName.substring(0, 2).toUpperCase(),
        isMe: userId === currentUserId || userId.toString() === currentUserId?.toString(),
      }];
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
    const { winner: winnerData } = data;
    if (winnerData) {
      const winnerObj = {
        id: winnerData.userId,
        name: winnerData.userName,
        bid: winnerData.amount,
        avatar: winnerData.userName.substring(0, 2).toUpperCase(),
      };
      setWinner(winnerObj);
      setShowWinnerModal(true);
      if (onAuctionComplete) {
        onAuctionComplete({
          type: 'betting',
          winner: winnerObj,
          amount: winnerData.amount,
        });
      }
    }
  };

  const handleParticipantsUpdatedEvent = (data) => {
    // optional
  };

  const handleWebSocketError = (err) => {
    console.error('WebSocket error:', err);
  };

  const submitBid = useCallback(async () => {
    if (isSubmittingBid) return;

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

    if (newBid >= currentLowest) {
      Alert.alert(t('Error'), `${t('Your bid must be lower than')} ${formatCurrency(currentLowest)}`);
      return;
    }

    if (newBid % 100 !== 0) {
      Alert.alert(t('Error'), t('Bid amount must be in multiples of ₹100'));
      return;
    }

    setIsSubmittingBid(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName') || 'You';
      
      AuctionWebSocketService.placeBid(
        selectedGroup.id,
        newBid,
        userId,
        userName
      );
      setBidAmount('');
    } catch (error) {
      console.error('Failed to submit bid:', error);
      Alert.alert(t('Error'), t('Failed to place bid. Please try again.'));
    } finally {
      setIsSubmittingBid(false);
    }
  }, [auctionStatus, bidAmount, getCurrentLowestBid, formatCurrency, selectedGroup, isSubmittingBid, t]);

  const quickBid = useCallback((decrement) => {
    const newAmount = getCurrentLowestBid() - decrement;
    if (newAmount > 0) {
      setBidAmount(newAmount.toString());
    }
  }, [getCurrentLowestBid]);

  const renderTimer = () => (
    <View style={styles.timerCard}>
      <MaterialCommunityIcons 
        name="timer-outline" 
        size={40} 
        color={timeRemaining < 60 ? '#EF4444' : '#6B46C1'} 
      />
      <Text style={[styles.timerText, timeRemaining < 60 && styles.timerTextWarning]}>
        {formatTime(timeRemaining)}
      </Text>
      <Text style={styles.timerLabel}>
        {auctionStatus === 'active' ? 'Time Remaining' : 'Auction Ended'}
      </Text>
      {auctionStatus === 'active' && timeRemaining < 60 && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>⚠️ Less than 1 minute!</Text>
        </View>
      )}
    </View>
  );

  const renderHighestBid = () => (
    <View style={styles.highestBidCard}>
      <View style={styles.highestBidHeader}>
        <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
        <Text style={styles.highestBidLabel}>Lowest Bid</Text>
      </View>
      <Text style={styles.highestBidAmount}>{formatCurrency(getCurrentLowestBid())}</Text>
      {myBid > 0 && (
        <Text style={styles.yourBidText}>Your bid: {formatCurrency(myBid)}</Text>
      )}
    </View>
  );

  const renderBiddingInput = () => (
    <View style={styles.biddingCard}>
      <Text style={styles.biddingLabel}>Place Your Bid</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.bidInput}
          value={bidAmount}
          onChangeText={setBidAmount}
          placeholder={`Max ${formatCurrency(getCurrentLowestBid() - 100)}`}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
          editable={auctionStatus === 'active' && !isSubmittingBid}
        />
      </View>

      <View style={styles.quickBidButtons}>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(1000)}
          disabled={auctionStatus !== 'active'}
        >
          <Text style={styles.quickBidText}>-₹1K</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(5000)}
          disabled={auctionStatus !== 'active'}
        >
          <Text style={styles.quickBidText}>-₹5K</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(10000)}
          disabled={auctionStatus !== 'active'}
        >
          <Text style={styles.quickBidText}>-₹10K</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.submitBidBtn, (isSubmittingBid || auctionStatus !== 'active') && styles.submitBidBtnDisabled]}
        onPress={submitBid}
        disabled={isSubmittingBid || auctionStatus !== 'active'}
      >
        <MaterialCommunityIcons name="gavel" size={20} color="#FFFFFF" />
        <Text style={styles.submitBidBtnText}>
          {isSubmittingBid ? 'Placing Bid...' : 'Place Bid'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.leaderboardCard}>
      <View style={styles.leaderboardHeader}>
        <MaterialCommunityIcons name="podium" size={20} color="#6B46C1" />
        <Text style={styles.leaderboardTitle}>Live Leaderboard</Text>
        <Text style={styles.bidCount}>{allBids.length}</Text>
      </View>

      {allBids.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="gavel-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bids placed yet</Text>
        </View>
      ) : (
        <FlatList
          data={sortedBids}
          renderItem={({ item, index }) => (
            <View style={[styles.bidRow, index === 0 && styles.topBidRow]}>
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
          )}
          keyExtractor={(item, index) => item.id ? item.id.toString() + '_' + index : index.toString()}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />
      )}
    </View>
  );

  const renderWinnerModal = () => (
    <Modal
      visible={showWinnerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowWinnerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialCommunityIcons name="trophy-award" size={70} color="#FFD700" />
          <Text style={styles.modalTitle}>🎉 Winner! 🎉</Text>
          <Text style={styles.winnerName}>{winner?.name}</Text>
          <Text style={styles.winnerBid}>
            Winning Bid: {formatCurrency(winner?.bid || 0)}
          </Text>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => setShowWinnerModal(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTimer()}
        {renderHighestBid()}
        {auctionStatus === 'active' && renderBiddingInput()}
        {renderLeaderboard()}
      </ScrollView>
      {renderWinnerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Timer Card
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6B46C1',
    marginVertical: 8,
    letterSpacing: 2,
  },
  timerTextWarning: {
    color: '#EF4444',
  },
  timerLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  warningBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },

  // Highest Bid Card
  highestBidCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  highestBidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  highestBidLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  highestBidAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
  },
  yourBidText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '500',
  },

  // Bidding Input
  biddingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  biddingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B46C1',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  quickBidButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickBidBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickBidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
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
    opacity: 0.6,
  },
  submitBidBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Leaderboard
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  bidCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankCircle: {
    backgroundColor: '#F59E0B',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  topRankText: {
    color: '#FFFFFF',
  },
  bidAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBidAvatar: {
    backgroundColor: '#F59E0B',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  myBidBadge: {
    fontSize: 10,
    color: '#6B46C1',
    fontWeight: '600',
    marginTop: 2,
  },
  bidAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  bidAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B46C1',
  },
  topBidAmount: {
    color: '#F59E0B',
    fontSize: 14,
  },
  crownIcon: {
    alignSelf: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Winner Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 4,
  },
  winnerBid: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default React.memo(BettingAuction);
