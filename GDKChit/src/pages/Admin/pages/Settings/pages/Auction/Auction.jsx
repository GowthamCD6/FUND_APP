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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import styles from '../Auction/AuctionSty.jsx';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import GroupCard from '../../../../../../components/GroupCard/GroupCard';
import ApiService from '../../../../../../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../../../../services/AuctionWebSocketService';
import { useAuth } from '../../../../../../utils/AuthContext';
import { useLanguage } from '../../../../../../utils/LanguageContext';
import BettingAuction from './Betting-Auction/BettingAuction';
import RandomAuction from './Random-Auction/RandomAuction';
import MemberSelectingModal from './MemberSelecting/MemberSelectingModal';

const { width, height } = Dimensions.get('window');

const AuctionScreen = ({ onBack, navigation: propNavigation }) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
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

  // Backend state
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectingGroupId, setSelectingGroupId] = useState(null);
  const [savingWinner, setSavingWinner] = useState(false);
  const [auctionCycleMonth, setAuctionCycleMonth] = useState(1);
  const [completedAuctions, setCompletedAuctions] = useState([]);

  const fetchCompletedAuctions = async (groupId) => {
    if (!groupId) return;
    try {
      const response = await ApiService.makeRequest(`/admin/groups/getCompletedAuctions?groupId=${groupId}`, { method: 'GET' });
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        setCompletedAuctions(result.data);
      } else {
        setCompletedAuctions([]);
      }
    } catch (error) {
      console.error('Error fetching completed auctions:', error);
      setCompletedAuctions([]);
    }
  };

  // Fetch groups and connect WebSocket on component mount
  useEffect(() => {
    fetchGroups();

    const initWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'admin');
        }
      } catch (error) {
        console.error('Failed to connect WebSocket on admin Auction:', error);
      }
    };

    if (isAuthenticated) {
      initWebSocket();
    }

    return () => {
      // Offload specific event listeners to prevent duplicate listener buildup while keeping connection alive
      AuctionWebSocketService.off('auction_created_alert');
      AuctionWebSocketService.off('new_bid');
    };
  }, [isAuthenticated]);

  // Fetch groups from backend
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await ApiService.makeRequest('/admin/groups/getGroups', { method: 'GET' });
      console.log('Groups API Response:', response);
      
      // Parse JSON from response
      const data = await response.json();
      console.log('Parsed Groups Data:', data);
      
      const groupsList = data.data || data.groups;
      if (data && data.success && Array.isArray(groupsList)) {
        const transformedGroups = groupsList.map(group => ({
          id: group.id,
          name: group.name || group.group_name || 'Unknown',
          totalMembers: group.totalMembers || group.total_members || group.members_count || 0,
          monthlyAmount: group.monthlyAmount || group.monthly_amount || 0,
          groupAmount: group.groupAmount || group.group_amount || group.total_amount || 0,
          status: group.status?.toLowerCase() === 'ongoing' || group.status?.toLowerCase() === 'ongo' ? 'active' : group.status?.toLowerCase(),
          completedCycles: group.completedCycles || group.completed_cycles || 0,
          totalCycles: group.totalCycles || group.total_cycles || group.total_months || group.duration || 12,
          nextDueDate: group.nextDueDate || group.next_due_date,
          collectedAmount: group.collectedAmount || group.collected_amount || group.coalesce || 0,
          members: group.members || [],
        }));
        console.log('Transformed Groups:', transformedGroups);
        setGroups(transformedGroups);
      } else {
        console.warn('Invalid response format:', data);
        setGroups([]);
        if (!data?.success) {
          Alert.alert('Error', data?.message || 'Failed to fetch groups');
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      Alert.alert('Error', 'Network error: ' + (error.message || 'Failed to fetch groups'));
    } finally {
      setLoadingGroups(false);
    }
  };

  // Fetch group members when group is selected
  const fetchGroupMembers = async (groupId) => {
    try {
      setLoadingMembers(true);
      const cleanGroupId = encodeURIComponent(String(groupId).trim());
      const response = await ApiService.makeRequest(`/admin/groups/getMembers?groupId=${cleanGroupId}`, { method: 'GET' });
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.members)) {
        const transformedMembers = data.members.map(member => ({
          id: member.id?.toString(),
          name: member.name || member.user_name || '',
          phone: member.phone || '',
          avatar: (member.name || member.user_name || 'U').substring(0, 2).toUpperCase(),
          currentBid: 0,
          hasWonAuction: Boolean(member.hasWonAuction),
          amountTaken: member.amountTaken || null,
          auctionDate: member.auctionDate || null,
          collectionPeriod: member.collectionPeriod || null,
        }));
        setSelectedGroup(prev => ({
          ...prev,
          members: transformedMembers,
        }));
      } else {
        Alert.alert('Error', data?.message || 'Failed to fetch group members');
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      Alert.alert('Error', 'Failed to fetch group members');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Send auction winner to GroupInfo via event
  const saveAuctionWinnerToBackend = async (winner) => {
    if (savingWinner) return;
    if (!winner || !winner.name || !selectedGroup?.id) {
      Alert.alert('Error', 'Invalid winner selection data');
      return;
    }

    if (winner.hasWonAuction) {
      Alert.alert(
        'Member Ineligible',
        `${winner.name} has already won or received an auction prize for this group and cannot win again.`
      );
      return;
    }

    try {
      setSavingWinner(true);

      const startDt = new Date(selectedGroup.startDate || selectedGroup.createdDate || new Date());
      const targetDate = !isNaN(startDt.getTime())
        ? new Date(startDt.getFullYear(), startDt.getMonth() + (auctionCycleMonth - 1), 1)
        : new Date();
      
      const payload = {
        groupId: selectedGroup.id,
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        chitWinnerName: String(winner.name).trim(),
        chitWinnerMemberId: String(winner.phone || winner.id || '').trim(),
        amountTaken: (winner.bid !== undefined && winner.bid > 0)
          ? winner.bid
          : (auctionResult?.amount !== undefined ? auctionResult.amount : selectedGroup.groupAmount),
        datePicked: new Date().toISOString().split('T')[0],
        cycleMonth: auctionCycleMonth,
      };
      
      // Emit event so GroupInfo can catch it and populate the modal
      import('react-native').then(({ DeviceEventEmitter }) => {
        DeviceEventEmitter.emit('auctionWinnerSelected', payload);
      });

      Alert.alert('Success', `${winner.name} has been selected for Month ${auctionCycleMonth}!`);
      setShowResultModal(false);
      resetAuction();
      
      // Go back to the ManageGroups screen where GroupInfo is
      navigation.goBack();
      
    } catch (error) {
      console.error('Error sending auction winner:', error);
      Alert.alert('Error', 'Failed to process auction winner');
    } finally {
      setSavingWinner(false);
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Action handlers
  const selectGroup = async (group) => {
    setSelectingGroupId(group.id);
    setSelectedGroup(group);
    setSelectedMembers([]);
    setParticipants([]);
    const initialCycle = (group.completedCycles !== undefined && group.completedCycles !== null)
      ? Number(group.completedCycles) + 1
      : (group.currentMonthNum || 1);
    setAuctionCycleMonth(initialCycle);
    setShowMemberModal(true);
    fetchCompletedAuctions(group.id);
    if (!group.members || group.members.length === 0) {
      await fetchGroupMembers(group.id);
    }
    setSelectingGroupId(null);
  };

  const handleGroupCardPress = (group) => {
    selectGroup(group);
  };

  const toggleMemberSelection = (member) => {
    if (member.hasWonAuction) {
      const amtStr = member.amountTaken ? ` (₹${Number(member.amountTaken).toLocaleString('en-IN')})` : '';
      Alert.alert(
        'Member Ineligible',
        `${member.name} has already received the auction prize${amtStr} and is NOT ELIGIBLE to participate in the auction.`
      );
      return;
    }
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
      bid: activeTab === 'betting' ? (selectedGroup.groupAmount || 90000) : 0 // Starting bid for betting auction
    }));
    
    // Broadcast setup to WebSocket to show bottom-up card on user panels
    const participantIds = selectedMembers.map(m => m.id);
    const sendSetup = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'admin');
          AuctionWebSocketService.setupAuction(
            selectedGroup.id,
            activeTab, // 'betting' or 'random'
            participantIds
          );
        }
      } catch (err) {
        console.error('Error connecting or sending setup_auction over WS:', err);
      }
    };
    sendSetup();

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

  const renderGroupSelector = () => {
    if (loadingGroups) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Loading groups...')}</Text>
          <ActivityIndicator size="large" color="#6B46C1" style={{ marginTop: 20 }} />
        </View>
      );
    }
    
    const activeGroups = groups.filter(g => g.status?.toLowerCase() === 'active' || g.status?.toLowerCase() === 'ongoing');
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'betting' ? t('Select Group for Betting Auction') : t('Select Group for Random Auction')}
        </Text>
        {activeGroups.length === 0 ? (
          <Text style={styles.emptyText}>{t('No active groups available')}</Text>
        ) : (
          <FlatList
            data={activeGroups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ position: 'relative' }}>
                <GroupCard 
                  group={item}
                  onPress={handleGroupCardPress}
                  onArrowPress={handleGroupCardPress}
                />
                {selectingGroupId === item.id && (
                  <View style={styles.cardSelectingOverlay}>
                    <ActivityIndicator size="small" color="#6B46C1" />
                    <Text style={styles.cardSelectingText}>{t('Selecting...')}</Text>
                  </View>
                )}
              </View>
            )}
            scrollEnabled={false}
            contentContainerStyle={styles.groupListContainer}
          />
        )}
      </View>
    );
  };

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
          selectedGroup={selectedGroup}
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
            {auctionResult?.type === 'betting' 
              ? `Auction Result - Month ${auctionCycleMonth}` 
              : `🎉 Month ${auctionCycleMonth} Winner!`}
          </Text>
        </View>
        
        {auctionResult?.type === 'betting' ? (
          <View style={styles.winnerListSection}>
            <Text style={styles.winnerListTitle}>Lowest Bidders (Select 1 Winner)</Text>
            <ScrollView style={styles.winnerList}>
              {participants
                .sort((a, b) => a.bid - b.bid) // Sort by lowest bid
                .map((participant) => {
                  const isIneligible = Boolean(participant.hasWonAuction);
                  return (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.winnerOption,
                        adminSelectedWinner?.id === participant.id && styles.selectedWinner,
                        isIneligible && { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }
                      ]}
                      onPress={() => {
                        if (isIneligible) {
                          Alert.alert(
                            'Member Ineligible',
                            `${participant.name} has already won or taken the auction prize for this group and cannot win again.`
                          );
                          return;
                        }
                        setAdminSelectedWinner(participant);
                      }}
                      activeOpacity={isIneligible ? 0.9 : 0.7}
                    >
                      <View style={[styles.winnerAvatar, isIneligible && { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.winnerAvatarText, isIneligible && { color: '#EF4444' }]}>{participant.avatar}</Text>
                      </View>
                      <View style={styles.winnerDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <Text style={[styles.winnerName, isIneligible && { color: '#991B1B' }]}>{participant.name}</Text>
                          {isIneligible && (
                            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FCA5A5' }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#B91C1C' }}>NOT ELIGIBLE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.winnerBid}>{formatCurrency(participant.bid)}</Text>
                      </View>
                      {adminSelectedWinner?.id === participant.id && (
                        <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.winnerSection}>
            <View style={[styles.winnerAvatar, auctionResult?.winner?.hasWonAuction && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.winnerAvatarText, auctionResult?.winner?.hasWonAuction && { color: '#EF4444' }]}>
                {auctionResult?.winner?.avatar}
              </Text>
            </View>
            <Text style={[styles.winnerName, auctionResult?.winner?.hasWonAuction && { color: '#991B1B' }]}>
              {auctionResult?.winner?.name}
            </Text>
            {auctionResult?.winner?.hasWonAuction && (
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5', marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#B91C1C' }}>⚠️ NOT ELIGIBLE - PRIZE ALREADY TAKEN</Text>
              </View>
            )}
            <Text style={styles.diceResult}>Dice Value: {auctionResult?.diceValue}</Text>
          </View>
        )}

        <View style={styles.modalActions}>
          {auctionResult?.type === 'betting' ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, (!adminSelectedWinner || savingWinner) && styles.disabledButton]}
                onPress={() => {
                  if (adminSelectedWinner) {
                    saveAuctionWinnerToBackend(adminSelectedWinner);
                  }
                }}
                disabled={!adminSelectedWinner || savingWinner}
              >
                {savingWinner ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Confirm Winner</Text>
                )}
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
            <>
              <TouchableOpacity 
                style={[styles.actionButton, savingWinner && styles.disabledButton]}
                onPress={() => {
                  if (auctionResult?.winner) {
                    saveAuctionWinnerToBackend(auctionResult.winner);
                  }
                }}
                disabled={savingWinner}
              >
                {savingWinner ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Confirm Winner</Text>
                )}
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
        loading={loadingMembers}
        selectedGroup={selectedGroup}
        selectedMembers={selectedMembers}
        selectedCycleMonth={auctionCycleMonth}
        completedAuctions={completedAuctions}
        onSelectCycleMonth={setAuctionCycleMonth}
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