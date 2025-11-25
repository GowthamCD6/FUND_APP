import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ScrollView,
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
  onRemovePaymentRecord,
  formatCurrency,
  getStatusColor,
  getStatusIcon,
  formatDate,
  renderPaymentHistoryItem,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [updatedPaymentStatus, setUpdatedPaymentStatus] = useState(null);

  if (!selectedMember) return null;

  // Get the current payment status considering recent updates
  const currentPaymentStatus = updatedPaymentStatus || selectedMember?.currentPayment?.status;

  // Direct biometric authentication - bypasses BiometricService settings
  const authenticateAndUpdateStatus = async status => {
    setIsAuthenticating(true);
    try {
      // Call rnBiometrics directly to show the biometric prompt
      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: `Authenticate to mark payment as ${status.toUpperCase()} for ${
          selectedMember.name
        }`,
        fallbackPromptMessage: 'Use device PIN, pattern or password',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        // Update local state immediately for instant UI feedback
        setUpdatedPaymentStatus(status);
        
        // Call parent update function
        onUpdatePaymentStatus(selectedMember.id, status);
        
        // Show success alert but keep modal open to see instant update
        Alert.alert(
          'Success',
          `Payment marked as ${status.toUpperCase()}\n\nMember: ${
            selectedMember.name
          }`,
          [{ text: 'OK' }], // Don't close modal, just dismiss alert
        );
      } else {
        Alert.alert(
          'Authentication Failed',
          error || 'Biometric authentication failed. Please try again.',
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setUpdatedPaymentStatus(null); // Reset on close
        onClose();
      }}
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
              onPress={() => {
                setUpdatedPaymentStatus(null);
                onClose();
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.historyTitle}>Payment History</Text>

          <FlatList
            data={selectedMember?.paymentHistory || []}
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
                    {item.receiptNumber && (
                      <Text style={styles.receiptNumber}>
                        Receipt: {item.receiptNumber}
                      </Text>
                    )}
                    <Text style={styles.historyDate}>
                      {item.status === 'paid'
                        ? `Paid: ${formatDate(item.paidDate)}`
                        : `Due: ${formatDate(item.dueDate)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item, index) =>
              `${item.year}-${item.month}-${index}`
            }
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
          />

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  styles.markPaidButton,
                  (currentPaymentStatus === 'paid' ||
                    isAuthenticating) &&
                    styles.disabledButton,
                ]}
                onPress={() => authenticateAndUpdateStatus('paid')}
                disabled={
                  currentPaymentStatus === 'paid' ||
                  isAuthenticating
                }
              >
                <MaterialCommunityIcons
                  name={isAuthenticating ? 'fingerprint' : 'check-circle'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.modalActionButtonText}>
                  {isAuthenticating ? 'Authenticating...' : 'Mark Paid'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  styles.markPendingButton,
                  (currentPaymentStatus === 'pending' ||
                    isAuthenticating) &&
                    styles.disabledButton,
                ]}
                onPress={() => authenticateAndUpdateStatus('pending')}
                disabled={
                  currentPaymentStatus === 'pending' ||
                  isAuthenticating
                }
              >
                <MaterialCommunityIcons
                  name={isAuthenticating ? 'fingerprint' : 'clock-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.modalActionButtonText}>
                  {isAuthenticating ? 'Authenticating...' : 'Mark Pending'}
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