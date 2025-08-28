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
import LeftArrowIcon from '../../assects/Icon/left-arrow.svg';
import RightViewIcon from '../../assects/Icon/right-view.svg';
import ChitGroupDetails from './Portfolio-view/Portfolio-view';
import styles from './Portfoliosty';

const ChitfundPortfolio = () => {
  // Modal state for showing group details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalGroup, setSelectedModalGroup] = useState(null);
  
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
        {/* NEW HEADER */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton}>
                <LeftArrowIcon width={20} height={20} fill="#1F2937" marginTop={-10} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Portfolio</Text>
        </View>

        {/* SEPARATOR LINE */}
        <View style={styles.separator} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.sectionTitle}>View Group</Text>
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
            </View>

            {/* --- UPDATED CHIT GROUP CARDS --- */}
            <View style={styles.section}>
                {/* Horizontal divider above section title */}
                <View style={styles.sectionDivider} />
                <Text style={styles.chitGroupSectionTitle}>Your Chit Groups</Text>
                
                {chitGroups.map((group) => (
                    <View key={group.id} style={styles.updatedCard}>
                        
                        {/* TOP: Group Name & View Icon */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.updatedGroupName}>{group.groupName}</Text>
                            <TouchableOpacity 
                                style={styles.viewIconTouchable} 
                                activeOpacity={0.7}
                                onPress={() => handleViewGroupDetails(group)}
                            >
                                <View style={styles.circleIcon}>
                                    <RightViewIcon width={20} height={20} fill="#A0AEC0" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* DIVIDER */}
                        <View style={styles.divider} />

                        {/* BOTTOM SECTION: Two rows with Group ID and Date on left, Chit Value spanning both rows on right */}
                        <View style={styles.bottomSection}>
                            {/* Left side - Group ID and Date in separate rows */}
                            <View style={styles.leftColumn}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Group ID : </Text>
                                    <Text style={styles.detailValue}>{group.groupId}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Date : </Text>
                                    <Text style={styles.detailValue}>{formatDate(group.estimatedPayDate)}</Text>
                                </View>
                            </View>
                            
                            {/* Right side - Chit Value section */}
                            <View style={styles.rightColumn}>
                                <Text style={styles.chitValueLabel}>CHIT VALUE</Text>
                                <Text style={styles.chitValueAmount}>
                                    {formatCurrency(group.investmentAmount)}
                                </Text>
                            </View>
                        </View>
                        
                    </View>
                ))}
            </View>
        </ScrollView>

        {/* Modal for Group Details */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <ChitGroupDetails 
            group={selectedModalGroup} 
            onClose={closeModal}
          />
        </Modal>
    </SafeAreaView>
  );
};

export default ChitfundPortfolio;