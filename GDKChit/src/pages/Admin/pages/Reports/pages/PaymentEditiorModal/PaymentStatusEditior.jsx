import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import styles from './PaymentStatusEditorStyles';

const rnBiometrics = new ReactNativeBiometrics();

const PaymentEditor = ({
  visible,
  selectedMember,
  onClose,
  onUpdatePaymentStatus,
  formatCurrency,
  getStatusColor,
  getStatusIcon,
  formatDate,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [localHistory, setLocalHistory] = useState([]);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState(null);

  // Sync state when modal opens
  useEffect(() => {
    if (selectedMember) {
      const history = selectedMember?.paymentHistory || [];
      setLocalHistory(history);

      // Auto-select first unpaid month if available, else current payment month or first item
      const firstUnpaid = history.find((h) => String(h.status).toLowerCase() !== 'paid');
      const currentMonthItem = history.find(
        (h) =>
          Number(h.month) === Number(selectedMember?.currentPayment?.month) &&
          Number(h.year) === Number(selectedMember?.currentPayment?.year),
      );

      setSelectedTargetMonth(firstUnpaid || currentMonthItem || history[0] || null);
    }
  }, [selectedMember, visible]);

  if (!selectedMember) return null;

  const currentStatus = String(selectedTargetMonth?.status || '').toLowerCase();

  const authenticateAndUpdateStatus = async (targetStatus) => {
    if (!selectedTargetMonth) {
      Alert.alert('Selection Required', 'Please tap a month from the list to select it for editing.');
      return;
    }

    if (currentStatus === targetStatus) return;

    setIsAuthenticating(true);
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: `Confirm ${targetStatus.toUpperCase()} Status for ${selectedTargetMonth.monthName || 'Month'} ${selectedTargetMonth.year || ''}`,
        fallbackPromptMessage: 'Use device PIN, pattern or password',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        const targetMonthIndex = selectedTargetMonth.month;
        const targetYearVal = selectedTargetMonth.year;

        await onUpdatePaymentStatus(
          selectedMember.id,
          targetStatus,
          targetMonthIndex,
          targetYearVal,
        );

        // Optimistically update the history item status
        const updatedHistory = localHistory.map((item) => {
          if (Number(item.month) === Number(targetMonthIndex) && Number(item.year) === Number(targetYearVal)) {
            return {
              ...item,
              status: targetStatus,
              paidDate: targetStatus === 'paid' ? new Date().toISOString() : null,
            };
          }
          return item;
        });

        setLocalHistory(updatedHistory);
        setSelectedTargetMonth((prev) => (prev ? { ...prev, status: targetStatus } : null));

        Alert.alert(
          'Payment Status Updated',
          `Member: ${selectedMember.name}\nMonth: ${selectedTargetMonth.monthName || ''} ${selectedTargetMonth.year || ''}\nStatus: ${targetStatus.toUpperCase()}\nAmount: ${formatCurrency(selectedTargetMonth?.amount || 0)}`,
        );
      } else {
        Alert.alert('Cancelled', 'Authentication was cancelled');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Update Failed', error?.message || 'Could not update payment status');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
              <Text style={styles.modalSubtitle}>{selectedMember?.phone}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}>
            <Text style={[styles.historyTitle, { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }]}>Group Payment Cycles</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Tap a month to select</Text>
          </View>

          <FlatList
            data={localHistory}
            keyExtractor={(item, index) => `${item.year}-${item.month}-${index}`}
            style={styles.historyList}
            renderItem={({ item }) => {
              const isSelected =
                selectedTargetMonth &&
                Number(selectedTargetMonth.month) === Number(item.month) &&
                Number(selectedTargetMonth.year) === Number(item.year);
              const isPaid = String(item.status).toLowerCase() === 'paid';
              const statusColor = getStatusColor(item.status);

              return (
                <TouchableOpacity
                  style={[
                    styles.historyItem,
                    isSelected && { backgroundColor: '#F3E8FF', borderWidth: 1.5, borderColor: '#7C3AED' },
                  ]}
                  onPress={() => setSelectedTargetMonth(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.historyHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.historyMonth}>{item.monthName} {item.year}</Text>
                      {isSelected ? (
                        <MaterialCommunityIcons name="check-circle" size={14} color="#7C3AED" />
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.historyStatusBadge,
                        { backgroundColor: statusColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getStatusIcon(item.status)}
                        size={10}
                        color="#FFFFFF"
                      />
                      <Text style={styles.historyStatusText}>
                        {String(item.status).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyDetails}>
                    <View style={styles.bottomRow}>
                      <Text style={styles.historyAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {isPaid
                          ? `Paid: ${formatDate(item.paidDate)}`
                          : `Due: ${formatDate(item.dueDate)}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Quick Actions for Selected Month */}
          <View style={styles.quickActionsContainer}>
            {selectedTargetMonth ? (
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Selected Month: <Text style={{ color: '#7C3AED', fontWeight: '700' }}>{selectedTargetMonth.monthName} {selectedTargetMonth.year}</Text> ({String(selectedTargetMonth.status).toUpperCase()})
              </Text>
            ) : null}

            <View style={styles.quickActionsRow}>
              {/* MARK PAID BUTTON */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  currentStatus === 'paid'
                    ? { backgroundColor: '#E5E7EB', elevation: 0 }
                    : { backgroundColor: '#10B981', elevation: 3 },
                ]}
                onPress={() => authenticateAndUpdateStatus('paid')}
                disabled={currentStatus === 'paid' || isAuthenticating}
              >
                <MaterialCommunityIcons
                  name={currentStatus === 'paid' ? 'check' : 'check-circle-outline'}
                  size={20}
                  color={currentStatus === 'paid' ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.modalActionButtonText,
                    { color: currentStatus === 'paid' ? '#9CA3AF' : '#FFFFFF' },
                  ]}
                >
                  {currentStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                </Text>
              </TouchableOpacity>

              {/* MARK PENDING BUTTON */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  currentStatus === 'pending'
                    ? { backgroundColor: '#E5E7EB', elevation: 0 }
                    : { backgroundColor: '#F59E0B', elevation: 3 },
                ]}
                onPress={() => authenticateAndUpdateStatus('pending')}
                disabled={currentStatus === 'pending' || isAuthenticating}
              >
                <MaterialCommunityIcons
                  name={currentStatus === 'pending' ? 'clock' : 'clock-time-three-outline'}
                  size={20}
                  color={currentStatus === 'pending' ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.modalActionButtonText,
                    { color: currentStatus === 'pending' ? '#9CA3AF' : '#FFFFFF' },
                  ]}
                >
                  {currentStatus === 'pending' ? 'Pending' : 'Mark Pending'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentEditor;