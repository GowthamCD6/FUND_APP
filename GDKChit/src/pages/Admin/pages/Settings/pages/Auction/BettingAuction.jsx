import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BettingAuction = ({
  participants = [],
  setParticipants,
  selectedGroup,
  selectedMembers = [],
  onAuctionComplete,
}) => {
  const [bettingAmount, setBettingAmount] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [currentUserId, setCurrentUserId] = useState(selectedMembers.length > 0 ? selectedMembers[0].id : null);
  const [auctionHistory, setAuctionHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Timer effect for betting auction
  useEffect(() => {
    let timer;
    if (isAuctionActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isAuctionActive) {
      endAuction();
    }
    return () => clearTimeout(timer);
  }, [isAuctionActive, timeRemaining]);

  // Update current user if selectedMembers changes
  useEffect(() => {
    if (selectedMembers.length > 0 && !currentUserId) {
      setCurrentUserId(selectedMembers[0].id);
    }
  }, [selectedMembers]);

  // Utility functions
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

  // Get current lowest bid from other participants
  const getLowestBid = () => {
    const activeBids = participants.filter(p => p.id !== currentUserId && p.bid > 0);
    if (activeBids.length === 0) return selectedGroup?.groupAmount || 90000;
    return Math.min(...activeBids.map(p => p.bid));
  };

  // Get current user's bid
  const getCurrentUserBid = () => {
    const user = participants.find(p => p.id === currentUserId);
    return user ? user.bid : 0;
  };

  // Get current user name
  const getCurrentUserName = () => {
    const user = participants.find(p => p.id === currentUserId);
    return user ? user.name : '';
  };

  const startAuction = () => {
    if (isAuctionActive) {
      Alert.alert('Auction Running', 'The betting auction is already in progress.');
      return;
    }
    setIsAuctionActive(true);
    setTimeRemaining(300);
    setWinner(null);
    setAuctionHistory([]);
    Alert.alert('Auction Started', 'Place your bids now! Timer has started.');
  };

  const pauseAuction = () => {
    setIsAuctionActive(false);
    Alert.alert('Auction Paused', 'The auction has been paused.');
  };

  const resumeAuction = () => {
    if (timeRemaining > 0) {
      setIsAuctionActive(true);
      Alert.alert('Auction Resumed', 'The auction has resumed.');
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
            setParticipants(participants.map(p => ({ ...p, bid: 0, bidTime: null })));
            setIsAuctionActive(false);
            setTimeRemaining(300);
            setWinner(null);
            setAuctionHistory([]);
            setBettingAmount('');
            Alert.alert('Success', 'Auction reset successfully!');
          },
        },
      ]
    );
  };

  const endAuction = () => {
    setIsAuctionActive(false);
    
    const validBids = participants.filter(p => p.bid > 0);
    if (validBids.length === 0) {
      Alert.alert('Auction Ended', 'No participants placed bids.');
      return;
    }

    const auctionWinner = validBids.reduce((prev, current) => 
      (prev.bid < current.bid) ? prev : current
    );
    
    setWinner(auctionWinner);
    setShowWinnerModal(true);
    
    if (onAuctionComplete) {
      onAuctionComplete({
        type: 'betting',
        winner: auctionWinner,
        amount: auctionWinner.bid
      });
    }
  };

  const submitBid = () => {
    if (!isAuctionActive) {
      Alert.alert('Error', 'Auction is not active. Please start the auction first.');
      return;
    }

    if (!bettingAmount || parseFloat(bettingAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    const newBid = parseFloat(bettingAmount);

    if (!currentUserId) {
      Alert.alert('Error', 'No user selected to place a bid.');
      return;
    }

    const currentUser = participants.find(p => p.id === currentUserId);
    if (!currentUser) {
      Alert.alert('Error', 'Current user not found in participants.');
      return;
    }

    // Check if bid is a valid increment (must be in 1000s)
    if (newBid % 1000 !== 0) {
      Alert.alert('Error', 'Bid amount must be in multiples of ₹1,000');
      return;
    }

    const lowestCurrentBid = getLowestBid();

    if (newBid >= lowestCurrentBid) {
      Alert.alert('Error', `Bid must be lower than the current lowest bid (${formatCurrency(lowestCurrentBid)})`);
      return;
    }

    if (newBid < 1000) {
      Alert.alert('Error', 'Minimum bid is ₹1,000');
      return;
    }

    // Update the participant's bid
    const updatedParticipants = participants.map(p => {
      if (p.id === currentUser.id) {
        return {
          ...p,
          bid: newBid,
          bidTime: new Date().toISOString(),
        };
      }
      return p;
    });

    setParticipants(updatedParticipants);
    
    // Add to history
    setAuctionHistory([...auctionHistory, {
      user: currentUser.name,
      bid: newBid,
      time: new Date().toLocaleTimeString(),
    }]);

    Alert.alert('Success', 'Bid submitted successfully!');
    setBettingAmount('');
  };

  // Quick Bid
  const quickBid = (amount) => {
    const lowestBid = getLowestBid();
    const suggestedBid = lowestBid - amount;
    if (suggestedBid > 0 && suggestedBid % 1000 === 0) {
      setBettingAmount(suggestedBid.toString());
    } else {
      Alert.alert('Invalid', 'Cannot create a valid quick bid with this amount.');
    }
  };

  const renderTimer = () => (
    <View style={styles.timerCard}>
      <MaterialCommunityIcons 
        name="timer-outline" 
        size={32} 
        color={timeRemaining < 60 ? '#EF4444' : '#6B46C1'} 
      />
      <Text style={[styles.timerText, timeRemaining < 60 && styles.timerTextWarning]}>
        {formatTime(timeRemaining)}
      </Text>
      <Text style={styles.timerLabel}>
        {isAuctionActive ? 'Time Remaining' : 'Auction Duration'}
      </Text>
      {isAuctionActive && timeRemaining < 60 && (
        <Text style={styles.warningText}>⚠️ Hurry! Less than 1 minute!</Text>
      )}
    </View>
  );

  const renderUserSelector = () => (
    <View style={styles.userSelectorCard}>
      <Text style={styles.userSelectorLabel}>Bidding as:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userList}>
        {participants.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.userChip,
              currentUserId === p.id && styles.userChipActive
            ]}
            onPress={() => setCurrentUserId(p.id)}
          >
            <Text style={[
              styles.userChipText,
              currentUserId === p.id && styles.userChipTextActive
            ]}>
              {p.avatar || p.name.substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.currentUserName}>{getCurrentUserName()}</Text>
    </View>
  );

  const renderBiddingList = () => (
    <View style={styles.bidsCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="podium" size={24} color="#6B46C1" />
        <Text style={styles.cardTitle}>Current Bids</Text>
      </View>
      
      {participants.filter(p => p.bid > 0).length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="information-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No bids placed yet</Text>
        </View>
      ) : (
        participants
          .filter(p => p.bid > 0)
          .sort((a, b) => a.bid - b.bid)
          .map((participant, index) => (
            <View key={participant.id} style={[styles.bidItem, index === 0 && styles.bidItemFirst]}>
              <View style={styles.bidLeft}>
                <View style={[styles.participantAvatar, index === 0 && styles.leadingAvatar]}>
                  <Text style={styles.avatarText}>
                    {participant.avatar || participant.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.bidAmount}>{formatCurrency(participant.bid)}</Text>
                </View>
              </View>
              <View style={[styles.rankBadge, index === 0 && styles.firstRank]}>
                <Text style={[styles.rankText, index === 0 && styles.firstRankText]}>
                  #{index + 1}
                </Text>
              </View>
            </View>
          ))
      )}
    </View>
  );

  const renderBidInput = () => (
    <View style={styles.bidCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="gavel" size={24} color="#6B46C1" />
        <Text style={styles.cardTitle}>Place Your Bid</Text>
      </View>

      <View style={styles.bidInfo}>
        <View style={styles.bidInfoRow}>
          <Text style={styles.bidInfoLabel}>Current Lowest Bid:</Text>
          <Text style={styles.bidInfoValue}>{formatCurrency(getLowestBid())}</Text>
        </View>
        <View style={styles.bidInfoRow}>
          <Text style={styles.bidInfoLabel}>Your Current Bid:</Text>
          <Text style={styles.bidInfoValue}>
            {getCurrentUserBid() > 0 ? formatCurrency(getCurrentUserBid()) : 'No bid yet'}
          </Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.bidInput}
          value={bettingAmount}
          onChangeText={setBettingAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          placeholderTextColor="#999"
          editable={isAuctionActive}
        />
      </View>

      {/* Quick Bid Buttons */}
      <View style={styles.quickBidRow}>
        <TouchableOpacity
          style={[styles.quickBidButton, !isAuctionActive && styles.buttonDisabled]}
          onPress={() => quickBid(5000)}
          disabled={!isAuctionActive}
        >
          <Text style={styles.quickBidText}>-₹5K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBidButton, !isAuctionActive && styles.buttonDisabled]}
          onPress={() => quickBid(10000)}
          disabled={!isAuctionActive}
        >
          <Text style={styles.quickBidText}>-₹10K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBidButton, !isAuctionActive && styles.buttonDisabled]}
          onPress={() => quickBid(20000)}
          disabled={!isAuctionActive}
        >
          <Text style={styles.quickBidText}>-₹20K</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, !isAuctionActive && styles.disabledButton]} 
        onPress={submitBid}
        disabled={!isAuctionActive}
      >
        <MaterialCommunityIcons name="gavel" size={18} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Submit Bid</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBidHistory = () => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="history" size={24} color="#6B46C1" />
        <Text style={styles.cardTitle}>Bid History</Text>
      </View>

      {auctionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="information-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No bids recorded yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList} nestedScrollEnabled={true}>
          {[...auctionHistory].reverse().map((entry, index) => (
            <View key={index} style={styles.historyItem}>
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

  const renderControlButtons = () => (
    <View style={styles.controlButtons}>
      <TouchableOpacity 
        style={[styles.startButton, isAuctionActive && styles.buttonDisabled]}
        onPress={startAuction}
        disabled={isAuctionActive}
      >
        <MaterialCommunityIcons name="play" size={20} color="#FFFFFF" />
        <Text style={styles.controlButtonText}>Start</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.pauseButton, !isAuctionActive && timeRemaining === 300 && styles.buttonDisabled]}
        onPress={isAuctionActive ? pauseAuction : resumeAuction}
        disabled={!isAuctionActive && timeRemaining === 300}
      >
        <MaterialCommunityIcons name={isAuctionActive ? "pause" : "play"} size={20} color="#FFFFFF" />
        <Text style={styles.controlButtonText}>
          {isAuctionActive ? 'Pause' : 'Resume'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetAuction}
      >
        <MaterialCommunityIcons name="reload" size={20} color="#FFFFFF" />
        <Text style={styles.controlButtonText}>Reset</Text>
      </TouchableOpacity>
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
          <MaterialCommunityIcons name="trophy-award" size={60} color="#FFD700" />
          <Text style={styles.modalTitle}>🎉 Winner! 🎉</Text>
          <Text style={styles.modalWinnerName}>{winner?.name}</Text>
          <Text style={styles.modalWinnerBid}>
            Winning Bid: {formatCurrency(winner?.bid || 0)}
          </Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowWinnerModal(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContent}>
          {renderControlButtons()}
          {renderTimer()}
          {renderUserSelector()}
          {renderBiddingList()}
          {renderBidInput()}
          {renderBidHistory()}
        </View>
      </ScrollView>
      {renderWinnerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingTop: 24,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginVertical: 8,
  },
  timerTextWarning: {
    color: '#EF4444',
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 8,
  },
  userSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userSelectorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  userList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userChipActive: {
    backgroundColor: '#6B46C1',
  },
  userChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  userChipTextActive: {
    color: '#FFFFFF',
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  bidItemFirst: {
    backgroundColor: '#FEF3C7',
  },
  bidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leadingAvatar: {
    backgroundColor: '#FFD700',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidAmount: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  firstRank: {
    backgroundColor: '#FFD700',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  firstRankText: {
    color: '#FFFFFF',
  },
  bidInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bidInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bidInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  bidInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B46C1',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  quickBidRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickBidButton: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBidText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  submitButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  historyBid: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B46C1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  modalWinnerName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 8,
  },
  modalWinnerBid: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  modalCloseButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BettingAuction;