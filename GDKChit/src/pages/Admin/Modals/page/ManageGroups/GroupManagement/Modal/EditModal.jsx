import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../../../../../../../services/ApiService';

const EditModal = ({ 
  visible, 
  onClose, 
  initialData,
  onSave 
}) => {
  const [editGroupData, setEditGroupData] = useState({
    groupName: '',
    totalAmount: '',
    numberOfUsers: '',
    createdDate: ''
  });
  const [editGroupErrors, setEditGroupErrors] = useState({});
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setEditGroupData({
        groupName: initialData.groupName || initialData.name || '',
        totalAmount: (initialData.groupAmount || initialData.totalAmount || initialData.monthlyAmount || '').toString(),
        numberOfUsers: (initialData.numberOfUsers || initialData.totalMembers || '').toString(),
        createdDate: initialData.createdDate || initialData.startDate || '',
      });
    }
  }, [initialData]);

  const handleEditGroupChange = (field, value) => {
    let cleanValue = value;
    if (['totalAmount', 'numberOfUsers'].includes(field)) {
      cleanValue = value.replace(/[^0-9]/g, '');
    } else if (field === 'groupName') {
      cleanValue = value.replace(/[<>&'"]/g, '');
    }
    setEditGroupData(prev => ({ ...prev, [field]: cleanValue }));
    if (editGroupErrors[field]) {
      setEditGroupErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateEditGroup = () => {
    const newErrors = {};
    if (!editGroupData.groupName || editGroupData.groupName.trim() === '') {
      newErrors.groupName = 'Group name is required';
    }
    if (!editGroupData.totalAmount || parseFloat(editGroupData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Please enter a valid total amount';
    }
    if (!editGroupData.numberOfUsers || parseInt(editGroupData.numberOfUsers) <= 0) {
      newErrors.numberOfUsers = 'Please enter a valid number of users';
    }
    if (!editGroupData.createdDate) {
      newErrors.createdDate = 'Start date is required';
    }
    setEditGroupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveEditGroup = async () => {
    if (!validateEditGroup()) {
      return;
    }
    try {
      await onSave(editGroupData);
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseStringDate = (value) => {
    try {
      if (!value) return new Date();
      if (value.includes('/')) {
        const [dd, mm, yyyy] = value.split('/').map(Number);
        if (!dd || !mm || !yyyy) return new Date();
        return new Date(yyyy, mm - 1, dd);
      }
      return new Date(value);
    } catch {
      return new Date();
    }
  };

  const openDatePicker = () => {
    const initial = parseStringDate(editGroupData.createdDate);
    setSelectedDate(initial);
    setShowCreatedDatePicker(true);
  };

  const onAndroidDateChange = (event, eventDate) => {
    if (event.type === 'dismissed') {
      setShowCreatedDatePicker(false);
      return;
    }
    const finalDate = eventDate || selectedDate;
    setShowCreatedDatePicker(false);
    handleEditGroupChange('createdDate', formatDate(finalDate));
  };

  const onIOSDateChange = (_event, selectedDate) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    handleEditGroupChange('createdDate', formatDate(selectedDate));
    setShowCreatedDatePicker(false);
  };

  const cancelIOSDate = () => {
    setShowCreatedDatePicker(false);
  };

  const handleClose = () => {
    setEditGroupErrors({});
    onClose();
  };

  return (
    <>
      {/* Edit Group Info Modal */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editGroupModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Group Information</Text>
              <TouchableOpacity onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.editGroupModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Group Name *</Text>
                <TextInput
                  style={[styles.input, editGroupErrors.groupName && styles.inputError]}
                  value={editGroupData.groupName}
                  onChangeText={(value) => handleEditGroupChange('groupName', value)}
                  placeholder="Enter group name"
                  placeholderTextColor="#9CA3AF"
                />
                {editGroupErrors.groupName && (
                  <Text style={styles.errorText}>{editGroupErrors.groupName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Amount *</Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.inputWithPrefix, editGroupErrors.totalAmount && styles.inputError]}
                    value={editGroupData.totalAmount}
                    onChangeText={(value) => handleEditGroupChange('totalAmount', value)}
                    placeholder="10000"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {editGroupErrors.totalAmount && (
                  <Text style={styles.errorText}>{editGroupErrors.totalAmount}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Number of Users *</Text>
                <TextInput
                  style={[styles.input, editGroupErrors.numberOfUsers && styles.inputError]}
                  value={editGroupData.numberOfUsers}
                  onChangeText={(value) => handleEditGroupChange('numberOfUsers', value)}
                  placeholder="20"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                {editGroupErrors.numberOfUsers && (
                  <Text style={styles.errorText}>{editGroupErrors.numberOfUsers}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date *</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, editGroupErrors.createdDate && styles.inputError]}
                  onPress={openDatePicker}
                >
                  <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                  <Text style={[styles.datePickerText, !editGroupData.createdDate && styles.placeholderText]}>
                    {editGroupData.createdDate ? parseStringDate(editGroupData.createdDate).toLocaleDateString('en-IN') : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {editGroupErrors.createdDate && (
                  <Text style={styles.errorText}>{editGroupErrors.createdDate}</Text>
                )}
              </View>
            </ScrollView>

            {showCreatedDatePicker && (
              Platform.OS === 'ios' ? (
                <View style={styles.iosPickerContainer}>
                  <View style={styles.iosPickerHeader}>
                    <TouchableOpacity onPress={cancelIOSDate} style={styles.iosPickerButton}>
                      <Text style={styles.iosPickerButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosPickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={confirmIOSDate} style={styles.iosPickerButton}>
                      <Text style={[styles.iosPickerButtonText, { color: '#2842C4' }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={onIOSDateChange}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={onAndroidDateChange}
                />
              )
            )}

            <View style={styles.editGroupModalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleClose}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={saveEditGroup}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editGroupModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 500,
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
    fontSize: 21,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    
  },
  editGroupModalContent: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  inputPrefix: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  inputWithPrefix: {
    flex: 1,
    padding: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#212121',
    borderWidth: 0,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#212121',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#4F46E5',
    lineHeight: 16,
  },
  editGroupModalActions: {
    marginTop: 15,
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date Picker Modal Styles
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
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 18,
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
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  iosPickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iosPickerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default EditModal;
