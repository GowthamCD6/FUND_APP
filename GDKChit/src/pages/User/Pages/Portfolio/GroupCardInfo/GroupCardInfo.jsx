import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './GroupCardInfoSty';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';
import { useLanguage } from '../../../../../utils/LanguageContext';

const GroupCardInfo = ({ onClose, group }) => {
  const { t, language } = useLanguage();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Use real group data passed from Portfolio
  const groupInfo = {
    name: group?.name || 'Group A',
    monthlyAmount: group?.monthlyAmount || 5000,
    status: group?.status || 'pending',
    groupId: group?.groupId || 'GRP-2024-001',
    startDate: group?.startDate || null,
  };

  const monthNamesArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthKey = `${monthNamesArray[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  let minDate = new Date(1900, 0, 1);
  if (groupInfo.startDate) {
    const parseStart = new Date(groupInfo.startDate);
    if (!isNaN(parseStart)) {
      minDate = new Date(parseStart.getFullYear(), parseStart.getMonth(), 1);
    }
  }

  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const isPrevDisabled = selectedDate <= minDate;
  const isNextDisabled = selectedDate >= currentMonthDate;

  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyInfo = async () => {
      try {
        setLoading(true);
        const result = await ApiService.getGroupMonthlyInfo(group.id || groupInfo.groupId);
        if (result?.success && result?.data) {
          setMonthlyData(result.data);
        }
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (groupInfo.groupId) {
      fetchMonthlyInfo();
    } else {
      setLoading(false);
    }
  }, [groupInfo.groupId]);

  const monthData = monthlyData[monthKey] || {
    status: 'pending',
    paymentAmount: null,
    discount: null,
    commission: null,
    netAmount: null,
    dueDate: null,
    auctionWinner: null,
    amountTaken: null,
    auctionDate: null,
    paidDate: null,
    daysPending: 0,
  };

  const effectiveDueDate = monthData.dueDate || null;

  const formatCurrency = (amount) => {
    if (amount == null || amount === '' || isNaN(amount)) return 'nil';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const displayNil = (value) => {
    if (value == null || value === '') return 'nil';
    return String(value);
  };

  const getAmountToPay = () => {
    if (monthData.paymentAmount != null && !isNaN(monthData.paymentAmount)) {
      return monthData.paymentAmount;
    }
    if (monthData.netAmount != null && !isNaN(monthData.netAmount)) {
      return monthData.netAmount;
    }
    return null;
  };

  const amountToPayThisMonth = getAmountToPay();

  const formatDate = (dateString) => {
    if (!dateString) return 'nil';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
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
              style={[styles.monthNavButton, isPrevDisabled && styles.monthNavButtonDisabled]}
              disabled={isPrevDisabled}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={isPrevDisabled ? '#D1D5DB' : '#3B82F6'} />
              <Text style={[styles.monthNavButtonText, isPrevDisabled && { color: '#D1D5DB' }, language === 'ta' && { fontSize: 13 }]}>{t('Previous')}</Text>
            </TouchableOpacity>
            
            <View style={styles.monthDisplay}>
              <Text style={[styles.monthLabel, language === 'ta' && { fontSize: 11 }]}>{t('Viewing Month')}</Text>
              <Text style={styles.monthValue}>
                {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              {selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) === 
               today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) ? (
               <Text style={[styles.currentMonthBadge, language === 'ta' && { fontSize: 11 }]}>{t('(Current)')}</Text>
              ) : null}
            </View>
            
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              style={[styles.monthNavButton, isNextDisabled && styles.monthNavButtonDisabled]}
              disabled={isNextDisabled}
            >
              <Text style={[styles.monthNavButtonText, isNextDisabled && { color: '#D1D5DB' }, language === 'ta' && { fontSize: 13 }]}>{t('Next')}</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={22} 
                color={isNextDisabled ? '#D1D5DB' : '#3B82F6'} 
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
              <Text style={[styles.statusLabel, language === 'ta' && { fontSize: 11 }]}>{t('Payment Status')}</Text>
              <Text style={[styles.statusValue, { color: getStatusColor() }, language === 'ta' && { fontSize: 14 }]}>
                {t(monthData.status).toUpperCase()}
              </Text>
            </View>
            {(monthData.status === 'pending' || monthData.status === 'overdue') && monthData.daysPending > 0 ? (
              <View style={styles.daysInfo}>
                <Text style={styles.daysValue}>{monthData.daysPending}</Text>
                <Text style={[styles.daysLabel, language === 'ta' && { fontSize: 10 }]}>
                  {monthData.status === 'overdue' ? t('days out') : t('days left')}
                </Text>
              </View>
            ) : null}
            {monthData.status === 'paid' && monthData.paidDate ? (
              <View style={styles.paidInfo}>
                <Text style={[styles.paidLabel, language === 'ta' && { fontSize: 11 }]}>{t('Paid on')}</Text>
                <Text style={styles.paidDate}>{formatDate(monthData.paidDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Payment Breakdown Card - Input Form Style */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, language === 'ta' && { fontSize: 16 }]}>{t('Payment Breakdown')}</Text>
          </View>

          <View style={styles.formDivider} />

          {/* Amount to be Paid */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, language === 'ta' && { fontSize: 13 }]}>{t('Amount to be Paid This Month')} <Text style={styles.requiredAsterisk}>*</Text></Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.inputValue}>{formatCurrency(amountToPayThisMonth)}</Text>
            </View>
          </View>

          {/* Discount and Commission - Side by Side */}
          <View style={styles.formRowContainer}>
            <View style={styles.formGroupHalf}>
              <View style={styles.labelWithIconStack}>
                <MaterialCommunityIcons name="trending-down" size={14} color="#6B7280" />
                <View style={styles.labelTextStack}>
                  <Text style={[styles.formLabelTamil, language === 'ta' && { fontSize: 13 }]}>எலத் தள்ளுபடி</Text>
                  <Text style={[styles.formLabelEnglish, language === 'ta' && { fontSize: 11 }]}>{t('(Discount)')}</Text>
                </View>
              </View>
              <View style={styles.inputFieldDisplay}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.inputValue}>{formatCurrency(monthData.discount)}</Text>
              </View>
            </View>

            <View style={styles.formGroupHalf}>
              <View style={styles.labelWithIconStack}>
                <MaterialCommunityIcons name="percent" size={14} color="#6B7280" />
                <View style={styles.labelTextStack}>
                  <Text style={[styles.formLabelTamil, language === 'ta' && { fontSize: 13 }]}>கசர்</Text>
                  <Text style={[styles.formLabelEnglish, language === 'ta' && { fontSize: 11 }]}>{t('(Commission)')}</Text>
                </View>
              </View>
              <View style={styles.inputFieldDisplay}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.inputValue}>{formatCurrency(monthData.commission)}</Text>
              </View>
            </View>
          </View>

          {(monthData.status === 'pending' || monthData.status === 'overdue') && (
            <View style={styles.dueSection}>
              <MaterialCommunityIcons name="calendar-alert" size={16} color="#EF4444" />
              <Text style={[styles.dueTextForm, language === 'ta' && { fontSize: 12 }]}>
                {monthData.status === 'overdue' ? t('Was due by ') : t('Due by ')}
                {formatDate(effectiveDueDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Auction Winner Card - Form Style */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, language === 'ta' && { fontSize: 16 }]}>{t('Chit Auction Winner')}</Text>
          </View>

          <View style={styles.formDivider} />

          {/* Winner Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, language === 'ta' && { fontSize: 13 }]}>{t('Winner Name')}</Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.inputValue}>{displayNil(monthData.auctionWinner)}</Text>
            </View>
          </View>

          {/* Amount Taken */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, language === 'ta' && { fontSize: 13 }]}>{t('Amount Taken')}</Text>
            <View style={styles.inputFieldDisplay}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.inputValue}>{formatCurrency(monthData.amountTaken)}</Text>
            </View>
          </View>

          {/* Auction Date */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, language === 'ta' && { fontSize: 13 }]}>{t('Auction Date')}</Text>
            <View style={[styles.inputFieldDisplay, { justifyContent: 'flex-start' }]}>
              <MaterialCommunityIcons name="calendar" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <Text style={styles.inputValue}>{formatDate(monthData.auctionDate)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {(monthData.status === 'pending' || monthData.status === 'overdue') && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.payNowButton}>
              <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
              <Text style={[styles.payNowButtonText, language === 'ta' && { fontSize: 14 }]}>{t('Pay Now')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactAdminButton}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#3B82F6" />
              <Text style={[styles.contactAdminButtonText, language === 'ta' && { fontSize: 14 }]}>{t('Contact Admin')}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default GroupCardInfo;