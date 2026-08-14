import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './createGsty';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';

const CreateGroup = ({ onBack, navigation }) => {
  const [groupData, setGroupData] = useState({
    groupId: '',
    groupName: '',
    totalMembers: '20',
    groupAmount: '',
    duration: '20',
    startDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdGroupData, setCreatedGroupData] = useState(null);
  const [sharingToComm, setSharingToComm] = useState(false);

  useEffect(() => {
    generateGroupId();
  }, []);

  const generateGroupId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const groupId = `GRP${timestamp}${random}`;
    setGroupData(prev => ({ ...prev, groupId }));
  };

  const sanitizeInput = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/[<>&'"]/g, '');
  };

  const handleInputChange = (field, value) => {
    let cleanedValue = value;
    if (field === 'groupName') {
      cleanedValue = sanitizeInput(value);
    } else if (['totalMembers', 'duration', 'groupAmount'].includes(field)) {
      cleanedValue = value.replace(/[^0-9]/g, '');
    }
    setGroupData(prev => ({ ...prev, [field]: cleanedValue }));
  };

  const validateForm = () => {
    const { groupName, totalMembers, groupAmount, duration, startDate } = groupData;
    const cleanName = (groupName || '').trim();
    const membersNum = parseInt(totalMembers, 10);
    const amountNum = parseFloat(groupAmount);
    const durationNum = parseInt(duration, 10);

    if (!cleanName) {
      Alert.alert('Validation Error', 'Please enter group name.');
      return false;
    }
    if (cleanName.length < 3 || cleanName.length > 60) {
      Alert.alert('Validation Error', 'Group name must be between 3 and 60 characters.');
      return false;
    }
    if (!membersNum || isNaN(membersNum) || membersNum < 2 || membersNum > 500) {
      Alert.alert('Validation Error', 'Total members must be between 2 and 500.');
      return false;
    }
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Validation Error', 'Please enter valid total group amount.');
      return false;
    }
    if (!durationNum || isNaN(durationNum) || durationNum < 1 || durationNum > 120) {
      Alert.alert('Validation Error', 'Duration must be between 1 and 120 months.');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('Validation Error', 'Please select start date.');
      return false;
    }

    return true;
  };

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const parseDDMMYYYY = (value) => {
    try {
      const [dd, mm, yyyy] = (value || '').split('/').map(Number);
      if (!dd || !mm || !yyyy) return new Date();
      return new Date(yyyy, mm - 1, dd);
    } catch {
      return new Date();
    }
  };

  const openDatePicker = () => {
    const initial = parseDDMMYYYY(groupData.startDate);
    setPickerDate(initial);
    setShowDatePicker(true);
  };

  const onAndroidDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    const date = selectedDate || pickerDate;
    setShowDatePicker(false);
    handleInputChange('startDate', formatDate(date));
  };

  const onIOSDateChange = (_event, selectedDate) => {
    if (selectedDate) {
      setPickerDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    handleInputChange('startDate', formatDate(pickerDate));
    setShowDatePicker(false);
  };

  const cancelIOSDate = () => {
    setShowDatePicker(false);
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newGroup = {
        ...groupData,
        groupName: groupData.groupName.trim(),
        groupCode: groupData.groupId,
        totalMembers: parseInt(groupData.totalMembers, 10),
        groupAmount: parseFloat(groupData.groupAmount),
        duration: parseInt(groupData.duration, 10),
        currentMembers: 0,
      };

      const response = await ApiService.makeRequest('/admin/groups/createGroup', {
        method: 'POST',
        body: JSON.stringify(newGroup),
      });

      const contentType = response.headers.get('content-type') || '';
      let result;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response: ${text.substring(0, 200)}`);
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to create group');
      }

      // Store created group data and show share modal
      setCreatedGroupData({
        id: result.data.id,
        groupCode: result.data.group_code,
        groupName: result.data.group_name,
      });
      setShowShareModal(true);

    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error?.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToCommunity = async () => {
    if (!createdGroupData?.id) return;

    setSharingToComm(true);
    try {
      const response = await ApiService.makeRequest('/chats/community/share-group', {
        method: 'POST',
        body: JSON.stringify({ groupId: createdGroupData.id }),
      });
      const result = await response.json();

      if (result.success) {
        Alert.alert('Shared! 🎉', `Group code shared to GDK Community successfully!`);
      } else {
        Alert.alert('Error', result.message || 'Failed to share to community');
      }
    } catch (error) {
      console.error('Error sharing to community:', error);
      Alert.alert('Error', 'Failed to share to community. You can share it later.');
    } finally {
      setSharingToComm(false);
      setShowShareModal(false);
      onBack();
    }
  };

  const handleSkipShare = () => {
    setShowShareModal(false);
    Alert.alert('Success!', `Group "${createdGroupData?.groupName}" created successfully!\nGroup ID: ${createdGroupData?.groupCode}`);
    onBack();
  };

  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSkipShare}
    >
      <View style={shareStyles.overlay}>
        <View style={shareStyles.container}>
          {/* Success Icon */}
          <View style={shareStyles.iconCircle}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
          </View>

          <Text style={shareStyles.title}>Group Created! 🎉</Text>

          <Text style={shareStyles.subtitle}>
            "{createdGroupData?.groupName}" has been created successfully.
          </Text>

          {/* Group Code Display */}
          <View style={shareStyles.codeBox}>
            <Text style={shareStyles.codeLabel}>Group Code</Text>
            <Text style={shareStyles.codeValue}>{createdGroupData?.groupCode}</Text>
          </View>

          <Text style={shareStyles.shareQuestion}>
            Share this group to GDK Community so users can join?
          </Text>

          {/* Share Button */}
          <TouchableOpacity
            style={shareStyles.shareButton}
            onPress={handleShareToCommunity}
            disabled={sharingToComm}
          >
            {sharingToComm ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
                <Text style={shareStyles.shareButtonText}>Share to Community</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={shareStyles.skipButton}
            onPress={handleSkipShare}
            disabled={sharingToComm}
          >
            <Text style={shareStyles.skipButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Create New Group" onBack={onBack} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.formContainer}>
            {/* Group ID Display */}
            <View style={styles.groupIdContainer}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="identifier" size={20} color="#212121" />
                <Text style={styles.groupIdLabel}>Auto-Generated Group ID</Text>
                <TouchableOpacity onPress={generateGroupId} style={styles.refreshButton}>
                  <MaterialCommunityIcons name="refresh" size={18} color="#666666" />
                </TouchableOpacity>
              </View>
              <View style={styles.groupIdBox}>
                <Text style={styles.groupIdText}>{groupData.groupId}</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <InputField
                label="Group Name"
                placeholder="Enter group name"
                value={groupData.groupName}
                onChangeText={(value) => handleInputChange('groupName', value)}
                icon="account-group-outline"
                required
              />

              <View style={styles.row}>
                <View style={[styles.halfWidth, { marginRight: 8 }]}>
                  <InputField
                    label="Total Members"
                    placeholder="e.g. 10"
                    value={groupData.totalMembers}
                    onChangeText={(value) => handleInputChange('totalMembers', value)}
                    icon="account-multiple"
                    keyboardType="numeric"
                    required
                  />
                </View>
                <View style={[styles.halfWidth, { marginLeft: 8 }]}>
                  <InputField
                    label="Duration (Months)"
                    placeholder="e.g. 12"
                    value={groupData.duration}
                    onChangeText={(value) => handleInputChange('duration', value)}
                    icon="calendar-month"
                    keyboardType="numeric"
                    required
                  />
                </View>
              </View>

              <InputField
                label="Group Amount (₹)"
                placeholder="Enter total group amount (e.g., 100000 for 1 Lakh)"
                value={groupData.groupAmount}
                onChangeText={(value) => handleInputChange('groupAmount', value)}
                icon="currency-inr"
                keyboardType="numeric"
                required
              />

              <DateField
                label="Start Date"
                value={groupData.startDate}
                onOpenPicker={openDatePicker}
                icon="calendar"
                required
              />

              {showDatePicker && (
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
                      value={pickerDate}
                      mode="date"
                      display="spinner"
                      onChange={onIOSDateChange}
                    />
                  </View>
                ) : (
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="default"
                    onChange={onAndroidDateChange}
                  />
                )
              )}

              {/* Summary Card */}
              {Boolean(parseInt(groupData.totalMembers, 10)) && Boolean(parseFloat(groupData.groupAmount)) && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Group Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Group Amount:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{parseFloat(groupData.groupAmount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Per Member Contribution:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{Math.round(parseFloat(groupData.groupAmount || 0) / Math.max(1, parseInt(groupData.totalMembers || 1, 10))).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Members:</Text>
                    <Text style={styles.summaryValue}>{groupData.totalMembers}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Duration:</Text>
                    <Text style={styles.summaryValue}>{groupData.duration} months</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.createButtonText}>Creating...</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderShareModal()}
    </View>
  );
};

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  required = false
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#212121" />
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    </View>
    <TextInput
      style={[styles.textInput, multiline && styles.multilineInput]}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);


const DateField = ({ label, value, onOpenPicker, icon, required = false }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#212121" />
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    </View>
    <TouchableOpacity onPress={onOpenPicker} activeOpacity={0.8}>
      <View style={[styles.textInput, { justifyContent: 'center' }]}>
        <Text style={{ color: value ? '#212121' : '#999999' }}>
          {value || 'DD/MM/YYYY'}
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);



const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  codeBox: {
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    width: '100%',
  },
  codeLabel: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B21B6',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  shareQuestion: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  shareButton: {
    backgroundColor: '#6B46C1',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
});

export default CreateGroup;
