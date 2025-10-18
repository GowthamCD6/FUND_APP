import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the maximum number of members
const MAX_MEMBERS = 20;

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
    { id: '9876543220', name: 'விஜய் குமார்', phone: '9876543220' },
    { id: '9876543221', name: 'சரண்யா தேவி', phone: '9876543221' },
    { id: '9876543222', name: 'சந்தீப் ராவ்', phone: '9876543222' },
    { id: '9876543223', name: 'நித்யா ஸ்ரீ', phone: '9876543223' },
    { id: '9876543224', name: 'பிரகாஷ் ராஜ்', phone: '9876543224' },
    { id: '9876543225', name: 'காயத்ரி', phone: '9876543225' },
    { id: '9876543226', name: 'அஜய் குமார்', phone: '9876543226' },
    { id: '9876543227', name: 'ரேகா', phone: '9876543227' },
    { id: '9876543228', name: 'பாலாஜி', phone: '9876543228' },
    { id: '9876543229', name: 'சுமதி', phone: '9876543229' },
  ]);

  const [memberMappings, setMemberMappings] = useState([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]); // Track selected members in picker

  // Track if changes have been made to enable/disable Save button
  const [hasChanges, setHasChanges] = useState(false);
  const [initialMemberMappings, setInitialMemberMappings] = useState([]);

  useEffect(() => {
    if (visible && group) {
      const initial = group.memberMappings || [];
      setMemberMappings(initial);
      setInitialMemberMappings(initial);
      setHasChanges(false);
    }
  }, [visible, group]);

  // Effect to compare current mappings with initial to set hasChanges
  useEffect(() => {
    const currentString = JSON.stringify(memberMappings.map(m => ({ id: m.id, memberId: m.memberId, name: m.name })));
    const initialString = JSON.stringify(initialMemberMappings.map(m => ({ id: m.id, memberId: m.memberId, name: m.name })));
    setHasChanges(currentString !== initialString);
  }, [memberMappings, initialMemberMappings]);

  // Reset search when modal closes
  useEffect(() => {
    if (!showMemberPicker) {
      setSearchQuery('');
      setSelectedMembers([]);
    }
  }, [showMemberPicker]);

  const addMultipleMembers = () => {
    const membersPresentCount = memberMappings.filter(m => m.memberId).length;
    
    // Check if the group has reached the maximum number of members
    if (membersPresentCount >= MAX_MEMBERS) {
      Alert.alert(
        'Group Full',
        `This group has reached the maximum of ${MAX_MEMBERS} members.`
      );
      return;
    }

    // Open picker for selecting multiple members
    setShowMemberPicker(true);
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
            setMemberMappings(prevMappings => 
              prevMappings.filter(mapping => mapping.id !== id)
            );
          }
        }
      ]
    );
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        // Check if adding this member would exceed the limit
        const currentMembersCount = memberMappings.filter(m => m.memberId).length;
        const totalAfterAdd = currentMembersCount + prev.length + 1;
        
        if (totalAfterAdd > MAX_MEMBERS) {
          Alert.alert(
            'Limit Reached',
            `You can only add ${MAX_MEMBERS - currentMembersCount - prev.length} more member(s).`
          );
          return prev;
        }
        
        return [...prev, member];
      }
    });
  };

  const confirmAddMembers = () => {
    if (selectedMembers.length === 0) {
      Alert.alert('No Selection', 'Please select at least one member to add.');
      return;
    }

    const newMappings = selectedMembers.map(member => ({
      id: Date.now() + Math.random(), // Unique ID for each mapping
      memberId: member.id,
      name: member.name
    }));

    setMemberMappings(prevMappings => [...prevMappings, ...newMappings]);
    setShowMemberPicker(false);
    setSelectedMembers([]);
  };

  const getAvailableMembers = () => {
    const usedMemberIds = memberMappings
      .filter(mapping => mapping.memberId)
      .map(mapping => mapping.memberId);

    return allMembers.filter(member => !usedMemberIds.includes(member.id));
  };

  const getFilteredMembers = () => {
    const availableMembers = getAvailableMembers();
    
    if (!searchQuery.trim()) {
      return availableMembers;
    }

    const query = searchQuery.toLowerCase();
    return availableMembers.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.phone.includes(query)
    );
  };

  const handleSave = () => {
    onSave(memberMappings);
    onClose(); 
  };

  const handleCloseMemberPicker = () => {
    setShowMemberPicker(false);
    setSelectedMembers([]);
  };

  const selectAllFiltered = () => {
    const filteredMembers = getFilteredMembers();
    const currentMembersCount = memberMappings.filter(m => m.memberId).length;
    const availableSlots = MAX_MEMBERS - currentMembersCount;
    
    if (filteredMembers.length > availableSlots) {
      Alert.alert(
        'Limit Reached',
        `You can only add ${availableSlots} more member(s). Only the first ${availableSlots} members will be selected.`
      );
      setSelectedMembers(filteredMembers.slice(0, availableSlots));
    } else {
      setSelectedMembers(filteredMembers);
    }
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  // Calculate the actual number of members present in the group
  const membersPresentCount = memberMappings.filter(m => m.memberId).length;
  const availableSlotsCount = MAX_MEMBERS - membersPresentCount;
  const isAddMemberButtonDisabled = membersPresentCount >= MAX_MEMBERS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (hasChanges) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Do you want to discard them and close?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: onClose },
            ]
          );
        } else {
          onClose();
        }
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (hasChanges) {
                Alert.alert(
                  'Unsaved Changes',
                  'You have unsaved changes. Do you want to discard them and close?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: onClose },
                  ]
                );
              } else {
                onClose();
              }
            }} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Member Registration</Text>
            <Text style={styles.headerSubtitle}>
              Add and manage group members
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            disabled={!hasChanges}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Group Info Card */}
        <View style={styles.groupNameCard}>
          <View style={styles.groupInfoHeader}>
            <View style={styles.groupInfoIcon}>
              <MaterialCommunityIcons name="account-group" size={20} color="#6B46C1" />
            </View>
            <View style={styles.groupInfoContent}>
              <Text style={styles.groupName}>{group?.groupName || 'Group Name'}</Text>
            </View>
          </View>
        </View>

        {/* Member Stats Cards - Improved Layout */}
        <View style={styles.memberStatsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="account-multiple-check" size={22} color="#10B981" />
              <Text style={styles.statCount}>{membersPresentCount}</Text>
            </View>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="account-plus-outline" size={22} color="#F59E0B" />
              <Text style={styles.statCount}>{availableSlotsCount}</Text>
            </View>
            <Text style={styles.statLabel}>Available Slots</Text>
          </View>
        </View>

        {/* Members List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {memberMappings.filter(m => m.memberId).map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.selectedMemberContainer}>
                <View style={styles.selectedMemberInfo}>
                  <View style={styles.selectedMemberIcon}>
                    <MaterialCommunityIcons name="account-check" size={20} color="#6B46C1" />
                  </View>
                  <View style={styles.selectedMemberText}>
                    <Text style={styles.selectedMemberName}>{member.name}</Text>
                    <Text style={styles.selectedMemberPhone}>Phone: {member.memberId}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeMemberMapping(member.id)}
                  style={styles.removeButton}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={addMultipleMembers}
            style={[styles.addMemberButton, isAddMemberButtonDisabled && styles.addMemberButtonDisabled]}
            disabled={isAddMemberButtonDisabled}
          >
            <MaterialCommunityIcons name="account-multiple-plus" size={20} color={isAddMemberButtonDisabled ? "#9CA3AF" : "#6B46C1"} />
            <Text style={[styles.addMemberButtonText, isAddMemberButtonDisabled && styles.addMemberButtonTextDisabled]}>
              Add Members
            </Text>
          </TouchableOpacity>

          {membersPresentCount === MAX_MEMBERS && (
            <Text style={styles.groupLimitReachedText}>
              This group has reached its maximum of {MAX_MEMBERS} members.
            </Text>
          )}
        </ScrollView>

        {/* Member Picker Modal with Multi-Select */}
        <Modal
          visible={showMemberPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseMemberPicker}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.memberPickerModal}>
              <View style={styles.memberPickerHeader}>
                <View style={styles.pickerHeaderLeft}>
                  <Text style={styles.memberPickerTitle}>Select Members</Text>
                  {selectedMembers.length > 0 && (
                    <View style={styles.selectionBadge}>
                      <Text style={styles.selectionBadgeText}>
                        {selectedMembers.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.pickerHeaderRight}>
                  {selectedMembers.length > 0 && (
                    <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleCloseMemberPicker}>
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Select All Button */}
              {getFilteredMembers().length > 0 && (
                <View style={styles.selectAllContainer}>
                  <TouchableOpacity onPress={selectAllFiltered} style={styles.selectAllButton}>
                    <MaterialCommunityIcons name="checkbox-multiple-marked" size={18} color="#6B46C1" />
                    <Text style={styles.selectAllText}>Select All</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView style={styles.memberPickerContent}>
                {getFilteredMembers().map((member) => {
                  const isSelected = selectedMembers.some(m => m.id === member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberPickerItem,
                        isSelected && styles.memberPickerItemSelected
                      ]}
                      onPress={() => toggleMemberSelection(member)}
                    >
                      <View style={styles.memberPickerItemContent}>
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && (
                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <View style={styles.memberInfoContainer}>
                          <Text style={styles.memberPickerItemName}>{member.name}</Text>
                          <Text style={styles.memberPickerItemPhone}>{member.phone}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {getFilteredMembers().length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
                    <Text style={styles.noMembersText}>
                      {searchQuery ? 'No members found matching your search' : 'No available members to add'}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Add Members Button */}
              <View style={styles.addMembersFooter}>
                <TouchableOpacity
                  onPress={confirmAddMembers}
                  style={[
                    styles.confirmAddButton,
                    selectedMembers.length === 0 && styles.confirmAddButtonDisabled
                  ]}
                  disabled={selectedMembers.length === 0}
                >
                  <Text style={styles.confirmAddButtonText}>
                    Add {selectedMembers.length > 0 ? `${selectedMembers.length} ` : ''}Member{selectedMembers.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    marginRight: 10, 
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
    backgroundColor: '#6B46C1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10, 
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E0', 
  },
  groupNameCard: {
    marginHorizontal: 20,
    marginTop: 20,
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
  // Improved Member Stats Cards - Icon left, number below, text at bottom
  memberStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 5,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  selectedMemberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedMemberIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedMemberText: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedMemberPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
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
  addMemberButtonDisabled: {
    borderColor: '#D1D5DB', 
  },
  addMemberButtonTextDisabled: {
    color: '#9CA3AF', 
  },
  groupLimitReachedText: {
    fontSize: 14,
    color: '#EF4444', 
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  memberPickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flex: 1, 
  },
  memberPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectionBadge: {
    marginLeft: 10,
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pickerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  selectAllContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  memberPickerContent: {
    flex: 1,
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
  memberPickerItemSelected: {
    backgroundColor: '#F9FAFB',
  },
  memberPickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  memberInfoContainer: {
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
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noMembersText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  addMembersFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  confirmAddButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmAddButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemberRegistration;