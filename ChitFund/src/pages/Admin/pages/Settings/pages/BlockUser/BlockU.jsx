import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BlockUserScreen = ({navigation, onClose}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('blocked');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '+91 9876543210',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Priya Singh',
      phone: '+91 9876543211',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Amit Patel',
      phone: '+91 9876543212',
      status: 'Active',
    },
    {
      id: '4',
      name: 'Sneha Reddy',
      phone: '+91 9876543213',
      status: 'Active',
    },
    {
      id: '5',
      name: 'Vijay Kumar',
      phone: '+91 9876543214',
      status: 'Active',
    },
  ]);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const blocked = await AsyncStorage.getItem('blockedUsers');
      if (blocked) {
        const blockedList = JSON.parse(blocked);
        setBlockedUsers(blockedList);
        // Remove blocked users from allUsers initially
        setAllUsers(prev =>
          prev.filter(user => !blockedList.some(b => b.id === user.id)),
        );
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const handleUnblock = userId => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            const user = blockedUsers.find(u => u.id === userId);
            const updatedBlocked = blockedUsers.filter(u => u.id !== userId);
            setBlockedUsers(updatedBlocked);

            // Add the unblocked user back to allUsers (ensure unique ID handling in a real app)
            if (user) {
              setAllUsers(prev =>
                [
                  ...prev,
                  {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    status: 'Active',
                  },
                ].sort((a, b) => a.name.localeCompare(b.name)),
              ); // Sort to maintain consistency
            }

            try {
              await AsyncStorage.setItem(
                'blockedUsers',
                JSON.stringify(updatedBlocked),
              );
            } catch (error) {
              console.error('Error saving:', error);
            }
          },
        },
      ],
    );
  };

  const handleBlockUser = user => {
    setSelectedUser(user);
    setBlockReason(''); // Clear reason when opening for new block
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for blocking');
      return;
    }

    const newBlockedUser = {
      id: selectedUser.id,
      name: selectedUser.name,
      phone: selectedUser.phone,
      blockedOn: new Date().toISOString().split('T')[0],
      reason: blockReason,
    };

    const updatedBlocked = [...blockedUsers, newBlockedUser];
    setBlockedUsers(updatedBlocked);
    setAllUsers(allUsers.filter(u => u.id !== selectedUser.id)); // Remove from allUsers

    setShowBlockModal(false);
    setBlockReason('');
    setSelectedUser(null);

    try {
      await AsyncStorage.setItem(
        'blockedUsers',
        JSON.stringify(updatedBlocked),
      );
      Alert.alert('Success', 'User has been blocked');
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const renderBlockedUser = ({item}) => (
    <View style={styles.userCard}>
      <View style={styles.cardContent}>
        <View style={styles.userInfoWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userPhone}>{item.phone}</Text>
            <Text style={styles.blockReason}>Reason: {item.reason}</Text>
            <Text style={styles.blockedDate}>Blocked on: {item.blockedOn}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item.id)}>
          <MaterialCommunityIcons name="account-check" size={18} color="#FFF" />
          <Text style={styles.buttonTextSmall}>Unblock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAllUser = ({item}) => (
    <View style={styles.userCard}>
      <View style={styles.cardContent}>
        <View style={styles.userInfoWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userPhone}>{item.phone}</Text>
            <Text style={styles.userStatus}>Status: {item.status}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => handleBlockUser(item)}>
          <MaterialCommunityIcons
            name="account-cancel"
            size={18}
            color="#FFF"
          />
          <Text style={styles.buttonTextSmall}>Block</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredBlockedUsers = blockedUsers.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  );

  const filteredAllUsers = allUsers
    .filter(
      user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery),
    )
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort all users for consistency

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose || (() => navigation?.goBack())}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Block User Management</Text>
      </View>
      <View style={styles.separator} />

      {/* Tab Selector */}
      <View style={styles.tabOuterContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
            onPress={() => setActiveTab('blocked')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'blocked' && styles.activeTabText,
              ]}>
              Blocked ({blockedUsers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}>
              All Users ({allUsers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={activeTab === 'blocked' ? filteredBlockedUsers : filteredAllUsers}
        renderItem={activeTab === 'blocked' ? renderBlockedUser : renderAllUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={
                activeTab === 'blocked' ? 'account-check' : 'account-group'
              }
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyStateText}>
              {activeTab === 'blocked'
                ? 'No blocked users found'
                : 'No users available'}
            </Text>
          </View>
        )}
      />

      {/* Block User Modal */}
      <Modal
        visible={showBlockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBlockModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredModalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowBlockModal(false)}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Block User</Text>
              <View style={{width: 24}} />
            </View>
            <View style={styles.modalHeaderSeparator} />

            <ScrollView style={styles.modalContent}>
              {selectedUser && (
                <View style={styles.modalUserInfo}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.modalUserName}>
                      {selectedUser.name}
                    </Text>
                    <Text style={styles.modalUserPhone}>
                      {selectedUser.phone}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={20}
                    color="#000000"
                  />
                  <Text style={styles.inputLabel}>Reason for blocking</Text>
                  <Text style={styles.requiredStar}>*</Text>
                </View>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter reason for blocking this user..."
                  value={blockReason}
                  onChangeText={setBlockReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.confirmBlockButton}
                onPress={confirmBlock}>
                <MaterialCommunityIcons
                  name="account-cancel"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.buttonText}>Block User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginTop: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
    marginTop: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  tabOuterContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 58,
    marginBottom: -10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: { // New style to wrap the main content
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start of the cross axis
    justifyContent: 'space-between',
  },
  userInfoWrapper: { // New style to group avatar and user details
    flexDirection: 'row',
    alignItems: 'flex-start', // Align avatar and text content to the top
    flex: 1, // Allow it to take up available space
    marginRight: 10, // Space between user info and button
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2, // Slightly adjust avatar position
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userDetails: {
    flex: 1, // Allow user details to take up remaining space
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  blockReason: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8, // Adjusted padding for better fit
    paddingHorizontal: 14, // Adjusted padding
    borderRadius: 8,
    gap: 6,
    // Removed minWidth to let content define width
    alignSelf: 'flex-start', // Align button to the top right
    marginTop: 2, // Align with avatar/name
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8, // Adjusted padding for better fit
    paddingHorizontal: 14, // Adjusted padding
    borderRadius: 8,
    gap: 6,
    // Removed minWidth to let content define width
    alignSelf: 'flex-start', // Align button to the top right
    marginTop: 2, // Align with avatar/name
  },
  buttonTextSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  blockedDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4, // Add margin to separate from reason
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  userStatus: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 4, // Add margin to separate from phone number
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalHeaderSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalUserPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  inputGroup: {
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
  },
  requiredStar: {
    fontSize: 15,
    color: '#EF4444',
    marginLeft: 2,
  },
  textArea: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  modalActions: {
    padding: 20,
    paddingTop: 0,
    marginTop: -5,
  },
  confirmBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
});

// Export with alias for compatibility
const BlockU = BlockUserScreen;
export default BlockU;