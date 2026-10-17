import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../../../../services/ApiService';
import Header from '../../../../../../../components/HeaderComponent/Header';

const SkeletonBox = ({ width, height, borderRadius = 6, style }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#CBD5E1',
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

const MemberRowSkeleton = () => (
  <View style={styles.memberCard}>
    <View style={styles.selectedMemberContainer}>
      <View style={styles.selectedMemberInfo}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={[styles.selectedMemberText, { gap: 6 }]}>
          <SkeletonBox width={140} height={16} borderRadius={4} />
          <SkeletonBox width={100} height={12} borderRadius={4} />
        </View>
      </View>
      <SkeletonBox width={24} height={24} borderRadius={12} />
    </View>
  </View>
);

const MemberRegistration = ({ visible, onClose, group, onSave, onMembersUpdate }) => {
  // Dynamic max members capacity from group definition
  const maxGroupMembers = Number(group?.totalMembers || group?.total_members || group?.numberOfUsers || 20);

  // Sample members data
  const [allMembers, setAllMembers] = useState([]);

  const [memberMappings, setMemberMappings] = useState([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]); // Track selected members in picker

  // Track loading state for content skeleton loader
  const [isLoading, setIsLoading] = useState(true);

  // Track if changes have been made to enable/disable Save button
  const [hasChanges, setHasChanges] = useState(false);
  const [initialMemberMappings, setInitialMemberMappings] = useState([]);

  useEffect(() => {
    if (visible && group) {
      // When the modal opens, fetch current members for the group from backend
      const fetchGroupMembers = async () => {
        setIsLoading(true);
        try {
          const groupIdNum = getGroupDbId();
          if (!groupIdNum) return;
          const resp = await ApiService.makeRequest(`/admin/groups/getMembers?groupId=${groupIdNum}`, { method: 'GET' });
          const json = await resp.json();
          if (!json.success) {
            console.warn('Failed to fetch group members');
            return;
          }
          const mappings = (json.members || []).map(m => ({
            id: m.mappingId || m.userId || `mem_${m.userId}`,
            memberId: m.userId,
            name: m.name || m.nickname || 'Unnamed',
            phone: m.phone || 'N/A',
            hasWonAuction: Boolean(m.hasWonAuction),
            amountTaken: m.amountTaken,
            auctionDate: m.auctionDate,
          }));
          setMemberMappings(mappings);
          setInitialMemberMappings(mappings);
          setHasChanges(false);
        } catch (err) {
          console.error('Error fetching group members:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGroupMembers();
    }
  }, [visible, group]);

  const getGroupDbId = () => {
    if (!group) return null;
    if (typeof group.id === 'number' && !Number.isNaN(group.id)) return group.id;
    if (group.id && !Number.isNaN(Number(group.id))) return Number(group.id);
    if (group.groupId && !Number.isNaN(Number(group.groupId))) return Number(group.groupId);
    return null;
  };

  const fetchUsers = async () => {
    try {
      const response = await ApiService.makeRequest('/admin/users/getAllUsers', {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setAllMembers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Effect to compare current mappings with initial to set hasChanges
  useEffect(() => {
    const currentString = JSON.stringify(
      memberMappings.map(m => ({ id: m.id, memberId: m.memberId, name: m.name })),
    );
    const initialString = JSON.stringify(
      initialMemberMappings.map(m => ({
        id: m.id,
        memberId: m.memberId,
        name: m.name,
      })),
    );
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
    if (membersPresentCount >= maxGroupMembers) {
      Alert.alert(
        'Group Full',
        `This group has reached the maximum of ${maxGroupMembers} members.`,
      );
      return;
    }

    // Open picker for selecting multiple members
    setShowMemberPicker(true);
  };

  const removeMemberMapping = memberIdToRemove => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupIdNum = getGroupDbId();
              if (!groupIdNum) {
                Alert.alert('Error', 'Invalid group id');
                return;
              }
              
              const resp = await ApiService.makeRequest('/admin/groups/removeMembers', {
                method: 'POST',
                body: JSON.stringify({ groupId: groupIdNum, members: [memberIdToRemove] }),
              });
              const json = await resp.json();
              if (!json.success) {
                Alert.alert('Error', 'Failed to remove member');
                return;
              }
              const updatedMappings = memberMappings.filter(m => m.memberId !== memberIdToRemove);
              setMemberMappings(updatedMappings);
              if (typeof onMembersUpdate === 'function') {
                onMembersUpdate(updatedMappings.length);
              }
            } catch (err) {
              console.error('Error removing member:', err);
              Alert.alert('Error', 'An error occurred while removing member.');
            }
          },
        },
      ],
    );
  };

  const toggleMemberSelection = member => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);

      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        // Check if adding this member would exceed the limit
        const currentMembersCount = memberMappings.filter(
          m => m.memberId,
        ).length;
        const totalAfterAdd = currentMembersCount + prev.length + 1;

        if (totalAfterAdd > maxGroupMembers) {
          Alert.alert(
            'Limit Reached',
            `You can only add ${Math.max(0, maxGroupMembers - currentMembersCount - prev.length)} more member(s).`,
          );
          return prev;
        }

        return [...prev, member];
      }
    });
  };

  const confirmAddMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('No Selection', 'Please select at least one member to add.');
      return;
    }

    try {
      const groupIdNum = getGroupDbId();
      if (!groupIdNum) {
        Alert.alert('Error', 'Invalid group id');
        return;
      }
      console.log('Adding to group', groupIdNum, selectedMembers.map(m => m.id));
      const response = await ApiService.makeRequest('/admin/groups/addMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId: groupIdNum, members: selectedMembers.map(m => m.id) }),
      });

      const data = await response.json();
      if (!data.success) {
        Alert.alert('Error', 'Failed to add members to the group.');
        return;
      }

      const newMappings = selectedMembers.map(member => ({
        id: Date.now() + Math.random(), // Unique ID for each mapping
        memberId: member.id,
        name: member.name,
        phone: member.phone || 'N/A',
      }));
      const updatedMappings = [...memberMappings, ...newMappings];
      setMemberMappings(updatedMappings);
      if (typeof onMembersUpdate === 'function') {
        onMembersUpdate(updatedMappings.length);
      }
      setShowMemberPicker(false);
      setSelectedMembers([]);
      Alert.alert('Success', 'Members added successfully.');
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'An error occurred while adding members.');
      return;
    }

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
    return availableMembers.filter(member => {
      const name = (member.name || '').toString();
      const phone = (member.phone || '').toString();
      return name.toLowerCase().includes(query) || phone.includes(query);
    });
  };

  const handleToggleAuctionPrize = (member) => {
    const isCurrentlyWon = Boolean(member.hasWonAuction);
    const targetState = !isCurrentlyWon;
    const defaultAmount = Number(group?.groupAmount || group?.group_amount || 100000);

    if (targetState) {
      Alert.alert(
        'Set Auction Prize',
        `Mark "${member.name}" as having received the auction amount for this group?\n(Amount: ₹${defaultAmount.toLocaleString('en-IN')})`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm & Mark',
            onPress: async () => {
              try {
                const groupIdNum = getGroupDbId();
                const resp = await ApiService.makeRequest('/admin/groups/toggleMemberAuctionPrize', {
                  method: 'POST',
                  body: JSON.stringify({
                    groupId: groupIdNum,
                    userId: member.memberId,
                    hasWon: true,
                    amountTaken: defaultAmount,
                  }),
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                  throw new Error(data.message || 'Failed to update prize status');
                }
                setMemberMappings(prev =>
                  prev.map(m =>
                    m.memberId === member.memberId
                      ? { ...m, hasWonAuction: true, amountTaken: defaultAmount }
                      : m
                  )
                );
                Alert.alert('Success', `"${member.name}" marked as auction prize recipient!`);
              } catch (err) {
                Alert.alert('Error', err.message || 'Failed to update auction prize status');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Remove Auction Prize Flag',
        `Are you sure you want to remove the auction prize flag for "${member.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove Flag',
            style: 'destructive',
            onPress: async () => {
              try {
                const groupIdNum = getGroupDbId();
                const resp = await ApiService.makeRequest('/admin/groups/toggleMemberAuctionPrize', {
                  method: 'POST',
                  body: JSON.stringify({
                    groupId: groupIdNum,
                    userId: member.memberId,
                    hasWon: false,
                  }),
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                  throw new Error(data.message || 'Failed to update prize status');
                }
                setMemberMappings(prev =>
                  prev.map(m =>
                    m.memberId === member.memberId
                      ? { ...m, hasWonAuction: false, amountTaken: null }
                      : m
                  )
                );
                Alert.alert('Success', `Auction prize flag removed for "${member.name}".`);
              } catch (err) {
                Alert.alert('Error', err.message || 'Failed to update auction prize status');
              }
            },
          },
        ]
      );
    }
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
    const availableSlots = maxGroupMembers - currentMembersCount;

    if (filteredMembers.length > availableSlots) {
      Alert.alert(
        'Limit Reached',
        `You can only add ${availableSlots} more member(s). Only the first ${availableSlots} members will be selected.`,
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
  const availableSlotsCount = Math.max(0, maxGroupMembers - membersPresentCount);
  const isAddMemberButtonDisabled = membersPresentCount >= maxGroupMembers;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <Header title="Member Registration" onBack={onClose} />

        {/* Group Info Card */}
        <View style={styles.groupNameCard}>
          <View style={styles.groupInfoHeader}>
            <View style={styles.groupInfoIcon}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color="#6B46C1"
              />
            </View>
            <View style={styles.groupInfoContent}>
              <Text style={styles.groupName}>
                {group?.groupName || 'Group Name'}
              </Text>
            </View>
          </View>
        </View>

        {/* Member Stats Cards - Improved Layout */}
        <View style={styles.memberStatsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons
                name="account-multiple-check"
                size={22}
                color="#10B981"
              />
              <Text style={styles.statCount}>{membersPresentCount}</Text>
            </View>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={22}
                color="#F59E0B"
              />
              <Text style={styles.statCount}>{availableSlotsCount}</Text>
            </View>
            <Text style={styles.statLabel}>Available Slots</Text>
          </View>
        </View>

        {/* Members List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <>
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
            </>
          ) : (
            memberMappings
              .filter(m => m.memberId)
              .map(member => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.selectedMemberContainer}>
                    <View style={styles.selectedMemberInfo}>
                      <View style={styles.selectedMemberIcon}>
                        <MaterialCommunityIcons
                          name="account-check"
                          size={20}
                          color="#6B46C1"
                        />
                      </View>
                      <View style={[styles.selectedMemberText, { flex: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
                          <Text style={styles.selectedMemberName}>
                            {member.name}
                          </Text>
                          {member.hasWonAuction ? (
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              backgroundColor: '#FEF3C7', 
                              paddingHorizontal: 6, 
                              paddingVertical: 2, 
                              borderRadius: 8, 
                              borderWidth: 1, 
                              borderColor: '#FDE68A' 
                            }}>
                              <MaterialCommunityIcons name="trophy" size={11} color="#D97706" style={{ marginRight: 2 }} />
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>
                                Prize Won {member.amountTaken ? `(₹${Number(member.amountTaken).toLocaleString('en-IN')})` : ''}
                              </Text>
                            </View>
                          ) : (
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              backgroundColor: '#F1F5F9', 
                              paddingHorizontal: 6, 
                              paddingVertical: 2, 
                              borderRadius: 8, 
                              borderWidth: 1, 
                              borderColor: '#E2E8F0' 
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: '600', color: '#475569' }}>
                                Eligible
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.selectedMemberPhone}>
                          Phone: {member.phone}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleToggleAuctionPrize(member)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: member.hasWonAuction ? '#FEF3C7' : '#F3F4F6',
                          borderWidth: 1,
                          borderColor: member.hasWonAuction ? '#FDE68A' : '#D1D5DB',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                        <MaterialCommunityIcons
                          name={member.hasWonAuction ? "trophy" : "trophy-outline"}
                          size={13}
                          color={member.hasWonAuction ? "#D97706" : "#4B5563"}
                        />
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: member.hasWonAuction ? "#B45309" : "#374151"
                        }}>
                          {member.hasWonAuction ? "Prize Taken" : "Set Prize"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeMemberMapping(member.memberId)}
                        style={styles.removeButton}>
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
          )}

          <TouchableOpacity
            onPress={addMultipleMembers}
            style={[
              styles.addMemberButton,
              isAddMemberButtonDisabled && styles.addMemberButtonDisabled,
            ]}
            disabled={isAddMemberButtonDisabled}>
            <MaterialCommunityIcons
              name="account-multiple-plus"
              size={20}
              color={isAddMemberButtonDisabled ? '#9CA3AF' : '#6B46C1'}
            />
            <Text
              style={[
                styles.addMemberButtonText,
                isAddMemberButtonDisabled && styles.addMemberButtonTextDisabled,
              ]}>
              Add Members
            </Text>
          </TouchableOpacity>

          {membersPresentCount >= maxGroupMembers && (
            <Text style={styles.groupLimitReachedText}>
              This group has reached its maximum of {maxGroupMembers} members.
            </Text>
          )}
        </ScrollView>

        {/* Member Picker Modal with Multi-Select */}
        <Modal
          visible={showMemberPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseMemberPicker}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}>
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
                    <TouchableOpacity
                      onPress={clearSelection}
                      style={styles.clearButton}>
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleCloseMemberPicker}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Select All Button */}
              {getFilteredMembers().length > 0 && (
                <View style={styles.selectAllContainer}>
                  <TouchableOpacity
                    onPress={selectAllFiltered}
                    style={styles.selectAllButton}>
                    <MaterialCommunityIcons
                      name="checkbox-multiple-marked"
                      size={18}
                      color="#6B46C1"
                    />
                    <Text style={styles.selectAllText}>Select All</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView style={styles.memberPickerContent}>
                {getFilteredMembers().map(member => {
                  const isSelected = selectedMembers.some(
                    m => m.id === member.id,
                  );
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberPickerItem,
                        isSelected && styles.memberPickerItemSelected,
                      ]}
                      onPress={() => toggleMemberSelection(member)}>
                      <View style={styles.memberPickerItemContent}>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check"
                              size={16}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                        <View style={styles.memberInfoContainer}>
                          <Text style={styles.memberPickerItemName}>
                            {member.name ? member.name : member.nickname}
                          </Text>
                          <Text style={styles.memberPickerItemPhone}>
                            {member.phone}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {getFilteredMembers().length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <MaterialCommunityIcons
                      name="account-search"
                      size={48}
                      color="#D1D5DB"
                    />
                    <Text style={styles.noMembersText}>
                      {searchQuery
                        ? 'No members found matching your search'
                        : 'No available members to add'}
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
                    selectedMembers.length === 0 &&
                    styles.confirmAddButtonDisabled,
                  ]}
                  disabled={selectedMembers.length === 0}>
                  <Text style={styles.confirmAddButtonText}>
                    Add{' '}
                    {selectedMembers.length > 0
                      ? `${selectedMembers.length} `
                      : ''}
                    Member{selectedMembers.length !== 1 ? 's' : ''}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',

  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
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
    textAlign: 'center',
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
    fontSize: 21,
    fontWeight: '500',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',

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
