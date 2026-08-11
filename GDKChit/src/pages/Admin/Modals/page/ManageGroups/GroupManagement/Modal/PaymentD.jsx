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
import DateTimePicker from '@react-native-community/datetimepicker';

const PaymentD = ({ visible, onClose, initialPaymentData, onSave }) => {
  const [paymentFormData, setPaymentFormData] = useState({
    currentMonthAmount: '',
    elathThalupadi: '',
    commission: '',
    deadlineDate: '',
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (visible && initialPaymentData) {
      setPaymentFormData({
        currentMonthAmount: initialPaymentData.currentMonthAmount?.toString() || '',
        elathThalupadi: initialPaymentData.elathThalupadi?.toString() || '',
        commission: initialPaymentData.commission?.toString() || '',
        deadlineDate: initialPaymentData.deadlineDate || '',
      });
      setErrors({});
    }
  }, [visible, initialPaymentData]);

  const handleInputChange = (field, value) => {
    let cleanValue = value;
    if (['currentMonthAmount', 'elathThalupadi', 'commission'].includes(field)) {
      cleanValue = value.replace(/[^0-9]/g, '');
    }
    setPaymentFormData(prev => ({ ...prev, [field]: cleanValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const monthly = parseFloat(paymentFormData.currentMonthAmount || '0');
    const discount = parseFloat(paymentFormData.elathThalupadi || '0');
    const commission = parseFloat(paymentFormData.commission || '0');

    if (!paymentFormData.currentMonthAmount || monthly <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid monthly amount';
    }

    if (discount + commission > monthly) {
      newErrors.elathThalupadi = 'Discount + Commission cannot exceed Monthly Amount';
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

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Select Date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const parseStringDate = (value) => {
    try {
      if (!value) return new Date();
      if (value.includes('/')) {
        const [dd, mm, yyyy] = value.split('/').map(Number);
        if (!dd || !mm || !yyyy) return new Date();
        return new Date(yyyy, mm - 1, dd);
      }
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  };

  const openDatePicker = () => {
    setSelectedDate(parseStringDate(paymentFormData.deadlineDate));
    setShowDatePicker(true);
  };

  const onAndroidDateChange = (event, selectedDateVal) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    const finalDate = selectedDateVal || selectedDate;
    setShowDatePicker(false);
    handleInputChange('deadlineDate', formatDateForInput(finalDate));
  };

  const onIOSDateChange = (_event, selectedDateVal) => {
    if (selectedDateVal) {
      setSelectedDate(selectedDateVal);
    }
  };

  const confirmIOSDate = () => {
    handleInputChange('deadlineDate', formatDateForInput(selectedDate));
    setShowDatePicker(false);
  };

  const cancelIOSDate = () => {
    setShowDatePicker(false);
  };

  return (
    <>
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

              {/* Payment Deadline Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B7280" />
                  {' '}Deadline Date (Payment Due Date)
                </Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, errors.deadlineDate && styles.inputError]}
                  onPress={openDatePicker}
                >
                  <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                  <Text style={[styles.datePickerText, !paymentFormData.deadlineDate && styles.placeholderText]}>
                    {paymentFormData.deadlineDate ? formatDateForDisplay(paymentFormData.deadlineDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {errors.deadlineDate && (
                  <Text style={styles.errorText}>{errors.deadlineDate}</Text>
                )}
              </View>

              {/* Discount and Commission Row */}
              <View style={styles.inputRow}>
                {/* Discount */}
                <View style={styles.halfInputGroup}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="trending-down" size={14} color="#6B7280" />
                    {' '}எலத் தள்ளுபடி{'\n'}(Discount)
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
                    {' '}கசர்{'\n'}(Commission)
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

      {/* Native Date Picker */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible={showDatePicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={cancelIOSDate} style={styles.iosPickerButton}>
                    <Text style={styles.iosPickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Select Deadline Date</Text>
                  <TouchableOpacity onPress={confirmIOSDate} style={styles.iosPickerButton}>
                    <Text style={[styles.iosPickerButtonText, { color: '#6B46C1' }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onIOSDateChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onAndroidDateChange}
          />
        )
      )}
    </>
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
  inputIconLeft: {
    position: 'absolute',
    left: 14,
    top: 14,
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
  inputWithIconLeft: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 42,
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
  placeholderText: {
    color: '#9CA3AF',
  },
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
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 360,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  iosPickerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iosPickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default PaymentD;