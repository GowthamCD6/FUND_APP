import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './MemberDetailsStyles';

const { width } = Dimensions.get('window');

const MemberDetails = ({ route, navigation }) => {
  const { group } = route.params || {};
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  
  // Extended sample data with payment history and auction winners
  const [groupData, setGroupData] = useState({
    ...group,
    members: group?.members?.map(member => ({
      ...member,
      paymentHistory: generatePaymentHistory(member.id),
      auctionWins: generateAuctionWins(member.id) // New: Auction wins data
    })) || []
  });

  // Generate auction wins for each member
  function generateAuctionWins(memberId) {
    const wins = [];
    const startDate = new Date(group.startDate);
    const currentDate = new Date();
    
    let date = new Date(startDate);
    let winCount = 0;
    
    while (date <= currentDate && winCount < 3) { // Simulate up to 3 wins per member
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Randomly decide if member won auction this month (20% chance)
      if (Math.random() > 0.8) {
        const auctionAmount = group.monthlyAmount * group.members.length;
        wins.push({
          month: month,
          year: year,
          monthName: monthName,
          auctionAmount: auctionAmount,
          bidAmount: Math.floor(auctionAmount * (0.85 + Math.random() * 0.1)), // 85-95% of total
          receivedAmount: Math.floor(auctionAmount * (0.85 + Math.random() * 0.1)),
          auctionDate: new Date(year, month, Math.floor(Math.random() * 28) + 1).toISOString(),
        });
        winCount++;
      }
      
      date.setMonth(date.getMonth() + 1);
    }
    
    return wins;
  }

  // Generate payment history for each member
  function generatePaymentHistory(memberId) {
    const history = [];
    const startDate = new Date(group.startDate);
    const currentDate = new Date();
    
    let date = new Date(startDate);
    while (date <= currentDate) {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Simulate payment data
      const statuses = ['paid', 'pending', 'overdue'];
      const randomStatus = Math.random() > 0.2 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue');
      
      history.push({
        month: month,
        year: year,
        monthName: monthName,
        status: randomStatus,
        amount: group.monthlyAmount,
        paidDate: randomStatus === 'paid' ? new Date(year, month, Math.floor(Math.random() * 28) + 1).toISOString() : null,
        dueDate: new Date(year, month, 15).toISOString(),
        receiptNumber: randomStatus === 'paid' ? `RCP${memberId}${year}${month}${Math.floor(Math.random() * 1000)}` : null
      });
      
      date.setMonth(date.getMonth() + 1);
    }
    
    return history.reverse(); // Latest first
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'overdue': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if member is auction winner for selected month
  const isAuctionWinnerForMonth = (member) => {
    return member.auctionWins?.find(
      win => win.month === selectedMonth && win.year === selectedYear
    );
  };

  const getCurrentMonthPayments = () => {
    return groupData.members.map(member => {
      const currentMonthPayment = member.paymentHistory.find(
        payment => payment.month === selectedMonth && payment.year === selectedYear
      );
      const auctionWin = isAuctionWinnerForMonth(member);
      
      return {
        ...member,
        currentPayment: currentMonthPayment || {
          status: 'pending',
          amount: group.monthlyAmount,
          monthName: `${months[selectedMonth]} ${selectedYear}`
        },
        isAuctionWinner: !!auctionWin,
        auctionDetails: auctionWin || null
      };
    });
  };

  const getMonthlyStats = () => {
    const currentMonthData = getCurrentMonthPayments();
    const paid = currentMonthData.filter(m => m.currentPayment.status === 'paid').length;
    const pending = currentMonthData.filter(m => m.currentPayment.status === 'pending').length;
    const overdue = currentMonthData.filter(m => m.currentPayment.status === 'overdue').length;
    const totalAmount = paid * group.monthlyAmount;
    
    return { paid, pending, overdue, totalAmount, total: currentMonthData.length };
  };

  const updatePaymentStatus = (memberId, newStatus) => {
    setGroupData(prev => ({
      ...prev,
      members: prev.members.map(member => {
        if (member.id === memberId) {
          const updatedHistory = member.paymentHistory.map(payment => {
            if (payment.month === selectedMonth && payment.year === selectedYear) {
              return {
                ...payment,
                status: newStatus,
                paidDate: newStatus === 'paid' ? new Date().toISOString() : null,
                receiptNumber: newStatus === 'paid' ? `RCP${memberId}${selectedYear}${selectedMonth}${Date.now()}` : null
              };
            }
            return payment;
          });
          return { ...member, paymentHistory: updatedHistory };
        }
        return member;
      })
    }));
  };

  const renderMemberCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.memberCard,
          item.isAuctionWinner && styles.auctionWinnerCard
        ]}
        onPress={() => setSelectedMember(item)}
        activeOpacity={0.7}
      >
        {/* Member Info Section */}
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatarContainer}>
            <View style={[
              styles.memberAvatar,
              item.isAuctionWinner && styles.auctionWinnerAvatar
            ]}>
              <Text style={styles.memberAvatarText}>
                {item.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Text>
            </View>
            {/* Crown Icon for Auction Winner */}
            {item.isAuctionWinner && (
              <View style={styles.crownContainer}>
                <MaterialCommunityIcons 
                  name="crown" 
                  size={18} 
                  color="#FFD700" 
                />
              </View>
            )}
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{item.name}</Text>
              {item.isAuctionWinner && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>Winner</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberPhone}>{item.phone}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.memberAmount}>{formatCurrency(item.currentPayment.amount)}</Text>
              
              {/* Auction Amount Display */}
              {item.isAuctionWinner && item.auctionDetails && (
                <View style={styles.auctionAmountContainer}>
                  <MaterialCommunityIcons name="trophy" size={12} color="#F59E0B" />
                  <Text style={styles.auctionAmountText}>
                    {formatCurrency(item.auctionDetails.receivedAmount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.statusAndArrowContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.currentPayment.status) }]}>
              <MaterialCommunityIcons 
                name={getStatusIcon(item.currentPayment.status)} 
                size={10} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{item.currentPayment.status}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" style={styles.arrowIcon} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyMonth}>{item.monthName}</Text>
        <View style={[styles.historyStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialCommunityIcons name={getStatusIcon(item.status)} size={10} color="#FFFFFF" />
          <Text style={styles.historyStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.historyDate}>
          {item.status === 'paid' ? `Paid: ${formatDate(item.paidDate)}` : `Due: ${formatDate(item.dueDate)}`}
        </Text>
        {item.receiptNumber && (
          <Text style={styles.receiptNumber}>Receipt: {item.receiptNumber}</Text>
        )}
      </View>
    </View>
  );

  const renderAuctionHistoryItem = ({ item }) => (
    <View style={styles.auctionHistoryItem}>
      <View style={styles.auctionHistoryHeader}>
        <View style={styles.auctionHistoryTitleRow}>
          <MaterialCommunityIcons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.auctionHistoryMonth}>{item.monthName}</Text>
        </View>
        <View style={styles.auctionWinBadge}>
          <MaterialCommunityIcons name="crown" size={10} color="#FFFFFF" />
          <Text style={styles.auctionWinBadgeText}>WON</Text>
        </View>
      </View>
      <View style={styles.auctionHistoryDetails}>
        <View style={styles.auctionAmountRow}>
          <Text style={styles.auctionLabel}>Auction Amount:</Text>
          <Text style={styles.auctionAmount}>{formatCurrency(item.auctionAmount)}</Text>
        </View>
        <View style={styles.auctionAmountRow}>
          <Text style={styles.auctionLabel}>Bid Amount:</Text>
          <Text style={styles.auctionBidAmount}>{formatCurrency(item.bidAmount)}</Text>
        </View>
        <View style={styles.auctionAmountRow}>
          <Text style={styles.auctionLabel}>Received:</Text>
          <Text style={styles.auctionReceivedAmount}>{formatCurrency(item.receivedAmount)}</Text>
        </View>
        <Text style={styles.auctionDate}>Won on: {formatDate(item.auctionDate)}</Text>
      </View>
    </View>
  );

  const stats = getMonthlyStats();
  // Sort to put auction winners at the top
  const currentMonthPayments = getCurrentMonthPayments().sort((a, b) => {
    if (a.isAuctionWinner && !b.isAuctionWinner) return -1;
    if (!a.isAuctionWinner && b.isAuctionWinner) return 1;
    return 0;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{group?.name}</Text>
        </View>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthLabel}>Payment Details for:</Text>
          {isCurrentMonth && <Text style={styles.currentMonthBadge}>Current Month</Text>}
        </View>
        <TouchableOpacity 
          style={styles.monthButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
          <Text style={styles.monthText}>{months[selectedMonth]} {selectedYear}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Monthly Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats.paid}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.statValue}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={currentMonthPayments}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Member Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedMember !== null}
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
                  {selectedMember?.isAuctionWinner && (
                    <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
                  )}
                </View>
                <Text style={styles.modalSubtitle}>{selectedMember?.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedMember(null)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>Payment History</Text>
            
            <FlatList
              data={selectedMember?.paymentHistory || []}
              renderItem={renderPaymentHistoryItem}
              keyExtractor={(item, index) => `${item.year}-${item.month}-${index}`}
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
            />

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.markPaidButton]}
                onPress={() => {
                  updatePaymentStatus(selectedMember.id, 'paid');
                  Alert.alert('Success', 'Payment marked as paid');
                }}
                disabled={selectedMember?.currentPayment?.status === 'paid'}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalActionButtonText}>
                  {selectedMember?.currentPayment?.status === 'paid' ? 'Already Paid' : 'Mark as Paid'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMonthPicker}
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.monthList}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthItem,
                    selectedMonth === index && styles.selectedMonthItem
                  ]}
                  onPress={() => {
                    setSelectedMonth(index);
                    setIsCurrentMonth(index === new Date().getMonth() && selectedYear === new Date().getFullYear());
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[
                    styles.monthItemText,
                    selectedMonth === index && styles.selectedMonthItemText
                  ]}>
                    {month} {selectedYear}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MemberDetails;