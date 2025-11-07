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
  Animated,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const AuctionScreen = ({ onBack }) => {
  // Main state
  const [activeTab, setActiveTab] = useState('betting');
  const [currentStep, setCurrentStep] = useState('setup');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // Auction state
  const [bettingAmount, setBettingAmount] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [diceValue, setDiceValue] = useState(1);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  
  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);
  
  // Animation
  const rotateAnim = new Animated.Value(0);

  // Mock data - Based on app structure
  const availableGroups = [
    {
      id: 1,
      name: 'Business Investment Group',
      totalMembers: 20,
      monthlyAmount: 10000,
      groupAmount: 200000,
      status: 'active',
      members: [
        { id: '1001', name: 'முருகன் குமார்', phone: '9876543210', avatar: 'MK' },
        { id: '1002', name: 'லட்சுமி செல்வி', phone: '9876543211', avatar: 'LS' },
        { id: '1003', name: 'ராஜேஷ் பாபு', phone: '9876543212', avatar: 'RB' },
        { id: '1004', name: 'பிரியா நாயர்', phone: '9876543213', avatar: 'PN' },
        { id: '1005', name: 'கார்த்திக் ராஜ்', phone: '9876543214', avatar: 'KR' },
        { id: '1006', name: 'சுதா தேவி', phone: '9876543215', avatar: 'SD' },
      ]
    },
    {
      id: 2,
      name: 'Family Savings Circle',
      totalMembers: 12,
      monthlyAmount: 5000,
      groupAmount: 60000,
      status: 'active',
      members: [
        { id: '2001', name: 'ஹரி பாஸ்கர்', phone: '9876543220', avatar: 'HB' },
        { id: '2002', name: 'மீரா தேவி', phone: '9876543221', avatar: 'MD' },
        { id: '2003', name: 'சந்தீப் ராவ்', phone: '9876543222', avatar: 'SR' },
        { id: '2004', name: 'நித்யா ஸ்ரீ', phone: '9876543223', avatar: 'NS' },
      ]
    },
    {
      id: 3,
      name: 'Student Education Fund',
      totalMembers: 15,
      monthlyAmount: 3000,
      groupAmount: 45000,
      status: 'active',
      members: [
        { id: '3001', name: 'விக்ரம் சிங்', phone: '9876543230', avatar: 'VS' },
        { id: '3002', name: 'பூர்ணிமா', phone: '9876543231', avatar: 'PU' },
        { id: '3003', name: 'ராம் குமார்', phone: '9876543232', avatar: 'RK' },
        { id: '3004', name: 'கீர்த்தனா', phone: '9876543233', avatar: 'KI' },
      ]
    }
  ];

  // Timer effect
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

  // Action handlers
  const selectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedMembers([]);
    setParticipants([]);
    setShowGroupModal(false);
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, { ...member, currentBid: 0 }];
      }
    });
  };

  const startAuctionSetup = () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group first');
      return;
    }
    if (selectedMembers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 members for the auction');
      return;
    }

    const auctionParticipants = selectedMembers.map(member => ({
      ...member,
      bid: activeTab === 'betting' ? Math.floor(Math.random() * 5000) + 35000 : 0
    }));
    
    setParticipants(auctionParticipants);
    setCurrentStep('auction');
  };

  const startAuction = () => {
    if (activeTab === 'betting') {
      setIsAuctionActive(true);
      setTimeRemaining(300);
    } else {
      rollDice();
    }
  };

  const endAuction = () => {
    setIsAuctionActive(false);
    if (activeTab === 'betting') {
      const winner = participants.reduce((prev, current) => 
        (prev.bid > current.bid) ? prev : current
      );
      setAuctionResult({
        type: 'betting',
        winner: winner,
        amount: winner.bid
      });
    }
    setShowResultModal(true);
  };

  const rollDice = () => {
    setIsDiceRolling(true);
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      { iterations: 10 }
    ).start();

    setTimeout(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(randomValue);
      setIsDiceRolling(false);
      
      const winnerIndex = (randomValue - 1) % participants.length;
      const winner = participants[winnerIndex];
      
      setAuctionResult({
        type: 'random',
        winner: winner,
        diceValue: randomValue
      });
      setShowResultModal(true);
      rotateAnim.setValue(0);
    }, 1000);
  };

  const submitBid = () => {
    if (!bettingAmount || parseFloat(bettingAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }
    Alert.alert('Success', 'Bid submitted successfully!');
    setBettingAmount('');
  };

  const resetAuction = () => {
    setCurrentStep('setup');
    setSelectedGroup(null);
    setSelectedMembers([]);
    setParticipants([]);
    setIsAuctionActive(false);
    setTimeRemaining(300);
    setAuctionResult(null);
    setBettingAmount('');
    setShowResultModal(false);
  };

  // Component render functions
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={currentStep === 'setup' ? onBack : resetAuction}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {currentStep === 'setup' ? 'Auction Setup' : `${selectedGroup?.name}`}
      </Text>
      {currentStep === 'auction' && (
        <TouchableOpacity style={styles.resetButton} onPress={resetAuction}>
          <MaterialCommunityIcons name="refresh" size={20} color="#6B46C1" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'betting' && styles.activeTab]}
        onPress={() => setActiveTab('betting')}
      >
        <MaterialCommunityIcons 
          name="gavel" 
          size={20} 
          color={activeTab === 'betting' ? '#FFFFFF' : '#6B46C1'} 
        />
        <Text style={[styles.tabText, activeTab === 'betting' && styles.activeTabText]}>
          Betting
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'random' && styles.activeTab]}
        onPress={() => setActiveTab('random')}
      >
        <MaterialCommunityIcons 
          name="dice-multiple" 
          size={20} 
          color={activeTab === 'random' ? '#FFFFFF' : '#6B46C1'} 
        />
        <Text style={[styles.tabText, activeTab === 'random' && styles.activeTabText]}>
          Random
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroupSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Group</Text>
      <TouchableOpacity 
        style={styles.groupSelector}
        onPress={() => setShowGroupModal(true)}
      >
        {selectedGroup ? (
          <View style={styles.selectedGroup}>
            <View style={styles.groupIcon}>
              <MaterialCommunityIcons name="account-group" size={24} color="#6B46C1" />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{selectedGroup.name}</Text>
              <Text style={styles.groupMeta}>
                {selectedGroup.totalMembers} Members • {formatCurrency(selectedGroup.monthlyAmount)}/month
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </View>
        ) : (
          <View style={styles.groupPlaceholder}>
            <MaterialCommunityIcons name="plus" size={24} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Select a Group</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMemberItem = ({ item }) => {
    const isSelected = selectedMembers.some(m => m.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.memberCard, isSelected && styles.selectedMember]}
        onPress={() => toggleMemberSelection(item)}
      >
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMemberSelection = () => {
    if (!selectedGroup) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Members</Text>
          <Text style={styles.memberCount}>
            {selectedMembers.length}/{selectedGroup.members.length}
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Choose at least 2 members for the auction
        </Text>
        
        <FlatList
          data={selectedGroup.members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderSetupScreen = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderTabSelector()}
      {renderGroupSelector()}
      {renderMemberSelection()}
      
      {selectedGroup && selectedMembers.length >= 2 && (
        <TouchableOpacity style={styles.startButton} onPress={startAuctionSetup}>
          <MaterialCommunityIcons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.startButtonText}>
            Start {activeTab === 'betting' ? 'Betting' : 'Random'} Auction
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderGroupModal = () => (
    <Modal
      visible={showGroupModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowGroupModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Group</Text>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableGroups.filter(g => g.status === 'active')}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupOption}
                onPress={() => selectGroup(item)}
              >
                <View style={styles.groupOptionIcon}>
                  <MaterialCommunityIcons name="account-group" size={28} color="#6B46C1" />
                </View>
                <View style={styles.groupOptionInfo}>
                  <Text style={styles.groupOptionName}>{item.name}</Text>
                  <Text style={styles.groupOptionMeta}>
                    {item.totalMembers} Members • {formatCurrency(item.monthlyAmount)}/month
                  </Text>
                  <Text style={styles.groupOptionAmount}>
                    Total Fund: {formatCurrency(item.groupAmount)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderAuctionInfo = () => (
    <View style={styles.auctionInfo}>
      <View style={styles.auctionHeader}>
        <MaterialCommunityIcons name="account-group" size={20} color="#6B46C1" />
        <Text style={styles.auctionTitle}>{selectedGroup?.name}</Text>
      </View>
      <Text style={styles.auctionMeta}>
        {participants.length} Participants • {formatCurrency(selectedGroup?.monthlyAmount)} Pool
      </Text>
    </View>
  );

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
        .sort((a, b) => b.bid - a.bid)
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
          editable={!isAuctionActive}
        />
      </View>
      <TouchableOpacity 
        style={[styles.submitButton, isAuctionActive && styles.disabledButton]} 
        onPress={submitBid}
        disabled={isAuctionActive}
      >
        <MaterialCommunityIcons name="gavel" size={18} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Submit Bid</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBettingScreen = () => (
    <View style={styles.tabContent}>
      {renderTimer()}
      {renderBiddingList()}
      {renderBidInput()}
    </View>
  );

  const renderDiceContainer = () => (
    <View style={styles.diceCard}>
      <Text style={styles.diceTitle}>Lucky Draw</Text>
      <Text style={styles.diceSubtitle}>Roll the dice to select winner</Text>
      
      <Animated.View 
        style={[
          styles.dice,
          {
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }]
          }
        ]}
      >
        <MaterialCommunityIcons 
          name={`dice-${diceValue}`} 
          size={60} 
          color={isDiceRolling ? "#6B46C1" : "#2D1B69"} 
        />
      </Animated.View>
      
      <TouchableOpacity 
        style={[styles.rollButton, isDiceRolling && styles.disabledButton]}
        onPress={rollDice}
        disabled={isDiceRolling}
      >
        <MaterialCommunityIcons 
          name={isDiceRolling ? "loading" : "dice-multiple"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.rollButtonText}>
          {isDiceRolling ? 'Rolling...' : 'Roll Dice'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderParticipantsGrid = () => (
    <View style={styles.participantsCard}>
      <Text style={styles.cardTitle}>Participants</Text>
      <View style={styles.participantsGrid}>
        {participants.map((participant, index) => (
          <View key={participant.id} style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.avatarText}>{participant.avatar}</Text>
            </View>
            <Text style={styles.participantName}>{participant.name.split(' ')[0]}</Text>
            <View style={styles.participantNumber}>
              <Text style={styles.participantNumberText}>{index + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRandomScreen = () => (
    <View style={styles.tabContent}>
      {renderDiceContainer()}
      {renderParticipantsGrid()}
    </View>
  );

  const renderAuctionScreen = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderAuctionInfo()}
      {activeTab === 'betting' ? renderBettingScreen() : renderRandomScreen()}
      
      <TouchableOpacity 
        style={[styles.startButton, isAuctionActive && styles.activeButton]}
        onPress={startAuction}
        disabled={activeTab === 'betting' && isAuctionActive}
      >
        <MaterialCommunityIcons 
          name={activeTab === 'betting' ? 'play' : 'dice-multiple'} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.startButtonText}>
          {isAuctionActive ? 'Auction Running...' : 
           activeTab === 'betting' ? 'Start Auction' : 'Roll for Winner'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowResultModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.resultModal}>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons 
              name={auctionResult?.type === 'betting' ? "trophy" : "dice-6"} 
              size={50} 
              color="#FFD700" 
            />
            <Text style={styles.resultTitle}>
              {auctionResult?.type === 'betting' ? 'Auction Winner!' : 'Lucky Winner!'}
            </Text>
          </View>
          
          <View style={styles.winnerSection}>
            <View style={styles.winnerAvatar}>
              <Text style={styles.winnerAvatarText}>{auctionResult?.winner?.avatar}</Text>
            </View>
            <Text style={styles.winnerName}>{auctionResult?.winner?.name}</Text>
            {auctionResult?.type === 'betting' ? (
              <Text style={styles.winningAmount}>{formatCurrency(auctionResult?.amount)}</Text>
            ) : (
              <Text style={styles.diceResult}>Dice Value: {auctionResult?.diceValue}</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => {
              setShowResultModal(false);
              resetAuction();
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Main render
  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.separator} />
      
      {currentStep === 'setup' ? renderSetupScreen() : renderAuctionScreen()}
      
      {renderGroupModal()}
      {renderResultModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  resetButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Section Styles
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },

  // Group Selector
  groupSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  groupPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
  },

  // Members List
  membersList: {
    maxHeight: 300,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedMember: {
    borderColor: '#6B46C1',
    backgroundColor: '#F8F8FF',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 8,
  },

  // Start Button
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Group Options
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupOptionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupOptionInfo: {
    flex: 1,
  },
  groupOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupOptionMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  groupOptionAmount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },

  // Auction Info
  auctionInfo: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  auctionMeta: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 16,
  },

  // Timer Card
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

  // Cards
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
  diceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  participantsCard: {
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

  // Bid Items
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

  // Input Styles
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

  // Dice Styles
  diceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  diceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  dice: {
    width: 100,
    height: 100,
    backgroundColor: '#F8F8FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  rollButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  rollButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Participants Grid
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  participantCard: {
    width: (width - 80) / 3,
    backgroundColor: '#F8F8FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  participantNumber: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Result Modal
  resultModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: width * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  winnerAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  winningAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  diceResult: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
  continueButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AuctionScreen;