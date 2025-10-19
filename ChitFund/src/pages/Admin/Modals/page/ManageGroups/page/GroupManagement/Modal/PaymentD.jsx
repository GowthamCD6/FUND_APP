import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const PaymentD = ({ visible, onClose, initialPaymentData, onSave }) => {
  const [paymentFormData, setPaymentFormData] = useState({
    currentMonthAmount: '',
    elathThalupadi: '',
    commission: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && initialPaymentData) {
      setPaymentFormData({
        currentMonthAmount: initialPaymentData.currentMonthAmount?.toString() || '',
        elathThalupadi: initialPaymentData.elathThalupadi?.toString() || '',
        commission: initialPaymentData.commission?.toString() || '',
      });
      setErrors({});
    }
  }, [visible, initialPaymentData]);

  const handleInputChange = (field, value) => {
    setPaymentFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentFormData.currentMonthAmount || parseFloat(paymentFormData.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid monthly amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePress = () => {
    if (validateForm()) {
      onSave(paymentFormData);
    } else {
      Alert.alert('Validation Error', 'Please correct the payment details.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Amount to be Paid This Month */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount to be Paid This Month *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={[styles.inputWithPrefix, errors.currentMonthAmount && styles.inputError]}
                  value={paymentFormData.currentMonthAmount}
                  onChangeText={(value) => handleInputChange('currentMonthAmount', value)}
                  placeholder="10000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.currentMonthAmount && (
                <Text style={styles.errorText}>{errors.currentMonthAmount}</Text>
              )}
            </View>

            {/* Discount and Commission Row */}
            <View style={styles.inputRow}>
              {/* Discount */}
              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>
                  <MaterialCommunityIcons name="trending-down" size={14} color="#6B7280" />
                  {' '}எலத் தள்ளுபடி (Discount)
                </Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.inputWithPrefix, errors.elathThalupadi && styles.inputError]}
                    value={paymentFormData.elathThalupadi}
                    onChangeText={(value) => handleInputChange('elathThalupadi', value)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Commission */}
              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>
                  <MaterialCommunityIcons name="percent" size={14} color="#6B7280" />
                  {' '}கசர் (Commission)
                </Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.inputWithPrefix, errors.commission && styles.inputError]}
                    value={paymentFormData.commission}
                    onChangeText={(value) => handleInputChange('commission', value)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePress}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  halfInputGroup: {
    flex: 1,
    marginHorizontal: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
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

export default PaymentD;