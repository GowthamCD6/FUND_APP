import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import styles from '../Auction/AuctionSty.jsx';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import GroupCard from '../../../../../../components/GroupCard/GroupCard';
import BettingAuction from './Betting-Auction/BettingAuction';
import RandomAuction from './Random-Auction/RandomAuction';
import MemberSelectingModal from './MemberSelecting/MemberSelectingModal';

const { width, height } = Dimensions.get('window');

const AuctionScreen = ({ onBack, navigation: propNavigation }) => {
  const stackNavigation = useNavigation();
  const navigation = propNavigation || stackNavigation;
  
  // Determine onBack handler
  const handleBack = onBack ? onBack : () => navigation.goBack();
  // Main state
  const [activeTab, setActiveTab] = useState('betting');
  const [currentStep, setCurrentStep] = useState('setup');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
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
      completedCycles: 8,
      totalCycles: 12,
      nextDueDate: '2025-12-20',
      completedDate: null,
      collectedAmount: 80000,
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
      completedCycles: 6,
      totalCycles: 12,
      nextDueDate: '2025-12-18',
      completedDate: null,
      collectedAmount: 30000,
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
      completedCycles: 10,
      totalCycles: 12,
      nextDueDate: '2025-12-25',
      completedDate: null,
      collectedAmount: 30000,
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
    setShowMemberModal(true);
  };

  const handleGroupCardPress = (group) => {
    selectGroup(group);
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
    setShowMemberModal(false);
  };

  // Component render functions
  const renderHeader = () => (
    <Header 
      title={currentStep === 'setup' ? 'Auction Setup' : `${selectedGroup?.name || 'Auction'}`}
      onBack={currentStep === 'setup' ? handleBack : resetAuction}
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
      <Text style={styles.sectionTitle}>Select Group for {activeTab === 'betting' ? 'Betting' : 'Random'} Auction</Text>
      <FlatList
        data={availableGroups.filter(g => g.status === 'active')}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GroupCard 
            group={item}
            onPress={handleGroupCardPress}
            onArrowPress={handleGroupCardPress}
          />
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.groupListContainer}
      />
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

  const renderSetupScreen = () => (
    <View style={styles.setupScreenContainer}>
      {renderTabSelector()}
      <ScrollView style={styles.setupScrollContainer} showsVerticalScrollIndicator={false}>
        {renderGroupSelector()}
      </ScrollView>
    </View>
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
      
      <MemberSelectingModal
        visible={showMemberModal}
        selectedGroup={selectedGroup}
        selectedMembers={selectedMembers}
        onClose={() => setShowMemberModal(false)}
        onMemberToggle={toggleMemberSelection}
        onProceed={() => {
          if (selectedMembers.length >= 2) {
            startAuctionSetup();
            setShowMemberModal(false);
          }
        }}
      />
      {renderResultModal()}
    </View>
  );
};

export default AuctionScreen;