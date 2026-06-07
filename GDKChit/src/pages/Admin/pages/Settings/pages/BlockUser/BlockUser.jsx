import React, { useState, useEffect } from 'react';
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
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';

const BlockUserScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('blocked');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backAction = () => {
      if (showBlockModal) {
        setShowBlockModal(false);
        return true;
      }
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, showBlockModal]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.makeRequest('/admin/users/getAllUsers', {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = userId => {
    Alert.alert('Unblock User', 'Are you sure you want to unblock this user?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await ApiService.makeRequest('/admin/users/unblock', {
              method: 'POST',
              body: JSON.stringify({ userId }),
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Success', 'User has been unblocked');
              fetchUsers();
            } else {
              Alert.alert('Error', data.message || 'Failed to unblock user');
            }
          } catch (error) {
            console.error('Error unblocking user:', error);
            Alert.alert('Error', 'Failed to unblock user. Please try again.');
          }
        },
      },
    ]);
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

    try {
      const response = await ApiService.makeRequest('/admin/users/block', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: blockReason,
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'User has been blocked');
        setShowBlockModal(false);
        setBlockReason('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        Alert.alert('Error', data.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    }
  };

  const renderBlockedUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardContent}>
        <View style={styles.userInfoWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userPhone}>{item.phone}</Text>
            {item.blockReason ? (
              <Text style={styles.blockReason} numberOfLines={1}>
                Reason: {item.blockReason}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusText, styles.blockedStatus]}>
              Blocked
            </Text>
          </View>
          <TouchableOpacity
            style={styles.unblockButton}
            onPress={() => handleUnblock(item.id)}
          >
            <MaterialCommunityIcons
              name="account-check"
              size={18}
              color="#FFF"
            />
            <Text style={styles.buttonTextSmall}>Unblock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAllUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardContent}>
        <View style={styles.userInfoWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusText, styles.activeStatus]}>
              {item.status}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={() => handleBlockUser(item)}
          >
            <MaterialCommunityIcons
              name="account-cancel"
              size={18}
              color="#FFF"
            />
            <Text style={styles.buttonTextSmall}>Block</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const blockedUsersList = users.filter(u => u.isActive === 0);
  const activeUsersList = users.filter(u => u.isActive === 1);

  const filteredBlockedUsers = blockedUsersList.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  );

  const filteredAllUsers = activeUsersList
    .filter(
      user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Block User Management"
        onBack={() => navigation.goBack()}
      />

      {/* Tab Selector */}
      <View style={styles.tabOuterContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
            onPress={() => setActiveTab('blocked')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'blocked' && styles.activeTabText,
              ]}
            >
              Blocked ({blockedUsersList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}
            >
              All Users ({activeUsersList.length})
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'blocked' ? filteredBlockedUsers : filteredAllUsers}
          renderItem={activeTab === 'blocked' ? renderBlockedUser : renderAllUser}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name={activeTab === 'blocked' ? 'account-check' : 'account-group'}
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
      )}

      {/* Block User Modal */}
      <Modal
        visible={showBlockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredModalOverlay}
        >
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
              <View style={{ width: 24 }} />
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
                onPress={confirmBlock}
              >
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userDetails: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
  },
  activeStatus: {
    color: '#10B981',
  },
  blockedStatus: {
    color: '#EF4444',
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
    marginTop: 8,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  blockReason: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
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
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  userStatus: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
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
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
  },
});

// Export with alias for compatibility
const BlockU = BlockUserScreen;
export default BlockU;
