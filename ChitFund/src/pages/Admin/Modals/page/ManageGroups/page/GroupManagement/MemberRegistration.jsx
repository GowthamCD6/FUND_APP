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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MemberRegistration = ({ visible, onClose, group, onSave }) => {
  // Sample members data
  const [allMembers] = useState([
    { id: '9876543210', name: 'முருகன் குமார்', phone: '9876543210' },
    { id: '9876543211', name: 'லட்சுமி செல்வி', phone: '9876543211' },
    { id: '9876543212', name: 'ராஜேஷ் பாபு', phone: '9876543212' },
    { id: '9876543213', name: 'பிரியா தேவி', phone: '9876543213' },
    { id: '9876543214', name: 'கண்ணன் ராஜ்', phone: '9876543214' },
    { id: '9876543215', name: 'சுந்தரி அம்மாள்', phone: '9876543215' },
    { id: '9876543216', name: 'வேலு நாயுடு', phone: '9876543216' },
    { id: '9876543217', name: 'மீனா குமாரி', phone: '9876543217' },
    { id: '9876543218', name: 'சிவன் ராஜு', phone: '9876543218' },
    { id: '9876543219', name: 'கமலா தேவி', phone: '9876543219' },
  ]);

  const [memberMappings, setMemberMappings] = useState([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [currentMappingId, setCurrentMappingId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (visible && group) {
      // Initialize with existing member mappings if any
      setMemberMappings(group.memberMappings || []);
    }
  }, [visible, group]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateForStorage = (date) => {
    return date.toISOString().split('T')[0];
  };

  const addMemberMapping = () => {
    setMemberMappings([...memberMappings, {
      id: Date.now(),
      memberId: '',
      name: '',
      status: 'pending',
      amount: group?.monthlyAmount?.toString() || '10000',
      paidDate: null
    }]);
  };

  const removeMemberMapping = (id) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setMemberMappings(memberMappings.filter(mapping => mapping.id !== id));
          }
        }
      ]
    );
  };

  const updateMemberMapping = (id, field, value) => {
    setMemberMappings(memberMappings.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
  };

  const openMemberPicker = (mappingId) => {
    setCurrentMappingId(mappingId);
    setShowMemberPicker(true);
  };

  const selectMember = (member) => {
    updateMemberMapping(currentMappingId, 'memberId', member.id);
    updateMemberMapping(currentMappingId, 'name', member.name);
    setShowMemberPicker(false);
  };

  const openDatePicker = (mappingId) => {
    setCurrentMappingId(mappingId);
    const mapping = memberMappings.find(m => m.id === mappingId);
    setSelectedDate(mapping.paidDate ? new Date(mapping.paidDate) : new Date());
    setShowDatePicker(true);
  };

  const selectDate = () => {
    updateMemberMapping(currentMappingId, 'paidDate', formatDateForStorage(selectedDate));
    setShowDatePicker(false);
  };

  const handleSave = () => {
    // Validation
    const errors = [];
    
    memberMappings.forEach((mapping, index) => {
      if (!mapping.memberId) {
        errors.push(`Member ${index + 1}: Please select a member`);
      }
      if (!mapping.amount || isNaN(mapping.amount) || parseFloat(mapping.amount) <= 0) {
        errors.push(`Member ${index + 1}: Please enter a valid amount`);
      }
      if (mapping.status === 'paid' && !mapping.paidDate) {
        errors.push(`Member ${index + 1}: Please select paid date`);
      }
    });

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    // Save the data
    onSave(memberMappings);
    Alert.alert('Success', 'Member registration saved successfully');
  };

  const getAvailableMembers = () => {
    const usedMemberIds = memberMappings.map(mapping => mapping.memberId).filter(id => id);
    return allMembers.filter(member => !usedMemberIds.includes(member.id));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Member Registration</Text>
            <Text style={styles.headerSubtitle}>Add and manage group members</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.groupInfoCard}>
          <View style={styles.groupInfoHeader}>
            <View style={styles.groupInfoIcon}>
              <MaterialCommunityIcons name="account-group" size={20} color="#6B46C1" />
            </View>
            <View style={styles.groupInfoContent}>
              <Text style={styles.groupName}>{group?.groupName || 'Group Name'}</Text>
              <Text style={styles.groupDetails}>
                Monthly Amount: ₹{group?.monthlyAmount || '10,000'}
              </Text>
            </View>
          </View>
        </View>

        {/* Members List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {memberMappings.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberCardHeader}>
                <TouchableOpacity
                  style={styles.memberSelectButton}
                  onPress={() => openMemberPicker(member.id)}
                >
                  <MaterialCommunityIcons name="account" size={16} color="#6B7280" />
                  <Text style={[styles.memberSelectText, !member.name && styles.placeholderText]}>
                    {member.name || 'Select member'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => removeMemberMapping(member.id)}
                  style={styles.removeButton}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.memberCardRow}>
                <View style={[styles.memberCardInput, { flex: 1 }]}>
                  <Text style={styles.memberCardLabel}>Amount</Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={styles.memberCardInputField}
                      value={member.amount}
                      onChangeText={(value) => updateMemberMapping(member.id, 'amount', value)}
                      placeholder="10000"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.memberCardRow}>
                <View style={[styles.memberCardInput, { flex: 1 }]}>
                  <Text style={styles.memberCardLabel}>Payment Status</Text>
                  <View style={styles.statusPicker}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        member.status === 'paid' && styles.statusOptionActive
                      ]}
                      onPress={() => updateMemberMapping(member.id, 'status', 'paid')}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        member.status === 'paid' && styles.statusOptionTextActive
                      ]}>
                        Paid
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        member.status === 'pending' && styles.statusOptionActive
                      ]}
                      onPress={() => updateMemberMapping(member.id, 'status', 'pending')}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        member.status === 'pending' && styles.statusOptionTextActive
                      ]}>
                        Pending
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {member.status === 'paid' && (
                <View style={styles.paidDateContainer}>
                  <Text style={styles.memberCardLabel}>Paid Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => openDatePicker(member.id)}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                    <Text style={[styles.datePickerText, !member.paidDate && styles.placeholderText]}>
                      {member.paidDate ? formatDateForDisplay(member.paidDate) : 'Select paid date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={addMemberMapping}
            style={styles.addMemberButton}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#6B46C1" />
            <Text style={styles.addMemberButtonText}>Add Member</Text>
          </TouchableOpacity>

          {memberMappings.length > 0 && (
            <View style={styles.memberSummary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.memberSummaryRow}>
                <Text style={styles.memberSummaryLabel}>Total Registered Members</Text>
                <Text style={styles.memberSummaryValue}>{memberMappings.length}</Text>
              </View>
              <View style={styles.memberSummaryRow}>
                <Text style={styles.memberSummaryLabel}>Total Amount Expected</Text>
                <Text style={styles.memberSummaryValue}>
                  ₹{memberMappings.reduce((sum, member) => sum + (parseFloat(member.amount) || 0), 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.memberSummaryRow}>
                <Text style={styles.memberSummaryLabel}>Paid Members</Text>
                <Text style={styles.memberSummaryValue}>
                  {memberMappings.filter(m => m.status === 'paid').length}
                </Text>
              </View>
              <View style={styles.memberSummaryRow}>
                <Text style={styles.memberSummaryLabel}>Pending Members</Text>
                <Text style={styles.memberSummaryValue}>
                  {memberMappings.filter(m => m.status === 'pending').length}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Member Picker Modal */}
        <Modal
          visible={showMemberPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMemberPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.memberPickerModal}>
              <View style={styles.memberPickerHeader}>
                <Text style={styles.memberPickerTitle}>Select Member</Text>
                <TouchableOpacity onPress={() => setShowMemberPicker(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.memberPickerContent}>
                {getAvailableMembers().map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.memberPickerItem}
                    onPress={() => selectMember(member)}
                  >
                    <View style={styles.memberPickerItemContent}>
                      <MaterialCommunityIcons name="account" size={20} color="#6B46C1" />
                      <View style={styles.memberPickerItemText}>
                        <Text style={styles.memberPickerItemName}>{member.name}</Text>
                        <Text style={styles.memberPickerItemPhone}>{member.phone}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
                {getAvailableMembers().length === 0 && (
                  <Text style={styles.noMembersText}>No available members to add</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
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
                  <Text style={styles.datePickerTitle}>Select Paid Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContent}>
                  <Text style={styles.selectedDateText}>
                    {selectedDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.datePickerActions}>
                  <TouchableOpacity 
                    style={styles.cancelDateButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelDateText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirmDateButton}
                    onPress={selectDate}
                  >
                    <Text style={styles.confirmDateText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  groupInfoCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfoContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  memberSelectText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
    color: '#374151',
    fontSize: 14,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 8,
  },
  memberCardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  memberCardInput: {
    marginRight: 12,
  },
  memberCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputPrefix: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  memberCardInputField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#374151',
  },
  statusPicker: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  statusOptionActive: {
    backgroundColor: '#6B46C1',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  paidDateContainer: {
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 14,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B46C1',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addMemberButtonText: {
    marginLeft: 8,
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '600',
  },
  memberSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  memberSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  memberPickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  memberPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  memberPickerContent: {
    maxHeight: 400,
  },
  memberPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberPickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberPickerItemText: {
    marginLeft: 12,
    flex: 1,
  },
  memberPickerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  memberPickerItemPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  noMembersText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    padding: 40,
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  datePickerContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B46C1',
  },
  datePickerActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  cancelDateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmDateButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmDateText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
});

export default MemberRegistration;