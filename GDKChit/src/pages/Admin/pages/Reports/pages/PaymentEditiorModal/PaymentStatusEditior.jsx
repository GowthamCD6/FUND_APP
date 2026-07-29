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

  // Local state for instant UI updates
  const [currentStatus, setCurrentStatus] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);

  // Sync state when modal opens
  useEffect(() => {
    if (selectedMember) {
      setCurrentStatus(selectedMember?.currentPayment?.status);
      setLocalHistory(selectedMember?.paymentHistory || []);
    }
  }, [selectedMember, visible]);

  if (!selectedMember) return null;

  const authenticateAndUpdateStatus = async targetStatus => {
    // If we are already in this status, do nothing (Double safety)
    if (currentStatus === targetStatus) return;

    setIsAuthenticating(true);
    try {
      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: `Confirm ${targetStatus.toUpperCase()} Status`,
        fallbackPromptMessage: 'Use device PIN, pattern or password',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        // Optimistic update for smoother UX while backend call runs.
        setCurrentStatus(targetStatus);

        // 2. Update the history list instantly
        const updatedHistory = localHistory.map((item, index) => {
          // Update the latest record (assuming index 0 is latest)
          if (index === 0) {
            return {
              ...item,
              status: targetStatus,
              paidDate:
                targetStatus === 'paid' ? new Date().toISOString() : null,
            };
          }
          return item;
        });
        setLocalHistory(updatedHistory);

        await onUpdatePaymentStatus(selectedMember.id, targetStatus);

        // Show success alert with user details
        Alert.alert(
          'Payment Status Updated',
          `Member: ${selectedMember.name}\nStatus: ${targetStatus.toUpperCase()}\nAmount: ${formatCurrency(selectedMember?.currentPayment?.amount || 0)}\nDate: ${new Date().toLocaleDateString()}`,
        );
      } else {
        Alert.alert('Cancelled', 'Authentication was cancelled');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Update Failed', error?.message || 'Could not update payment status');

      // Rollback optimistic status in case API fails.
      setCurrentStatus(selectedMember?.currentPayment?.status);
      setLocalHistory(selectedMember?.paymentHistory || []);
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

          <Text style={styles.historyTitle}>Payment History</Text>

          <FlatList
            data={localHistory}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyMonth}>{item.monthName}</Text>
                  <View
                    style={[
                      styles.historyStatusBadge,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(item.status)}
                      size={10}
                      color="#FFFFFF"
                    />
                    <Text style={styles.historyStatusText}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <View style={styles.bottomRow}>
                    <Text style={styles.historyDate}>
                      {item.status === 'paid'
                        ? `Paid: ${formatDate(item.paidDate)}`
                        : `Due: ${formatDate(item.dueDate)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item, index) => `${index}`}
            style={styles.historyList}
          />

          {/* --- PERFECTED QUICK ACTIONS --- */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActionsRow}>
              {/* MARK PAID BUTTON */}
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  // If Paid: Gray Background (Disabled look). If Pending: Green Background.
                  currentStatus === 'paid'
                    ? { backgroundColor: '#E5E7EB', elevation: 0 }
                    : { backgroundColor: '#10B981', elevation: 3 },
                ]}
                onPress={() => authenticateAndUpdateStatus('paid')}
                disabled={currentStatus === 'paid' || isAuthenticating}
              >
                <MaterialCommunityIcons
                  // If Paid: Check icon (static). If Pending: Check-circle (action).
                  name={
                    currentStatus === 'paid' ? 'check' : 'check-circle-outline'
                  }
                  size={20}
                  // If Paid: Dark Gray icon. If Pending: White icon.
                  color={currentStatus === 'paid' ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.modalActionButtonText,
                    // If Paid: Dark Gray text. If Pending: White text.
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
                  // If Pending: Gray Background (Disabled look). If Paid: Orange Background.
                  currentStatus === 'pending'
                    ? { backgroundColor: '#E5E7EB', elevation: 0 }
                    : { backgroundColor: '#F59E0B', elevation: 3 },
                ]}
                onPress={() => authenticateAndUpdateStatus('pending')}
                disabled={currentStatus === 'pending' || isAuthenticating}
              >
                <MaterialCommunityIcons
                  name={
                    currentStatus === 'pending'
                      ? 'clock'
                      : 'clock-time-three-outline'
                  }
                  size={20}
                  color={currentStatus === 'pending' ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.modalActionButtonText,
                    {
                      color:
                        currentStatus === 'pending' ? '#9CA3AF' : '#FFFFFF',
                    },
                  ]}
                >
                  {currentStatus === 'pending' ? 'Pending' : 'Mark Pending'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* ----------------------------- */}
        </View>
      </View>
    </Modal>
  );
};

export default PaymentEditor;