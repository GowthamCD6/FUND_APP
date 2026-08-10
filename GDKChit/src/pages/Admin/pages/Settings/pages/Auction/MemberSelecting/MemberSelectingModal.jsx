import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../../../../../utils/LanguageContext';

const { width, height } = Dimensions.get('window');

const MemberSelectingModal = ({
  visible,
  loading = false,
  selectedGroup,
  selectedMembers,
  onClose,
  onMemberToggle,
  onProceed,
}) => {
  const { t } = useLanguage();

  const renderMemberItem = ({ item }) => {
    const isSelected = selectedMembers.some(m => m.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.memberCard, isSelected && styles.selectedMember]}
        onPress={() => onMemberToggle(item)}
      >
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#10B981"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.memberModalContainer}>
          <View style={styles.memberModalHeader}>
            <Text style={styles.memberModalTitle}>
              {t('Select Members')} - {selectedGroup?.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <View style={styles.memberCountBadge}>
            <Text style={styles.memberCountText}>
              {t('Selected:')} {selectedMembers.length}/
              {selectedGroup?.members.length || 0}
            </Text>
          </View>

          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#6B46C1" />
              <Text style={styles.modalLoadingText}>{t('Loading group members...')}</Text>
            </View>
          ) : (
            <FlatList
              data={selectedGroup?.members || []}
              renderItem={renderMemberItem}
              keyExtractor={item => item.id}
              style={styles.membersList}
              contentContainerStyle={styles.memberListContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.memberModalFooter}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={onClose}
            >
              <Text style={styles.cancelModalButtonText}>{t('Cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.proceedModalButton,
                (loading || selectedMembers.length < 2) && styles.disabledButton,
              ]}
              onPress={onProceed}
              disabled={loading || selectedMembers.length < 2}
            >
              <Text style={styles.proceedModalButtonText}>
                {t('Start Auction')} ({selectedMembers.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Member Modal Container
  memberModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: height * 0.75,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    overflow: 'hidden',
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 12,
  },
  memberModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  memberCountBadge: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },

  // Members List
  membersList: {
    maxHeight: height * 0.42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 36,
  },
  memberListContent: {
    paddingBottom: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  selectedMember: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
    elevation: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  memberPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 0,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  checkIcon: {
    marginLeft: 12,
  },

  // Modal Footer
  memberModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  proceedModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  proceedModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '500',
  },
});

export default MemberSelectingModal;
