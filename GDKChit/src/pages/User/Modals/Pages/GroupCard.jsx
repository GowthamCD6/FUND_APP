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
  TextInput,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GroupCard = ({ onBack }) => {
  const [currentView, setCurrentView] = useState('groupList'); // 'groupList' or 'groupDetails'
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [userOtp, setUserOtp] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [otpStep, setOtpStep] = useState('user'); // 'user' or 'admin'

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

  // OTP Handler Functions
  const handleMonthClick = (monthIndex) => {
    if (monthIndex < selectedGroup.currentMonth) {
      // Already completed month
      return;
    }
    if (monthIndex === selectedGroup.currentMonth) {
      // Current month - initiate OTP process
      setSelectedMonth(monthIndex);
      setShowOtpModal(true);
      setOtpStep('user');
      setUserOtp('');
      setAdminOtp('');
    }
  };

  const handleUserOtpSubmit = () => {
    if (userOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    // Simulate OTP verification (you would call your API here)
    if (userOtp === '123456') { // Demo OTP
      setOtpStep('admin');
    } else {
      Alert.alert('Error', 'Invalid User OTP. Please try again.');
      setUserOtp('');
    }
  };

  const handleAdminOtpSubmit = () => {
    if (adminOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit Admin OTP');
      return;
    }
    // Simulate Admin OTP verification (you would call your API here)
    if (adminOtp === '654321') { // Demo Admin OTP
      // Mark month as completed
      Alert.alert('Success', 'Month payment completed successfully!');
      setShowOtpModal(false);
      setSelectedMonth(null);
      setOtpStep('user');
      setUserOtp('');
      setAdminOtp('');
      // Here you would update the group data
    } else {
      Alert.alert('Error', 'Invalid Admin OTP. Please try again.');
      setAdminOtp('');
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setSelectedMonth(null);
    setOtpStep('user');
    setUserOtp('');
    setAdminOtp('');
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
                {chitRows.map((row) => {
                  const isCompleted = row.serialNo < selectedGroup.currentMonth;
                  const isCurrentMonth = row.serialNo === selectedGroup.currentMonth;
                  const isFutureMonth = row.serialNo > selectedGroup.currentMonth;
                  
                  return (
                    <TouchableOpacity 
                      key={row.serialNo} 
                      style={styles.tableRow}
                      onPress={() => handleMonthClick(row.serialNo)}
                      disabled={isFutureMonth}
                      activeOpacity={isFutureMonth ? 1 : 0.7}
                    >
                      <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.auctionAmount ? formatCurrency(row.auctionAmount) : ''}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.receivedAmount ? formatCurrency(row.receivedAmount) : ''}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.commission ? formatCurrency(row.commission) : ''}</Text>
                      <View style={[styles.tableCell, { flex: 1.2, alignItems: 'center' }]}>
                        {isCompleted ? (
                          <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                        ) : isCurrentMonth ? (
                          <MaterialCommunityIcons name="lock" size={16} color="#FF9800" />
                        ) : (
                          <MaterialCommunityIcons name="clock-outline" size={16} color="#9E9E9E" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
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

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <View style={styles.otpModalOverlay}>
            <View style={styles.otpModalContainer}>
              <View style={styles.otpModalHeader}>
                <Text style={styles.otpModalTitle}>
                  {otpStep === 'user' ? 'User OTP Verification' : 'Admin OTP Verification'}
                </Text>
                <TouchableOpacity onPress={handleCloseOtpModal}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.otpModalSubtitle}>
                Month {selectedMonth} Payment Verification
              </Text>
              
              <View style={styles.otpStepsContainer}>
                <View style={[styles.otpStep, otpStep === 'user' && styles.activeOtpStep]}>
                  <MaterialCommunityIcons 
                    name={otpStep === 'admin' ? "check-circle" : "account"} 
                    size={20} 
                    color={otpStep === 'admin' ? "#4CAF50" : "#6B46C1"} 
                  />
                  <Text style={styles.otpStepText}>User OTP</Text>
                </View>
                
                <View style={styles.otpStepLine} />
                
                <View style={[styles.otpStep, otpStep === 'admin' && styles.activeOtpStep]}>
                  <MaterialCommunityIcons 
                    name="shield-account" 
                    size={20} 
                    color={otpStep === 'admin' ? "#6B46C1" : "#9E9E9E"} 
                  />
                  <Text style={styles.otpStepText}>Admin OTP</Text>
                </View>
              </View>

              <View style={styles.otpInputContainer}>
                <Text style={styles.otpInputLabel}>
                  Enter {otpStep === 'user' ? 'User' : 'Admin'} OTP (6 digits)
                </Text>
                <TextInput
                  style={styles.otpInput}
                  value={otpStep === 'user' ? userOtp : adminOtp}
                  onChangeText={otpStep === 'user' ? setUserOtp : setAdminOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="000000"
                  textAlign="center"
                />
              </View>

              <View style={styles.otpModalButtons}>
                <TouchableOpacity style={styles.otpCancelButton} onPress={handleCloseOtpModal}>
                  <Text style={styles.otpCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.otpSubmitButton} 
                  onPress={otpStep === 'user' ? handleUserOtpSubmit : handleAdminOtpSubmit}
                >
                  <Text style={styles.otpSubmitButtonText}>
                    {otpStep === 'user' ? 'Next' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    // minHeight: '80%',
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
    maxHeight: 475,
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

  // OTP Modal Styles
  otpModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  otpModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // OTP Steps
  otpStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeOtpStep: {
    backgroundColor: '#EBF4FF',
    borderColor: '#6B46C1',
    borderWidth: 1,
  },
  otpStepText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  otpStepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // OTP Input
  otpInputContainer: {
    marginBottom: 24,
  },
  otpInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 8,
    backgroundColor: '#F9FAFB',
  },

  // OTP Buttons
  otpModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  otpSubmitButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GroupCard;
