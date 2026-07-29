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

const ChitfundPortfolio = ({ navigation }) => {
  const { t, language } = useLanguage();
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
    let dynamicNextDue = group.estimatedPayDate;

    if (group.startDate) {
      const parts = group.startDate.split('-');
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);

        const paidCycles = Math.max(0, Number(group.currentMonth) || 0);
        const nextCycleIndex = group.paymentStatus === 'completed' ? paidCycles - 1 : paidCycles;
        const cycleIndex = Math.max(0, nextCycleIndex);
        const nextCycleStart = new Date(year, month + cycleIndex, day);

        const cycleDue = new Date(nextCycleStart);
        cycleDue.setDate(cycleDue.getDate() + 20);

        const yyyy = cycleDue.getFullYear();
        const mm = String(cycleDue.getMonth() + 1).padStart(2, '0');
        const dd = String(cycleDue.getDate()).padStart(2, '0');
        dynamicNextDue = `${yyyy}-${mm}-${dd}`;
      }
    }

    return {
      id: group.id,
      name: group.groupName,
      status: group.paymentStatus,
      totalMembers: group.totalMembers,
      currentMembers: group.currentMembers,
      monthlyAmount: group.monthlyContribution,
      completedCycles: group.currentMonth,
      totalCycles: group.totalMonths,
      nextDueDate: dynamicNextDue,
      completedDate: group.estimatedPayDate,
      totalAmount: group.investmentAmount,
      groupId: group.groupId,
      startDate: group.startDate,
      collectedAmount: group.groupCollectedAmount || 0,
      userPaidAmount: group.totalPaid || 0,
    };
  };

  const handleViewGroupDetails = (group) => {
    setSelectedModalGroup(group);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedModalGroup(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Portfolio" onBack={() => navigation?.goBack()} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={[styles.loadingText, language === 'ta' && { fontSize: 16 }]}>{t('Loading your portfolio...')}</Text>
            <Text style={[styles.loadingSubtext, language === 'ta' && { fontSize: 13 }]}>{t('Please wait while we fetch your investment details')}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Portfolio" onBack={() => navigation?.goBack()} />
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <MaterialCommunityIcons name="wifi-off" size={64} color="#DC2626" />
            <Text style={[styles.errorTitle, language === 'ta' && { fontSize: 18 }]}>{t('Unable to Load Portfolio')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchPortfolio}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={[styles.retryButtonText, language === 'ta' && { fontSize: 14 }]}>{t('Try Again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (chitGroups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Portfolio" onBack={() => navigation?.goBack()} />
        <View style={styles.emptyPortfolioContainer}>
          <View style={styles.emptyPortfolioContent}>
            <MaterialCommunityIcons name="briefcase-outline" size={72} color="#D1D5DB" />
            <Text style={[styles.emptyPortfolioTitle, language === 'ta' && { fontSize: 18 }]}>{t('No Portfolio Data')}</Text>
            <Text style={[styles.emptyPortfolioMessage, language === 'ta' && { fontSize: 14 }]}>{t("You haven't joined any chit groups yet")}</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation?.navigate('Home')}
            >
              <Text style={[styles.exploreButtonText, language === 'ta' && { fontSize: 14 }]}>{t('Explore Groups')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Portfolio"
        onBack={() => navigation?.goBack()}
      />

      {/* FIXED HEADER - Above the divider */}
      <View style={styles.fixedHeader}>
        {/* NEW SUMMARY SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 12 }]}>{t('Summary')}</Text>
          <View style={styles.summaryContainer}>
            {/* Total Amount Invested Card */}
            <View style={styles.summaryCard}>
              <Text style={[styles.cardLabel, language === 'ta' && { fontSize: 12 }]}>{t('Total Paid Amount')}</Text>
              <Text style={styles.cardValue}>{formatCurrency(totalAmountInvested)}</Text>
            </View>

            {/* Selected Group Card */}
            <View style={styles.summaryCard}>
              <Text style={[styles.cardLabel, language === 'ta' && { fontSize: 12 }]}>
                {selectedGroup ? selectedGroup.groupName : t('Select a Group')}
              </Text>
              <Text style={styles.cardValue}>
                {formatCurrency(amountPaidInSelectedGroup)}
              </Text>
            </View>
          </View>
        </View>

        {/* VIEW GROUP SELECTOR */}
        <View style={styles.section}>
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

          {/* Divider below group amount values */}
          <View style={styles.groupSelectorDivider} />
        </View>
      </View>

      {/* SCROLLABLE CONTENT - Below the divider */}
      <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
        {/* View Group title below the divider */}
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

        {/* --- CHIT GROUP CARDS USING REUSABLE COMPONENT --- */}
        <View style={styles.section}>
          {currentGroups.length > 0 ? (
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