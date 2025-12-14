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

const BettingAuction = ({ participants = [], onAuctionComplete }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [myBid, setMyBid] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Sample other bids (in a real app these come from backend/live updates)
  const mockParticipantBids = [
    { id: '2', name: 'Rahul Kumar', bid: 82000 },
    { id: '3', name: 'Priya Singh', bid: 79000 },
    { id: '4', name: 'Amit Patel', bid: 85000 },
  ];

  const allParticipants = [...mockParticipantBids];
  if (myBid)
    allParticipants.push({ id: 'me', name: 'You', bid: myBid, isMe: true });

  useEffect(() => {
    let timer;
    if (auctionStatus === 'active' && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining(t => t - 1), 1000);
    } else if (timeRemaining === 0 && auctionStatus === 'active') {
      endAuction();
    }
    return () => clearTimeout(timer);
  }, [auctionStatus, timeRemaining]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentLowestBid = () => {
    const bids = allParticipants.map(p => p.bid);
    return bids.length ? Math.min(...bids) : 90000;
  };

  const submitBid = () => {
    if (auctionStatus !== 'active')
      return Alert.alert(
        'Auction Ended',
        'This auction has already concluded.',
      );
    if (!bidAmount || parseFloat(bidAmount) <= 0)
      return Alert.alert('Invalid Bid', 'Please enter a valid bid amount');

    const newBid = parseFloat(bidAmount);
    if (newBid % 1000 !== 0)
      return Alert.alert(
        'Invalid Amount',
        'Bid amount must be in multiples of ₹1,000',
      );

    const currentLowest = getCurrentLowestBid();
    if (newBid >= currentLowest)
      return Alert.alert(
        'Bid Too High',
        `Your bid must be lower than ${formatCurrency(currentLowest)}`,
      );
    if (newBid < 10000)
      return Alert.alert('Bid Too Low', 'Minimum bid is ₹10,000');

    setMyBid(newBid);
    setBidAmount('');
    Alert.alert(
      'Bid Submitted!',
      `Your bid of ${formatCurrency(newBid)} has been submitted.`,
    );
  };

  const quickBid = reduction => {
    const currentLowest = getCurrentLowestBid();
    const suggested = currentLowest - reduction;
    if (suggested >= 10000 && suggested % 1000 === 0)
      setBidAmount(String(suggested));
    else
      Alert.alert('Invalid', 'Cannot create a valid bid with this reduction.');
  };

  const endAuction = () => {
    setAuctionStatus('ended');
    const sorted = [...allParticipants].sort((a, b) => a.bid - b.bid);
    const win = sorted[0] || null;
    setWinner(win);
    setShowWinnerModal(true);
    if (onAuctionComplete) onAuctionComplete({ type: 'betting', winner: win });
  };

  const renderWinnerModal = () => (
    <Modal
      visible={showWinnerModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWinnerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialCommunityIcons
            name="trophy-award"
            size={60}
            color="#FFD700"
          />
          <Text style={styles.modalTitle}>🎉 Auction Winner! 🎉</Text>
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timerCard}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={auctionStatus === 'active' ? '#EF4444' : '#6B7280'}
          />
          <Text style={styles.timerLabel}>
            {auctionStatus === 'active' ? 'Time Remaining' : 'Auction Ended'}
          </Text>
          <Text
            style={[
              styles.timerValue,
              { color: auctionStatus === 'active' ? '#EF4444' : '#6B7280' },
            ]}
          >
            {auctionStatus === 'active' ? formatTime(timeRemaining) : '00:00'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Lowest Bid</Text>
          <Text style={styles.statusAmount}>
            {formatCurrency(getCurrentLowestBid())}
          </Text>
          <Text style={styles.statusSubtext}>
            {myBid
              ? `Your current bid: ${formatCurrency(myBid)}`
              : "You haven't placed a bid yet"}
          </Text>
        </View>

        <View style={styles.participantsCard}>
          <Text style={styles.cardTitle}>Live Leaderboard</Text>
          <View style={styles.participantsList}>
            {allParticipants
              .sort((a, b) => a.bid - b.bid)
              .map((p, i) => (
                <View
                  key={p.id}
                  style={[styles.participantRow, p.isMe && styles.myBidRow]}
                >
                  <View
                    style={[
                      styles.participantRank,
                      i === 0 && styles.winningRank,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        i === 0 && styles.winningRankText,
                      ]}
                    >
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text
                      style={[styles.participantName, p.isMe && styles.myName]}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[
                        styles.participantBid,
                        p.isMe && styles.myBidText,
                      ]}
                    >
                      {formatCurrency(p.bid)}
                    </Text>
                  </View>
                  {i === 0 && (
                    <MaterialCommunityIcons
                      name="crown"
                      size={18}
                      color="#FFD700"
                    />
                  )}
                  {p.isMe && (
                    <MaterialCommunityIcons
                      name="account"
                      size={16}
                      color="#3B82F6"
                    />
                  )}
                </View>
              ))}
          </View>
        </View>

        {auctionStatus === 'active' && (
          <View style={styles.bidCard}>
            <Text style={styles.cardTitle}>Place Your Bid</Text>
            <Text style={styles.bidHint}>
              Bid lower than {formatCurrency(getCurrentLowestBid())} to take the
              lead!
            </Text>
            <View style={styles.quickBidsContainer}>
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => quickBid(5000)}
              >
                <Text style={styles.quickBidText}>-₹5K</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => quickBid(10000)}
              >
                <Text style={styles.quickBidText}>-₹10K</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBidButton}
                onPress={() => quickBid(15000)}
              >
                <Text style={styles.quickBidText}>-₹15K</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bidInputContainer}>
              <TextInput
                style={styles.bidInput}
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                editable={auctionStatus === 'active'}
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  auctionStatus !== 'active' && styles.disabledButton,
                ]}
                onPress={submitBid}
                disabled={auctionStatus !== 'active'}
              >
                <MaterialCommunityIcons
                  name="gavel"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>Submit Bid</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bidNote}>
              * Bid must be in multiples of ₹1,000 and lower than current lowest
              bid
            </Text>
          </View>
        )}

        {auctionStatus === 'ended' && (
          <View style={styles.endedCard}>
            <MaterialCommunityIcons
              name="flag-checkered"
              size={32}
              color="#10B981"
            />
            <Text style={styles.endedTitle}>Auction Completed!</Text>
            <Text style={styles.endedText}>
              {winner
                ? `Winner: ${winner.name} with ${formatCurrency(winner.bid)}`
                : 'Results are being processed...'}
            </Text>
          </View>
        )}
      </ScrollView>
      {renderWinnerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 8 },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 4,
    fontWeight: '500',
  },
  timerValue: { fontSize: 28, fontWeight: '800' },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusAmount: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '800',
    marginBottom: 4,
  },
  statusSubtext: { fontSize: 14, color: '#6B7280' },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  participantsList: { gap: 8 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 12,
  },
  myBidRow: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  participantRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winningRank: { backgroundColor: '#FFD700' },
  rankText: { fontSize: 12, fontWeight: '700', color: '#1F2937' },
  winningRankText: { color: '#FFFFFF' },
  participantInfo: { flex: 1 },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  myName: { color: '#3B82F6' },
  participantBid: { fontSize: 13, color: '#6B7280' },
  myBidText: { color: '#3B82F6', fontWeight: '600' },
  bidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bidHint: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  quickBidsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBidButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickBidText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  bidInputContainer: { gap: 12 },
  bidInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  bidNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  endedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  endedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 8,
    marginBottom: 4,
  },
  endedText: { fontSize: 14, color: '#166534', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  modalWinnerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 8,
  },
  modalWinnerBid: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  modalCloseButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default BettingAuction;
