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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },

  // Group Info Header
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  groupNameTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#111827',
    fontWeight: '700',
  },
  groupIdText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
    marginTop: 4,
    display: 'none',
  },
  statusBadge: {
    display: 'none',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
  },

  // Month Calendar
  monthCalendarContainer: {
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  monthCalendarLabel: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
    marginBottom: 14,
  },
  monthSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
    color: '#3B82F6',
  },
  monthDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#111827',
    fontWeight: '700',
  },
  currentMonthBadge: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
  monthYearDisplay: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarDay: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  calendarDayActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  calendarDayText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#4B5563',
    fontWeight: '500',
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
    fontSize: 13,
  },

  // Status Card
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  daysInfo: {
    alignItems: 'center',
  },
  daysValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#F59E0B',
    fontWeight: '700',
  },
  daysLabel: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
  },
  paidInfo: {
    alignItems: 'flex-end',
  },
  paidLabel: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
  },
  paidDate: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },

  // Modal Card Style
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalCardHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardIconBgWinner: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalCardTitle: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
  },
  modalCardSubtitle: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
    marginTop: 2,
  },
  modalCardContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalCardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Form Card Style - Payment Details
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  formGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  formRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '700',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  labelWithIconStack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  labelTextStack: {
    flex: 1,
  },
  formLabelEnglish: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 14,
    marginLeft: -15,
  },
  formLabelTamil: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 14,
  },
  inputFieldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#9CA3AF',
    fontWeight: '600',
    marginRight: 6,
  },
  inputValue: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#212121',
  },
  inputFieldHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputValueHighlight: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#1E40AF',
    fontWeight: '600',
  },
  dueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  dueTextForm: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Payment Breakdown
  paymentBreakdown: {
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  breakdownItemLabel: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
  },
  breakdownItemValue: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#1E293B',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#10B981',
    fontWeight: '600',
  },
  commissionValue: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#F59E0B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerBold: {
    height: 1.5,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  totalItem: {
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#059669',
    fontWeight: '700',
  },
  dueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dueText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },

  // Winner Container
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  winnerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  winnerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    color: '#111827',
    fontWeight: '600',
  },
  winnerDateLabel: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
    marginTop: 2,
  },
  winnerAmount: {
    alignItems: 'flex-end',
  },
  winnerAmountLabel: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
    color: '#6B7280',
    fontWeight: '500',
  },
  winnerAmountValue: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
    marginTop: 8,
  },
  payNowButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
  },
  contactAdminButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  contactAdminButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
    fontWeight: '600',
  },

  // Info Cards
  infoCardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#1E3A8A',
    lineHeight: 18,
  },

  winnerInfo: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
    color: '#6B7280',
    flex: 1,
  },
});

export default GroupCardInfo;