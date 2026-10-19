import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GroupCardInfo from './GroupCardInfo/GroupCardInfo';
import GroupCard from '../../../../components/GroupCard/GroupCard';
import Header from '../../../../components/HeaderComponent/Header';
import ApiService from '../../../../services/ApiService';
import styles from './Portfoliosty';
import { useLanguage } from '../../../../utils/LanguageContext';
import { useSecureScreen } from '../../../../services/ScreenSecurity';

const ChitfundPortfolio = ({ navigation, route }) => {
  const { t, language } = useLanguage();
  useSecureScreen();
  // Modal state for showing group details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalGroup, setSelectedModalGroup] = useState(null);

  // Tab state for switching between Active and Completed groups
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA ---
  const [chitGroups, setChitGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiService.getPortfolio();

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to load portfolio');
      }

      const groups = result.data || [];
      setChitGroups(groups);
      if (groups.length > 0) {
        setSelectedGroupId((prev) => prev || groups[0].id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err.message || 'Could not load your portfolio data. Please check your connection and try again.');
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [fetchPortfolio])
  );

  // Auto-open specific group card and month if requested by notification or route params
  useEffect(() => {
    const openGroupId = route?.params?.openGroupId || route?.params?.groupId;
    const targetMonth = route?.params?.targetMonth || route?.params?.month;

    if (openGroupId && chitGroups.length > 0) {
      const match = chitGroups.find(
        g => String(g.id) === String(openGroupId) ||
             String(g.groupId) === String(openGroupId) ||
             `GRP-${g.id}` === String(openGroupId)
      );
      if (match) {
        setSelectedGroupId(match.id);
        setSelectedModalGroup({ ...transformGroupData(match), targetMonth });
        setModalVisible(true);
      }
    }
  }, [route?.params, chitGroups]);

  // --- CALCULATIONS ---
  // Calculate the actual total amount the user has successfully paid across all groups
  const totalAmountInvested = chitGroups.reduce(
    (sum, group) => sum + (Number(group.totalPaid) || 0),
    0
  );

  // Find the full object for the selected group
  const selectedGroup = chitGroups.find(g => g.id === selectedGroupId);

  // Calculate the amount paid into the selected group so far based on approved payments
  const amountPaidInSelectedGroup = selectedGroup
    ? (Number(selectedGroup.totalPaid) || 0)
    : 0;

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStyles = (status) => {
    if (status === 'completed') {
      return { backgroundColor: '#DCFCE7', textColor: '#15803D' };
    }
    return { backgroundColor: '#FFEDD5', textColor: '#C2410C' };
  };

  // Filter groups by status
  const activeGroups = chitGroups.filter(group => group.paymentStatus !== 'completed');
  const completedGroups = chitGroups.filter(group => group.paymentStatus === 'completed');

  // Get current groups based on active tab
  const currentGroups = activeTab === 'active' ? activeGroups : completedGroups;

  // Function to transform Portfolio data to GroupCard format
  const transformGroupData = (group) => {
    if (!group) return {};
    return {
      id: group.id,
      name: String(group.groupName || 'Chit Group'),
      status: group.paymentStatus || 'pending',
      totalMembers: Number(group.totalMembers) || 0,
      currentMembers: Number(group.currentMembers) || 0,
      monthlyAmount: Number(group.monthlyContribution) || 0,
      completedCycles: Number(group.currentMonth || group.completedCycles) || 0,
      paidCycles: Number(group.paidCycles) || 0,
      currentMonth: Number(group.currentMonth) || 1,
      currentMonthDisplay: group.currentMonthDisplay || (group.totalMonths ? `${group.currentMonth || 1}st Month of ${group.totalMonths}` : '1st Month'),
      currentMonthName: group.currentMonthName || '',
      totalCycles: Number(group.totalMonths) || 0,
      duration: Number(group.totalMonths) || 0,
      totalMonths: Number(group.totalMonths) || 0,
      nextDueDate: group.estimatedPayDate || 'N/A',
      completedDate: group.estimatedPayDate || 'N/A',
      totalAmount: Number(group.investmentAmount) || 0,
      groupId: String(group.groupId || `GRP-${group.id}`),
      startDate: group.startDate || null,
      collectedAmount: Number(group.groupCollectedAmount) || 0,
      userPaidAmount: Number(group.totalPaid) || 0,
    };
  };

  const handleViewGroupDetails = (group) => {
    setSelectedGroupId(group.id);
    setSelectedModalGroup(transformGroupData(group));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedModalGroup(null);
    if (navigation?.setParams) {
      navigation.setParams({
        openGroupId: undefined,
        groupId: undefined,
        targetMonth: undefined,
        month: undefined,
      });
    }
  };

  const CardSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonTextLeft} />
        <View style={styles.skeletonTextRight} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonTextLeft} />
        <View style={styles.skeletonTextRight} />
      </View>
      <View style={styles.skeletonProgress} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('Portfolio')}
        onBack={() => navigation?.goBack()}
        showBackButton={true}
      />

      {/* FIXED HEADER - Summary & Selection Chips (Static Shell) */}
      <View style={styles.fixedHeader}>
        {/* SUMMARY SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 12 }]}>{t('Summary')}</Text>
          <View style={styles.summaryContainer}>
            {/* Total Amount Invested Card */}
            <View style={styles.summaryCard}>
              <Text style={[styles.cardLabel, language === 'ta' && { fontSize: 12 }]}>{t('Total Paid Amount')}</Text>
              <Text style={styles.cardValue}>
                {isLoading ? '...' : formatCurrency(totalAmountInvested)}
              </Text>
            </View>

            {/* Selected Group Card */}
            <View style={styles.summaryCard}>
              <Text style={[styles.cardLabel, language === 'ta' && { fontSize: 12 }]} numberOfLines={1}>
                {selectedGroup ? selectedGroup.groupName : t('Select a Group')}
              </Text>
              <Text style={styles.cardValue}>
                {isLoading ? '...' : formatCurrency(amountPaidInSelectedGroup)}
              </Text>
            </View>
          </View>
        </View>

        {/* VIEW GROUP SELECTOR CHIPS */}
        <View style={styles.section}>
          {chitGroups.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {chitGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.selectorChip,
                    selectedGroupId === group.id && styles.selectorChipActive
                  ]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text style={[
                    styles.selectorChipText,
                    selectedGroupId === group.id && styles.selectorChipTextActive
                  ]}>
                    {group.groupName} ({formatCurrency(group.investmentAmount)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.cardLabel, { fontSize: 12, color: '#9CA3AF' }]}>
              {isLoading ? t('Loading your portfolio...') : t('No Portfolio Data')}
            </Text>
          )}

          {/* Divider below group selector */}
          <View style={styles.groupSelectorDivider} />
        </View>
      </View>

      {/* SCROLLABLE CONTENT - Group Tabs & Dynamic Backend List */}
      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle1, language === 'ta' && { fontSize: 12 }]}>{t('View Group')}</Text>

          {/* TABS SECTION */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'active' && styles.activeTab
              ]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'active' && styles.activeTabText,
                language === 'ta' && { fontSize: 13 }
              ]}>
                {t('Active Groups')} ({activeGroups.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'completed' && styles.activeTab
              ]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'completed' && styles.activeTabText,
                language === 'ta' && { fontSize: 13 }
              ]}>
                {t('Completed Groups')} ({completedGroups.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INLINE CARD CONTENT LOADING SKELETON & GROUPS */}
        <View style={styles.section}>
          {isLoading ? (
            <View style={{ marginTop: 4 }}>
              <CardSkeleton />
              <CardSkeleton />
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { paddingTop: 30, paddingBottom: 30 }]}>
              <MaterialCommunityIcons name="wifi-off" size={48} color="#DC2626" />
              <Text style={[styles.emptyStateText, { color: '#DC2626', marginTop: 10 }, language === 'ta' && { fontSize: 16 }]}>
                {t('Unable to Load Portfolio')}
              </Text>
              <Text style={styles.emptyStateSubtext}>{error}</Text>
              <TouchableOpacity
                style={[styles.selectorChip, styles.selectorChipActive, { marginTop: 12, paddingHorizontal: 20 }]}
                onPress={fetchPortfolio}
              >
                <Text style={styles.selectorChipTextActive}>{t('Try Again')}</Text>
              </TouchableOpacity>
            </View>
          ) : currentGroups.length > 0 ? (
            currentGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={transformGroupData(group)}
                onPress={() => handleViewGroupDetails(group)}
                onArrowPress={() => handleViewGroupDetails(group)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name={activeTab === 'active' ? 'account-group-outline' : 'check-circle-outline'}
                size={48}
                color="#9CA3AF"
              />
              <Text style={[styles.emptyStateText, language === 'ta' && { fontSize: 15 }]}>
                {activeTab === 'active'
                  ? t('No active groups found')
                  : t('No completed groups found')
                }
              </Text>
              <Text style={[styles.emptyStateSubtext, language === 'ta' && { fontSize: 13 }]}>
                {activeTab === 'active'
                  ? t('Join a chit group to start your investment journey')
                  : t('Complete your active groups to see them here')
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Group Details */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <GroupCardInfo
          group={selectedModalGroup}
          onClose={closeModal}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default ChitfundPortfolio;