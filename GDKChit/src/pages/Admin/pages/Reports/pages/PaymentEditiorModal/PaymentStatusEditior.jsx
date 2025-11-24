import React from 'react';
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
import styles from './PaymentStatusEditorStyles';


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
  if (!selectedMember) return null;

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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
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
                  <View style={[styles.historyStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialCommunityIcons name={getStatusIcon(item.status)} size={10} color="#FFFFFF" />
                    <Text style={styles.historyStatusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                  <View style={styles.bottomRow}>
                    {item.receiptNumber && (
                      <Text style={styles.receiptNumber}>Receipt: {item.receiptNumber}</Text>
                    )}
                    <Text style={styles.historyDate}>
                      {item.status === 'paid' ? `Paid: ${formatDate(item.paidDate)}` : `Due: ${formatDate(item.dueDate)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item, index) => `${item.year}-${item.month}-${index}`}
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
          />

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.markPaidButton]}
                onPress={() => {
                  onUpdatePaymentStatus(selectedMember.id, 'paid');
                  Alert.alert('Success', 'Payment marked as paid');
                }}
                disabled={selectedMember?.currentPayment?.status === 'paid'}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalActionButtonText}>Mark Paid</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalActionButton, styles.markPendingButton]}
                onPress={() => {
                  onUpdatePaymentStatus(selectedMember.id, 'pending');
                  Alert.alert('Success', 'Payment marked as pending');
                }}
                disabled={selectedMember?.currentPayment?.status === 'pending'}
              >
                <MaterialCommunityIcons name="clock-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalActionButtonText}>Mark Pending</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentEditor;
