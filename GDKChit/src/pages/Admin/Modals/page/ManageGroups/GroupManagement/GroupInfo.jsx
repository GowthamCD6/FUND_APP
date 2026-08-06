import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import pageStyles from '../ManageGsty';
import MemberRegistration from './Page/MemberRegistration'; 
import EditModal from './Modal/EditModal'; 
import PaymentD from './Modal/PaymentD';
import AuctionW from './Modal/AuctionW';
import ApiService from '../../../../../../services/ApiService'; 
import Header from '../../../../../../components/HeaderComponent/Header';

const GroupInfoAdmin = ({ group, onBack, onSave }) => {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = current, -1 = previous
  const [expandedSections, setExpandedSections] = useState({
    groupInfo: true,
    payment: true, // Keep payment section collapsed initially, or remove its toggle if it's always a modal
    winner: true,
    history: false
  });
  console.log(group.id);
  

  // Month-wise data storage
  const [monthlyData, setMonthlyData] = useState([]);

  const [formData, setFormData] = useState({
    groupName: group.name || '',
    groupId: group.id || '',
    monthlyAmount: group.monthlyAmount?.toString() || '',
    groupAmount: group.groupAmount?.toString() || '',
    totalMembers: group.totalMembers?.toString() || '',
    currentMembers: group.currentMembers || 0,
    createdDate: group.createdDate || new Date().toISOString().split('T')[0],
    currentMonthAmount: group.currentMonthAmount?.toString() || group.monthlyAmount?.toString() || '',
    elathThalupadi: group.elathThalupadi?.toString() || '',
    commission: group.commission?.toString() || '',
    chitWinnerName: group.currentChitWinner?.name || '',
    chitWinnerMemberId: group.currentChitWinner?.memberId || '',
    amountTaken: group.currentChitWinner?.amountTaken?.toString() || '',
    datePicked: group.currentChitWinner?.datePicked || '',
  });

  const [memberMappings, setMemberMappings] = useState([]);
  const [errors, setErrors] = useState({});
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showMemberRegistration, setShowMemberRegistration] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // State for PaymentD modal
  const [showAuctionModal, setShowAuctionModal] = useState(false); // State for AuctionW modal
  const groupIdNum = Number(formData.groupId || group.id);

  const getPeriodFromOffset = useCallback((offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      date,
    };
  }, []);

  const loadMonthSnapshot = useCallback(async () => {
    const groupId = Number(formData.groupId || group.id);
    if (!Number.isInteger(groupId)) return;

    try {
      const period = getPeriodFromOffset(currentMonth);
      const response = await ApiService.makeRequest(
        `/admin/groups/getMonthlySnapshot?groupId=${groupId}&month=${period.month}&year=${period.year}`,
        { method: 'GET' },
      );

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to fetch monthly snapshot');
      }

      const payment = result?.data?.payment;
      const winner = result?.data?.winner;

      if (payment) {
        setFormData((prev) => ({
          ...prev,
          currentMonthAmount: payment.currentMonthAmount?.toString() || prev.currentMonthAmount,
          elathThalupadi: payment.elathThalupadi?.toString() || '',
          commission: payment.commission?.toString() || '',
          deadlineDate: payment.deadlineDate || '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          currentMonthAmount: '',
          elathThalupadi: '',
          commission: '',
          deadlineDate: '',
        }));
      }

      if (winner) {
        setFormData((prev) => ({
          ...prev,
          chitWinnerName: winner.chitWinnerName || '',
          chitWinnerMemberId: winner.chitWinnerMemberId || '',
          amountTaken: winner.amountTaken?.toString() || '',
          datePicked: winner.datePicked || '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          chitWinnerName: '',
          chitWinnerMemberId: '',
          amountTaken: '',
          datePicked: '',
        }));
      }

      setMonthlyData((prev) => {
        const withoutCurrent = prev.filter((item) => item.month !== currentMonth);
        return [
          {
            month: currentMonth,
            date: payment?.date || winner?.datePicked || new Date().toISOString().split('T')[0],
            amount: Number(payment?.currentMonthAmount || 0),
            discount: Number(payment?.elathThalupadi || 0),
            commission: Number(payment?.commission || 0),
            hasPayment: Boolean(payment),
            winner: winner
              ? {
                  name: winner.chitWinnerName,
                  memberId: winner.chitWinnerMemberId,
                  amountTaken: Number(winner.amountTaken || 0),
                  date: winner.datePicked,
                }
              : null,
            hasWinner: Boolean(winner),
            mappedMembers: [],
          },
          ...withoutCurrent,
        ];
      });
    } catch (error) {
      console.error('Error loading month snapshot:', error);
    }
  }, [currentMonth, formData.groupId, group.id, getPeriodFromOffset]);

  useEffect(() => {
    loadMonthSnapshot();
  }, [loadMonthSnapshot]);

  // Listener for returning from Live Auction
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('auctionWinnerSelected', (data) => {
      // If the event is for this group
      if (data.groupId === (formData.groupId || group.id)) {
        setFormData(prev => ({
          ...prev,
          chitWinnerName: data.chitWinnerName,
          chitWinnerMemberId: data.chitWinnerMemberId,
          amountTaken: data.amountTaken?.toString() || '',
          datePicked: data.datePicked
        }));
        setShowAuctionModal(true); // Auto-open the modal so the admin can verify and save
      }
    });

    return () => {
      subscription.remove();
    };
  }, [formData.groupId, group.id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openEditGroupModal = () => {
    setShowEditGroupModal(true);
  };

  const handleEditSave = async (updatedData) => {
    try {
      const payload = {
        groupId: groupIdNum,
        groupName: updatedData.groupName,
        totalAmount: updatedData.totalAmount,
        numberOfUsers: updatedData.numberOfUsers,
        createdDate: updatedData.createdDate,
      };

      const response = await ApiService.makeRequest('/admin/groups/updateGroup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      let result;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response: ${text.substring(0, 200)}`);
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to update group');
      }

      setFormData(prev => ({
        ...prev,
        groupName: updatedData.groupName,
        groupAmount: updatedData.totalAmount,
        monthlyAmount: Math.round(Number(updatedData.totalAmount) / (Number(updatedData.numberOfUsers) || 1)).toString(),
        totalMembers: updatedData.numberOfUsers,
        createdDate: updatedData.createdDate,
      }));
      
      // Update the group object so the EditModal can access the updated numberOfUsers
      if (group.totalMembers !== updatedData.numberOfUsers) {
        group.totalMembers = updatedData.numberOfUsers;
      }
      
      Alert.alert('Success', 'Group information updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Error', 'Failed to update group. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleEditGroupChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Group Info validation
    if (!formData.groupName || formData.groupName.trim() === '') {
      newErrors.groupName = 'Group name is required';
    }

    if (!formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0) {
      newErrors.monthlyAmount = 'Please enter a valid monthly amount';
    }

    // Moved payment validation to PaymentD component, but keep currentMonthAmount for overall save
    if (!formData.currentMonthAmount || parseFloat(formData.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid amount';
    }


    const hasChitWinnerData = formData.chitWinnerName || formData.chitWinnerMemberId ||
                               formData.amountTaken || formData.datePicked;

    if (hasChitWinnerData) {
      if (!formData.chitWinnerName) newErrors.chitWinnerName = 'Winner name is required';
      if (!formData.chitWinnerMemberId) newErrors.chitWinnerMemberId = 'Member ID is required';
      if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) {
        newErrors.amountTaken = 'Please enter valid amount taken';
      }
      if (!formData.datePicked) newErrors.datePicked = 'Date picked is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle saving payment details from the modal
  const handlePaymentSave = async (paymentData) => {
    const groupId = Number(formData.groupId || group.id);
    const period = getPeriodFromOffset(currentMonth);

    try {
      const response = await ApiService.makeRequest('/admin/groups/saveMonthlyDetails', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          month: period.month,
          year: period.year,
          currentMonthAmount: Number(paymentData.currentMonthAmount) || 0,
          elathThalupadi: Number(paymentData.elathThalupadi) || 0,
          commission: Number(paymentData.commission) || 0,
          deadlineDate: paymentData.deadlineDate || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save payment details');
      }

      setFormData(prev => ({
        ...prev,
        currentMonthAmount: paymentData.currentMonthAmount,
        elathThalupadi: paymentData.elathThalupadi,
        commission: paymentData.commission,
        deadlineDate: paymentData.deadlineDate,
      }));

      setMonthlyData((prev) => {
        const currentEntry = prev.find((item) => item.month === currentMonth);
        const withoutCurrent = prev.filter((item) => item.month !== currentMonth);
        return [
          {
            month: currentMonth,
            date: new Date().toISOString().split('T')[0],
            amount: Number(paymentData.currentMonthAmount) || 0,
            discount: Number(paymentData.elathThalupadi) || 0,
            commission: Number(paymentData.commission) || 0,
            hasPayment: true,
            winner: currentEntry?.winner || null,
            hasWinner: Boolean(currentEntry?.winner),
            mappedMembers: [],
          },
          ...withoutCurrent,
        ];
      });

      setShowPaymentModal(false);
      Alert.alert('Success', 'Payment details saved');
    } catch (error) {
      console.error('Error saving payment details:', error);
      Alert.alert('Error', error.message || 'Failed to save payment details');
    }
  };

  const handleMembersUpdate = (newMemberCount) => {
    setFormData(prev => ({
      ...prev,
      currentMembers: newMemberCount,
    }));
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    const dataToSave = {
      // Group Info
      groupName: formData.groupName,
      monthlyAmount: parseFloat(formData.monthlyAmount),
      createdDate: formData.createdDate,

      // Monthly Data
      month: currentMonth,
      date: new Date().toISOString().split('T')[0],
      currentMonthAmount: parseFloat(formData.currentMonthAmount),
      elathThalupadi: formData.elathThalupadi ? parseFloat(formData.elathThalupadi) : 0,
      commission: formData.commission ? parseFloat(formData.commission) : 0,
      currentChitWinner: formData.chitWinnerName ? {
        name: formData.chitWinnerName,
        memberId: formData.chitWinnerMemberId,
        amountTaken: parseFloat(formData.amountTaken),
        datePicked: formData.datePicked,
      } : null,
      memberMappings: memberMappings
    };

    onSave(dataToSave);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Auction winner date picker moved inside AuctionW modal

  const openCreatedDatePicker = () => {
    if (formData.createdDate) {
      setSelectedDate(new Date(formData.createdDate));
    } else {
      setSelectedDate(new Date());
    }
    setShowCreatedDatePicker(true);
  };

  const handleCreatedDateSelect = () => {
    const formattedDate = formatDateForInput(selectedDate);
    if (showEditGroupModal) {
      handleEditGroupChange('createdDate', formattedDate);
    } else {
      handleInputChange('createdDate', formattedDate);
    }
    setShowCreatedDatePicker(false);
  };

  // Function to handle saving auction winner details from the modal
  const handleAuctionWinnerSave = async (winnerData) => {
    const groupId = Number(formData.groupId || group.id);
    const period = getPeriodFromOffset(currentMonth);

    try {
      const response = await ApiService.makeRequest('/admin/groups/saveAuctionWinner', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          month: period.month,
          year: period.year,
          chitWinnerName: winnerData.chitWinnerName,
          chitWinnerMemberId: winnerData.chitWinnerMemberId,
          amountTaken: Number(winnerData.amountTaken) || 0,
          datePicked: winnerData.datePicked,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save auction winner');
      }

      setFormData(prev => ({
        ...prev,
        chitWinnerName: winnerData.chitWinnerName,
        chitWinnerMemberId: winnerData.chitWinnerMemberId,
        amountTaken: winnerData.amountTaken,
        datePicked: winnerData.datePicked,
      }));

      setMonthlyData((prev) => {
        const currentEntry = prev.find((item) => item.month === currentMonth);
        const withoutCurrent = prev.filter((item) => item.month !== currentMonth);

        return [
          {
            month: currentMonth,
            date: winnerData.datePicked,
            amount: Number(currentEntry?.amount || formData.currentMonthAmount || 0),
            discount: Number(currentEntry?.discount || formData.elathThalupadi || 0),
            commission: Number(currentEntry?.commission || formData.commission || 0),
            hasPayment: Boolean(currentEntry?.hasPayment || formData.currentMonthAmount),
            winner: {
              name: winnerData.chitWinnerName,
              memberId: winnerData.chitWinnerMemberId,
              amountTaken: Number(winnerData.amountTaken || 0),
              date: winnerData.datePicked,
            },
            hasWinner: true,
            mappedMembers: currentEntry?.mappedMembers || [],
          },
          ...withoutCurrent,
        ];
      });

      setShowAuctionModal(false);
      Alert.alert('Success', 'Auction winner saved');
    } catch (error) {
      console.error('Error saving auction winner:', error);
      Alert.alert('Error', error.message || 'Failed to save auction winner');
    }
  };

  const getMonthLabel = (offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonthData = () => {
    return monthlyData.find(m => m.month === currentMonth) || null;
  };

  const currentMonthData = getCurrentMonthData();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'not-started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const isStartMonth = () => {
    const period = getPeriodFromOffset(currentMonth);
    const startDt = new Date(formData.createdDate || group.createdDate || group.start_date || group.startDate);
    if (!Number.isNaN(startDt.getTime())) {
      const periodYearMonth = period.year * 12 + period.month;
      const startYearMonth = startDt.getFullYear() * 12 + startDt.getMonth();
      return periodYearMonth <= startYearMonth;
    }
    return false; // Safest default is to allow previous if no creation date
  };

  const calculateDaysToNextChit = () => {
    const dateStr = formData.createdDate || group.createdDate;
    if (!dateStr) return 0;
    const startDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nextChitDate = new Date(today.getFullYear(), today.getMonth(), startDate.getDate());
    
    if (today > nextChitDate) {
      nextChitDate.setMonth(nextChitDate.getMonth() + 1);
    }
    
    const diffTime = nextChitDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header 
        title="Group Details"
        onBack={onBack}
        rightComponent={
          <View style={{ 
            backgroundColor: '#ECFDF5', 
            paddingHorizontal: 12, 
            paddingVertical: 4, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#D1FAE5',
            alignItems: 'center',
            marginTop: -10,
          }}>
            <Text style={{ fontSize: 9, color: '#047857', marginBottom: 2, textTransform: 'uppercase', fontWeight: '700' }}>Next Chit In</Text>
            <Text style={{ color: '#059669', fontWeight: '900', fontSize: 13 }}>{calculateDaysToNextChit()} Days</Text>
          </View>
        }
      />

      {/* Page intro below header (non-scrollable) */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderSubtext}>Manage your group details and settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        {/* Group Info Card */}
        <View style={styles.listContainer}>
          <View style={pageStyles.groupCard}>
            {/* Header with Group Name and Right Actions */}
            <View style={pageStyles.groupCardHeader}>
              <View style={pageStyles.groupNameContainer}>
                <Text style={pageStyles.groupName}>{formData.groupName || group.name}</Text>
                <Text style={styles.groupCodeText}>#{group.groupCode}</Text>
              </View>

              {/* Right Actions: Status and Edit */}
              <View style={styles.rightActionsContainer}>
                {/* Status Badge */}
                <View style={[pageStyles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
                  <MaterialCommunityIcons name="progress-clock" size={12} color="#FFFFFF" />
                  <Text style={pageStyles.statusText}>
                    {group.status === 'not-started' ? 'NOT STARTED' : group.status.toUpperCase()}
                  </Text>
                </View>

                {/* Edit Icon Button */}
                <TouchableOpacity
                  onPress={openEditGroupModal}
                  style={styles.editIconButton}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#6B46C1" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content Section */}
            <View style={pageStyles.groupCardContent}>
              {/* Group Info Row */}
              <View style={pageStyles.groupInfoRow}>
                <View style={pageStyles.groupInfoItem}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#6B46C1" />
                  <Text style={pageStyles.groupInfoText}>{formData.currentMembers} / {formData.totalMembers || 'N/A'} Members</Text>
                </View>
                <View style={pageStyles.groupInfoItem}>
                  <MaterialCommunityIcons name="currency-inr" size={16} color="#059669" />
                  <Text style={pageStyles.groupInfoText}>
                    {formatCurrency(formData.monthlyAmount)} / month
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={pageStyles.groupCardFooter}>
                <Text style={pageStyles.groupDate}>
                  Start Date: {new Date(formData.createdDate || group.createdDate).toLocaleDateString('en-IN')}
                </Text>
                <Text style={pageStyles.groupAmount}>
                  Total Fund: {formatCurrency(formData.groupAmount || (formData.monthlyAmount * (formData.totalMembers || formData.currentMembers || 0)))}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Member Registration */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowMemberRegistration(true)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#6B46C1" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Member Registration</Text>
                  <Text style={styles.sectionSubtitle}>Add and manage group members</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth - 1)}
              disabled={isStartMonth()}
              style={[styles.monthNavButton, isStartMonth() && styles.monthNavButtonDisabled]}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={isStartMonth() ? "#9CA3AF" : "#6B46C1"} />
              <Text style={[styles.monthNavButtonText, isStartMonth() && { color: '#9CA3AF' }]}>Previous</Text>
            </TouchableOpacity>

            <View style={styles.monthDisplay}>
              <Text style={styles.monthLabel}>Viewing Month</Text>
              <Text style={styles.monthValue}>{getMonthLabel(currentMonth)}</Text>
              {currentMonth === 0 && <Text style={styles.currentMonthBadge}>(Current)</Text>}
            </View>

            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth + 1)}
              disabled={currentMonth >= 0}
              style={[styles.monthNavButton, currentMonth >= 0 && styles.monthNavButtonDisabled]}
            >
              <Text style={[styles.monthNavButtonText, currentMonth >= 0 && { color: '#9CA3AF' }]}>Next</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={currentMonth >= 0 ? "#9CA3AF" : "#6B46C1"} />
            </TouchableOpacity>
          </View>

          {/* Payment Details Section (Now opens a modal) */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)} // Open PaymentD modal
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Payment Details</Text>
                  <Text style={styles.sectionSubtitle}>Monthly amount, discount & commission</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right" // Changed to chevron-right as it's a modal now
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* Chit Winner Section (opens AuctionW modal) */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowAuctionModal(true)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Chit Auction Winner</Text>
                  <Text style={styles.sectionSubtitle}>
                    {formData.chitWinnerName ? `Winner: ${formData.chitWinnerName}` : 'Register monthly auction winner'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>



      {/* Start Date Picker Modal */}
      {showCreatedDatePicker && (
        <Modal
          visible={showCreatedDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreatedDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Start Date</Text>
                <TouchableOpacity onPress={() => setShowCreatedDatePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContent}>
                <View style={styles.datePickerControls}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#6B46C1" />
                  </TouchableOpacity>

                  <View style={styles.dateDisplay}>
                    <Text style={styles.selectedDateText}>
                      {selectedDate.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#6B46C1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.quickDateButtons}>
                  <TouchableOpacity
                    style={styles.quickDateBtn}
                    onPress={() => setSelectedDate(new Date())}
                  >
                    <Text style={styles.quickDateText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickDateBtn}
                    onPress={() => {
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      setSelectedDate(lastMonth);
                    }}
                  >
                    <Text style={styles.quickDateText}>Last Month</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.cancelDateButton}
                  onPress={() => setShowCreatedDatePicker(false)}
                >
                  <Text style={styles.cancelDateText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectDateButton}
                  onPress={handleCreatedDateSelect}
                >
                  <Text style={styles.selectDateText}>Select Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Group Modal */}
      <EditModal
        visible={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        initialData={{
          groupName: formData.groupName,
          totalAmount: formData.groupAmount || formData.monthlyAmount,
          numberOfUsers: formData.totalMembers,
          createdDate: formData.createdDate
        }}
        onSave={handleEditSave}
      />

      {/* Member Registration Page */}
      <MemberRegistration
        visible={showMemberRegistration}
        onClose={() => setShowMemberRegistration(false)}
        group={{
          id: formData.groupId, // Pass id explicitly to ensure getGroupDbId works
          groupName: formData.groupName,
          groupId: formData.groupId,
          monthlyAmount: formData.monthlyAmount,
          memberMappings: memberMappings
        }}
        onSave={(updatedMemberMappings) => {
          setMemberMappings(updatedMemberMappings);
          setShowMemberRegistration(false);
        }}
        onMembersUpdate={handleMembersUpdate}
      />

      {/* Payment Details Modal */}
      <PaymentD
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialPaymentData={{
          currentMonthAmount: formData.currentMonthAmount,
          elathThalupadi: formData.elathThalupadi,
          commission: formData.commission,
          deadlineDate: formData.deadlineDate,
        }}
        onSave={handlePaymentSave}
      />

      {/* Chit Auction Winner Modal */}
      <AuctionW
        visible={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        groupMembers={memberMappings}
        groupId={formData.groupId || group.id}
        initialWinnerData={{
          chitWinnerName: formData.chitWinnerName,
          chitWinnerMemberId: formData.chitWinnerMemberId,
          amountTaken: formData.amountTaken,
          datePicked: formData.datePicked,
        }}
        onSave={handleAuctionWinnerSave}
      />

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Page Header Text (NEW)
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
  },
  pageHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
  },
  pageHeaderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingBottom: 100, // keep content visible above bottom actions
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  // Group Code Text (additional style)
  groupCodeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Right Actions Container (for status + edit)
  rightActionsContainer: {
    alignItems: 'flex-end',
    gap: 10,
  },

  // Edit Icon Button
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Group Header (keep for other uses)
  groupHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupHeaderLeft: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  groupCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupHeaderRight: {
    alignItems: 'flex-end',
  },
  monthlyAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthlyAmountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
  },

  // Month Navigation
  monthNavigation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  currentMonthBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 2,
  },

  // Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputPrefix: {
    position: 'absolute',
    left: 16,
    top: 12,
    fontSize: 16,
    color: '#6B7280',
    zIndex: 1,
  },
  inputWithPrefix: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  placeholderText: {
    color: '#9CA3AF',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#4338CA',
    flex: 1,
    lineHeight: 16,
  },

  // Date Picker Button
  datePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    fontSize: 14,
    color: '#212121',
  },

  // History Styles
  historyGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  historyCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  historyCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  winnerDetailsCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  winnerDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: 8,
  },
  winnerDetailsText: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  winnerDetailsLabel: {
    fontWeight: '600',
  },
  historyMembersContainer: {
    marginTop: 8,
  },
  historyMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  historyMemberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  historyMemberPhone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  historyMemberRight: {
    alignItems: 'flex-end',
  },
  historyMemberAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  historyMemberStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyMemberStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  modalContent: {
    maxHeight: 400,
  },

  // Date Picker Modal
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  datePickerContent: {
    padding: 20,
  },
  datePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  datePickerActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectDateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GroupInfoAdmin;