import React, {useState, useMemo, useRef} from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ManageU = ({onBack}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedNickname, setEditedNickname] = useState('');
  const [editedDateOfYear, setEditedDateOfYear] = useState('');
  const [menuPosition, setMenuPosition] = useState({top: 0, right: 0});
  const menuButtonRefs = useRef({});

  // Sample users data
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Murugan Kumar',
      phone: '9876543210',
      type: 'user',
      email: 'murugan@example.com',
      joinedDate: '2024-01-15',
      dateOfBirth: '1990-05-20',
      nickname: 'MK',
    },
    {
      id: '2',
      name: 'Lakshmi Selvi',
      phone: '9876543211',
      type: 'admin',
      email: 'lakshmi@example.com',
      joinedDate: '2023-12-10',
      dateOfBirth: '1988-08-15',
      nickname: 'Laksha',
    },
    {
      id: '3',
      name: 'Rajesh Babu',
      phone: '9876543212',
      type: 'user',
      email: 'rajesh@example.com',
      joinedDate: '2024-02-20',
      dateOfBirth: '1992-11-30',
      nickname: 'Raji',
    },
  ]);

  // Sort and filter users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery),
    );
    return filtered.sort((a, b) => {
      if (a.type === 'admin' && b.type !== 'admin') return -1;
      if (a.type !== 'admin' && b.type === 'admin') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, searchQuery]);

  // Handlers
  const handleMenuPress = (user, buttonRef) => {
    setSelectedUser(user);
    if (buttonRef.current) {
      buttonRef.current.measure((_x, _y, _width, _height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + _height + 5,
          right: Platform.OS === 'ios' ? 16 : 24,
        });
        setShowMenu(true);
      });
    }
  };

  const handleEdit = () => {
    if (!selectedUser) return;
    setEditedName(selectedUser.name);
    setEditedPhone(selectedUser.phone);
    setEditedType(selectedUser.type);
    setEditedNickname(selectedUser.nickname || '');
    setEditedDateOfYear(
      selectedUser.dateOfBirth ? selectedUser.dateOfBirth.substring(0, 4) : '',
    );
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
    setUsers(
      users.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: editedName,
              phone: editedPhone,
              type: editedType,
              nickname: editedNickname,
              dateOfBirth: `${editedDateOfYear}-01-01`,
            }
          : user,
      ),
    );
    setShowEditModal(false);
  };

  const confirmDelete = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setShowDeleteModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
      </View>
      <View style={styles.separator} />

      {/* Search Bar */}
      <View style={customStyles.searchContainer}>
        <View style={customStyles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#6B7280" />
          <TextInput
            style={customStyles.searchInput}
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

      {/* Users List */}
      <ScrollView
        style={customStyles.content}
        showsVerticalScrollIndicator={false}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => {
            const buttonRef = useRef(null);
            return (
              <View key={user.id} style={customStyles.userCard}>
                <View style={customStyles.userInfo}>
                  <View
                    style={[
                      customStyles.userIconContainer,
                      {
                        backgroundColor:
                          user.type === 'admin' ? '#EDE9FE' : '#DBEAFE',
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={
                        user.type === 'admin'
                          ? 'shield-crown'
                          : 'account-circle'
                      }
                      size={24}
                      color={user.type === 'admin' ? '#7C3AED' : '#3B82F6'}
                    />
                  </View>
                  <View>
                    <Text style={customStyles.userName}>{user.name}</Text>
                    <Text style={customStyles.userPhone}>{user.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  ref={buttonRef}
                  onPress={() => handleMenuPress(user, buttonRef)}
                  style={customStyles.menuButton}>
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={customStyles.emptyState}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text style={customStyles.emptyStateText}>No users found</Text>
          </View>
        )}
      </ScrollView>

      {/* Actions Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        <Pressable
          style={customStyles.menuOverlay}
          onPress={() => setShowMenu(false)}>
          <View
            style={[
              customStyles.menuModal,
              {top: menuPosition.top, right: menuPosition.right},
            ]}>
            <TouchableOpacity
              style={customStyles.menuItem}
              onPress={handleView}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color="#4B5563"
              />
              <Text style={customStyles.menuText}>View Details</Text>
            </TouchableOpacity>
            <View style={customStyles.menuDivider} />
            <TouchableOpacity
              style={customStyles.menuItem}
              onPress={handleEdit}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color="#3B82F6"
              />
              <Text style={[customStyles.menuText, {color: '#3B82F6'}]}>
                Edit User
              </Text>
            </TouchableOpacity>
            <View style={customStyles.menuDivider} />
            <TouchableOpacity
              style={customStyles.menuItem}
              onPress={handleDelete}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color="#EF4444"
              />
              <Text style={[customStyles.menuText, {color: '#EF4444'}]}>
                Delete User
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={customStyles.modalOverlay}>
          <View style={customStyles.modalContainer}>
            <View style={customStyles.modalHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons
                  name="account-edit-outline"
                  size={28}
                  color="#6B7280"
                  style={{marginRight: 10}}
                />
                <Text style={customStyles.modalTitle}>Edit User</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <View style={customStyles.modalHeaderSeparator} />
            <View style={customStyles.modalContent}>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedName}
                  onChangeText={setEditedName}
                />
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedPhone}
                  onChangeText={setEditedPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Nickname</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedNickname}
                  onChangeText={setEditedNickname}
                />
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Birth Year</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedDateOfYear}
                  onChangeText={setEditedDateOfYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>User Role</Text>
                <View style={customStyles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      customStyles.typeOption,
                      editedType === 'user' && customStyles.typeOptionActive,
                    ]}
                    onPress={() => setEditedType('user')}>
                    <MaterialCommunityIcons
                      name="account"
                      size={18}
                      color={editedType === 'user' ? '#3B82F6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        customStyles.typeOptionText,
                        editedType === 'user' && {color: '#3B82F6'},
                      ]}>
                      User
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      customStyles.typeOption,
                      editedType === 'admin' && customStyles.typeOptionActive,
                    ]}
                    onPress={() => setEditedType('admin')}>
                    <MaterialCommunityIcons
                      name="shield-crown"
                      size={18}
                      color={editedType === 'admin' ? '#7C3AED' : '#6B7280'}
                    />
                    <Text
                      style={[
                        customStyles.typeOptionText,
                        editedType === 'admin' && {color: '#7C3AED'},
                      ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={customStyles.modalActions}>
              <TouchableOpacity
                style={customStyles.cancelButton}
                onPress={() => setShowEditModal(false)}>
                <Text style={customStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customStyles.saveButton}
                onPress={confirmEdit}>
                <Text style={[customStyles.buttonText, {color: '#FFFFFF'}]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== VIEW MODAL (Styled to match the image) ===== */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewModal(false)}>
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.viewModalContainer}>
            <View style={customStyles.modalHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={28}
                  color="#6B7280"
                  style={{marginRight: 10}}
                />
                <Text style={customStyles.viewModalTitle}>User Details</Text>
              </View>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <View style={customStyles.modalHeaderSeparator} />
            <View style={customStyles.modalContent}>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={customStyles.viewDataContainer}>
                  <Text style={customStyles.viewDataText}>
                    {selectedUser?.name}
                  </Text>
                </View>
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={customStyles.viewDataContainer}>
                  <Text style={customStyles.viewDataText}>
                    {selectedUser?.phone}
                  </Text>
                </View>
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Nickname</Text>
                <View style={customStyles.viewDataContainer}>
                  <Text style={customStyles.viewDataText}>
                    {selectedUser?.nickname || 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Birth Year</Text>
                <View style={customStyles.viewDataContainer}>
                  <Text style={customStyles.viewDataText}>
                    {selectedUser?.dateOfBirth
                      ? selectedUser.dateOfBirth.substring(0, 4)
                      : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={customStyles.inputGroup}>
                <Text style={styles.inputLabel}>Member Since</Text>
                <View style={customStyles.viewDataContainer}>
                  <Text style={customStyles.viewDataText}>
                    {selectedUser?.joinedDate}
                  </Text>
                </View>
              </View>
            </View>
            <View style={customStyles.viewModalActions}>
              <TouchableOpacity
                style={customStyles.closeButton}
                onPress={() => setShowViewModal(false)}>
                <Text style={[customStyles.buttonText, {color: '#FFFFFF'}]}>
                  Close
                </Text>
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
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.deleteModal}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color="#F59E0B"
            />
            <Text style={customStyles.deleteTitle}>Confirm Deletion</Text>
            <Text style={customStyles.deleteMessage}>
              Are you sure you want to delete{' '}
              <Text style={{fontWeight: 'bold'}}>{selectedUser?.name}</Text>?
              This cannot be undone.
            </Text>
            <View style={customStyles.deleteActions}>
              <TouchableOpacity
                style={customStyles.cancelButton}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={customStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[customStyles.saveButton, {backgroundColor: '#EF4444'}]}
                onPress={confirmDelete}>
                <Text style={[customStyles.buttonText, {color: '#FFFFFF'}]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- STYLES ---

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
  backButton: {padding: 4},
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
});

const customStyles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    // borderBottomWidth and borderBottomColor removed
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
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
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
  },

  // Modals General
  modalOverlay: {
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
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
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
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalHeaderSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeOptionActive: {
    borderColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },

  // Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuModal: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Delete Modal
  deleteModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },

  // --- View Modal Styles ---
  viewModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  viewModalTitle: {
    fontSize: 23,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  viewDataContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  viewDataText: {
    fontSize: 16,
    color: '#1F2937',
  },
  viewModalActions: {
    padding: 20,
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: -25,
  },
});

export default ManageU;