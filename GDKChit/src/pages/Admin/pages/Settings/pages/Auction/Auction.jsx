import React, { useState, useReducer, useEffect } from 'react';
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

// --- Mock Data ---
const MOCK_CHIT_FUND = {
  id: 'chitFund123',
  name: 'Monthly Savings Group A',
  potAmount: 100000, // Example pot amount for the current round
  members: [
    { id: 'memberA', name: 'Alice' },
    { id: 'memberB', name: 'Bob' },
    { id: 'memberC', name: 'Charlie' },
    { id: 'memberD', name: 'Diana' },
    { id: 'memberE', name: 'Eve' },
  ],
  membersTakenPotThisCycle: [], // IDs of members who have already taken the pot
  defaultMinDiscountPercentage: 5, // For turn-based auction
};

// --- Reducer for managing auction state ---
const auctionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_CHIT_FUND':
      return { ...state, currentChitFund: action.payload };
    case 'ADD_BID':
      return { ...state, currentBids: [...state.currentBids, action.payload] };
    case 'CLEAR_BIDS':
      return { ...state, currentBids: [] };
    case 'SET_INTERESTED_MEMBERS':
      return { ...state, interestedMembers: action.payload };
    case 'SET_AUCTION_RESULT':
      return { ...state, auctionResult: action.payload };
    case 'UPDATE_MEMBER_BALANCE':
      const { memberId, amount, reason } = action.payload;
      return {
        ...state,
        memberBalances: {
          ...state.memberBalances,
          [memberId]: (state.memberBalances[memberId] || 0) + amount,
        },
      };
    case 'MARK_MEMBER_TAKEN_POT':
      return {
        ...state,
        currentChitFund: {
          ...state.currentChitFund,
          membersTakenPotThisCycle: [
            ...state.currentChitFund.membersTakenPotThisCycle,
            action.payload,
          ],
        },
      };
    case 'RESET_AUCTION_STATE':
      return {
        ...initialAuctionState,
        currentChitFund: { // Preserve chit fund data but reset cycle-specific parts
          ...MOCK_CHIT_FUND,
          membersTakenPotThisCycle: []
        }
      };
    default:
      return state;
  }
};

const initialAuctionState = {
  currentChitFund: MOCK_CHIT_FUND,
  currentBids: [], // Stores bids for the betting system
  interestedMembers: [], // Stores IDs of members interested in turn-based
  auctionResult: null, // Stores the result of the last auction
  memberBalances: {}, // To demonstrate balance updates
};

