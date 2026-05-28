import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../../../../../services/AuctionWebSocketService';

const AdminAuctionMonitor = ({
  participants = [],
  setParticipants,
  selectedGroup,
  onAuctionComplete,
}) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [auctionStartTime, setAuctionStartTime] = useState(null);
  const [auctionDuration, setAuctionDuration] = useState(300);
  const [auctionHistory, setAuctionHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [activeBidders, setActiveBidders] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribeRef = useRef([]);

  // Connect to WebSocket on mount
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          // Connect to auction WebSocket
          await AuctionWebSocketService.connect(token, userId, 'admin');
          setWsConnected(true);

          // Listen for auction events
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
        Alert.alert('Connection Error', 'Failed to connect to auction server');
      }
    };

    initWebSocket();

    return () => {
      unsubscribeRef.current.forEach(unsub => unsub?.());
      AuctionWebSocketService.disconnect();
    };
  }, []);

  // Synchronized timer effect
  useEffect(() => {
    if (!isAuctionActive || !auctionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - auctionStartTime) / 1000);
      const remaining = Math.max(0, auctionDuration - elapsed);
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        endAuction();
      }
    }, 100); // Update every 100ms for smooth timer

    return () => clearInterval(interval);
  }, [isAuctionActive, auctionStartTime, auctionDuration]);

  // WebSocket event handlers
  const handleAuctionStartedEvent = (data) => {
    console.log('🎯 Auction started event:', data);
    setAuctionStartTime(data.startTime);
    setAuctionDuration(data.duration || 300);
    setIsAuctionActive(true);
    setAuctionStarted(true);
    setAuctionHistory([]);
    setActiveBidders([]);
  };

  const handleBidPlacedEvent = (data) => {
    console.log('💰 Bid placed event:', data);
    const { userId, userName, amount, timestamp } = data;
    
    // Update participants
    setParticipants(prev => {
      const updated = [...prev];
      const bidderIndex = updated.findIndex(p => p.id === userId);
      if (bidderIndex >= 0) {
        updated[bidderIndex] = {
          ...updated[bidderIndex],
          bid: amount,
          bidTime: timestamp,
        };
      }
      return updated;
    });

    // Add to history
    setAuctionHistory(prev => [...prev, {
      userId,
      user: userName,
      bid: amount,
      time: new Date(timestamp).toLocaleTimeString(),
    }]);

    // Update active bidders
    setActiveBidders(prev => {
      const exists = prev.find(b => b.userId === userId);
      if (exists) {
        return prev.map(b => b.userId === userId ? { ...b, amount, timestamp } : b);
      }
      return [...prev, { userId, userName, amount, timestamp }];
    });
  };

  const handleTimeUpdateEvent = (data) => {
    // Server-sent time sync for all clients
    console.log('⏰ Time update from server:', data);
    setTimeRemaining(Math.max(0, data.remainingTime));
  };

  const handleAuctionEndedEvent = (data) => {
    console.log('🏁 Auction ended event:', data);
    const { winner: winnerData } = data;
    if (winnerData) {
      const winnerObj = participants.find(p => p.id === winnerData.userId);
      setWinner(winnerObj || winnerData);
      setShowWinnerModal(true);
    }
    setIsAuctionActive(false);
  };

  const handleParticipantsUpdatedEvent = (data) => {
    console.log('👥 Participants updated:', data);
    if (data.participants) {
      setParticipants(data.participants);
    }
  };

  const handleWebSocketError = (error) => {
    console.error('⚠️ WebSocket error:', error);
    Alert.alert('Connection Issue', error.message || 'WebSocket connection lost');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentHighestBid = () => {
    const activeBids = participants.filter(p => p.bid > 0);
    if (activeBids.length === 0) {
      return parseFloat(initialAmount) || selectedGroup?.groupAmount || 90000;
    }
    return Math.max(...activeBids.map(p => p.bid));
  };

  const startAuction = () => {
    if (!initialAmount || parseFloat(initialAmount) <= 0) {
      Alert.alert('Error', 'Please set an initial amount before starting the auction.');
      return;
    }

    if (parseFloat(initialAmount) % 1000 !== 0) {
      Alert.alert('Error', 'Initial amount must be in multiples of ₹1,000');
      return;
    }

    if (!selectedGroup?.id) {
      Alert.alert('Error', 'No group selected');
      return;
    }

    if (isAuctionActive) {
      Alert.alert('Auction Running', 'The betting auction is already in progress.');
      return;
    }

    // Send auction start event via WebSocket
    AuctionWebSocketService.startAuction(
      selectedGroup.id,
      parseFloat(initialAmount),
      300
    );
  };

  const pauseAuction = () => {
    if (!selectedGroup?.id) return;
    AuctionWebSocketService.pauseAuction(selectedGroup.id);
    setIsAuctionActive(false);
  };

  const resumeAuction = () => {
    if (!selectedGroup?.id) return;
    if (timeRemaining > 0) {
      AuctionWebSocketService.resumeAuction(selectedGroup.id);
      setIsAuctionActive(true);
    } else {
      Alert.alert('Cannot Resume', 'Time has expired. Please reset the auction.');
    }
  };

  const resetAuction = () => {
    Alert.alert(
      'Reset Auction',
      'Are you sure you want to reset the auction? All bids will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (selectedGroup?.id) {
              AuctionWebSocketService.resetAuction(selectedGroup.id);
            }
            setParticipants(participants.map(p => ({ ...p, bid: 0, bidTime: null })));
            setIsAuctionActive(false);
            setAuctionStarted(false);
            setTimeRemaining(300);
            setWinner(null);
            setAuctionHistory([]);
            setActiveBidders([]);
            setInitialAmount('');
            Alert.alert('Success', 'Auction reset successfully!');
          },
        },
      ]
    );
  };

  const endAuction = () => {
    if (!selectedGroup?.id) return;
    
    const validBids = participants.filter(p => p.bid > 0);
    if (validBids.length === 0) {
      Alert.alert('Auction Ended', 'No participants placed bids.');
      setIsAuctionActive(false);
      return;
    }

    const auctionWinner = validBids.reduce((prev, current) => 
      (prev.bid > current.bid) ? prev : current
    );

    // Send end auction event via WebSocket
    AuctionWebSocketService.endAuction(selectedGroup.id);
    
    setWinner(auctionWinner);
    setShowWinnerModal(true);
    setIsAuctionActive(false);
    
    if (onAuctionComplete) {
      onAuctionComplete({
        type: 'betting',
        winner: auctionWinner,
        amount: auctionWinner.bid
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerContent}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="shield-crown" size={28} color="#6B46C1" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Auction Monitor</Text>
          <Text style={styles.headerSubtitle}>Manage betting auction</Text>
        </View>
      </View>

      {!auctionStarted && (
        <View style={styles.initialAmountCard}>
          <Text style={styles.initialAmountLabel}>Initial Auction Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={initialAmount}
              onChangeText={setInitialAmount}
              placeholder="90000"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.inputHint}>Must be in multiples of ₹1,000</Text>
        </View>
      )}

      <View style={styles.controlButtons}>
        <TouchableOpacity 
          style={[styles.controlBtn, styles.startButton, (isAuctionActive || auctionStarted) && styles.buttonDisabled]}
          onPress={startAuction}
          disabled={isAuctionActive || auctionStarted}
        >
          <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlBtn, styles.pauseButton, !auctionStarted && styles.buttonDisabled]}
          onPress={isAuctionActive ? pauseAuction : resumeAuction}
          disabled={!auctionStarted}
        >
          <MaterialCommunityIcons name={isAuctionActive ? "pause" : "play"} size={18} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>
            {isAuctionActive ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlBtn, styles.resetButton]}
          onPress={resetAuction}
        >
          <MaterialCommunityIcons name="reload" size={18} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        {isAuctionActive ? 'Time Remaining' : 'Duration'}
      </Text>
      {isAuctionActive && timeRemaining < 60 && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>⚠️ Less than 1 minute!</Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
          <MaterialCommunityIcons name="account-group" size={20} color="#3B82F6" />
        </View>
        <Text style={styles.statValue}>{participants.length}</Text>
        <Text style={styles.statLabel}>Participants</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
          <MaterialCommunityIcons name="trophy" size={20} color="#6B46C1" />
        </View>
        <Text style={[styles.statValue, { fontSize: 14 }]}>
          {formatCurrency(getCurrentHighestBid())}
        </Text>
        <Text style={styles.statLabel}>Highest Bid</Text>
      </View>
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="podium" size={20} color="#6B46C1" />
        <Text style={styles.sectionTitle}>Leaderboard</Text>
      </View>
      
      {participants.filter(p => p.bid > 0).length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bids placed yet</Text>
        </View>
      ) : (
        <View>
          {participants
            .filter(p => p.bid > 0)
            .sort((a, b) => b.bid - a.bid)
            .map((participant, index) => (
              <View key={participant.id} style={[styles.bidRow, index === 0 && styles.topBid]}>
                <View style={styles.bidInfo}>
                  <View style={[styles.avatar, index === 0 && styles.topAvatar]}>
                    <Text style={styles.avatarText}>
                      {participant.avatar || participant.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bidDetails}>
                    <Text style={styles.userName}>{participant.name}</Text>
                    <Text style={styles.bidValue}>
                      {formatCurrency(participant.bid)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.rank, index === 0 && styles.topRank]}>
                  <Text style={[styles.rankText, index === 0 && styles.topRankText]}>
                    #{index + 1}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );

  const renderBidHistory = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="history" size={20} color="#6B46C1" />
        <Text style={styles.sectionTitle}>Bid History</Text>
      </View>

      {auctionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="information-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>No activity yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
          {[...auctionHistory].reverse().map((entry, index) => (
            <View key={`${entry.userId}-${entry.bid}-${index}`} style={styles.historyRow}>
              <View>
                <Text style={styles.historyUser}>{entry.user}</Text>
                <Text style={styles.historyTime}>{entry.time}</Text>
              </View>
              <Text style={styles.historyBid}>{formatCurrency(entry.bid)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderLiveBidders = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#10B981" />
        <Text style={styles.sectionTitle}>Live Bidders</Text>
        {wsConnected && (
          <View style={styles.connectionBadge}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>Connected</Text>
          </View>
        )}
      </View>
      
      {activeBidders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-multiple-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Waiting for bids...</Text>
        </View>
      ) : (
        <View>
          {activeBidders
            .sort((a, b) => b.amount - a.amount)
            .map((bidder, index) => (
              <View key={bidder.userId} style={[styles.activeBidderRow, index === 0 && styles.topActiveBidder]}>
                <View style={styles.bidderInfo}>
                  <View style={[styles.activeBidderAvatar, index === 0 && styles.topActiveBidderAvatar]}>
                    <Text style={styles.avatarText}>
                      {bidder.userName.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bidderDetails}>
                    <Text style={styles.bidderName}>{bidder.userName}</Text>
                    <Text style={styles.bidderTime}>
                      {new Date(bidder.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.bidderAmountContainer}>
                  <Text style={[styles.bidderAmount, index === 0 && styles.topBidderAmount]}>
                    {formatCurrency(bidder.amount)}
                  </Text>
                  {index === 0 && (
                    <View style={styles.leadingBadge}>
                      <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                    </View>
                  )}
                </View>
              </View>
            ))}
        </View>
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
        {renderHeader()}
        {renderTimer()}
        {renderStats()}
        {renderLiveBidders()}
        {renderLeaderboard()}
        {renderBidHistory()}
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
    paddingTop: 2,
    paddingBottom: 16,
  },
  
  // Header
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: 14,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '400',
  },
  
  // Initial Amount
  initialAmountCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  initialAmountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B46C1',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '400',
  },
  
  // Control Buttons
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    gap: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Timer
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#6B46C1',
    marginVertical: 6,
    letterSpacing: 3,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  
  // Section Card
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
    fontWeight: '500',
  },
  
  // Bid Row
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  topBid: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  bidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topAvatar: {
    backgroundColor: '#F59E0B',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bidDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    letterSpacing: -0.2,
  },
  bidValue: {
    fontSize: 13,
    color: '#6B46C1',
    marginTop: 1,
    fontWeight: '600',
  },
  rank: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  topRank: {
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
  
  // History
  historyScroll: {
    maxHeight: 220,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyUser: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  historyTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '400',
  },
  historyBid: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B46C1',
    letterSpacing: -0.2,
  },

  // Live Bidders
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  activeBidderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBEF63',
  },
  topActiveBidder: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeBidderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topActiveBidderAvatar: {
    backgroundColor: '#F59E0B',
  },
  bidderDetails: {
    flex: 1,
  },
  bidderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  bidderTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  bidderAmountContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  bidderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  topBidderAmount: {
    color: '#F59E0B',
    fontSize: 15,
  },
  leadingBadge: {
    marginTop: 4,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 360,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 14,
    letterSpacing: -0.5,
  },
  winnerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B46C1',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  winnerBid: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AdminAuctionMonitor;