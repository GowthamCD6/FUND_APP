import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../../../../../../../services/ApiService';

const AuctionW = ({ visible, onClose, initialWinnerData, onSave, groupMembers = [], groupId, pastWinners = [] }) => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    chitWinnerName: '',
    chitWinnerMemberId: '',
    amountTaken: '',
    datePicked: '',
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fetchedPastWinners, setFetchedPastWinners] = useState([]);
  const autoFilledPhoneRef = useRef('');

  const normalizeText = (value) => (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

  const findBestMemberMatch = (nameValue) => {
    const query = normalizeText(nameValue);
    if (!query || groupMembers.length === 0) {
      return null;
    }

    const exactMatch = groupMembers.find((member) => normalizeText(member?.name) === query);
    if (exactMatch) return exactMatch;

    const startsWithMatch = groupMembers.find((member) => {
      const memberName = normalizeText(member?.name);
      return memberName && (memberName.startsWith(query) || query.startsWith(memberName));
    });
    if (startsWithMatch) return startsWithMatch;

    const includesMatch = groupMembers.find((member) => {
      const memberName = normalizeText(member?.name);
      return memberName && (memberName.includes(query) || query.includes(memberName));
    });

    return includesMatch || null;
  };

  const fetchCompletedAuctions = async () => {
    if (!groupId) return;
    try {
      const response = await ApiService.makeRequest(`/admin/groups/getCompletedAuctions?groupId=${groupId}`, { method: 'GET' });
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        setFetchedPastWinners(result.data);
      }
    } catch (error) {
      console.error('Error fetching completed auctions:', error);
    }
  };

  useEffect(() => {
    if (visible && groupId) {
      fetchCompletedAuctions();
    }
  }, [visible, groupId]);

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
      
      if (visible && groupId) {
        fetchPendingAuction();
      }
    }
  }, [initialWinnerData, visible, groupId]);

  const fetchPendingAuction = async () => {
    try {
      const response = await ApiService.makeRequest(`/admin/groups/getPendingAuctionWinner?groupId=${groupId}`, { method: 'GET' });
      const result = await response.json();
      if (result && result.success && result.data) {
        setFormData({
          chitWinnerName: result.data.chitWinnerName || '',
          chitWinnerMemberId: result.data.chitWinnerMemberId || '',
          amountTaken: result.data.amountTaken?.toString() || '',
          datePicked: result.data.datePicked?.split('T')[0] || '',
        });
      }
    } catch (error) {
      console.error('Error fetching pending auction:', error);
    }
  };

  useEffect(() => {
    if (!visible || !formData.chitWinnerName.trim() || groupMembers.length === 0) {
      return;
    }

    const matchedMember = findBestMemberMatch(formData.chitWinnerName);
    const targetMemberId = matchedMember ? String(matchedMember.id || matchedMember.phone || '') : '';

    if (targetMemberId && targetMemberId !== formData.chitWinnerMemberId && !autoFilledPhoneRef.current) {
      setFormData((prev) => ({
        ...prev,
        chitWinnerMemberId: targetMemberId,
      }));
      autoFilledPhoneRef.current = targetMemberId;
      if (errors.chitWinnerMemberId) {
        setErrors((prev) => ({
          ...prev,
          chitWinnerMemberId: null,
        }));
      }
      return;
    }
  }, [errors.chitWinnerMemberId, formData.chitWinnerMemberId, formData.chitWinnerName, groupMembers, visible]);

  const handleInputChange = (field, value) => {
    let cleanValue = value;
    if (field === 'amountTaken') {
      cleanValue = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    if (field === 'chitWinnerName') {
      const matchedMember = findBestMemberMatch(cleanValue);
      const targetMemberId = matchedMember ? String(matchedMember.id || matchedMember.phone || '') : '';

      if (targetMemberId) {
        setFormData((prev) => ({
          ...prev,
          chitWinnerName: cleanValue,
          chitWinnerMemberId: targetMemberId,
        }));
        autoFilledPhoneRef.current = targetMemberId;
      }
    }
  };

  const isUserAlreadyWon = (name, memberId) => {
    const normName = normalizeText(name);
    const normId = normalizeText(memberId);

    const allPast = [...pastWinners, ...fetchedPastWinners];

    return allPast.some(winner => {
      const pastName = normalizeText(winner.name || winner.chitWinnerName || winner.winner_name);
      const pastId = normalizeText(winner.memberId || winner.chitWinnerMemberId || winner.winner_member_phone || winner.winner_user_id);

      const nameMatch = normName && pastName && normName === pastName;
      const idMatch = normId && pastId && normId === pastId;

      return nameMatch || idMatch;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.chitWinnerName || formData.chitWinnerName.trim() === '') {
      newErrors.chitWinnerName = 'Winner name is required';
    }
    if (!formData.chitWinnerMemberId || formData.chitWinnerMemberId.trim() === '') {
      newErrors.chitWinnerMemberId = 'Member ID or phone is required';
    } else if (!/^\d{1,12}$/.test(formData.chitWinnerMemberId.trim())) {
      newErrors.chitWinnerMemberId = 'Please enter a valid numeric Member ID or phone number';
    }
    if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) {
      newErrors.amountTaken = 'Please enter a valid amount taken';
    }
    if (!formData.datePicked || formData.datePicked.trim() === '') {
      newErrors.datePicked = 'Auction date is required';
    }

    // Strict Rule: Prevent members who have already won from winning again
    if (isUserAlreadyWon(formData.chitWinnerName, formData.chitWinnerMemberId)) {
      newErrors.chitWinnerName = 'STRICT RULE: This member has ALREADY won a chit auction in a previous cycle for this group and cannot win again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    } else {
      Alert.alert('Validation Error', errors.chitWinnerName || 'Please fill all required fields correctly.');
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

  const openDatePicker = () => {
    const parsed = formData.datePicked ? new Date(formData.datePicked) : new Date();
    setSelectedDate(isNaN(parsed.getTime()) ? new Date() : parsed);
    setShowDatePicker(true);
  };

  const onAndroidDateChange = (event, selectedDateVal) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    const finalDate = selectedDateVal || selectedDate;
    setShowDatePicker(false);
    handleInputChange('datePicked', formatDateForInput(finalDate));
  };

  const onIOSDateChange = (_event, selectedDateVal) => {
    if (selectedDateVal) {
      setSelectedDate(selectedDateVal);
    }
  };

  const confirmIOSDate = () => {
    handleInputChange('datePicked', formatDateForInput(selectedDate));
    setShowDatePicker(false);
  };

  const cancelIOSDate = () => {
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
                placeholder="Auto-fills from winner name"
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
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.liveAuctionButton} 
            onPress={() => {
              onClose();
              navigation.navigate('AuctionSettings');
            }}
          >
            <MaterialCommunityIcons name="gavel" size={20} color="#FFFFFF" />
            <Text style={styles.liveAuctionButtonText}>Go to Live Auction</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  <Text style={styles.iosPickerTitle}>Select Auction Date</Text>
                  <TouchableOpacity onPress={confirmIOSDate} style={styles.iosPickerButton}>
                    <Text style={[styles.iosPickerButtonText, { color: '#6B46C1' }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
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
            maximumDate={new Date()}
            onChange={onAndroidDateChange}
          />
        )
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
    marginBottom: -7,
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
    marginBottom: 18,
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
  liveAuctionButton: {
    backgroundColor: '#10B981', // Emerald green color
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: -5,
  },
  liveAuctionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date Picker Specific Styles
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

export default AuctionW;