const AuctionScreen = ({ onBack }) => {
  const [state, dispatch] = useReducer(auctionReducer, initialAuctionState);
  const { currentChitFund, currentBids, interestedMembers, auctionResult, memberBalances } = state;

  const [myBidAmount, setMyBidAmount] = useState(''); // For user's own bid
  const [selectedMyMemberId, setSelectedMyMemberId] = useState('memberA'); // Simulate current user

  useEffect(() => {
    // Initialize member balances for display
    const initialBalances = {};
    currentChitFund.members.forEach(member => {
      initialBalances[member.id] = 0; // Starting with 0 for demonstration
    });
    dispatch({ type: 'UPDATE_MEMBER_BALANCE', payload: { memberId: 'memberA', amount: 50000, reason: 'Initial Deposit' } });
    dispatch({ type: 'UPDATE_MEMBER_BALANCE', payload: { memberId: 'memberB', amount: 50000, reason: 'Initial Deposit' } });
    dispatch({ type: 'UPDATE_MEMBER_BALANCE', payload: { memberId: 'memberC', amount: 50000, reason: 'Initial Deposit' } });
    dispatch({ type: 'UPDATE_MEMBER_BALANCE', payload: { memberId: 'memberD', amount: 50000, reason: 'Initial Deposit' } });
    dispatch({ type: 'UPDATE_MEMBER_BALANCE', payload: { memberId: 'memberE', amount: 50000, reason: 'Initial Deposit' } });
  }, []);

  // --- Helper Functions ---
  const isEligibleForPot = (memberId) => {
    return !currentChitFund.membersTakenPotThisCycle.includes(memberId);
  };

  const getAllActiveMembers = () => {
    return currentChitFund.members;
  };

  const getMemberName = (memberId) => {
    return currentChitFund.members.find(m => m.id === memberId)?.name || memberId;
  };

  const getEligibleMembers = () => {
    return currentChitFund.members.filter(member => isEligibleForPot(member.id));
  };

  // --- Auction Logic Functions ---

  // Type 1: Turn-Based / Member Selection Auction
  const conductTurnBasedAuction = () => {
    const eligibleMembers = getEligibleMembers();
    const interestedAndEligible = interestedMembers.filter(id =>
      eligibleMembers.some(em => em.id === id)
    );

    if (interestedAndEligible.length === 0) {
      Alert.alert('No Interest', 'No eligible members expressed interest this round.');
      dispatch({ type: 'SET_AUCTION_RESULT', payload: null });
      return;
    }

    let winnerId;
    if (interestedAndEligible.length === 1) {
      winnerId = interestedAndEligible[0];
    } else {
      const randomIndex = Math.floor(Math.random() * interestedAndEligible.length);
      winnerId = interestedAndEligible[randomIndex];
    }

    const defaultMinDiscountAmount =
      currentChitFund.potAmount * (currentChitFund.defaultMinDiscountPercentage / 100);

    const winnerGets = currentChitFund.potAmount - defaultMinDiscountAmount;

    const allChitFundMembers = getAllActiveMembers();
    const numberOfMembersForDistribution = allChitFundMembers.length - 1;

    let discountPerMember = 0;
    if (numberOfMembersForDistribution > 0) {
      discountPerMember = defaultMinDiscountAmount / numberOfMembersForDistribution;
    }

    // Update state
    dispatch({
      type: 'SET_AUCTION_RESULT',
      payload: {
        type: 'Turn-Based',
        winnerId: winnerId,
        winnerAmount: winnerGets,
        discountAmount: defaultMinDiscountAmount,
        discountPerMember: discountPerMember,
      },
    });

    dispatch({ type: 'MARK_MEMBER_TAKEN_POT', payload: winnerId });
    dispatch({
      type: 'UPDATE_MEMBER_BALANCE',
      payload: { memberId: winnerId, amount: winnerGets, reason: 'Chit Fund Pot Received' },
    });

    allChitFundMembers.forEach(member => {
      if (member.id !== winnerId) {
        dispatch({
          type: 'UPDATE_MEMBER_BALANCE',
          payload: {
            memberId: member.id,
            amount: discountPerMember,
            reason: 'Chit Fund Discount Distribution',
          },
        });
      }
    });

    // Clear interest for next round
    dispatch({ type: 'SET_INTERESTED_MEMBERS', payload: [] });
    Alert.alert('Auction Complete', `Winner: ${getMemberName(winnerId)} gets ${winnerGets}.`);
  };

  // Type 2: Betting System Auction
  const conductBettingAuction = () => {
    if (currentBids.length === 0) {
      Alert.alert('No Bids', 'No bids received for this auction.');
      dispatch({ type: 'SET_AUCTION_RESULT', payload: null });
      return;
    }

    let winningBid = null;

    currentBids.forEach(bid => {
      if (!isEligibleForPot(bid.memberId)) {
        console.warn(`Member ${bid.memberId} is not eligible, skipping bid.`);
        return;
      }

      if (winningBid === null || bid.discountAmount > winningBid.discountAmount) {
        winningBid = bid;
      } else if (bid.discountAmount === winningBid.discountAmount) {
        if (bid.timestamp < winningBid.timestamp) {
          winningBid = bid;
        }
      }
    });

    if (!winningBid) {
      Alert.alert('No Valid Bids', 'No valid winning bid found (check eligibility).');
      dispatch({ type: 'SET_AUCTION_RESULT', payload: null });
      return;
    }

    const winnerId = winningBid.memberId;
    const winningDiscountAmount = winningBid.discountAmount;
    const winnerGets = currentChitFund.potAmount - winningDiscountAmount;

    const allChitFundMembers = getAllActiveMembers();
    const numberOfMembersForDistribution = allChitFundMembers.length - 1;

    let discountPerMember = 0;
    if (numberOfMembersForDistribution > 0) {
      discountPerMember = winningDiscountAmount / numberOfMembersForDistribution;
    }

    // Update state
    dispatch({
      type: 'SET_AUCTION_RESULT',
      payload: {
        type: 'Betting System',
        winnerId: winnerId,
        winnerAmount: winnerGets,
        discountAmount: winningDiscountAmount,
        discountPerMember: discountPerMember,
      },
    });

    dispatch({ type: 'MARK_MEMBER_TAKEN_POT', payload: winnerId });
    dispatch({
      type: 'UPDATE_MEMBER_BALANCE',
      payload: { memberId: winnerId, amount: winnerGets, reason: 'Chit Fund Pot Received' },
    });

    allChitFundMembers.forEach(member => {
      if (member.id !== winnerId) {
        dispatch({
          type: 'UPDATE_MEMBER_BALANCE',
          payload: {
            memberId: member.id,
            amount: discountPerMember,
            reason: 'Chit Fund Discount Distribution',
          },
        });
      }
    });

    // Clear bids for next round
    dispatch({ type: 'CLEAR_BIDS' });
    Alert.alert('Auction Complete', `Winner: ${getMemberName(winnerId)} gets ${winnerGets}.`);
  };

  // --- UI Handlers ---
  const handleToggleInterest = (memberId) => {
    if (interestedMembers.includes(memberId)) {
      dispatch({
        type: 'SET_INTERESTED_MEMBERS',
        payload: interestedMembers.filter(id => id !== memberId),
      });
    } else {
      dispatch({
        type: 'SET_INTERESTED_MEMBERS',
        payload: [...interestedMembers, memberId],
      });
    }
  };

  const handlePlaceBid = () => {
    const bidValue = parseFloat(myBidAmount);
    if (isNaN(bidValue) || bidValue <= 0 || bidValue >= currentChitFund.potAmount) {
      Alert.alert('Invalid Bid', 'Please enter a valid discount amount greater than 0 and less than the pot amount.');
      return;
    }
    if (!isEligibleForPot(selectedMyMemberId)) {
      Alert.alert('Not Eligible', 'You have already taken the pot in this cycle.');
      return;
    }

    // Check if this member has already bid
    const existingBidIndex = currentBids.findIndex(
      (bid) => bid.memberId === selectedMyMemberId
    );

    const newBid = {
      memberId: selectedMyMemberId,
      discountAmount: bidValue,
      timestamp: Date.now(),
    };

    if (existingBidIndex !== -1) {
      // Replace existing bid if found
      const updatedBids = [...currentBids];
      updatedBids[existingBidIndex] = newBid;
      dispatch({ type: 'CLEAR_BIDS' }); // Clear first to ensure immutable update
      updatedBids.forEach(bid => dispatch({ type: 'ADD_BID', payload: bid }));
      Alert.alert('Bid Updated', `Your bid of ${bidValue} has been updated.`);
    } else {
      dispatch({ type: 'ADD_BID', payload: newBid });
      Alert.alert('Bid Placed', `You placed a bid of ${bidValue}.`);
    }

    setMyBidAmount('');
  };


  const resetChitCycle = () => {
    Alert.alert(
      "Reset Cycle",
      "Are you sure you want to reset the chit fund cycle? This will clear taken pot status and auction results.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: () => dispatch({ type: 'RESET_AUCTION_STATE' })
        }
      ]
    );
  };


  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auction Settings</Text>
      </View>
      <View style={styles.separator} />
      
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Chit Fund Auction</Text>
        <Text style={styles.subHeader}>{currentChitFund.name}</Text>
      <Text style={styles.potInfo}>Current Pot: ₹{currentChitFund.potAmount.toLocaleString()}</Text>

      <TouchableOpacity style={styles.resetButton} onPress={resetChitCycle}>
        <Text style={styles.resetButtonText}>Reset Chit Cycle</Text>
      </TouchableOpacity>


      {/* --- Member Balances --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Member Balances (Demonstration)</Text>
        {currentChitFund.members.map(member => (
          <Text key={member.id} style={styles.memberBalanceText}>
            {member.name}: ₹{memberBalances[member.id]?.toLocaleString() || '0'}
          </Text>
        ))}
      </View>

      {/* --- Auction Type 1: Member Selection (Turn-Based) --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Auction Type 1: Member Selection</Text>
        <Text style={styles.sectionDescription}>
          Eligible members express interest, one is randomly selected (or takes turn).
        </Text>

        <Text style={styles.label}>My Member ID (Simulated):</Text>
        <TextInput
          style={styles.input}
          value={selectedMyMemberId}
          onChangeText={setSelectedMyMemberId}
          placeholder="e.g., memberA"
        />

        <Text style={styles.subLabel}>Eligible Members:</Text>
        {getEligibleMembers().map(member => (
          <View key={member.id} style={styles.memberRow}>
            <Text style={styles.memberName}>{member.name}</Text>
            <TouchableOpacity
              style={[
                styles.interestButton,
                interestedMembers.includes(member.id) && styles.interestButtonActive,
                !isEligibleForPot(member.id) && styles.disabledButton, // Visually disable if not eligible
              ]}
              onPress={() => handleToggleInterest(member.id)}
              disabled={!isEligibleForPot(member.id)}
            >
              <Text style={styles.interestButtonText}>
                {interestedMembers.includes(member.id) ? 'Interested' : 'Show Interest'}
              </Text>
            </TouchableOpacity>
            {currentChitFund.membersTakenPotThisCycle.includes(member.id) && (
              <Text style={styles.takenPotText}> (Taken Pot)</Text>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={conductTurnBasedAuction}>
          <Text style={styles.buttonText}>Conduct Turn-Based Auction</Text>
        </TouchableOpacity>
      </View>

      {/* --- Auction Type 2: Betting System --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Auction Type 2: Betting System</Text>
        <Text style={styles.sectionDescription}>
          Members bid a discount amount. Highest discount wins.
        </Text>

        <Text style={styles.label}>Your Bid (Discount Amount):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={myBidAmount}
          onChangeText={setMyBidAmount}
          placeholder="e.g., 5000 (for ₹5000 discount)"
          editable={isEligibleForPot(selectedMyMemberId)}
        />
        {!isEligibleForPot(selectedMyMemberId) && (
          <Text style={styles.errorText}>You have already taken the pot.</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            !isEligibleForPot(selectedMyMemberId) && styles.disabledButton,
          ]}
          onPress={handlePlaceBid}
          disabled={!isEligibleForPot(selectedMyMemberId)}
        >
          <Text style={styles.buttonText}>Place My Bid</Text>
        </TouchableOpacity>

        <Text style={styles.subLabel}>Current Bids:</Text>
        {currentBids.length === 0 ? (
          <Text>No bids yet.</Text>
        ) : (
          currentBids
            .sort((a, b) => b.discountAmount - a.discountAmount) // Sort by highest discount
            .map((bid, index) => (
              <Text key={index} style={styles.bidText}>
                {getMemberName(bid.memberId)}: ₹{bid.discountAmount.toLocaleString()} discount
                {bid.memberId === selectedMyMemberId && ' (You)'}
              </Text>
            ))
        )}

        <TouchableOpacity style={styles.button} onPress={conductBettingAuction}>
          <Text style={styles.buttonText}>Conduct Betting Auction</Text>
        </TouchableOpacity>
      </View>

      {/* --- Auction Result Display --- */}
      {auctionResult && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Last Auction Result ({auctionResult.type})</Text>
          <Text>
            Winner:{' '}
            <Text style={styles.resultHighlight}>{getMemberName(auctionResult.winnerId)}</Text>
          </Text>
          <Text>
            Pot Received:{' '}
            <Text style={styles.resultHighlight}>₹{auctionResult.winnerAmount.toLocaleString()}</Text>
          </Text>
          <Text>
            Discount Offered:{' '}
            <Text style={styles.resultHighlight}>₹{auctionResult.discountAmount.toLocaleString()}</Text>
          </Text>
          <Text>
            Discount per Other Member:{' '}
            <Text style={styles.resultHighlight}>₹{auctionResult.discountPerMember.toLocaleString()}</Text>
          </Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
    textAlign: 'center',
  },
  potInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  interestButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  interestButtonActive: {
    backgroundColor: '#28a745',
  },
  interestButtonText: {
    color: '#333',
    fontSize: 14,
  },
  bidText: {
    fontSize: 15,
    paddingVertical: 4,
    color: '#555',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
  resultHighlight: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  memberBalanceText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  takenPotText: {
    fontSize: 13,
    color: '#d63384',
    marginLeft: 5,
  },
  resetButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuctionScreen;