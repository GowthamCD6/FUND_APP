import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import styles from './MemberChitCardSty';

const ChitCard = ({ selectedGroup, selectedMember, onBack }) => {
  const [rows, setRows] = useState([]);
  const [groupInfo, setGroupInfo] = useState(selectedGroup || null);
  const [memberInfo, setMemberInfo] = useState(selectedMember || null);
  const [loading, setLoading] = useState(true);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [selectedPendingRow, setSelectedPendingRow] = useState(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);

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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpInput('');
    setSelectedPendingRow(row);
    setOtpVisible(true);
  };

  const closeOtpModal = () => {
    if (otpSubmitting) return;
    setOtpVisible(false);
    setOtpInput('');
    setGeneratedOtp('');
    setSelectedPendingRow(null);
  };

  const verifyOtpAndMarkPaid = async () => {
    if (!selectedPendingRow) return;

    if (otpInput.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    if (otpInput !== generatedOtp) {
      Alert.alert('OTP Failed', 'Entered OTP is incorrect.');
      return;
    }

    try {
      setOtpSubmitting(true);

      const response = await ApiService.makeRequest('/admin/reports/payment-status', {
        method: 'POST',
        body: JSON.stringify({
          groupId: Number(selectedGroup?.id),
          userId: Number(selectedMember?.id),
          month: Number(selectedPendingRow.month),
          year: Number(selectedPendingRow.year),
          status: 'paid',
          amount: Number(selectedPendingRow.amount || 0),
          dueDate: selectedPendingRow.dueDate,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to update status');
      }

      setRows((prev) =>
        prev.map((row) => {
          if (
            row.serialNo === selectedPendingRow.serialNo &&
            row.month === selectedPendingRow.month &&
            row.year === selectedPendingRow.year
          ) {
            return {
              ...row,
              status: 'paid',
              paidDate: new Date().toISOString(),
            };
          }
          return row;
        }),
      );

      Alert.alert('Success', 'Payment marked as PAID successfully.');
      closeOtpModal();
    } catch (error) {
      console.error('Failed to update pending status:', error);
      Alert.alert('Error', error.message || 'Unable to update payment status.');
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={groupInfo?.name || groupInfo?.groupName || 'Member Chit Card'} onBack={onBack} />

      {memberInfo ? (
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoContent}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {memberInfo?.name
                  ? memberInfo.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                  : 'NA'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{memberInfo?.name || 'Unknown Member'}</Text>
              <Text style={styles.userPhone}>{memberInfo?.phone || 'No Phone'}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6B46C1" />
        </View>
      ) : (
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
                    <View key={`${row.year}-${row.month}-${row.serialNo}`} style={styles.tableRow}>
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

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.detailsButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#6B46C1" />
              <Text style={styles.detailsButtonText}>Payment History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={otpVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeOtpModal}
      >
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContainer}>
            <View style={styles.otpModalHeader}>
              <Text style={styles.otpModalTitle}>OTP Verification</Text>
              <TouchableOpacity onPress={closeOtpModal} disabled={otpSubmitting}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.otpModalSubtitle}>
              Enter OTP to mark Month {selectedPendingRow?.serialNo || '-'} as paid.
            </Text>

            <View style={styles.otpInputContainer}>
              <Text style={styles.otpInputLabel}>Enter OTP (6 digits)</Text>
              <TextInput
                style={styles.otpInput}
                value={otpInput}
                onChangeText={setOtpInput}
                keyboardType="numeric"
                maxLength={6}
                placeholder="000000"
                editable={!otpSubmitting}
              />
              <Text style={styles.demoOtpHint}>Demo OTP: {generatedOtp}</Text>
            </View>

            <View style={styles.otpModalButtons}>
              <TouchableOpacity
                style={[styles.otpCancelButton, otpSubmitting && styles.disabledButton]}
                onPress={closeOtpModal}
                disabled={otpSubmitting}
              >
                <Text style={styles.otpCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.otpSubmitButton, (otpSubmitting || otpInput.length !== 6) && styles.disabledButton]}
                onPress={verifyOtpAndMarkPaid}
                disabled={otpSubmitting || otpInput.length !== 6}
              >
                <Text style={styles.otpSubmitButtonText}>{otpSubmitting ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ChitCard;
