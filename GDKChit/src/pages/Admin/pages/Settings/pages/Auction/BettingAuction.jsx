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
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

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

  const startAuction = () => {
    if (isAuctionActive) {
      Alert.alert('Auction Running', 'The betting auction is already in progress.');
      return;
    }
    setIsAuctionActive(true);
    setTimeRemaining(300); // 5 minutes
  };

  const endAuction = () => {
    setIsAuctionActive(false);
    // Find the winner with lowest bid
    if (participants.length === 0) {
      Alert.alert("Auction Ended", "No participants in the auction.");
      return;
    }
    const winner = participants.reduce((prev, current) => 
      (prev.bid < current.bid) ? prev : current
    );
    
    if (onAuctionComplete) {
      onAuctionComplete({
        type: 'betting',
        winner: winner,
        amount: winner.bid
      });
    }
  };

  const submitBid = () => {
    if (!bettingAmount || parseFloat(bettingAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }
    if (!isAuctionActive) {
      Alert.alert('Error', 'Auction is not active. Please start the auction first.');
      return;
    }

    const newBid = parseFloat(bettingAmount);
    
    // Find the participant representing the "current user" to update their bid
    // For a real app, you'd have a userId for the current user.
    // Here, we assume the first selected member is the "user" submitting the bid.
    if (selectedMembers.length === 0) {
        Alert.alert('Error', 'No user selected to place a bid.');
        return;
    }
    const currentUser = participants.find(p => p.id === selectedMembers[0].id);
    if (!currentUser) {
        Alert.alert('Error', 'Current user not found in participants.');
        return;
    }

    const lowestCurrentBid = participants.reduce((minBid, p) => 
        p.id !== currentUser.id && p.bid > 0 ? Math.min(minBid, p.bid) : minBid, 
        Infinity
    );
    
    // If it's the first bid for the user, no need to compare with others yet, just validate format
    if (currentUser.bid === 0 && newBid % 1000 !== 0) {
        Alert.alert('Error', 'Bid amount must be in multiples of 1,000');
        return;
    }

    // Check if bid is valid (must be lower than current lowest bid from *other* participants)
    // or if it's the very first bid, it should be below the initial set bid (e.g., 90000)
    const currentHighestPossibleBid = lowestCurrentBid === Infinity ? selectedGroup.groupAmount : lowestCurrentBid;

    if (newBid >= currentHighestPossibleBid) {
      Alert.alert('Error', `Bid must be lower than the current lowest bid (${formatCurrency(currentHighestPossibleBid)})`);
      return;
    }

    // Check if bid is a valid decrement (must be in 1000s)
    if (newBid % 1000 !== 0) {
      Alert.alert('Error', 'Bid amount must be in multiples of 1,000');
      return;
    }

    // Update the participant's bid
    const updatedParticipants = participants.map(p => {
      if (p.id === currentUser.id) { // Update for the current user
        return {
          ...p,
          bid: newBid,
        };
      }
      return p;
    });

    setParticipants(updatedParticipants);
    Alert.alert('Success', 'Bid submitted successfully!');
    setBettingAmount('');
  };

  const renderTimer = () => (
    <View style={styles.timerCard}>
      <MaterialCommunityIcons name="timer-outline" size={24} color="#6B46C1" />
      <Text style={styles.timerText}>
        {isAuctionActive ? formatTime(timeRemaining) : '05:00'}
      </Text>
      <Text style={styles.timerLabel}>
        {isAuctionActive ? 'Time Remaining' : 'Auction Duration'}
      </Text>
    </View>
  );

  const renderBiddingList = () => (
    <View style={styles.bidsCard}>
      <Text style={styles.cardTitle}>Current Bids</Text>
      {participants
        .sort((a, b) => a.bid - b.bid) // Sort by lowest bid for display
        .map((participant, index) => (
        <View key={participant.id} style={styles.bidItem}>
          <View style={styles.bidLeft}>
            <View style={[styles.participantAvatar, index === 0 && styles.leadingAvatar]}>
              <Text style={styles.avatarText}>{participant.avatar}</Text>
            </View>
            <View>
              <Text style={styles.participantName}>{participant.name.split(' ')[0]}</Text>
              <Text style={styles.bidAmount}>{formatCurrency(participant.bid)}</Text>
            </View>
          </View>
          <View style={[styles.rankBadge, index === 0 && styles.firstRank]}>
            <Text style={[styles.rankText, index === 0 && styles.firstRankText]}>
              #{index + 1}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderBidInput = () => (
    <View style={styles.bidCard}>
      <Text style={styles.cardTitle}>Place Your Bid</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.bidInput}
          value={bettingAmount}
          onChangeText={setBettingAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          placeholderTextColor="#999"
          editable={isAuctionActive} // Only allow bidding when auction is active
        />
      </View>
      <TouchableOpacity 
        style={[styles.submitButton, !isAuctionActive && styles.disabledButton]} 
        onPress={submitBid}
        disabled={!isAuctionActive} // Disable if auction is not active
      >
        <MaterialCommunityIcons name="gavel" size={18} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Submit Bid</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.tabContent}>
      {renderTimer()}
      {renderBiddingList()}
      {renderBidInput()}
      
      <TouchableOpacity 
        style={[styles.startButton, isAuctionActive && styles.activeButton]}
        onPress={startAuction}
        disabled={isAuctionActive}
      >
        <MaterialCommunityIcons 
          name={'play'} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.startButtonText}>
          {isAuctionActive ? 'Auction Running...' : 'Start Betting Auction'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    paddingHorizontal: 16,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginVertical: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidAmount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  firstRank: {
    backgroundColor: '#FFD700',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  firstRankText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 16,
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
  submitButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BettingAuction;
