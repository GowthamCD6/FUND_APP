import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import styles from './MemberChitCardSty';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.map((p) => p.charAt(0)).join('').substring(0, 2).toUpperCase();
};

const SkeletonBox = ({ width, height, borderRadius = 6, style }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#CBD5E1',
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

const UserInfoCardSkeleton = () => (
  <View style={styles.userInfoCard}>
    <View style={styles.userInfoContent}>
      <View style={styles.userAvatar}>
        <SkeletonBox width={50} height={50} borderRadius={25} />
      </View>
      <View style={[styles.userDetails, { gap: 8 }]}>
        <SkeletonBox width={140} height={18} borderRadius={4} />
        <SkeletonBox width={100} height={14} borderRadius={4} />
      </View>
    </View>
  </View>
);

const TableRowSkeleton = () => (
  <View style={styles.tableRow}>
    <View style={[styles.tableCell, { flex: 0.8, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={14} height={12} borderRadius={3} />
    </View>
    <View style={[styles.tableCell, { flex: 1.5, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={45} height={12} borderRadius={3} />
    </View>
    <View style={[styles.tableCell, { flex: 1.4, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={35} height={12} borderRadius={3} />
    </View>
    <View style={[styles.tableCell, { flex: 1.4, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={35} height={12} borderRadius={3} />
    </View>
    <View style={[styles.tableCell, { flex: 1.8, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={55} height={12} borderRadius={3} />
    </View>
    <View style={[styles.tableCell, { flex: 1.4, alignItems: 'center', justifyContent: 'center' }]}>
      <SkeletonBox width={48} height={16} borderRadius={8} />
    </View>
  </View>
);

const FullPageChitCardSkeleton = ({ onBack }) => (
  <View style={styles.container}>
    <Header title="Member Chit Card" onBack={onBack} />
    <UserInfoCardSkeleton />
    <ScrollView style={styles.groupDetailsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.chitDetailsCard}>
        <View style={{ alignItems: 'center', marginVertical: 4, marginBottom: 16 }}>
          <SkeletonBox width={180} height={20} borderRadius={6} />
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Discount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Commission</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Paid Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Status</Text>
          </View>

          <ScrollView style={styles.tableBody} nestedScrollEnabled>
            {[1, 2, 3, 4, 5, 6].map((key) => (
              <TableRowSkeleton key={key} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  </View>
);

const ChitCard = ({ selectedGroup, selectedMember, onBack, onPaymentMarkedPaid }) => {
  const [rows, setRows] = useState([]);
  const [groupInfo, setGroupInfo] = useState(selectedGroup || null);
  const [memberInfo, setMemberInfo] = useState(selectedMember || null);
  const [loading, setLoading] = useState(true);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [selectedPendingRow, setSelectedPendingRow] = useState(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState(null); // Track recently updated row

  useEffect(() => {
    const loadChitCard = async () => {
      if (!selectedGroup?.id || !selectedMember?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await ApiService.makeRequest(
          `/admin/reports/member-chit-card?groupId=${selectedGroup.id}&userId=${selectedMember.id}`,
          { method: 'GET' },
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to fetch chit card');
        }

        setRows(result.data?.rows || []);
        setGroupInfo(result.data?.group || selectedGroup);
        setMemberInfo(result.data?.member || selectedMember);
      } catch (error) {
        console.error('Failed to load member chit card:', error);
        Alert.alert('Error', error.message || 'Unable to load chit card details');
      } finally {
        setLoading(false);
      }
    };

    loadChitCard();
  }, [selectedGroup, selectedMember]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      const [y, m, d] = dateValue.split('T')[0].split('-').map(Number);
      if (y && m && d) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
      }
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'paid':
        return '#2E7D32';
      case 'overdue':
        return '#C62828';
      default:
        return '#F59E0B';
    }
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || 'pending').toLowerCase();
    if (normalized === 'paid') return 'PAID';
    if (normalized === 'overdue') return 'OVERDUE';
    return 'PENDING';
  };

  const openOtpForRow = (row) => {
    setSelectedPendingRow(row);
    setOtpInput('');
    setOtpSent(false);
    setGeneratedOtp('');
    setOtpVisible(true);
  };

  const sendOtp = async () => {
    const targetPhone = memberInfo?.phone || selectedMember?.phone;
    const targetUserId = memberInfo?.id || selectedMember?.id;
    const targetGroupId = selectedGroup?.id || groupInfo?.id;

    if (!targetPhone) {
      Alert.alert('Error', 'Member phone number not available');
      return;
    }

    if (!targetUserId || !targetGroupId) {
      Alert.alert('Error', 'Member ID or Group ID missing');
      return;
    }

    try {
      setOtpSubmitting(true);

      const response = await ApiService.makeRequest('/admin/reports/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: targetPhone,
          userId: targetUserId,
          groupId: targetGroupId,
          groupName: groupInfo?.name || selectedGroup?.group_name || selectedGroup?.name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      Alert.alert('Success', `OTP request sent successfully to member (${targetPhone})`);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
      setOtpSent(false);
    } finally {
      setOtpSubmitting(false);
    }
  };

  const closeOtpModal = () => {
    if (otpSubmitting) return;
    setOtpVisible(false);
    setOtpInput('');
    setGeneratedOtp('');
    setSelectedPendingRow(null);
    setOtpSent(false);
  };

  const verifyOtpAndMarkPaid = async () => {
    if (!selectedPendingRow) return;

    if (otpInput.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    const targetUserId = memberInfo?.id || selectedMember?.id;
    const targetGroupId = selectedGroup?.id || groupInfo?.id;

    try {
      setOtpSubmitting(true);

      // Step 1: Verify OTP with backend
      const verifyResponse = await ApiService.makeRequest('/admin/reports/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: memberInfo?.phone || selectedMember?.phone,
          otp: otpInput,
          groupId: Number(targetGroupId),
          userId: Number(targetUserId),
          month: Number(selectedPendingRow.month),
          year: Number(selectedPendingRow.year),
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult?.success) {
        throw new Error(verifyResult?.message || 'OTP verification failed');
      }

      // Step 2: Update payment status
      const paymentResponse = await ApiService.makeRequest('/admin/reports/payment-status', {
        method: 'POST',
        body: JSON.stringify({
          groupId: Number(targetGroupId),
          userId: Number(targetUserId),
          month: Number(selectedPendingRow.month),
          year: Number(selectedPendingRow.year),
          status: 'paid',
          amount: Number(selectedPendingRow.amount || 0),
          dueDate: selectedPendingRow.dueDate,
        }),
      });

      const paymentResult = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentResult?.success) {
        throw new Error(paymentResult?.message || 'Failed to update payment status');
      }

      // Update local state with new paid status
      const currentDate = new Date();
      const paidDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      // Highlight the updated row
      const rowKey = `${selectedPendingRow.year}-${selectedPendingRow.month}-${selectedPendingRow.serialNo}`;
      setHighlightedRow(rowKey);
      
      setRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
          // Match the exact row that was paid
          if (
            row.serialNo === selectedPendingRow.serialNo &&
            Number(row.month) === Number(selectedPendingRow.month) &&
            Number(row.year) === Number(selectedPendingRow.year)
          ) {
            console.log('Updating row from pending to paid:', { serialNo: row.serialNo, month: row.month, year: row.year });
            return {
              ...row,
              status: 'paid',
              paidDate: paidDateString,
            };
          }
          return row;
        });
        console.log('Updated rows:', updatedRows);
        return updatedRows;
      });

      Alert.alert('Success', 'Payment marked as paid successfully');
      
      // Notify parent component of successful payment update
      if (onPaymentMarkedPaid) {
        onPaymentMarkedPaid();
      }
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedRow(null);
      }, 2000);
      
      // Small delay to ensure state update completes before closing modal
      setTimeout(() => {
        closeOtpModal();
      }, 300);
    } catch (error) {
      console.error('Payment verification failed:', error);
      Alert.alert('Error', error.message || 'Payment verification failed');
    } finally {
      setOtpSubmitting(false);
    }
  };

  if (loading) {
    return <FullPageChitCardSkeleton onBack={onBack} />;
  }

  return (
    <View style={styles.container}>
      <Header title={groupInfo?.name || groupInfo?.groupName || 'Member Chit Card'} onBack={onBack} />

      <View style={styles.userInfoCard}>
        <View style={styles.userInfoContent}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{getInitials(memberInfo?.name)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{memberInfo?.name || 'Unknown Member'}</Text>
            <Text style={styles.userPhone}>{memberInfo?.phone || 'No Phone'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.groupDetailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.chitDetailsCard}>
          <Text style={styles.chitDetailsTitle}>Chit Payment Details</Text>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Amount</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Discount</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Commission</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Paid Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Status</Text>
            </View>

            <ScrollView style={styles.tableBody} nestedScrollEnabled>
              {rows.map((row) => {
                const rowKey = `${row.year}-${row.month}-${row.serialNo}`;
                const isHighlighted = highlightedRow === rowKey;

                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const rowMonthStart = new Date(row.year, row.month, 1);
                const isFutureRow = rowMonthStart > currentMonthStart;
                const isPendingRow = !isFutureRow && String(row.status).toLowerCase() === 'pending';

                const statusIcon = isFutureRow
                  ? 'lock'
                  : row.status === 'paid'
                    ? 'check-circle'
                    : row.status === 'overdue'
                      ? 'alert-circle'
                      : 'clock-outline';

                const statusColor = isFutureRow ? '#9E9E9E' : getStatusColor(row.status);
                const statusLabel = isFutureRow ? 'LOCKED' : getStatusLabel(row.status);

                return (
                  <View
                    key={rowKey}
                    style={[
                      styles.tableRow,
                      isHighlighted && { backgroundColor: '#D1FAE5', borderLeftWidth: 4, borderLeftColor: '#10B981' },
                    ]}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{isFutureRow ? '-' : formatCurrency(row.amount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1.4 }]}>{isFutureRow ? '-' : formatCurrency(row.discountAmount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1.4 }]}>{isFutureRow ? '-' : formatCurrency(row.commissionAmount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{isFutureRow ? '-' : formatDate(row.paidDate)}</Text>
                    <View style={[styles.tableCell, { flex: 1.4, alignItems: 'center' }]}>
                      {isPendingRow ? (
                        <TouchableOpacity style={styles.statusContainer} onPress={() => openOtpForRow(row)}>
                          <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
                          <Text style={[styles.pendingText, { color: statusColor }]}>{statusLabel}</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.statusContainer}>
                          <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
                          <Text style={[styles.pendingText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={otpVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={closeOtpModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.otpModalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={styles.otpModalContainer}>
                {/* Header */}
                <View style={styles.otpModalHeader}>
                  <View>
                    <Text style={styles.otpModalTitle}>Verify Payment</Text>
                    <Text style={styles.otpModalSubheader}>
                      {otpSent ? 'Enter the OTP sent to member' : 'Send OTP to member'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeOtpModal} disabled={otpSubmitting}>
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Step 1: Send OTP */}
                {!otpSent ? (
                  <View style={styles.otpSendContainer}>
                    <MaterialCommunityIcons name="send" size={48} color="#6B46C1" />
                    <Text style={styles.otpSendTitle}>Ready to send OTP?</Text>
                    <Text style={styles.otpSendDescription}>
                      Click the button below to send a 6-digit OTP to the member's registered phone number
                    </Text>
                  </View>
                ) : null}

                {/* Step 2: Enter OTP */}
                {otpSent ? (
                  <>
                    {/* OTP Display Indicator */}
                    <View style={styles.otpDisplayContainer}>
                      <View style={styles.otpDotsContainer}>
                        {[...Array(6)].map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.otpDot,
                              index < otpInput.length && styles.otpDotFilled,
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    {/* OTP Input */}
                    <View style={styles.otpInputContainer}>
                      <Text style={styles.otpInputLabel}>Enter OTP</Text>
                      <TextInput
                        style={styles.otpInput}
                        value={otpInput}
                        onChangeText={setOtpInput}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="000000"
                        placeholderTextColor="#D1D5DB"
                        editable={!otpSubmitting}
                        autoFocus={true}
                      />
                    </View>

                    {/* Verification Status */}
                    {otpSubmitting && (
                      <View style={styles.otpVerifyingContainer}>
                        <ActivityIndicator size="small" color="#6B46C1" />
                        <Text style={styles.otpVerifyingText}>Verifying OTP...</Text>
                      </View>
                    )}
                  </>
                ) : null}

                {/* Buttons */}
                <View style={styles.otpModalButtons}>
                  <TouchableOpacity
                    style={[styles.otpCancelButton, (otpSubmitting || !otpSent) && styles.disabledButton]}
                    onPress={closeOtpModal}
                    disabled={otpSubmitting}
                  >
                    <Text style={styles.otpCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  {!otpSent ? (
                    <TouchableOpacity
                      style={styles.otpSendButton}
                      onPress={sendOtp}
                      disabled={otpSubmitting}
                    >
                      <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.otpSendButtonText}>Send OTP</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.otpSubmitButton, (otpSubmitting || otpInput.length !== 6) && styles.disabledButton]}
                      onPress={verifyOtpAndMarkPaid}
                      disabled={otpSubmitting || otpInput.length !== 6}
                    >
                      {otpSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.otpSubmitButtonText}>Verify & Confirm</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ChitCard;
