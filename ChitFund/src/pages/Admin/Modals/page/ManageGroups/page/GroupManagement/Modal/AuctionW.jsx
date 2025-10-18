import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AuctionW = ({ visible, onClose, initialWinnerData, onSave }) => {
  const [formData, setFormData] = useState({
    chitWinnerName: '',
    chitWinnerMemberId: '',
    amountTaken: '',
    datePicked: '',
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (initialWinnerData) {
      setFormData({
        chitWinnerName: initialWinnerData.chitWinnerName || '',
        chitWinnerMemberId: initialWinnerData.chitWinnerMemberId || '',
        amountTaken: initialWinnerData.amountTaken?.toString() || '',
        datePicked: initialWinnerData.datePicked || '',
      });
    } else {
      setFormData({
        chitWinnerName: '',
        chitWinnerMemberId: '',
        amountTaken: '',
        datePicked: '',
      });
    }
  }, [initialWinnerData, visible]); // Reset form when modal opens or initial data changes

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.chitWinnerName || formData.chitWinnerName.trim() === '') {
      newErrors.chitWinnerName = 'Winner name is required';
    }
    if (!formData.chitWinnerMemberId || formData.chitWinnerMemberId.trim() === '') {
      newErrors.chitWinnerMemberId = 'Member ID is required';
    } else if (!/^\d{10}$/.test(formData.chitWinnerMemberId)) {
      newErrors.chitWinnerMemberId = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) {
      newErrors.amountTaken = 'Please enter a valid amount taken';
    }
    if (!formData.datePicked || formData.datePicked.trim() === '') {
      newErrors.datePicked = 'Auction date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    } else {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
    }
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

  const openDatePicker = () => {
    setSelectedDate(formData.datePicked ? new Date(formData.datePicked) : new Date());
    setShowDatePicker(true);
  };

  const handleDateSelect = () => {
    const formattedDate = formatDateForInput(selectedDate);
    handleInputChange('datePicked', formattedDate);
    setShowDatePicker(false);
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
            <Text style={styles.modalTitle}>Chit Auction Winner</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Winner Name</Text>
              <TextInput
                style={[styles.input, errors.chitWinnerName && styles.inputError]}
                value={formData.chitWinnerName}
                onChangeText={(value) => handleInputChange('chitWinnerName', value)}
                placeholder="Enter winner's name"
                placeholderTextColor="#9CA3AF"
              />
              {errors.chitWinnerName && (
                <Text style={styles.errorText}>{errors.chitWinnerName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Member Phone Number</Text>
              <TextInput
                style={[styles.input, errors.chitWinnerMemberId && styles.inputError]}
                value={formData.chitWinnerMemberId}
                onChangeText={(value) => handleInputChange('chitWinnerMemberId', value)}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#9CA3AF"
              />
              {errors.chitWinnerMemberId && (
                <Text style={styles.errorText}>{errors.chitWinnerMemberId}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Taken</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={[styles.inputWithPrefix, errors.amountTaken && styles.inputError]}
                  value={formData.amountTaken}
                  onChangeText={(value) => handleInputChange('amountTaken', value)}
                  placeholder="9300"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.amountTaken && (
                <Text style={styles.errorText}>{errors.amountTaken}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Auction Date</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, errors.datePicked && styles.inputError]}
                onPress={openDatePicker}
              >
                <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                <Text style={[styles.datePickerText, !formData.datePicked && styles.placeholderText]}>
                  {formData.datePicked ? formatDateForDisplay(formData.datePicked) : 'Select'}
                </Text>
              </TouchableOpacity>
              {errors.datePicked && (
                <Text style={styles.errorText}>{errors.datePicked}</Text>
              )}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Internal Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Auction Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
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
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSelectedDate(yesterday);
                    }}
                  >
                    <Text style={styles.quickDateText}>Yesterday</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.cancelDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelDateText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectDateButton}
                  onPress={handleDateSelect}
                >
                  <Text style={styles.selectDateText}>Select Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    maxWidth: 400,
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date Picker Specific Styles (reused from GroupInfoAdmin)
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
});

export default AuctionW;