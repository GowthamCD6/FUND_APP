import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './createGsty';
import ApiService from '../../../../../services/ApiService';

const CreateGroup = ({ onBack, navigation }) => {
  const [groupData, setGroupData] = useState({
    // groupId: '',
    groupName: '',
    totalMembers: '20',
    groupAmount: '',
    duration: '20',
    startDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // useEffect(() => {
  //   generateGroupId();
  // }, []);

  // const generateGroupId = () => {
  //   const timestamp = Date.now().toString().slice(-6);
  //   const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  //   const groupId = `GRP${timestamp}${random}`;
  //   setGroupData(prev => ({ ...prev, groupId }));
  // };

  const handleInputChange = (field, value) => {
    setGroupData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { groupName, totalMembers, groupAmount, duration, startDate } = groupData;

    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter group name');
      return false;
    }
    if (!totalMembers || isNaN(totalMembers) || parseInt(totalMembers) < 2) {
      Alert.alert('Validation Error', 'Total members must be at least 2');
      return false;
    }
    if (!groupAmount || isNaN(groupAmount) || parseFloat(groupAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid group amount');
      return false;
    }
    if (!duration || isNaN(duration) || parseInt(duration) < 1) {
      Alert.alert('Validation Error', 'Please enter valid duration in months');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('Validation Error', 'Please enter start date');
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
        totalMembers: parseInt(groupData.totalMembers),
        groupAmount: parseFloat(groupData.groupAmount),
        duration: parseInt(groupData.duration),
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
      
      const successMsg = `Group "${result.data.group_name}" created successfully!\nGroup ID: ${result.data.group_code}`;
      Alert.alert('Success!', successMsg);
      onBack();

    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Group</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.formContainer}>
            {/* Group ID Display */}
            {/* <View style={styles.groupIdContainer}>
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
          </View> */}

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
              {groupData.totalMembers && groupData.groupAmount && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Group Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Group Amount:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{parseFloat(groupData.groupAmount || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Per Member Contribution:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{(parseFloat(groupData.groupAmount || 0) / parseInt(groupData.totalMembers || 1)).toLocaleString()}
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



export default CreateGroup;
