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
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const PasswordManagement = ({ onClose }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
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

  useEffect(() => {
    const backAction = () => {
      if (showPasswordModal) {
        setShowPasswordModal(false);
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
  }, [navigation, showPasswordModal]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

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
      const cleanUserId = encodeURIComponent(String(userId).trim());
      const response = await ApiService.makeRequest(`/admin/users/${cleanUserId}/passwordDetails`, {
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

    // Filter by search query with defensive null checks
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          (user.name || '').toLowerCase().includes(q) ||
          String(user.phone || '').includes(q) ||
          (user.email && user.email.toLowerCase().includes(q))
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
    if (isUpdating) return;
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
    if (isUpdating) return;
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
    if (isUpdating) return;
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
    if (isUpdating) return;
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
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            <View style={[styles.roleBadge, item.type === 'Admin' ? styles.adminBadge : styles.userBadge]}>
              <Text style={[styles.roleText, item.type === 'Admin' ? styles.adminRoleText : styles.userRoleText]}>
                {item.type}
              </Text>
            </View>
          </View>
          <Text style={styles.userPhone}>{item.phone}</Text>
          {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Header
        title={t('Password Management')}
        onBack={() => navigation.goBack()}
        showBackButton={true}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search users...')}
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

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
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
        animationType="fade"
        onRequestClose={handleClosePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredModalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClosePasswordModal}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.modalHeaderSeparator} />

            {selectedUser && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalUserInfo}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                    <Text style={styles.modalUserPhone}>{selectedUser.phone}</Text>
                  </View>
                </View>

                {/* Password Status Information */}
                {loadingDetails ? (
                  <View style={styles.loadingDetailsContainer}>
                    <ActivityIndicator size="small" color="#0066FF" />
                    <Text style={styles.loadingDetailsText}>Loading password details...</Text>
                  </View>
                ) : selectedUserDetails ? (
                  <View style={styles.passwordStatusContainer}>
                    <Text style={styles.passwordStatusTitle}>Current Password Status</Text>
                    
                    <View style={styles.statusItem}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={18}
                        color="#0066FF"
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
                        name="key-variant"
                        size={18}
                        color="#EF4444"
                      />
                      <View style={styles.statusItemContent}>
                        <Text style={styles.statusLabel}>Current Password</Text>
                        <Text style={styles.statusValue}>
                          {selectedUserDetails.currentPassword || 'N/A'}
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
                      placeholderTextColor="#9CA3AF"
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
                        color="#6B7280"
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
                      placeholderTextColor="#9CA3AF"
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
                        color="#6B7280"
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
                      color={newPassword.length >= 4 ? '#10B981' : '#D1D5DB'}
                    />
                    <Text style={styles.requirementText}>Minimum 4 characters</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons
                      name={newPassword === confirmPassword && confirmPassword !== '' ? 'check-circle' : 'circle-outline'}
                      size={18}
                      color={newPassword === confirmPassword && confirmPassword !== '' ? '#10B981' : '#D1D5DB'}
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
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  adminBadge: {
    backgroundColor: '#E0F2FE',
  },
  userBadge: {
    backgroundColor: '#F3F4F6',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  adminRoleText: {
    color: '#0369A1',
  },
  userRoleText: {
    color: '#4B5563',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  userEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0066FF',
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
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
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
    maxHeight: '85%',
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
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 54,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  requirementsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  loadingDetailsContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingDetailsText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  passwordStatusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  passwordStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
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
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
});

export default PasswordManagement;