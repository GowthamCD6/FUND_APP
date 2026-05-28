import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const BettingAuction = ({ participants = [], selectedGroup, selectedMembers = [], onAuctionComplete }) => {
  // All useState hooks MUST come first, before any other code
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [myBid, setMyBid] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [allBids, setAllBids] = useState([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Now all useEffect hooks come after useState
  const initialAmount = selectedGroup?.groupAmount || 90000;

  // Memoized sorted bids to prevent sorting on every render
  const sortedBids = useMemo(() => 
    [...allBids].sort((a, b) => b.bid - a.bid),
    [allBids]
  );

  // Helper functions - must be defined before useEffect
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const getCurrentHighestBid = useCallback(() => {
    const bids = allBids.map(b => b.bid);
    return bids.length > 0 ? Math.max(...bids) : initialAmount;
  }, [allBids, initialAmount]);

  const endAuction = useCallback(() => {
    setAuctionStatus('ended');
    
    const topBidder = allBids.reduce((max, bid) => 
      bid.bid > max.bid ? bid : max, 
      allBids[0] || {}
    );
    
    if (topBidder.id) {
      setWinner(topBidder);
      setShowWinnerModal(true);
      if (onAuctionComplete) {
        onAuctionComplete({
          type: 'betting',
          winner: topBidder,
          amount: topBidder.bid,
        });
      }
    }
  }, [allBids, onAuctionComplete]);

  // Initialize mock bids
  useEffect(() => {
    const mockBids = (selectedMembers || []).map((member, index) => ({
      id: member.id,
      name: member.name,
      bid: initialAmount - (index * 5000),
      bidTime: new Date(Date.now() - index * 10000),
      avatar: member.avatar || member.name.substring(0, 2).toUpperCase(),
    })).filter(b => b.bid > 0);
    
    setAllBids(mockBids);
  }, [selectedMembers, initialAmount]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (auctionStatus === 'active' && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining(t => t - 1), 1000);
    } else if (timeRemaining === 0 && auctionStatus === 'active') {
      // Call endAuction directly to avoid dependency cycles
      setAuctionStatus('ended');
      
      const topBidder = allBids.reduce((max, bid) => 
        bid.bid > max.bid ? bid : max, 
        allBids[0] || {}
      );
      
      if (topBidder.id) {
        setWinner(topBidder);
        setShowWinnerModal(true);
        if (onAuctionComplete) {
          onAuctionComplete({
            type: 'betting',
            winner: topBidder,
            amount: topBidder.bid,
          });
        }
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [auctionStatus, timeRemaining, allBids, onAuctionComplete]);

  const submitBid = useCallback(() => {
    if (auctionStatus !== 'active') {
      Alert.alert('Auction Ended', 'This auction has already concluded.');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    const newBid = parseFloat(bidAmount);
    const currentHighest = getCurrentHighestBid();

    if (newBid <= currentHighest) {
      Alert.alert('Error', `Your bid must be higher than ${formatCurrency(currentHighest)}`);
      return;
    }

    if (newBid % 100 !== 0) {
      Alert.alert('Error', 'Bid amount must be in multiples of ₹100');
      return;
    }

    setIsSubmittingBid(true);
    
    setTimeout(() => {
      setMyBid(newBid);
      setAllBids(prev => [
        ...prev.filter(b => b.id !== 'me'),
        {
          id: 'me',
          name: 'You',
          bid: newBid,
          bidTime: new Date(),
          avatar: 'U',
          isMe: true,
        }
      ]);
      setBidAmount('');
      setIsSubmittingBid(false);
      Alert.alert('Success', `Your bid of ${formatCurrency(newBid)} has been placed!`);
    }, 500);
  }, [auctionStatus, bidAmount, getCurrentHighestBid, formatCurrency]);

  const quickBid = useCallback((increment) => {
    const newAmount = getCurrentHighestBid() + increment;
    setBidAmount(newAmount.toString());
  }, [getCurrentHighestBid]);

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
        <Text style={styles.highestBidLabel}>Highest Bid</Text>
      </View>
      <Text style={styles.highestBidAmount}>{formatCurrency(getCurrentHighestBid())}</Text>
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
          placeholder={`Min ${formatCurrency(getCurrentHighestBid() + 100)}`}
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
          <Text style={styles.quickBidText}>+₹1K</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(5000)}
          disabled={auctionStatus !== 'active'}
        >
          <Text style={styles.quickBidText}>+₹5K</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBidBtn}
          onPress={() => quickBid(10000)}
          disabled={auctionStatus !== 'active'}
        >
          <Text style={styles.quickBidText}>+₹10K</Text>
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
          keyExtractor={(item) => item.id.toString()}
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
