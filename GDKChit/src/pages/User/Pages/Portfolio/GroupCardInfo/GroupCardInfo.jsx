import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import styles from './GroupCardInfoSty';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';

const GroupCardInfo = ({ onClose, group }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Use real group data passed from Portfolio
  const groupInfo = {
    name: group?.groupName || group?.name || 'Group A',
    monthlyAmount: group?.monthlyContribution || group?.monthlyAmount || 5000,
    status: group?.paymentStatus || group?.status || 'pending',
    groupId: group?.groupId || 'GRP-2024-001',
  };

  // Helper function to get last 12 months
  const getLastMonths = () => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      months.push({
        key,
        date,
        display: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      });
    }
    return months;
  };

  const availableMonths = getLastMonths();
  const monthKey = selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  // Generate mock monthly data based on real group data
  const monthlyData = {
    'Dec 2024': {
      status: groupInfo.status || 'pending',
      paymentAmount: groupInfo.monthlyAmount || 5000,
      discount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.02),
      commission: Math.floor((groupInfo.monthlyAmount || 5000) * 0.01),
      netAmount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.97),
      dueDate: '2024-12-25',
      auctionWinner: 'Rajesh Kumar',
      amountTaken: (groupInfo.monthlyAmount || 5000) * 9,
      auctionDate: '2024-12-01',
      daysPending: 5,
    },
    'Nov 2024': {
      status: 'paid',
      paymentAmount: groupInfo.monthlyAmount || 5000,
      discount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.03),
      commission: Math.floor((groupInfo.monthlyAmount || 5000) * 0.015),
      netAmount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.955),
      dueDate: '2024-11-25',
      auctionWinner: 'Priya Singh',
      amountTaken: (groupInfo.monthlyAmount || 5000) * 8.4,
      auctionDate: '2024-11-01',
      paidDate: '2024-11-20',
    },
    'Oct 2024': {
      status: 'paid',
      paymentAmount: groupInfo.monthlyAmount || 5000,
      discount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.04),
      commission: Math.floor((groupInfo.monthlyAmount || 5000) * 0.02),
      netAmount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.94),
      dueDate: '2024-10-25',
      auctionWinner: 'Amit Sharma',
      amountTaken: 40000,
      auctionDate: '2024-10-01',
      paidDate: '2024-10-23',
    },
  };

  const monthData = monthlyData[monthKey] || {
    status: 'pending',
    paymentAmount: groupInfo.monthlyAmount || 5000,
    discount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.02),
    commission: Math.floor((groupInfo.monthlyAmount || 5000) * 0.01),
    netAmount: Math.floor((groupInfo.monthlyAmount || 5000) * 0.97),
    dueDate: '2024-12-25',
    auctionWinner: 'N/A',
    amountTaken: 0,
    auctionDate: 'N/A',
    daysPending: 5,
  };

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = () => {
    switch (monthData.status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (monthData.status) {
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'information';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Chit Group Details"
        onBack={onClose}
        showBackButton={true}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Group Info Header */}
        <View style={styles.groupInfoHeader}>
          <Text style={styles.groupNameTitle}>{groupInfo.name}</Text>
        </View>

        {/* Month Selector Calendar */}
        <View style={styles.monthCalendarContainer}>
          <View style={styles.monthSelectorHeader}>
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              style={styles.monthNavButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color="#3B82F6" />
              <Text style={styles.monthNavButtonText}>Previous</Text>
            </TouchableOpacity>
            
            <View style={styles.monthDisplay}>
              <Text style={styles.monthLabel}>Viewing Month</Text>
              <Text style={styles.monthValue}>
                {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              {selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) === 
               new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) && 
               <Text style={styles.currentMonthBadge}>(Current)</Text>
              }
            </View>
            
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              style={[styles.monthNavButton, selectedDate >= today && styles.monthNavButtonDisabled]}
              disabled={selectedDate >= today}
            >
              <Text style={styles.monthNavButtonText}>Next</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={22} 
                color={selectedDate >= today ? '#D1D5DB' : '#3B82F6'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: `${getStatusColor()}15` }]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor() }]}>
              <MaterialCommunityIcons name={getStatusIcon()} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Payment Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor() }]}>
                {monthData.status.charAt(0).toUpperCase() + monthData.status.slice(1)}
              </Text>
            </View>
            {monthData.status === 'pending' && monthData.daysPending && (
              <View style={styles.daysInfo}>
                <Text style={styles.daysValue}>{monthData.daysPending}</Text>
                <Text style={styles.daysLabel}>days left</Text>
              </View>
            )}
            {monthData.status === 'paid' && monthData.paidDate && (
              <View style={styles.paidInfo}>
                <Text style={styles.paidLabel}>Paid on</Text>
                <Text style={styles.paidDate}>{formatDate(monthData.paidDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Breakdown Card - Input Form Style */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Payment Breakdown</Text>
          </View>

          <View style={styles.formDivider} />

          {/* Amount to be Paid */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Amount to be Paid This Month <Text style={styles.requiredAsterisk}>*</Text></Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.inputValue}>{monthData.paymentAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Discount and Commission - Side by Side */}
          <View style={styles.formRowContainer}>
            <View style={styles.formGroupHalf}>
              <View style={styles.labelWithIconStack}>
                <MaterialCommunityIcons name="trending-down" size={14} color="#6B7280" />
                <View style={styles.labelTextStack}>
                  <Text style={styles.formLabelTamil}>எலத் தள்ளுபடி</Text>
                  <Text style={styles.formLabelEnglish}>(Discount)</Text>
                </View>
              </View>
              <View style={styles.inputFieldDisplay}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.inputValue}>{monthData.discount.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.formGroupHalf}>
              <View style={styles.labelWithIconStack}>
                <MaterialCommunityIcons name="percent" size={14} color="#6B7280" />
                <View style={styles.labelTextStack}>
                  <Text style={styles.formLabelTamil}>கசர்</Text>
                  <Text style={styles.formLabelEnglish}>(Commission)</Text>
                </View>
              </View>
              <View style={styles.inputFieldDisplay}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.inputValue}>{monthData.commission.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {monthData.status === 'pending' && (
            <View style={styles.dueSection}>
              <MaterialCommunityIcons name="calendar-alert" size={16} color="#EF4444" />
              <Text style={styles.dueTextForm}>Due by {formatDate(monthData.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Auction Winner Card - Form Style */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Chit Auction Winner</Text>
          </View>

          <View style={styles.formDivider} />

          {/* Winner Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Winner Name</Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.inputValue}>{monthData.auctionWinner}</Text>
            </View>
          </View>

          {/* Amount Taken */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Amount Taken</Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.inputValue}>{monthData.amountTaken.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Auction Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Auction Date</Text>
            <View style={[styles.inputFieldDisplay, { justifyContent: 'flex-start' }]}>
              <MaterialCommunityIcons name="calendar" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <Text style={styles.inputValue}>{formatDate(monthData.auctionDate)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {monthData.status === 'pending' && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.payNowButton}>
              <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactAdminButton}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#3B82F6" />
              <Text style={styles.contactAdminButtonText}>Contact Admin</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupCardInfo;