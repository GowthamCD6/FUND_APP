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
  
  // Extended sample data with payment history
  const [groupData, setGroupData] = useState({
    ...group,
    members: group?.members?.map(member => ({
      ...member,
      paymentHistory: generatePaymentHistory(member.id)
    })) || []
  });

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
      case 'paid': return '#10B981';      // Light green
      case 'pending': return '#F59E0B';   // Light orange
      case 'overdue': return '#EF4444';   // Light red
      default: return '#6B7280';          // Light gray
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

  const getCurrentMonthPayments = () => {
    return groupData.members.map(member => {
      const currentMonthPayment = member.paymentHistory.find(
        payment => payment.month === selectedMonth && payment.year === selectedYear
      );
      return {
        ...member,
        currentPayment: currentMonthPayment || {
          status: 'pending',
          amount: group.monthlyAmount,
          monthName: `${months[selectedMonth]} ${selectedYear}`
        }
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
    const stats = getMonthlyStats();
    return (
      <TouchableOpacity 
        style={styles.memberCard}
        onPress={() => setSelectedMember(item)}
        activeOpacity={0.7}
      >
        {/* Member Info Section */}
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatarContainer}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {item.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Text>
            </View>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberPhone}>{item.phone}</Text>
            <Text style={styles.memberAmount}>{formatCurrency(item.currentPayment.amount)}</Text>
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

  const stats = getMonthlyStats();
  const currentMonthPayments = getCurrentMonthPayments();

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
              <View>
                <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
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