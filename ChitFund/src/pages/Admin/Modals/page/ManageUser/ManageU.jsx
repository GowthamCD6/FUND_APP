import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ManageU = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRefs = useRef({});

  // Sample users data
  const [users, setUsers] = useState([
    { id: '1', name: 'முருகன் குமார்', phone: '9876543210', type: 'user', email: 'murugan@example.com', joinedDate: '2024-01-15', dateOfBirth: '1990-05-20' },
    { id: '2', name: 'லட்சுமி செல்வி', phone: '9876543211', type: 'admin', email: 'lakshmi@example.com', joinedDate: '2023-12-10', dateOfBirth: '1988-08-15' },
    { id: '3', name: 'ராஜேஷ் பாபு', phone: '9876543212', type: 'user', email: 'rajesh@example.com', joinedDate: '2024-02-20', dateOfBirth: '1992-11-30' },
  ]);

  // Sort users - admins first, then alphabetically, and filter based on search
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (searchQuery) {
      filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      );
    }
    
    // Sort: admins first, then alphabetically by name
    return filtered.sort((a, b) => {
      if (a.type === 'admin' && b.type !== 'admin') return -1;
      if (a.type !== 'admin' && b.type === 'admin') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, searchQuery]);

  const handleMenuPress = (user, buttonRef) => {
    setSelectedUser(user);
    if (buttonRef && buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height + 5,
          right: 16,
        });
        setShowMenu(true);
      });
    } else {
      setShowMenu(true);
    }
  };

  const handleEdit = () => {
    setEditedName(selectedUser.name);
    setEditedPhone(selectedUser.phone);
    setEditedType(selectedUser.type);
    setEditedDateOfBirth(selectedUser.dateOfBirth);
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleView = () => {
    setShowMenu(false);
    setShowViewModal(true);
  };

  const confirmEdit = () => {
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, name: editedName, phone: editedPhone, type: editedType, dateOfBirth: editedDateOfBirth }
        : user
    ));
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const confirmDelete = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
      </View>
      <View style={styles.separator} />

      {/* Search Bar */}
      <View style={customStyles.searchContainer}>
        <View style={customStyles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            style={customStyles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Users List */}
      <ScrollView 
        style={customStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => {
            const buttonRef = useRef(null);
            menuButtonRefs.current[user.id] = buttonRef;
            
            return (
              <View key={user.id} style={customStyles.userCard}>
                <View style={customStyles.userInfo}>
                  <View style={[
                    customStyles.userIconContainer,
                    { backgroundColor: user.type === 'admin' ? '#EDE9FE' : '#DBEAFE' }
                  ]}>
                    <MaterialCommunityIcons
                      name={user.type === 'admin' ? 'shield-crown' : 'account-circle'}
                      size={24}
                      color={user.type === 'admin' ? '#7C3AED' : '#3B82F6'}
                    />
                  </View>
                  <View style={customStyles.userDetails}>
                    <Text style={customStyles.userName}>{user.name}</Text>
                    <Text style={customStyles.userPhone}>
                      <MaterialCommunityIcons name="phone" size={12} color="#6B7280" />
                      {' '}{user.phone}
                    </Text>
                  </View>
                </View>
                <View style={customStyles.userActions}>
                  <View style={[
                    customStyles.userTypeBadge,
                    { backgroundColor: user.type === 'admin' ? '#F3E8FF' : '#EFF6FF' }
                  ]}>
                    <Text style={[
                      customStyles.userTypeText,
                      { color: user.type === 'admin' ? '#7C3AED' : '#3B82F6' }
                    ]}>
                      {user.type === 'admin' ? 'Admin' : 'User'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    ref={buttonRef}
                    onPress={() => handleMenuPress(user, buttonRef)} 
                    style={customStyles.menuButton}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={customStyles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
            <Text style={customStyles.emptyStateText}>No users found</Text>
            <Text style={customStyles.emptyStateSubtext}>Try adjusting your search</Text>
          </View>
        )}
      </ScrollView>

      {/* Menu Modal - WhatsApp Style */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={customStyles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[customStyles.menuModal, { position: 'absolute', top: menuPosition.top, right: menuPosition.right }]}>
            <TouchableOpacity 
              style={customStyles.menuItem} 
              onPress={handleView}
              activeOpacity={0.7}
            >
              <View style={customStyles.menuIconContainer}>
                <MaterialCommunityIcons name="eye-outline" size={20} color="#6B7280" />
              </View>
              <Text style={customStyles.menuText}>View Details</Text>
            </TouchableOpacity>
            
            <View style={customStyles.menuDivider} />
            
            <TouchableOpacity 
              style={customStyles.menuItem} 
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <View style={[customStyles.menuIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={[customStyles.menuText, { color: '#3B82F6' }]}>Edit User</Text>
            </TouchableOpacity>
            
            <View style={customStyles.menuDivider} />
            
            <TouchableOpacity 
              style={customStyles.menuItem} 
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <View style={[customStyles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[customStyles.menuText, { color: '#EF4444' }]}>Delete User</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.editModal}>
            <View style={customStyles.modalHeader}>
              <View>
                <Text style={customStyles.modalTitle}>Edit User</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={customStyles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={customStyles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="account" size={18} color="#212121" />
                  <Text style={styles.inputLabel}>Name</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={customStyles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="phone" size={18} color="#212121" />
                  <Text style={styles.inputLabel}>Phone Number</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={editedPhone}
                  onChangeText={setEditedPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={customStyles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="account-group" size={18} color="#212121" />
                  <Text style={styles.inputLabel}>User Role</Text>
                </View>
                <View style={customStyles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      customStyles.typeOption,
                      editedType === 'user' && customStyles.typeOptionActiveUser
                    ]}
                    onPress={() => setEditedType('user')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons 
                      name="account" 
                      size={18} 
                      color={editedType === 'user' ? '#3B82F6' : '#9CA3AF'} 
                    />
                    <Text style={[
                      customStyles.typeOptionText,
                      editedType === 'user' && customStyles.typeOptionTextActiveUser
                    ]}>User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      customStyles.typeOption,
                      editedType === 'admin' && customStyles.typeOptionActiveAdmin
                    ]}
                    onPress={() => setEditedType('admin')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons 
                      name="security" 
                      size={18} 
                      color={editedType === 'admin' ? '#7C3AED' : '#9CA3AF'} 
                    />
                    <Text style={[
                      customStyles.typeOptionText,
                      editedType === 'admin' && customStyles.typeOptionTextActiveAdmin
                    ]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={customStyles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="cake" size={18} color="#212121" />
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={editedDateOfBirth}
                  onChangeText={setEditedDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <View style={customStyles.modalActions}>
              <TouchableOpacity
                style={customStyles.cancelButton}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={customStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customStyles.saveButton}
                onPress={confirmEdit}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="check-bold" size={18} color="#FFFFFF" />
                <Text style={customStyles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.deleteModal}>
            <View style={customStyles.deleteIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={56} color="#EF4444" />
            </View>
            <Text style={customStyles.deleteTitle}>Delete User?</Text>
            <Text style={customStyles.deleteMessage}>
              Are you sure you want to delete <Text style={customStyles.deleteUserName}>{selectedUser?.name}</Text>? This action cannot be undone and all user data will be permanently removed.
            </Text>
            <View style={customStyles.deleteActions}>
              <TouchableOpacity
                style={customStyles.deleteCancelButton}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.7}
              >
                <Text style={customStyles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customStyles.deleteConfirmButton}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete" size={18} color="#FFFFFF" />
                <Text style={customStyles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Modal */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.viewModal}>
            <View style={customStyles.modalHeader}>
              <View>
                <Text style={customStyles.modalTitle}>User Details</Text>
                <Text style={customStyles.modalSubtitle}>Complete information</Text>
              </View>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={customStyles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={customStyles.viewHeader}>
                <View style={[
                  customStyles.viewIconLarge,
                  { backgroundColor: selectedUser?.type === 'admin' ? '#EDE9FE' : '#DBEAFE' }
                ]}>
                  <MaterialCommunityIcons
                    name={selectedUser?.type === 'admin' ? 'security' : 'account'}
                    size={40}
                    color={selectedUser?.type === 'admin' ? '#7C3AED' : '#3B82F6'}
                  />
                </View>
                <Text style={customStyles.viewName}>{selectedUser?.name}</Text>
                <View style={[
                  customStyles.viewBadge,
                  { backgroundColor: selectedUser?.type === 'admin' ? '#F3E8FF' : '#EFF6FF' }
                ]}>
                  <MaterialCommunityIcons 
                    name={selectedUser?.type === 'admin' ? 'shield-check' : 'account-check'} 
                    size={14} 
                    color={selectedUser?.type === 'admin' ? '#7C3AED' : '#3B82F6'}
                  />
                  <Text style={[
                    customStyles.viewBadgeText,
                    { color: selectedUser?.type === 'admin' ? '#7C3AED' : '#3B82F6' }
                  ]}>
                    {selectedUser?.type === 'admin' ? 'Administrator' : 'Standard User'}
                  </Text>
                </View>
              </View>

              <View style={customStyles.viewSection}>
                <View style={customStyles.viewInfoCard}>
                  <View style={customStyles.viewRow}>
                    <View style={customStyles.viewRowContent}>
                      <View style={customStyles.viewLabelRow}>
                        <MaterialCommunityIcons name="phone" size={18} color="#6B7280" />
                        <Text style={customStyles.viewLabel}>Phone Number</Text>
                      </View>
                      <Text style={customStyles.viewValue}>{selectedUser?.phone}</Text>
                    </View>
                  </View>

                  <View style={customStyles.viewDivider} />

                  <View style={customStyles.viewRow}>
                    <View style={customStyles.viewRowContent}>
                      <View style={customStyles.viewLabelRow}>
                        <MaterialCommunityIcons name="calendar-range" size={18} color="#6B7280" />
                        <Text style={customStyles.viewLabel}>Date of Birth</Text>
                      </View>
                      <Text style={customStyles.viewValue}>{selectedUser?.dateOfBirth}</Text>
                    </View>
                  </View>

                  <View style={customStyles.viewDivider} />

                  <View style={customStyles.viewRow}>
                    <View style={customStyles.viewRowContent}>
                      <View style={customStyles.viewLabelRow}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
                        <Text style={customStyles.viewLabel}>Joined Date</Text>
                      </View>
                      <Text style={customStyles.viewValue}>{selectedUser?.joinedDate}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={customStyles.viewActions}>
              <TouchableOpacity
                style={customStyles.viewCloseButton}
                onPress={() => setShowViewModal(false)}
                activeOpacity={0.7}
              >
                <Text style={customStyles.viewCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginTop: -4,
  },
  headerTitle: {
    marginTop: -6,
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
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  animation: {
    width: 160,
    height: 160,
  },
  formContainer: {
    paddingBottom: 40,
    marginTop: 0,
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
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
    height: 48,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    height: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  dropdownOptionTextSelected: {
    color: '#007AFF',
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
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
});

const customStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  userTypeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 6,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  editModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#111827',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',

  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeOptionActiveUser: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  typeOptionActiveAdmin: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  typeOptionTextActiveUser: {
    color: '#3B82F6',
  },
  typeOptionTextActiveAdmin: {
    color: '#7C3AED',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF', // Changed to match reference
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteIconContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 30,
    padding: 12,
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 10,
  },
  deleteMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteUserName: {
    fontWeight: '700',
    color: '#111827',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  deleteConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  viewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  viewIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  viewBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewSection: {
    marginBottom: 20,
  },
  viewInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewRowContent: {
    flex: 1,
  },
  viewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 26, // Align with label text
  },
  viewDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  viewActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewCloseButton: {
    backgroundColor: '#007AFF', // Changed to match reference
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewCloseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ManageU;