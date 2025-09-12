import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GroupCard = ({ onBack }) => {
  const [currentView, setCurrentView] = useState('groupList'); // 'groupList' or 'groupDetails'
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Sample data for 20 groups
  const userGroups = Array.from({ length: 20 }, (_, index) => ({
    id: `GRP-2024-${String(index + 1).padStart(3, '0')}`,
    groupName: `Group ${String.fromCharCode(65 + (index % 26))}${index > 25 ? Math.floor(index / 26) : ''}`,
    totalMembers: 20,
    monthlyContribution: (index + 1) * 1000 + 2000,
    nextPaymentDate: '2025-09-15',
    paymentStatus: index % 3 === 0 ? 'completed' : 'pending',
    currentMonth: Math.floor(Math.random() * 15) + 1,
    totalMonths: 20,
    yourPosition: Math.floor(Math.random() * 20) + 1,
    estimatedReceiveAmount: (index + 1) * 15000 + 50000,
  }));

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

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setCurrentView('groupDetails');
  };

  const handleBackToGroupList = () => {
    setCurrentView('groupList');
    setSelectedGroup(null);
  };

  // Group List View Component
  const GroupListView = () => {
    const renderGroupCard = ({ item }) => (
      <TouchableOpacity
        style={styles.groupListCard}
        onPress={() => handleGroupSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupListCardHeader}>
          <Text style={styles.groupListCardName}>{item.groupName}</Text>
          <View style={[
            styles.groupListStatusBadge,
            item.paymentStatus === 'completed' ? styles.statusCompleted : styles.statusPending
          ]}>
            <Text style={[
              styles.groupListStatusText,
              item.paymentStatus === 'completed' ? styles.statusCompletedText : styles.statusPendingText
            ]}>
              {item.paymentStatus === 'completed' ? 'PAID' : 'PENDING'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.groupListCardId}>ID: {item.id}</Text>
        
        <View style={styles.groupListCardInfo}>
          <Text style={styles.currentMonthText}>Current Month: {item.currentMonth}</Text>
        </View>

        <View style={styles.groupListProgressSection}>
          <View style={styles.groupListProgressBar}>
            <View 
              style={[
                styles.groupListProgressFill, 
                { width: `${(item.currentMonth / item.totalMonths) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.groupListProgressText}>
            {item.currentMonth}/{item.totalMonths} months
          </Text>
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Group</Text>
        </View>

        <View style={styles.groupListContainer}>
          {/* Summary Stats */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Portfolio Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{userGroups.length}</Text>
                <Text style={styles.summaryStatLabel}>Total Groups</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {userGroups.filter(g => g.paymentStatus === 'completed').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Paid</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {userGroups.filter(g => g.paymentStatus === 'pending').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Groups Grid */}
          <FlatList
            data={userGroups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.groupListContent}
            columnWrapperStyle={styles.groupListRow}
          />
        </View>
      </View>
    );
  };

  // Group Details View Component (with traditional chit details)
  const GroupDetailsView = () => {
    if (!selectedGroup) return null;

    // Create 20 rows for chit details table
    const chitRows = Array.from({ length: 20 }, (_, index) => ({
      serialNo: index + 1,
      date: index < selectedGroup.currentMonth ? `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/09/2024` : '',
      auctionAmount: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 5000) + 15000 : '',
      receivedAmount: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 3000) + 12000 : '',
      commission: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 500) + 200 : '',
      signature: index < selectedGroup.currentMonth ? '✓' : '',
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToGroupList}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedGroup.groupName}</Text>
          <TouchableOpacity style={styles.headerRight}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.groupDetailsContainer} showsVerticalScrollIndicator={false}>

          {/* Traditional Chit Details Table */}
          <View style={styles.chitDetailsCard}>
            <Text style={styles.chitDetailsTitle}>Chit Payment Details</Text>
            
            {/* Table Header */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>எண்</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>தேதி</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>எலத் தள்ளுபடி</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>க.வே. தொகை</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>கசர்</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>கையொப்பம்</Text>
              </View>

              {/* Table Body */}
              <ScrollView style={styles.tableBody} nestedScrollEnabled>
                {chitRows.map((row) => (
                  <View key={row.serialNo} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.date}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.auctionAmount ? formatCurrency(row.auctionAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.receivedAmount ? formatCurrency(row.receivedAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.commission ? formatCurrency(row.commission) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.signature}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.payButton}>
              <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Make Payment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.detailsButton}>
              <MaterialCommunityIcons name="download" size={20} color="#6B46C1" />
              <Text style={styles.detailsButtonText}>Download Statement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.safeArea}>
      {currentView === 'groupList' ? <GroupListView /> : <GroupDetailsView />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container styles
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: -27
  },
  header: {
    marginTop:-10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d5d6ddff',
    elevation: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginBottom: -10,
  },
  headerTitle: {
    marginBottom: -10,
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginTop: 9,
  },

  // Group List Styles
  groupListContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  groupListContent: {
    paddingBottom: 20
    ,
  },
  groupListRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupListCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupListCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2A4E',
    flex: 1,
    marginRight: 8,
  },
  groupListStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  groupListStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupListCardId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: 8,
  },
  groupListCardInfo: {
    marginBottom: 16,
  },
  currentMonthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
    marginBottom: 8,
  },

  groupListProgressSection: {
    marginBottom: 12,
  },
  groupListProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  groupListProgressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  groupListProgressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Status Badge Styles
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompletedText: {
    color: '#065F46',
  },
  statusPendingText: {
    color: '#92400E',
  },

  // Group Details Styles
  groupDetailsContainer: {
    flex: 1,
    padding: 16,
  },

  // Chit Details Table Styles
  chitDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flex: 1,
  },
  chitDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  tableHeaderCell: {
    padding: 8,
    fontWeight: '700',
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#4CAF50',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    padding: 8,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#C8E6C9',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B46C1',
    gap: 8,
  },
  detailsButtonText: {
    color: '#6B46C1',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default GroupCard;
