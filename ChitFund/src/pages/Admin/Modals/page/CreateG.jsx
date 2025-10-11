import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CreateGroup = ({ onBack }) => {
  const [groupData, setGroupData] = useState({
    groupId: '',
    groupName: '',
    totalMembers: '20',
    groupAmount: '',
    duration: '20',
    startDate: '',
  });
  const [loading, setLoading] = useState(false);

  // Generate unique group ID
  useEffect(() => {
    generateGroupId();
  }, []);

  const generateGroupId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const groupId = `GRP${timestamp}${random}`;
    setGroupData(prev => ({ ...prev, groupId }));
  };

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

  const handleCreateGroup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Get existing groups from AsyncStorage
      const existingGroups = await AsyncStorage.getItem('chitFundGroups');
      const groups = existingGroups ? JSON.parse(existingGroups) : [];
      
      // Create new group object
      const newGroup = {
        ...groupData,
        totalMembers: parseInt(groupData.totalMembers),
        groupAmount: parseFloat(groupData.groupAmount),
        duration: parseInt(groupData.duration),
        createdDate: new Date().toISOString(),
        status: 'Active',
        currentMembers: 0,
        members: []
      };
      
      // Add to groups array
      groups.push(newGroup);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('chitFundGroups', JSON.stringify(groups));
      
      Alert.alert(
        'Success!',
        `Group "${groupData.groupName}" created successfully!\n\nGroup ID: ${groupData.groupId}`,
        [
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form and generate new ID
              setGroupData({
                groupId: '',
                groupName: '',
                totalMembers: '20',
                groupAmount: '',
                duration: '20',
                startDate: '',
              });
              generateGroupId();
            }
          },
          {
            text: 'Done',
            onPress: onBack
          }
        ]
      );
      
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

            <InputField
              label="Start Date"
              placeholder="DD/MM/YYYY"
              value={groupData.startDate}
              onChangeText={(value) => handleInputChange('startDate', value)}
              icon="calendar"
              required
            />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    marginTop: -10,
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContainer: {
    paddingBottom: 40,
  },
  groupIdContainer: {
    marginBottom: 32,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  groupIdLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  groupIdBox: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5F5F5',
    width: '100%',
    marginTop: 8,
  },
  groupIdText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  formSection: {
    gap: 24,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
    width: '100%',
    marginTop: 8,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666666',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
});

export default CreateGroup;
