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
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';

const PasswordManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, edit, reset

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, activeTab]);

  const fetchAllUsers = async () => {
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

  const fetchUserPasswordDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const response = await ApiService.makeRequest(`/admin/users/${userId}/passwordDetails`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success) {
        setSelectedUserDetails(data.data);
      } else {
        console.error('Failed to fetch password details:', data.message);
      }
    } catch (error) {
      console.error('Error fetching password details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone.includes(searchQuery) ||
          (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setSelectedUserDetails(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
    // Fetch password details for this user
    fetchUserPasswordDetails(user.id);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setSelectedUserDetails(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields');
      return false;
    }

    if (newPassword.length < 4) {
      Alert.alert('Validation Error', 'Password must be at least 4 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    Alert.alert(
      'Confirm Password Change',
      `Are you sure you want to change the password for ${selectedUser.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          style: 'destructive',
          onPress: async () => {
            await updateUserPassword();
          },
        },
      ]
    );
  };

  const updateUserPassword = async () => {
    try {
      setIsUpdating(true);

      const response = await ApiService.makeRequest('/admin/users/updatePassword', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Password updated successfully');
        handleClosePasswordModal();
        fetchAllUsers();
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = (user) => {
    Alert.alert(
      'Reset Password',
      `Reset ${user.name}'s password to default (Year of Birth)?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetUserPassword(user.id);
          },
        },
      ]
    );
  };

  const resetUserPassword = async (userId) => {
    try {
      setIsUpdating(true);

      const response = await ApiService.makeRequest('/admin/users/resetPassword', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Password reset to default successfully');
        fetchAllUsers();
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userCardHeader}>
        <View style={styles.userAvatarContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userPhone}>{item.phone}</Text>
          {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
          <Text style={styles.userType}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.userCardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleOpenPasswordModal(item)}
        >
          <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={() => handleResetPassword(item)}
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons
        name="account-search-outline"
        size={64}
        color="#CCCCCC"
      />
      <Text style={styles.emptyStateText}>No users found</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Header
        title="Password Management"
        onBack={onClose}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#999999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or email"
          placeholderTextColor="#CCCCCC"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#999999"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Users ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Password Update Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClosePasswordModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#333333"
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.userDetailsContainer}>
                  <View style={styles.userDetailsAvatar}>
                    <Text style={styles.detailsAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetailsInfo}>
                    <Text style={styles.detailsName}>{selectedUser.name}</Text>
                    <Text style={styles.detailsPhone}>{selectedUser.phone}</Text>
                    <Text style={styles.detailsType}>{selectedUser.type}</Text>
                  </View>
                </View>

                {/* Password Status Information */}
                {loadingDetails ? (
                  <View style={styles.loadingDetailsContainer}>
                    <ActivityIndicator size="small" color="#6B46C1" />
                    <Text style={styles.loadingDetailsText}>Loading password details...</Text>
                  </View>
                ) : selectedUserDetails ? (
                  <View style={styles.passwordStatusContainer}>
                    <Text style={styles.passwordStatusTitle}>Current Password Status</Text>
                    
                    <View style={styles.statusItem}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={18}
                        color="#6B46C1"
                      />
                      <View style={styles.statusItemContent}>
                        <Text style={styles.statusLabel}>Account Created</Text>
                        <Text style={styles.statusValue}>
                          {new Date(selectedUserDetails.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusItem}>
                      <MaterialCommunityIcons
                        name="lock-reset"
                        size={18}
                        color="#F59E0B"
                      />
                      <View style={styles.statusItemContent}>
                        <Text style={styles.statusLabel}>Last Password Update</Text>
                        <Text style={styles.statusValue}>
                          {selectedUserDetails.lastUpdatedAt
                            ? new Date(selectedUserDetails.lastUpdatedAt).toLocaleDateString()
                            : 'Never changed (using default)'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusItem}>
                      <MaterialCommunityIcons
                        name="account-key"
                        size={18}
                        color="#10B981"
                      />
                      <View style={styles.statusItemContent}>
                        <Text style={styles.statusLabel}>Role</Text>
                        <Text style={styles.statusValue}>{selectedUserDetails.role}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* New Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter new password"
                      placeholderTextColor="#CCCCCC"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm new password"
                      placeholderTextColor="#CCCCCC"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons
                      name={newPassword.length >= 4 ? 'check-circle' : 'circle-outline'}
                      size={18}
                      color={newPassword.length >= 4 ? '#10B981' : '#CCCCCC'}
                    />
                    <Text style={styles.requirementText}>Minimum 4 characters</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons
                      name={newPassword === confirmPassword && confirmPassword !== '' ? 'check-circle' : 'circle-outline'}
                      size={18}
                      color={newPassword === confirmPassword && confirmPassword !== '' ? '#10B981' : '#CCCCCC'}
                    />
                    <Text style={styles.requirementText}>Passwords must match</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClosePasswordModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      isUpdating && { opacity: 0.6 },
                    ]}
                    onPress={handleUpdatePassword}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.updateButtonText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999999',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  userPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  userEmail: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  userType: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resetButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  userDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  userDetailsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  userDetailsInfo: {
    flex: 1,
  },
  detailsName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  detailsPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  detailsType: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333333',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  requirementsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 12,
    color: '#333333',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  loadingDetailsContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingDetailsText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  passwordStatusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6B46C1',
  },
  passwordStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
});

export default PasswordManagement;