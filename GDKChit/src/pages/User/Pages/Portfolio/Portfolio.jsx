import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GroupCardInfo from './GroupCardInfo/GroupCardInfo';
import GroupCard from '../../../../components/GroupCard/GroupCard';
import Header from '../../../../components/HeaderComponent/Header';
import styles from './Portfoliosty';

const ChitfundPortfolio = () => {
  // Modal state for showing group details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalGroup, setSelectedModalGroup] = useState(null);
  
  // Tab state for switching between Active and Completed groups
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  
  // --- DATA (from your original component) ---
  const [chitGroups] = useState([
    {
      id: 'CHT001',
      groupName: 'Group A',
      investmentAmount: 100000,
      groupId: 'GRP-2024-001',
      totalMembers: 20,
      estimatedPayDate: '2025-09-15',
      paymentStatus: 'pending',
      monthlyContribution: 5000,
      currentMonth: 8,
      totalMonths: 20,
    },
    {
      id: 'CHT002',
      groupName: 'Group B',
      investmentAmount: 150000,
      groupId: 'GRP-2024-002',
      totalMembers: 30,
      estimatedPayDate: '2025-09-10',
      paymentStatus: 'completed',
      monthlyContribution: 7500,
      currentMonth: 12,
      totalMonths: 20,
    },
    {
      id: 'CHT004',
      groupName: 'Group D',
      investmentAmount: 500000, // Added 5 lakh group for the example
      groupId: 'GRP-2024-004',
      totalMembers: 40,
      estimatedPayDate: '2025-09-05',
      paymentStatus: 'pending',
      monthlyContribution: 10000,
      currentMonth: 15,
      totalMonths: 20,
    },
  ]);

  // Default to selecting the first group on load
  const [selectedGroupId, setSelectedGroupId] = useState(chitGroups.length > 0 ? chitGroups[0].id : null);

  // --- CALCULATIONS ---
  // Calculate the total value of all chits the user is in (e.g., 1L + 5L)
  const totalChitValue = chitGroups.reduce(
    (sum, group) => sum + group.investmentAmount,
    0
  );
  
  // Find the full object for the selected group
  const selectedGroup = chitGroups.find(g => g.id === selectedGroupId);

  // Calculate the amount paid into the selected group so far
  const amountPaidInSelectedGroup = selectedGroup
    ? selectedGroup.monthlyContribution * selectedGroup.currentMonth
    : 0;

  // --- HELPER FUNCTIONS (from your original code) ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
    return {
      id: group.id,
      name: group.groupName,
      status: group.paymentStatus,
      totalMembers: group.totalMembers,
      monthlyAmount: group.monthlyContribution,
      completedCycles: group.currentMonth,
      totalCycles: group.totalMonths,
      nextDueDate: group.estimatedPayDate,
      totalAmount: group.investmentAmount,
      groupId: group.groupId,
    };
  };

  // Function to handle showing group details in modal
  const handleViewGroupDetails = (group) => {
    setSelectedModalGroup(group);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedModalGroup(null);
  };

  return (
    <SafeAreaView style={styles.container}>
        <Header 
          title="Portfolio"
          onBack={() => {/* Add your navigation back logic here */}}
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
                        <Text style={styles.cardValue}>{formatCurrency(totalChitValue)}</Text>
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
                            onPress={() => {}} // Disabled card press
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