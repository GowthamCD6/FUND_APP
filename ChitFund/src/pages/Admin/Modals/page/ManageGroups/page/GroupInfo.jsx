import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import pageStyles from '../ManageGsty';

const GroupInfoAdmin = ({ group, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    currentMonthAmount: group.currentMonthAmount?.toString() || group.monthlyAmount?.toString() || '',
    elathThalupadi: group.elathThalupadi?.toString() || '',
    commission: group.commission?.toString() || '',
    chitWinnerName: group.currentChitWinner?.name || '',
    chitWinnerMemberId: group.currentChitWinner?.memberId || '',
    amountTaken: group.currentChitWinner?.amountTaken?.toString() || '',
    datePicked: group.currentChitWinner?.datePicked || '',
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentMonthAmount || parseFloat(formData.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid amount';
    }

    if (formData.elathThalupadi && parseFloat(formData.elathThalupadi) < 0) {
      newErrors.elathThalupadi = 'Discount cannot be negative';
    }

    if (formData.commission && parseFloat(formData.commission) < 0) {
      newErrors.commission = 'Commission cannot be negative';
    }

    // If any chit winner field is filled, validate all chit winner fields
    const hasChitWinnerData = formData.chitWinnerName || formData.chitWinnerMemberId || 
                               formData.amountTaken || formData.datePicked;

    if (hasChitWinnerData) {
      if (!formData.chitWinnerName) {
        newErrors.chitWinnerName = 'Winner name is required';
      }
      if (!formData.chitWinnerMemberId) {
        newErrors.chitWinnerMemberId = 'Member ID is required';
      }
      if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) {
        newErrors.amountTaken = 'Please enter valid amount taken';
      }
      if (!formData.datePicked) {
        newErrors.datePicked = 'Date picked is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    const dataToSave = {
      currentMonthAmount: parseFloat(formData.currentMonthAmount),
      elathThalupadi: formData.elathThalupadi ? parseFloat(formData.elathThalupadi) : 0,
      commission: formData.commission ? parseFloat(formData.commission) : 0,
      currentChitWinner: formData.chitWinnerName ? {
        name: formData.chitWinnerName,
        memberId: formData.chitWinnerMemberId,
        amountTaken: parseFloat(formData.amountTaken),
        datePicked: formData.datePicked,
      } : null,
    };

    onSave(dataToSave);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const handleDateSelect = () => {
    const formattedDate = formatDateForInput(selectedDate);
    handleInputChange('datePicked', formattedDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    if (formData.datePicked) {
      setSelectedDate(new Date(formData.datePicked));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'not-started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'progress-clock';
      case 'not-started': return 'clock-outline';
      default: return 'help-circle';
    }
  };

  return (
    <View style={pageStyles.container}>
      {/* Header */}
      <View style={pageStyles.header}>
        <View style={pageStyles.headerContent}>
          <TouchableOpacity onPress={onBack} style={pageStyles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={pageStyles.headerTitle}>Update Group Details</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.formContainer}>
        {/* Group Info Header */}
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupCode}>#{group.groupCode}</Text>
          <View style={[pageStyles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
            <MaterialCommunityIcons 
              name={getStatusIcon(group.status)} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={pageStyles.statusText}>
              {group.status === 'not-started' ? 'NOT STARTED' : group.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Current Month Details Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Month Payment Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount to be Paid This Month *</Text>
            <TextInput
              style={[styles.input, errors.currentMonthAmount && styles.inputError]}
              value={formData.currentMonthAmount}
              onChangeText={(value) => handleInputChange('currentMonthAmount', value)}
              placeholder="Enter amount"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {errors.currentMonthAmount && (
              <Text style={styles.errorText}>{errors.currentMonthAmount}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>எலத் தள்ளுபடி (Discount)</Text>
            <TextInput
              style={[styles.input, errors.elathThalupadi && styles.inputError]}
              value={formData.elathThalupadi}
              onChangeText={(value) => handleInputChange('elathThalupadi', value)}
              placeholder="Enter discount amount"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {errors.elathThalupadi && (
              <Text style={styles.errorText}>{errors.elathThalupadi}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>கசர் (Commission)</Text>
            <TextInput
              style={[styles.input, errors.commission && styles.inputError]}
              value={formData.commission}
              onChangeText={(value) => handleInputChange('commission', value)}
              placeholder="Enter commission amount"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {errors.commission && (
              <Text style={styles.errorText}>{errors.commission}</Text>
            )}
          </View>
        </View>

        {/* Monthly Chit Auction Winner Registration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="trophy" size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Monthly Chit Auction Winner Registration</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Register the successful bidder and auction details for this month's cycle
          </Text>

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
              placeholder="Enter mobile number (10 digits)"
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
            <TextInput
              style={[styles.input, errors.amountTaken && styles.inputError]}
              value={formData.amountTaken}
              onChangeText={(value) => handleInputChange('amountTaken', value)}
              placeholder="Enter amount taken"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
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
              <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
              <Text style={[styles.datePickerText, !formData.datePicked && styles.placeholderText]}>
                {formData.datePicked ? formatDateForDisplay(formData.datePicked) : 'Select auction date'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.datePicked && (
              <Text style={styles.errorText}>{errors.datePicked}</Text>
            )}
            <Text style={styles.helperText}>Date when the chit auction was conducted</Text>
          </View>
        </View>

        {/* Summary Preview */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Amount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(formData.currentMonthAmount || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(formData.elathThalupadi || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Commission:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(formData.commission || 0)}
            </Text>
          </View>
          {formData.amountTaken && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to Winner:</Text>
              <Text style={[styles.summaryValue, styles.winnerAmountText]}>
                {formatCurrency(formData.amountTaken || 0)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
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
      )}

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onBack}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  groupHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  groupCode: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
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
    fontSize: 13,
    marginTop: 4,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 100,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  winnerAmountText: {
    color: '#10B981',
    fontSize: 17,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  
  // Date Picker Button Styles
  datePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  
  // Date Picker Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontSize: 16,
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

export default GroupInfoAdmin;