import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';

const CardSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: animatedValue }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonBox} />
        <View style={styles.skeletonBox} />
      </View>
    </Animated.View>
  );
};
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler } from 'react-native';
import GroupCard from '../../../../../components/GroupCard/GroupCard';
import Header from '../../../../../components/HeaderComponent/Header';
import BettingAuction from './BettingAuction/BettingAuction';
import RandomAuction from './RandomAuction/RandomAuction';
import ApiService from '../../../../../services/ApiService';
import AuctionWebSocketService from '../../../../../services/AuctionWebSocketService';
import { useLanguage } from '../../../../../utils/LanguageContext';

const Auction = ({ route, navigation, onClose, selectedGroupId, selectedGroupType }) => {
  const { t, language } = useLanguage();
  const paramGroupId = route?.params?.groupId || selectedGroupId;
  const paramGroupType = route?.params?.auctionType || selectedGroupType;

  const [activeTab, setActiveTab] = useState('betting');
  const [participants, setParticipants] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [auctionResult, setAuctionResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [targetGroupForModal, setTargetGroupForModal] = useState(null);
  const [showNotActiveModal, setShowNotActiveModal] = useState(false);
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [liveAmount, setLiveAmount] = useState(null);

  useEffect(() => {
    fetchUserGroups();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (selectedGroup) {
        setSelectedGroup(null);
        setActiveTab('betting');
        return true;
      }
      if (showNotActiveModal) {
        setShowNotActiveModal(false);
        setTargetGroupForModal(null);
        return true;
      }
      if (showResultModal) {
        setShowResultModal(false);
        return true;
      }
      handleBackFromAuction();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [selectedGroup, showNotActiveModal, showResultModal]);

  useEffect(() => {
    if (paramGroupId && userGroups.length > 0) {
      const matched = userGroups.find(g => g.id.toString() === paramGroupId.toString());
      if (matched) {
        handleGroupSelect(matched);
        if (paramGroupType) {
          setActiveTab(paramGroupType);
        }
      }
    }
  }, [paramGroupId, paramGroupType, userGroups]);

  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await ApiService.makeRequest('/user/portfolio', { method: 'GET' });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        const transformedGroups = data.data.map(group => {
          const totalMonths = Number(group.totalMonths) || 20;
          const investmentAmount = Number(group.investmentAmount) || 0;
          return {
            id: group.id.toString(),
            name: group.groupName || 'Unknown',
            totalMembers: group.totalMembers || 0,
            currentMembers: group.currentMembers || 0,
            monthlyAmount: group.monthlyContribution || Math.round(investmentAmount / totalMonths),
            completedCycles: group.groupCompletedCycles !== undefined ? group.groupCompletedCycles : 0,
            totalCycles: totalMonths,
            collectedAmount: group.groupCollectedAmount !== undefined ? group.groupCollectedAmount : 0,
            nextDueDate: group.startDate,
            groupAmount: investmentAmount,
            status: group.paymentStatus || 'Not Started',
          };
        });
        setUserGroups(transformedGroups);
      } else {
        setUserGroups([]);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setTargetGroupForModal(group);
    setLiveAmount(group.groupAmount || null);

    const cleanGroupId = encodeURIComponent(String(group.id).trim());

    // Fetch members in background
    try {
      const response = await ApiService.makeRequest(`/user/groups/getMembers?groupId=${cleanGroupId}`, { method: 'GET' });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.members)) {
        const transformedMembers = data.members.map(member => ({
          id: member.id?.toString(),
          name: member.name || member.user_name || '',
          phone: member.phone || '',
          avatar: (member.name || member.user_name || 'U').substring(0, 2).toUpperCase(),
        }));
        setParticipants(transformedMembers);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      setParticipants([]);
    }

    // Check if live auction is active for this group
    let active = false;
    try {
      const resp = await ApiService.makeRequest(`/user/auctions/active?groupId=${cleanGroupId}`, { method: 'GET' });
      const auctionData = await resp.json();
      if (auctionData && auctionData.success && auctionData.active) {
        active = true;
      }
    } catch (e) {
      // Default to false if active auction not confirmed yet
    }

    if (active) {
      setIsAuctionActive(true);
      setSelectedGroup(group);
      setShowNotActiveModal(false);
    } else {
      setIsAuctionActive(false);
      setSelectedGroup(null); // Keep user OUTSIDE the auction page while auction is not held
      setShowNotActiveModal(true); // Display modal over group list page
    }
  };

  // Socket listener to automatically bring user into auction room when admin starts auction
  useEffect(() => {
    const activeGroup = targetGroupForModal || selectedGroup;
    if (!activeGroup) return;

    let unsubStart = null;
    let unsubEnd = null;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'user');
          unsubStart = AuctionWebSocketService.on('auction_started', (data) => {
            console.log('📢 Live Auction started for group:', data);
            setIsAuctionActive(true);
            setShowNotActiveModal(false);
            setSelectedGroup(activeGroup); // Automatically enter auction page when started!
          });
          unsubEnd = AuctionWebSocketService.on('auction_ended', () => {
            console.log('📢 Live Auction ended');
            setIsAuctionActive(false);
          });
        }
      } catch (err) {
        console.log('WebSocket connect notice in Auction:', err);
      }
    };

    initSocket();

    return () => {
      if (typeof unsubStart === 'function') unsubStart();
      if (typeof unsubEnd === 'function') unsubEnd();
    };
  }, [targetGroupForModal, selectedGroup]);

  const handleBackFromAuction = () => {
    if (onClose) {
      onClose();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      setSelectedGroup(null);
      setActiveTab('betting');
    }
  };

  const handleAuctionComplete = result => {
    console.log('Auction completed:', result);
    setAuctionResult(result);
    setShowResultModal(true);
  };

  const ResultModalContent = () => (
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
        <View style={styles.winnerSection}>
          <View style={styles.winnerAvatar}>
            <Text style={styles.winnerAvatarText}>{auctionResult?.winner?.avatar}</Text>
          </View>
          <Text style={styles.winnerName}>{auctionResult?.winner?.name}</Text>
          <Text style={styles.winnerBid}>Amount: ₹{auctionResult?.amount?.toLocaleString()}</Text>
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
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => {
            setShowResultModal(false);
            handleBackFromAuction();
          }}
        >
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowResultModal(false);
        handleBackFromAuction();
      }}
    >
      <View style={styles.modalOverlay}>
        <ResultModalContent />
      </View>
    </Modal>
  );

  const renderAuctionNotHeldModal = () => (
    <Modal
      visible={showNotActiveModal && !!targetGroupForModal && !isAuctionActive}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowNotActiveModal(false);
        setTargetGroupForModal(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.notActiveCardContainer}>
          {/* Circular Glowing Icon Badge */}
          <View style={styles.notActiveIconWrapper}>
            <View style={styles.notActiveIconCircle}>
              <MaterialCommunityIcons name="gavel" size={40} color="#7C3AED" />
            </View>
          </View>

          {/* Status Badge Pill */}
          <View style={styles.notActiveBadgePill}>
            <View style={styles.notActiveDot} />
            <Text style={styles.notActiveBadgeText}>Auction Not Held</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.notActiveMainTitle}>Auction Not Active</Text>
          <Text style={styles.notActiveDescriptionText}>
            The auction for <Text style={{ fontWeight: '700', color: '#111827' }}>{targetGroupForModal?.name || 'this group'}</Text> is currently not held or in progress.
          </Text>
          <Text style={styles.notActiveSubText}>
            You are not permitted to enter the auction room right now. Please try again when the auction is officially started.
          </Text>

          {/* Action Button */}
          <View style={styles.notActiveActionRow}>
            <TouchableOpacity
              style={styles.notActivePrimaryBtn}
              onPress={() => {
                setShowNotActiveModal(false);
                setTargetGroupForModal(null);
                setSelectedGroup(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.notActivePrimaryBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGroupSelectHeader = () => (
    <Header 
      title="Select Group" 
      onBack={() => {
        if (onClose) onClose();
        else if (navigation && navigation.canGoBack()) navigation.goBack();
      }}
      showBackButton={true}
      rightComponent={
        <MaterialCommunityIcons name="gavel" size={24} color="#6B46C1" />
      }
    />
  );

  const renderGroupsList = () => {
    if (loadingGroups) {
      return (
        <ScrollView 
          style={styles.groupsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.groupsContent}
        >
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      );
    }
    return (
      <ScrollView 
        style={styles.groupsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.groupsContent}
      >
      {userGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No groups available</Text>
          <Text style={styles.emptySubtext}>Join or create a group to start auction</Text>
        </View>
      ) : (
        <FlatList
          data={userGroups}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCardWrapper}
              onPress={() => handleGroupSelect(item)}
              activeOpacity={0.8}
            >
              <GroupCard 
                group={item}
                onPress={() => handleGroupSelect(item)}
                onArrowPress={() => handleGroupSelect(item)}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      )}
    </ScrollView>
    );
  };

  const renderAuctionTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'betting' && styles.activeTab, isAuctionActive && styles.disabledTab]}
        onPress={() => {
          if (!isAuctionActive) setActiveTab('betting');
        }}
        disabled={isAuctionActive}
      >
        <MaterialCommunityIcons
          name="gavel"
          size={20}
          color={activeTab === 'betting' ? '#6B46C1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'betting' && styles.activeTabText,
          ]}
        >
          Betting Auction
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'random' && styles.activeTab, isAuctionActive && styles.disabledTab]}
        onPress={() => {
          if (!isAuctionActive) setActiveTab('random');
        }}
        disabled={isAuctionActive}
      >
        <MaterialCommunityIcons
          name="dice-5"
          size={20}
          color={activeTab === 'random' ? '#6B46C1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'random' && styles.activeTabText,
          ]}
        >
          Random Auction
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuctionHeader = () => (
    <Header 
      title={selectedGroup?.name || 'Auction'} 
      onBack={handleBackFromAuction}
      showBackButton={true}
      rightComponent={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="cash" size={24} color="#6B46C1" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#6B46C1' }}>
            ₹{(liveAmount !== null && liveAmount !== undefined ? liveAmount : selectedGroup?.groupAmount)?.toLocaleString('en-IN')}
          </Text>
        </View>
      }
    />
  );

  // If no group selected, show group selection
  if (!selectedGroup) {
    return (
      <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        {renderGroupSelectHeader()}
        {renderGroupsList()}
        {renderAuctionNotHeldModal()}
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // If group selected, show auction interface
  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {renderAuctionHeader()}
      {renderAuctionTabs()}

      <View style={styles.contentContainer}>
        {activeTab === 'betting' ? (
          <BettingAuction
            participants={participants}
            setParticipants={setParticipants}
            selectedGroup={selectedGroup}
            selectedMembers={participants}
            onAuctionComplete={handleAuctionComplete}
            onAuctionStatusChange={setIsAuctionActive}
            onAmountChange={(amount) => setLiveAmount(amount)}
          />
        ) : (
          <RandomAuction
            participants={participants}
            selectedGroup={selectedGroup}
            onAuctionComplete={handleAuctionComplete}
            onAuctionStatusChange={setIsAuctionActive}
            onAmountChange={(amount) => setLiveAmount(amount)}
          />
        )}
      </View>
      {renderResultModal()}
      {renderAuctionNotHeldModal()}
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  groupsContainer: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupCardWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EDE9FE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#6B46C1',
  },
  disabledTab: {
    opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 10,
  },
  winnerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  winnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  winnerAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  winnerBid: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10B981",
  },
  diceResult: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B46C1",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Auction Not Held Modal Styles
  notActiveCardContainer: {
    width: width * 0.88,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  notActiveIconWrapper: {
    marginBottom: 14,
  },
  notActiveIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  notActiveBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
  },
  notActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  notActiveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  notActiveMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  notActiveDescriptionText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  notActiveSubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  notActiveWaitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  notActiveWaitingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B46C1',
  },
  notActiveActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  notActivePrimaryBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  notActivePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notActiveSecondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notActiveSecondaryBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },

  // Skeleton Styles
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonTitle: {
    width: '45%',
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 60,
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
  },
  skeletonLineShort: {
    width: '30%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 14,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
});

export default Auction;