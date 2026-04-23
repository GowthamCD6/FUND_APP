import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GroupCardInfo from './GroupCardInfo/GroupCardInfo';
import GroupCard from '../../../../components/GroupCard/GroupCard';
import Header from '../../../../components/HeaderComponent/Header';
import ApiService from '../../../../services/ApiService';
import styles from './Portfoliosty';

const ChitfundPortfolio = ({ navigation }) => {
  // Modal state for showing group details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalGroup, setSelectedModalGroup] = useState(null);
  
  // Tab state for switching between Active and Completed groups
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [isLoading, setIsLoading] = useState(true);
  
  // --- DATA ---
  const [chitGroups, setChitGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.makeRequest('/user/portfolio', { method: 'GET' });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to load portfolio');
      }

      setChitGroups(result.data || []);
      if (result.data?.length > 0) {
        setSelectedGroupId(result.data[0].id);
      }
    } catch (error) {
      console.error('Portfolio fetch error:', error);
      Alert.alert('Error', error.message || 'Could not load your portfolio data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
      const st = new Date(group.startDate);
      // Determine the start date of the current active cycle
      const cycleIndex = Math.max(0, (group.currentMonth || 1) - 1);
      const currentCycleStart = new Date(st.getFullYear(), st.getMonth() + cycleIndex, st.getDate());
      
      // Next due date is 20 days after the exact cycle start date
      const cycleDue = new Date(currentCycleStart);
      cycleDue.setDate(cycleDue.getDate() + 20);
      
      dynamicNextDue = cycleDue.toISOString().split('T')[0];
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
      collectedAmount: group.totalPaid || 0,
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <Header title="Portfolio" onBack={() => navigation?.goBack()} />
         <ActivityIndicator size="large" color="#6B46C1" />
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
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.summaryContainer}>
                    {/* Total Amount Invested Card */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Total Amount Invested</Text>
                        <Text style={styles.cardValue}>{formatCurrency(totalAmountInvested)}</Text>
                    </View>

                    {/* Selected Group Card */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>
                           {selectedGroup ? selectedGroup.groupName : 'Select a Group'}
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
                <Text style={styles.sectionTitle}>View Group</Text>

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
                            activeTab === 'active' && styles.activeTabText
                        ]}>
                            Active Groups ({activeGroups.length})
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
                            activeTab === 'completed' && styles.activeTabText
                        ]}>
                            Completed Groups ({completedGroups.length})
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
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'active' 
                                ? 'No active groups found' 
                                : 'No completed groups found'
                            }
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            {activeTab === 'active' 
                                ? 'Join a chit group to start your investment journey' 
                                : 'Complete your active groups to see them here'
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