import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import BettingAuction from './BettingAuction';
import RandomAuction from './RandomAuction';

const { width, height } = Dimensions.get('window');

const AuctionScreen = ({ onBack }) => {
  // Main state
  const [activeTab, setActiveTab] = useState('betting');
  const [currentStep, setCurrentStep] = useState('setup');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);

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

  // Utility functions
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
        return [...prev, { ...member, currentBid: 0 }]; // Initialize currentBid
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
      // Initialize bid for betting, 0 for random (will be assigned a number later)
      bid: activeTab === 'betting' ? 90000 : 0 // Starting bid for betting auction
    }));
    
    setParticipants(auctionParticipants);
    setCurrentStep('auction');
  };

  const handleAuctionComplete = (result) => {
    setAuctionResult(result);
    setShowResultModal(true);
  };

  const resetAuction = () => {
    setCurrentStep('setup');
    setSelectedGroup(null);
    setSelectedMembers([]);
    setParticipants([]);
    setAuctionResult(null);
    setShowResultModal(false);
  };

  // Component render functions
  const renderHeader = () => (
    <Header 
      title={currentStep === 'setup' ? 'Auction Setup' : `${selectedGroup?.name || 'Auction'}`}
      onBack={currentStep === 'setup' ? onBack : resetAuction}
      showBackButton={true}
      rightComponent={
        currentStep === 'auction' ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetAuction}>
            <MaterialCommunityIcons name="refresh" size={20} color="#6B46C1" />
          </TouchableOpacity>
        ) : null
      }
    />
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

  const renderAuctionScreen = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderAuctionInfo()}
      {activeTab === 'betting' ? (
        <BettingAuction
          participants={participants}
          setParticipants={setParticipants}
          selectedGroup={selectedGroup}
          selectedMembers={selectedMembers}
          onAuctionComplete={handleAuctionComplete}
        />
      ) : (
        <RandomAuction
          participants={participants}
          onAuctionComplete={handleAuctionComplete}
        />
      )}
    </ScrollView>
  );

  const ResultModalContent = () => {
    const [adminSelectedWinner, setAdminSelectedWinner] = useState(null);
    
    useEffect(() => {
      // Pre-select the lowest bidder if betting and result is available
      if (auctionResult?.type === 'betting' && participants.length > 0) {
        const sortedParticipants = [...participants].sort((a, b) => a.bid - b.bid);
        setAdminSelectedWinner(sortedParticipants[0]);
      } else {
        setAdminSelectedWinner(null);
      }
    }, [auctionResult, participants]);

    return (
      <View style={styles.resultModal}>
        <View style={styles.resultHeader}>
          <MaterialCommunityIcons 
            name={auctionResult?.type === 'betting' ? "trophy" : "dice-6"} 
            size={50} 
            color="#FFD700" 
          />
          <Text style={styles.resultTitle}>
            {auctionResult?.type === 'betting' ? 'Auction Result' : 'Lucky Winner!'}
          </Text>
        </View>
        
        {auctionResult?.type === 'betting' ? (
          <View style={styles.winnerListSection}>
            <Text style={styles.winnerListTitle}>Lowest Bidders</Text>
            <ScrollView style={styles.winnerList}>
              {participants
                .sort((a, b) => a.bid - b.bid) // Sort by lowest bid
                .map((participant) => (
                  <TouchableOpacity
                    key={participant.id}
                    style={[
                      styles.winnerOption,
                      adminSelectedWinner?.id === participant.id && styles.selectedWinner
                    ]}
                    onPress={() => setAdminSelectedWinner(participant)}
                  >
                    <View style={styles.winnerAvatar}>
                      <Text style={styles.winnerAvatarText}>{participant.avatar}</Text>
                    </View>
                    <View style={styles.winnerDetails}>
                      <Text style={styles.winnerName}>{participant.name}</Text>
                      <Text style={styles.winnerBid}>{formatCurrency(participant.bid)}</Text>
                    </View>
                    {adminSelectedWinner?.id === participant.id && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.winnerSection}>
            <View style={styles.winnerAvatar}>
              <Text style={styles.winnerAvatarText}>{auctionResult?.winner?.avatar}</Text>
            </View>
            <Text style={styles.winnerName}>{auctionResult?.winner?.name}</Text>
            <Text style={styles.diceResult}>Dice Value: {auctionResult?.diceValue}</Text>
          </View>
        )}

        <View style={styles.modalActions}>
          {auctionResult?.type === 'betting' ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, !adminSelectedWinner && styles.disabledButton]}
                onPress={() => {
                  if (adminSelectedWinner) {
                    // This action confirms the winner and ends the auction flow.
                    Alert.alert(
                      'Winner Confirmed',
                      `${adminSelectedWinner.name} has been declared as the winner with a bid of ${formatCurrency(adminSelectedWinner.bid)}`
                    );
                    setShowResultModal(false);
                    resetAuction(); // Reset for a new auction
                  }
                }}
                disabled={!adminSelectedWinner}
              >
                <Text style={styles.actionButtonText}>Confirm Winner</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setShowResultModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setShowResultModal(false);
                resetAuction();
              }}
            >
              <Text style={styles.actionButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowResultModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ResultModalContent />
      </View>
    </Modal>
  );

  // Main render
  return (
    <View style={styles.container}>
      {renderHeader()}
      
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

  // Result Modal
  resultModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
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
  winnerListSection: {
    width: '100%',
    marginBottom: 20,
  },
  winnerListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  winnerList: {
    maxHeight: height * 0.4,
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedWinner: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  winnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  winnerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  winnerBid: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Reusing disabledButton style for consistency
  // disabledButton: {
  //   opacity: 0.6,
  // },
  diceResult: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
});

export default AuctionScreen;